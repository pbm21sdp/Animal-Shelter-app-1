/**
 * Integration tests — Pets endpoints
 * Covers: GET /pets, GET /pets/:id, POST /pets (validation + forbidden words),
 *         PATCH /pets/:id/approve, PATCH /pets/:id/reject (+ notification check).
 */
import request from 'supertest';
import { pool } from '../../config/database/connectPostgresDB.js';
import { app } from '../../app.js';
import {
    setupIntegration,
    teardownIntegration,
    clearAll,
    createTestUser,
    createAdminUser,
    authCookie,
    seedPet,
} from './helpers/integrationSetup.js';

const BASE = '/api/pets';

let user, admin, userCookie, adminCookie;

beforeAll(async () => { await setupIntegration(); });
afterAll(async () => { await teardownIntegration(); });

beforeEach(async () => {
    await clearAll();
    user  = await createTestUser();
    admin = await createAdminUser();
    userCookie  = authCookie(user._id, false);
    adminCookie = authCookie(admin._id, true);
});

// ─── GET /api/pets ───────────────────────────────────────────────────────────

describe('GET /api/pets', () => {
    it('returns only approved+available pets for unauthenticated requests', async () => {
        // approved + available
        await seedPet(null, { status: 'approved', name: 'Visible Dog' });
        // pending — must NOT appear
        await seedPet(null, { status: 'pending', name: 'Pending Dog' });
        // approved but adopted (is_available = false via trigger) — not returned by default
        await seedPet(null, { status: 'approved', name: 'Adopted Dog' });
        await pool.query(`UPDATE pets SET adoption_status = 'adopted' WHERE name = 'Adopted Dog'`);

        const res = await request(app).get(BASE);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        const names = res.body.pets.map(p => p.name);
        expect(names).toContain('Visible Dog');
        expect(names).not.toContain('Pending Dog');
        expect(names).not.toContain('Adopted Dog');
    });

    it('returns an array of pets', async () => {
        await seedPet(null, { name: 'Pet A' });
        await seedPet(null, { name: 'Pet B' });

        const res = await request(app).get(BASE);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.pets)).toBe(true);
        expect(res.body.pets.length).toBeGreaterThanOrEqual(2);
    });
});

// ─── GET /api/pets/:id ───────────────────────────────────────────────────────

