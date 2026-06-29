/**
 * Integration tests — Community adoption endpoints
 * Tests the "mark as adopted" flow with the 3 adopter options:
 *   1. PAWS user (adoptedById = MongoDB _id)
 *   2. External person (adopterExternalName)
 *   3. Rather not say (neither field sent)
 * Also tests PATCH /pets/:id/return.
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

const PETS = '/api/pets';

let uploader, otherUser, admin;
let uploaderCookie, otherCookie, adminCookie;

beforeAll(async () => { await setupIntegration(); });
afterAll(async () => { await teardownIntegration(); });

beforeEach(async () => {
    await clearAll();
    uploader  = await createTestUser({ name: 'Uploader' });
    otherUser = await createTestUser({ name: 'Other' });
    admin     = await createAdminUser();
    uploaderCookie = authCookie(uploader._id, false);
    otherCookie    = authCookie(otherUser._id, false);
    adminCookie    = authCookie(admin._id, true);
});

// ─── PATCH /api/pets/:id/adopt ───────────────────────────────────────────────

describe('PATCH /api/pets/:id/adopt', () => {
    it('returns 401 without authentication', async () => {
        const pet = await seedPet(uploader._id.toString());
        const res = await request(app).patch(`${PETS}/${pet.id}/adopt`);
        expect(res.status).toBe(401);
    });

    it('returns 403 when non-uploader, non-admin tries to adopt', async () => {
        const pet = await seedPet(uploader._id.toString());

        const res = await request(app)
            .patch(`${PETS}/${pet.id}/adopt`)
            .set('Cookie', otherCookie)
            .send({});

        expect(res.status).toBe(403);
        expect(res.body.message).toMatch(/uploader or an admin/i);
    });

    it('option 1 — PAWS user: stores adoptedById, sets is_adopted = true', async () => {
        const pet = await seedPet(uploader._id.toString());
        const adopter = await createTestUser({ name: 'Adopter Paws' });

        const res = await request(app)
            .patch(`${PETS}/${pet.id}/adopt`)
            .set('Cookie', uploaderCookie)
            .send({ adoptedById: adopter._id.toString() });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.pet.is_adopted).toBe(true);
        expect(res.body.pet.adopted_by).toBe(adopter._id.toString());
        expect(res.body.pet.adopter_external_name).toBeNull();
        expect(res.body.pet.adoption_status_label).toBe('adopted');
        expect(res.body.pet.adoption_status).toBe('adopted');
    });

    it('option 2 — external person: stores adopterExternalName, no adoptedById', async () => {
        const pet = await seedPet(uploader._id.toString());

        const res = await request(app)
            .patch(`${PETS}/${pet.id}/adopt`)
            .set('Cookie', uploaderCookie)
            .send({ adopterExternalName: 'Maria Ionescu' });

        expect(res.status).toBe(200);
        expect(res.body.pet.is_adopted).toBe(true);
        expect(res.body.pet.adopter_external_name).toBe('Maria Ionescu');
        expect(res.body.pet.adopted_by).toBeNull();
        expect(res.body.pet.adoption_status).toBe('adopted');
    });

    it('option 3 — rather not say: neither adoptedById nor adopterExternalName', async () => {
        const pet = await seedPet(uploader._id.toString());

        const res = await request(app)
            .patch(`${PETS}/${pet.id}/adopt`)
            .set('Cookie', uploaderCookie)
            .send({});

        expect(res.status).toBe(200);
        expect(res.body.pet.is_adopted).toBe(true);
        expect(res.body.pet.adopted_by).toBeNull();
        expect(res.body.pet.adopter_external_name).toBeNull();
        expect(res.body.pet.adoption_status).toBe('adopted');
    });

    it('admin can also mark a pet as adopted', async () => {
        const pet = await seedPet(uploader._id.toString());

        const res = await request(app)
            .patch(`${PETS}/${pet.id}/adopt`)
            .set('Cookie', adminCookie)
            .send({});

        expect(res.status).toBe(200);
        expect(res.body.pet.is_adopted).toBe(true);
    });
});

// ─── PATCH /api/pets/:id/return ──────────────────────────────────────────────

describe('PATCH /api/pets/:id/return', () => {
    it('returns 401 without authentication', async () => {
        const pet = await seedPet(uploader._id.toString());
        await pool.query(`UPDATE pets SET is_adopted = true, adoption_status = 'adopted' WHERE id = $1`, [pet.id]);
        const res = await request(app).patch(`${PETS}/${pet.id}/return`);
        expect(res.status).toBe(401);
    });

    it('returns 400 when pet is not adopted', async () => {
        const pet = await seedPet(uploader._id.toString());

        const res = await request(app)
            .patch(`${PETS}/${pet.id}/return`)
            .set('Cookie', uploaderCookie);

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/not marked as adopted/i);
    });

    it('marks pet as returned → adoption_status_label=returned, is_available=true', async () => {
        const pet = await seedPet(uploader._id.toString());
        // First adopt the pet
        await request(app)
            .patch(`${PETS}/${pet.id}/adopt`)
            .set('Cookie', uploaderCookie)
            .send({ adopterExternalName: 'Temp adopter' });

        // Now return it
        const res = await request(app)
            .patch(`${PETS}/${pet.id}/return`)
            .set('Cookie', uploaderCookie);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.pet.adoption_status_label).toBe('returned');
        expect(res.body.pet.adoption_status).toBe('available');

        // adopted_at should still be preserved (adoption history kept)
        expect(res.body.pet.adopted_at).toBeTruthy();

        // is_available is set by trigger when adoption_status = 'available'
        const { rows } = await pool.query('SELECT is_available FROM pets WHERE id = $1', [pet.id]);
        expect(rows[0].is_available).toBe(true);
    });

    it('returns 403 for non-uploader, non-admin', async () => {
        const pet = await seedPet(uploader._id.toString());
        await pool.query(
            `UPDATE pets SET is_adopted = true, adoption_status = 'adopted', adoption_status_label = 'adopted' WHERE id = $1`,
            [pet.id]
        );

        const res = await request(app)
            .patch(`${PETS}/${pet.id}/return`)
            .set('Cookie', otherCookie);

        expect(res.status).toBe(403);
    });
});
