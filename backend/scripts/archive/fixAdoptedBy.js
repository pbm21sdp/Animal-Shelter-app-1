// ARCHIVED — one-off cleanup script, already applied to production DB.
// What it did: cleared the adopted_by column for pets where is_adopted=FALSE
// but adopted_by was left non-NULL by old code (stale data from a previous
// adoption that was later cancelled). Ran once. Do NOT run again.

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

// Clear adopted_by for pets that are no longer adopted
// (is_adopted = false but adopted_by was left set by old code)
const fix = await pool.query(`
    UPDATE pets
    SET adopted_by = NULL
    WHERE is_adopted = FALSE AND adopted_by IS NOT NULL
    RETURNING id, name
`);

if (fix.rows.length === 0) {
    console.log('Nothing to fix — no stale adopted_by entries found.');
} else {
    console.log(`Fixed ${fix.rows.length} pet(s):`);
    fix.rows.forEach(r => console.log(`  · #${r.id} ${r.name}`));
}

await pool.end();
