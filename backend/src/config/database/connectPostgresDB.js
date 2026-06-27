import pg from 'pg';
const { Pool, types } = pg;

// pg reads TIMESTAMP WITHOUT TIME ZONE as a local-time string (e.g. "2026-06-27 14:51:00").
// On Windows (UTC+3) this shifts dates 3 hours back when serialized.
// Treat stored values as UTC so they arrive correctly in the frontend.
types.setTypeParser(1114, (str) => str ? new Date(str.replace(' ', 'T') + 'Z') : null);

let pool;

export const connectPostgresDB = async () => {
    try {
        pool = new Pool({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: String(process.env.DB_PASSWORD),
            database: process.env.DB_NAME,
        });

        await pool.query('SELECT NOW()');
        console.log('PostgreSQL connected successfully');
        return pool;
    } catch (error) {
        console.error('PostgreSQL connection error:', error);
        process.exit(1);
    }
}

export { pool };