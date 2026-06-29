// ARCHIVED — one-off migration script, already applied to production DB.
// What it did: set adoption_status='adopted' on all pets where is_adopted=TRUE
// but adoption_status was out of sync (different value). Ran once after the
// adoption_status field was introduced. Do NOT run again.

import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const { Pool } = pg;

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: String(process.env.DB_PASSWORD),
    database: process.env.DB_NAME,
});

const fix = await pool.query(`
    UPDATE pets
    SET adoption_status = 'adopted'
    WHERE is_adopted = TRUE AND adoption_status != 'adopted'
    RETURNING id, name
`);

if (fix.rows.length === 0) {
    console.log('Nothing to fix — all adopted pets already have correct status.');
} else {
    console.log(`Fixed ${fix.rows.length} pet(s):`);
    fix.rows.forEach(r => console.log(`  · #${r.id} ${r.name}`));
}

await pool.end();
