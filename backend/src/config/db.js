import pg from 'pg';
const { Pool } = pg;  // Destructure Pool from the default export

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: String(process.env.DB_PASSWORD),
    database: process.env.DB_NAME,
});

export { pool };  // Use ES module export