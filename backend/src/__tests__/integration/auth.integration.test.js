/**
 * Integration tests — Auth endpoints
 * Tests real HTTP requests against the Express app + paws_test databases.
 */
import request from 'supertest';
import { app } from '../../app.js';
import {
    setupIntegration,
    teardownIntegration,
    clearAll,
    clearMongo,
    createTestUser,
    authCookie,
} from './helpers/integrationSetup.js';

const BASE = '/api/auth';

beforeAll(async () => { await setupIntegration(); });
afterAll(async () => { await teardownIntegration(); });
beforeEach(async () => { await clearMongo(); }); // auth only touches MongoDB

// ─── POST /api/auth/signup ───────────────────────────────────────────────────

describe('POST /api/auth/signup', () => {
    it('creates user with valid data → 201, cookie set, password not returned', async () => {
        const res = await request(app)
            .post(`${BASE}/signup`)
            .send({ name: 'Alice', email: 'alice@test.local', password: 'ValidPass123!' });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.user.email).toBe('alice@test.local');
        expect(res.body.user.password).toBeUndefined();

        const cookies = res.headers['set-cookie'] ?? [];
        expect(cookies.some(c => c.startsWith('token='))).toBe(true);
    });

    it('returns 400 for duplicate email (verified user)', async () => {
        await createTestUser({ email: 'dup@test.local', isVerified: true });

        const res = await request(app)
            .post(`${BASE}/signup`)
            .send({ name: 'Bob', email: 'dup@test.local', password: 'AnotherPass456!' });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/already exists/i);
    });

    it('returns 400 for password shorter than 12 chars', async () => {
        const res = await request(app)
            .post(`${BASE}/signup`)
            .send({ name: 'Charlie', email: 'charlie@test.local', password: 'Short1' });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/12 characters/i);
    });

    it('returns 400 for password missing uppercase', async () => {
        const res = await request(app)
            .post(`${BASE}/signup`)
            .send({ name: 'Dave', email: 'dave@test.local', password: 'alllowercase123' });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('returns 400 when required fields are missing', async () => {
        const res = await request(app)
            .post(`${BASE}/signup`)
            .send({ email: 'noname@test.local' });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });
});

// ─── POST /api/auth/login ────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
    it('returns 200 and sets JWT cookie for valid credentials', async () => {
        const password = 'ValidPass123!';
        const user = await createTestUser({ email: 'loginok@test.local', plainPassword: password });

        const res = await request(app)
            .post(`${BASE}/login`)
            .send({ email: user.email, password });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.user.email).toBe(user.email);
        expect(res.body.user.password).toBeUndefined();

        const cookies = res.headers['set-cookie'] ?? [];
        expect(cookies.some(c => c.startsWith('token='))).toBe(true);
    });

    it('returns 400 for wrong password', async () => {
        const user = await createTestUser({ email: 'wrongpw@test.local' });

        const res = await request(app)
            .post(`${BASE}/login`)
            .send({ email: user.email, password: 'WrongPassword999!' });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/invalid credentials/i);
    });

    it('returns 400 for unknown email', async () => {
        const res = await request(app)
            .post(`${BASE}/login`)
            .send({ email: 'nobody@test.local', password: 'SomePass123!' });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/invalid credentials/i);
    });
});

// ─── POST /api/auth/logout ───────────────────────────────────────────────────

describe('POST /api/auth/logout', () => {
    it('returns 200 and clears the token cookie', async () => {
        const res = await request(app).post(`${BASE}/logout`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        const cookies = res.headers['set-cookie'] ?? [];
        const tokenCookie = cookies.find(c => c.toLowerCase().includes('token='));
        expect(tokenCookie).toBeDefined();
        // Cleared cookie has empty value or MaxAge=0 or Expires in the past
        expect(tokenCookie).toMatch(/token=;|Max-Age=0|1970/i);
    });
});

// ─── GET /api/auth/check-auth ────────────────────────────────────────────────

describe('GET /api/auth/check-auth', () => {
    it('returns 401 without token', async () => {
        const res = await request(app).get(`${BASE}/check-auth`);
        expect(res.status).toBe(401);
    });

    it('returns 200 with user data (no password) for valid token', async () => {
        const user = await createTestUser();

        const res = await request(app)
            .get(`${BASE}/check-auth`)
            .set('Cookie', authCookie(user._id));

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.user._id).toBe(user._id.toString());
        expect(res.body.user.password).toBeUndefined();
    });
});
