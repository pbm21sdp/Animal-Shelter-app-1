import pg from 'pg';
const { Pool } = pg;

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