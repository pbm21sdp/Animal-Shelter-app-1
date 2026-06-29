/**
 * Integration tests — Forum endpoints
 * GET /api/forum/posts — public
 * POST /api/forum/posts — admin only, category validation
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
} from './helpers/integrationSetup.js';

const BASE = '/api/forum';

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

// ─── GET /api/forum/posts ────────────────────────────────────────────────────

describe('GET /api/forum/posts', () => {
    it('is publicly accessible (no auth required)', async () => {
        const res = await request(app).get(`${BASE}/posts`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.posts)).toBe(true);
    });

    it('returns existing posts with correct shape', async () => {
        await pool.query(
            `INSERT INTO forum_posts (author_id, category, title, content)
             VALUES ($1, 'announcement', 'Test Title', 'Test content')`,
            [admin._id.toString()]
        );

        const res = await request(app).get(`${BASE}/posts`);

        expect(res.status).toBe(200);
        expect(res.body.posts.length).toBeGreaterThanOrEqual(1);
        const post = res.body.posts[0];
        expect(post).toHaveProperty('id');
        expect(post).toHaveProperty('title');
        expect(post).toHaveProperty('category');
        expect(post).toHaveProperty('author_id');
    });

    it('filters by valid category', async () => {
        await pool.query(
            `INSERT INTO forum_posts (author_id, category, title, content)
             VALUES ($1, 'announcement', 'Announcement post', 'Content')`,
            [admin._id.toString()]
        );
        await pool.query(
            `INSERT INTO forum_posts (author_id, category, title, content)
             VALUES ($1, 'urgent_appeal', 'Urgent post', 'Content')`,
            [admin._id.toString()]
        );

        const res = await request(app).get(`${BASE}/posts?category=announcement`);

        expect(res.status).toBe(200);
        expect(res.body.posts.every(p => p.category === 'announcement')).toBe(true);
    });

    it('returns total count', async () => {
        await pool.query(
            `INSERT INTO forum_posts (author_id, category, title, content)
             VALUES ($1, 'announcement', 'Post 1', 'Content 1'),
                    ($1, 'announcement', 'Post 2', 'Content 2')`,
            [admin._id.toString()]
        );

        const res = await request(app).get(`${BASE}/posts`);

        expect(res.status).toBe(200);
        expect(typeof res.body.total).toBe('number');
        expect(res.body.total).toBeGreaterThanOrEqual(2);
    });
});

// ─── POST /api/forum/posts ───────────────────────────────────────────────────

describe('POST /api/forum/posts', () => {
    const validPost = () => ({
        title: 'New shelter announcement',
        content: 'We have exciting news for the community!',
        category: 'announcement',
    });

    it('returns 401 without authentication', async () => {
        const res = await request(app).post(`${BASE}/posts`).send(validPost());
        expect(res.status).toBe(401);
    });

    it('returns 403 for regular (non-admin) user', async () => {
        const res = await request(app)
            .post(`${BASE}/posts`)
            .set('Cookie', userCookie)
            .send(validPost());

        expect(res.status).toBe(403);
        expect(res.body.message).toMatch(/admin/i);
    });

    it('admin creates post with valid category → 201', async () => {
        const res = await request(app)
            .post(`${BASE}/posts`)
            .set('Cookie', adminCookie)
            .send(validPost());

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.post.title).toBe('New shelter announcement');
        expect(res.body.post.category).toBe('announcement');
        expect(res.body.post.author_id).toBe(admin._id.toString());
    });

    it('returns 400 for invalid category', async () => {
        const res = await request(app)
            .post(`${BASE}/posts`)
            .set('Cookie', adminCookie)
            .send({ ...validPost(), category: 'invalid_category' });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/category must be one of/i);
    });

    it('returns 400 for all valid categories except the invalid one', async () => {
        const VALID = ['transparency', 'announcement', 'urgent_appeal', 'community_spotlight', 'safety_awareness'];
        for (const cat of VALID) {
            const res = await request(app)
                .post(`${BASE}/posts`)
                .set('Cookie', adminCookie)
                .send({ title: `Post ${cat}`, content: 'Content', category: cat });
            expect(res.status).toBe(201);
        }
    });

    it('returns 400 when title is missing', async () => {
        const { title, ...noTitle } = validPost();
        const res = await request(app)
            .post(`${BASE}/posts`)
            .set('Cookie', adminCookie)
            .send(noTitle);

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/title is required/i);
    });

    it('returns 400 when content is missing', async () => {
        const { content, ...noContent } = validPost();
        const res = await request(app)
            .post(`${BASE}/posts`)
            .set('Cookie', adminCookie)
            .send(noContent);

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/content is required/i);
    });
});
