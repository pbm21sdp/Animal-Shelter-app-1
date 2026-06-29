/**
 * Integration tests — Notifications endpoints
 * Verifică izolarea (user A nu vede notificările lui B)
 * și ownership-ul pe PATCH /:id/read.
 */
import request from 'supertest';
import { pool } from '../../config/database/connectPostgresDB.js';
import { app } from '../../app.js';
import {
    setupIntegration,
    teardownIntegration,
    clearAll,
    createTestUser,
    authCookie,
    seedNotification,
    seedPet,
} from './helpers/integrationSetup.js';

const BASE = '/api/notifications';

let userA, userB, cookieA, cookieB;

beforeAll(async () => { await setupIntegration(); });
afterAll(async () => { await teardownIntegration(); });

beforeEach(async () => {
    await clearAll();
    userA = await createTestUser({ name: 'User A' });
    userB = await createTestUser({ name: 'User B' });
    cookieA = authCookie(userA._id, false);
    cookieB = authCookie(userB._id, false);
});

// ─── GET /api/notifications ──────────────────────────────────────────────────

describe('GET /api/notifications', () => {
    it('returns 401 without token', async () => {
        const res = await request(app).get(BASE);
        expect(res.status).toBe(401);
    });

    it('returns empty list when user has no notifications', async () => {
        const res = await request(app).get(BASE).set('Cookie', cookieA);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.notifications).toEqual([]);
        expect(res.body.total).toBe(0);
    });

    it('returns only the current user\'s notifications (isolation)', async () => {
        const petA = await seedPet(userA._id.toString());
        const petB = await seedPet(userB._id.toString());

        await seedNotification(userA._id.toString(), petA.id, { message: 'Notif for A' });
        await seedNotification(userA._id.toString(), petA.id, { message: 'Notif for A 2' });
        await seedNotification(userB._id.toString(), petB.id, { message: 'Notif for B' });

        const resA = await request(app).get(BASE).set('Cookie', cookieA);
        const resB = await request(app).get(BASE).set('Cookie', cookieB);

        expect(resA.status).toBe(200);
        expect(resA.body.total).toBe(2);
        expect(resA.body.notifications.every(n => n.user_id === userA._id.toString())).toBe(true);

        expect(resB.status).toBe(200);
        expect(resB.body.total).toBe(1);
        expect(resB.body.notifications[0].message).toBe('Notif for B');
    });

    it('returns correct shape (success, notifications array, total, limit, offset)', async () => {
        const res = await request(app).get(BASE).set('Cookie', cookieA);

        expect(res.body).toMatchObject({
            success: true,
            notifications: expect.any(Array),
            total: expect.any(Number),
            limit: expect.any(Number),
            offset: expect.any(Number),
        });
    });

    it('respects limit and offset query params', async () => {
        const pet = await seedPet(userA._id.toString());
        // insert 5 notifications
        for (let i = 0; i < 5; i++) {
            await seedNotification(userA._id.toString(), pet.id, { message: `Notif ${i}` });
        }

        const res = await request(app)
            .get(`${BASE}?limit=2&offset=1`)
            .set('Cookie', cookieA);

        expect(res.status).toBe(200);
        expect(res.body.notifications.length).toBe(2);
        expect(res.body.total).toBe(5);
        expect(res.body.limit).toBe(2);
        expect(res.body.offset).toBe(1);
    });
});

// ─── GET /api/notifications/unread-count ────────────────────────────────────

describe('GET /api/notifications/unread-count', () => {
    it('returns 401 without token', async () => {
        const res = await request(app).get(`${BASE}/unread-count`);
        expect(res.status).toBe(401);
    });

    it('returns correct unread count', async () => {
        const pet = await seedPet(userA._id.toString());
        await seedNotification(userA._id.toString(), pet.id);
        await seedNotification(userA._id.toString(), pet.id);
        // Mark one as read
        await pool.query(
            `UPDATE notifications SET is_read = true WHERE id = (
                SELECT id FROM notifications WHERE user_id = $1 LIMIT 1
            )`,
            [userA._id.toString()]
        );

        const res = await request(app).get(`${BASE}/unread-count`).set('Cookie', cookieA);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        // At least 1 unread (1 was marked read, 1 is still unread)
        expect(res.body.count).toBeGreaterThanOrEqual(1);
    });
});

// ─── PATCH /api/notifications/:id/read ──────────────────────────────────────

describe('PATCH /api/notifications/:id/read', () => {
    it('returns 401 without token', async () => {
        const pet = await seedPet(userA._id.toString());
        const notif = await seedNotification(userA._id.toString(), pet.id);
        const res = await request(app).patch(`${BASE}/${notif.id}/read`);
        expect(res.status).toBe(401);
    });

    it('marks own notification as read → is_read becomes true', async () => {
        const pet = await seedPet(userA._id.toString());
        const notif = await seedNotification(userA._id.toString(), pet.id);

        const res = await request(app)
            .patch(`${BASE}/${notif.id}/read`)
            .set('Cookie', cookieA);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.notification.is_read).toBe(true);

        // Verify in DB
        const { rows } = await pool.query(
            'SELECT is_read FROM notifications WHERE id = $1',
            [notif.id]
        );
        expect(rows[0].is_read).toBe(true);
    });

    it('returns 404 when user B tries to mark user A\'s notification as read', async () => {
        const pet = await seedPet(userA._id.toString());
        const notifA = await seedNotification(userA._id.toString(), pet.id);

        const res = await request(app)
            .patch(`${BASE}/${notifA.id}/read`)
            .set('Cookie', cookieB);

        // Controller: UPDATE ... WHERE id=$1 AND user_id=$2 → 0 rows → 404
        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/not found/i);
    });

    it('returns 404 for non-existent notification id', async () => {
        const res = await request(app)
            .patch(`${BASE}/99999/read`)
            .set('Cookie', cookieA);

        expect(res.status).toBe(404);
    });
});

// ─── PATCH /api/notifications/read-all ──────────────────────────────────────

describe('PATCH /api/notifications/read-all', () => {
    it('returns 401 without token', async () => {
        const res = await request(app).patch(`${BASE}/read-all`);
        expect(res.status).toBe(401);
    });

    it('marks all own notifications as read without touching other users\'', async () => {
        const petA = await seedPet(userA._id.toString());
        const petB = await seedPet(userB._id.toString());

        await seedNotification(userA._id.toString(), petA.id);
        await seedNotification(userA._id.toString(), petA.id);
        await seedNotification(userB._id.toString(), petB.id);

        const res = await request(app)
            .patch(`${BASE}/read-all`)
            .set('Cookie', cookieA);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        // All of A's notifications should now be read
        const { rows: aRows } = await pool.query(
            'SELECT is_read FROM notifications WHERE user_id = $1',
            [userA._id.toString()]
        );
        expect(aRows.every(r => r.is_read === true)).toBe(true);

        // B's notification should still be unread
        const { rows: bRows } = await pool.query(
            'SELECT is_read FROM notifications WHERE user_id = $1',
            [userB._id.toString()]
        );
        expect(bRows[0].is_read).toBe(false);
    });
});
