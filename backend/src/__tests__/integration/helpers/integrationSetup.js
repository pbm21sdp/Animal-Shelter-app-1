/**
 * Integration test setup — connects to the real PostgreSQL test DB and an
 * in-memory MongoDB instance (mongodb-memory-server), so tests run without
 * an external MongoDB installation.
 */
import { connectPostgresDB, pool } from '../../../config/database/connectPostgresDB.js';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User } from '../../../models/user.model.js';
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';

let mongod = null;

// ─── Connection lifecycle ────────────────────────────────────────────────────

export async function setupIntegration() {
    await connectPostgresDB();

    // Start in-memory MongoDB and connect
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);

    await ensureTestTables();
}

export async function teardownIntegration() {
    try { await pool.end(); } catch (_) {}
    try { await mongoose.connection.close(); } catch (_) {}
    try { if (mongod) await mongod.stop(); } catch (_) {}
}

// ─── Table guard (idempotent — safe to run on every test file) ───────────────

async function ensureTestTables() {
    // Columns added directly to prod without migration files
    await pool.query(`ALTER TABLE pets ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION`);
    await pool.query(`ALTER TABLE pets ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION`);
    await pool.query(`ALTER TABLE pets ADD COLUMN IF NOT EXISTS found_how TEXT`);

    // saved_animals may be missing from the test DB if it was created before that migration
    await pool.query(`
        CREATE TABLE IF NOT EXISTS saved_animals (
            id      SERIAL PRIMARY KEY,
            user_id VARCHAR(255) NOT NULL,
            pet_id  INTEGER REFERENCES pets(id) ON DELETE CASCADE,
            UNIQUE (user_id, pet_id)
        )
    `);
    // Notifications table — created by app.js migration; add IF NOT EXISTS as guard
    await pool.query(`
        CREATE TABLE IF NOT EXISTS notifications (
            id                SERIAL PRIMARY KEY,
            user_id           VARCHAR(30) NOT NULL,
            type              VARCHAR(30) NOT NULL,
            related_animal_id INTEGER REFERENCES pets(id) ON DELETE CASCADE,
            message           TEXT,
            is_read           BOOLEAN NOT NULL DEFAULT false,
            created_at        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
    `);
    // Forum tables
    await pool.query(`
        CREATE TABLE IF NOT EXISTS forum_posts (
            id         SERIAL PRIMARY KEY,
            author_id  VARCHAR(255) NOT NULL,
            category   VARCHAR(30)  NOT NULL,
            title      VARCHAR(150) NOT NULL,
            content    TEXT         NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    `);
    await pool.query(`
        CREATE TABLE IF NOT EXISTS forum_post_photos (
            id         SERIAL PRIMARY KEY,
            post_id    INTEGER REFERENCES forum_posts(id) ON DELETE CASCADE,
            photo_data BYTEA NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    `);
    // Forbidden words — needed by contentFilter for pet create/update
    await pool.query(`
        CREATE TABLE IF NOT EXISTS forbidden_words (
            id         SERIAL PRIMARY KEY,
            word       VARCHAR(100) UNIQUE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    `);
    await pool.query(`
        INSERT INTO forbidden_words (word)
        SELECT word FROM (VALUES ('fuck'),('shit'),('pula'),('muie')) AS v(word)
        WHERE NOT EXISTS (SELECT 1 FROM forbidden_words LIMIT 1)
    `);
}

// ─── Data cleanup ────────────────────────────────────────────────────────────

export async function clearAll() {
    await clearPostgres();
    await clearMongo();
}

export async function clearPostgres() {
    // Delete in FK-safe order (children first)
    await pool.query('DELETE FROM notifications');
    await pool.query('DELETE FROM forum_post_photos');
    await pool.query('DELETE FROM forum_posts');
    await pool.query('DELETE FROM saved_animals');
    await pool.query('DELETE FROM pet_traits');
    await pool.query('DELETE FROM pet_photos');
    await pool.query('DELETE FROM pets');
}

export async function clearMongo() {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
}

// ─── User factories ──────────────────────────────────────────────────────────

const DEFAULT_PW = 'TestPassword123';

/**
 * Insert a real User into MongoDB with a known hashed password.
 * Pass `plainPassword` in overrides to override the default.
 */
export async function createTestUser(overrides = {}) {
    const plainPassword = overrides.plainPassword ?? DEFAULT_PW;
    const { plainPassword: _drop, ...rest } = overrides;

    const user = new User({
        name: 'Test User',
        email: `u_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@test.local`,
        password: await bcryptjs.hash(plainPassword, 10),
        isVerified: true,
        isAdmin: false,
        ...rest,
    });
    await user.save();
    return user;
}

export async function createAdminUser(overrides = {}) {
    return createTestUser({ isAdmin: true, name: 'Admin User', ...overrides });
}

// ─── JWT helper ──────────────────────────────────────────────────────────────

export function generateToken(userId, isAdmin = false) {
    return jwt.sign(
        { userId: userId.toString(), isAdmin },
        process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only',
        { expiresIn: '1h' }
    );
}

/** Returns `Cookie: token=<jwt>` header value ready for Supertest's `.set()`. */
export function authCookie(userId, isAdmin = false) {
    return `token=${generateToken(userId, isAdmin)}`;
}

// ─── Pet seed ────────────────────────────────────────────────────────────────

/**
 * Insert a pet directly into PostgreSQL (bypassing validation).
 * @param {string|null} uploaderIdStr  MongoDB _id string of the uploader, or null
 * @param {object} overrides           Column overrides
 */
export async function seedPet(uploaderIdStr = null, overrides = {}) {
    const r = await pool.query(
        `INSERT INTO pets (
             name, type, description, gender,
             situation, current_status, microchip_status,
             neutered_spayed_status, vaccination_status,
             location_city, status, uploader_id
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         RETURNING *`,
        [
            overrides.name           ?? 'Test Pet',
            overrides.type           ?? 'dog',
            overrides.description    ?? 'A test pet for integration testing',
            overrides.gender         ?? 'male',
            overrides.situation      ?? 'adoption',
            overrides.current_status ?? 'healthy',
            overrides.microchip_status         ?? 'not_chipped',
            overrides.neutered_spayed_status   ?? 'not_neutered',
            overrides.vaccination_status       ?? 'not_vaccinated',
            overrides.location_city  ?? 'Timisoara',
            overrides.status         ?? 'approved',
            uploaderIdStr,
        ]
    );
    return r.rows[0];
}

// ─── Notification seed ───────────────────────────────────────────────────────

export async function seedNotification(userIdStr, petId = null, overrides = {}) {
    const r = await pool.query(
        `INSERT INTO notifications (user_id, type, related_animal_id, message)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [
            userIdStr,
            overrides.type    ?? 'animal_approved',
            petId,
            overrides.message ?? 'Your listing has been approved.',
        ]
    );
    return r.rows[0];
}