describe('GET /api/pets/:id', () => {
    it('returns approved pet without authentication', async () => {
        const pet = await seedPet(null, { status: 'approved' });

        const res = await request(app).get(`${BASE}/${pet.id}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.pet.id).toBe(pet.id);
    });

    it('returns 404 for pending pet when requested by unrelated user', async () => {
        const pet = await seedPet(admin._id.toString(), { status: 'pending' });

        const res = await request(app)
            .get(`${BASE}/${pet.id}`)
            .set('Cookie', userCookie);

        expect(res.status).toBe(404);
    });

    it('returns pending pet to its uploader', async () => {
        const pet = await seedPet(user._id.toString(), { status: 'pending' });

        const res = await request(app)
            .get(`${BASE}/${pet.id}`)
            .set('Cookie', userCookie);

        expect(res.status).toBe(200);
        expect(res.body.pet.id).toBe(pet.id);
    });

    it('returns pending pet to admin', async () => {
        const pet = await seedPet(user._id.toString(), { status: 'pending' });

        const res = await request(app)
            .get(`${BASE}/${pet.id}`)
            .set('Cookie', adminCookie);

        expect(res.status).toBe(200);
    });

    it('returns 404 for non-existent pet', async () => {
        const res = await request(app).get(`${BASE}/99999999`);
        expect(res.status).toBe(404);
    });
});

// ─── POST /api/pets ──────────────────────────────────────────────────────────

describe('POST /api/pets', () => {
    const validPetPayload = () => ({
        name: 'New Dog',
        type: 'dog',
        description: 'A lovely dog looking for a home',
        gender: 'male',
        situation: 'adoption',
        current_status: 'healthy',
        microchip_status: 'not_chipped',
        neutered_spayed_status: 'not_neutered',
        vaccination_status: 'not_vaccinated',
        location_city: 'Timisoara',
    });

    it('returns 401 without authentication', async () => {
        const res = await request(app).post(BASE).send(validPetPayload());
        expect(res.status).toBe(401);
    });

    it('creates pet successfully for authenticated user → 201', async () => {
        const res = await request(app)
            .post(BASE)
            .set('Cookie', userCookie)
            .send(validPetPayload());

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.pet.name).toBe('New Dog');
        expect(res.body.pet.uploader_id).toBe(user._id.toString());
    });

    it('returns 400 when required fields are missing', async () => {
        const { gender, situation, ...incomplete } = validPetPayload();
        const res = await request(app)
            .post(BASE)
            .set('Cookie', userCookie)
            .send(incomplete);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/missing required fields/i);
        expect(res.body.message).toMatch(/gender/i);
    });

    it('returns 400 when location is missing', async () => {
        const { location_city, ...noLocation } = validPetPayload();
        const res = await request(app)
            .post(BASE)
            .set('Cookie', userCookie)
            .send(noLocation);

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/location_city/i);
    });

    it('returns 400 when description contains a forbidden word', async () => {
        const res = await request(app)
            .post(BASE)
            .set('Cookie', userCookie)
            .send({ ...validPetPayload(), description: 'This is a fuck test' });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/isn't allowed/i);
    });

    it('returns 400 when name contains a forbidden word', async () => {
        const res = await request(app)
            .post(BASE)
            .set('Cookie', userCookie)
            .send({ ...validPetPayload(), name: 'shit dog' });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/isn't allowed/i);
    });
});

// ─── PATCH /api/pets/:id/approve ─────────────────────────────────────────────

describe('PATCH /api/pets/:id/approve', () => {
    it('returns 401 without token', async () => {
        const pet = await seedPet(user._id.toString(), { status: 'pending' });
        const res = await request(app).patch(`${BASE}/${pet.id}/approve`);
        expect(res.status).toBe(401);
    });

    it('returns 403 for regular user', async () => {
        const pet = await seedPet(admin._id.toString(), { status: 'pending' });
        const res = await request(app)
            .patch(`${BASE}/${pet.id}/approve`)
            .set('Cookie', userCookie);
        expect(res.status).toBe(403);
    });

    it('admin approves a pending pet → 200 + status becomes approved', async () => {
        const pet = await seedPet(user._id.toString(), { status: 'pending' });

        const res = await request(app)
            .patch(`${BASE}/${pet.id}/approve`)
            .set('Cookie', adminCookie);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.pet.status).toBe('approved');
    });

    it('approval creates a notification for the uploader', async () => {
        const pet = await seedPet(user._id.toString(), { status: 'pending' });

        await request(app)
            .patch(`${BASE}/${pet.id}/approve`)
            .set('Cookie', adminCookie);

        const { rows } = await pool.query(
            `SELECT * FROM notifications WHERE user_id = $1 AND type = 'animal_approved'`,
            [user._id.toString()]
        );
        expect(rows.length).toBe(1);
        expect(rows[0].related_animal_id).toBe(pet.id);
    });
});

// ─── PATCH /api/pets/:id/reject ──────────────────────────────────────────────

describe('PATCH /api/pets/:id/reject', () => {
    it('returns 401 without token', async () => {
        const pet = await seedPet(user._id.toString(), { status: 'pending' });
        const res = await request(app)
            .patch(`${BASE}/${pet.id}/reject`)
            .send({ reason: 'Poor photo quality' });
        expect(res.status).toBe(401);
    });

    it('returns 403 for regular user', async () => {
        const pet = await seedPet(admin._id.toString(), { status: 'pending' });
        const res = await request(app)
            .patch(`${BASE}/${pet.id}/reject`)
            .set('Cookie', userCookie)
            .send({ reason: 'Poor photo quality' });
        expect(res.status).toBe(403);
    });

    it('returns 400 when reason is missing', async () => {
        const pet = await seedPet(user._id.toString(), { status: 'pending' });
        const res = await request(app)
            .patch(`${BASE}/${pet.id}/reject`)
            .set('Cookie', adminCookie)
            .send({});
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/reason is required/i);
    });

    it('admin rejects pet → 200 + status becomes rejected', async () => {
        const pet = await seedPet(user._id.toString(), { status: 'pending' });

        const res = await request(app)
            .patch(`${BASE}/${pet.id}/reject`)
            .set('Cookie', adminCookie)
            .send({ reason: 'Poor photo quality' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.pet.status).toBe('rejected');
    });

    it('rejection creates animal_rejected notification for the uploader', async () => {
        const pet = await seedPet(user._id.toString(), { status: 'pending' });

        await request(app)
            .patch(`${BASE}/${pet.id}/reject`)
            .set('Cookie', adminCookie)
            .send({ reason: 'Insufficient description' });

        const { rows } = await pool.query(
            `SELECT * FROM notifications WHERE user_id = $1 AND type = 'animal_rejected'`,
            [user._id.toString()]
        );
        expect(rows.length).toBe(1);
        expect(rows[0].message).toMatch(/Insufficient description/);
    });
});
