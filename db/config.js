const { Pool } = require('pg');

const pool = new Pool({
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME     || 'haivintage',
    user:     process.env.DB_USER     || 'postgres',
    password: process.env.DB_PASSWORD || '1974'
});

pool.on('error', (err) => {
    console.error('Eroare neașteptată la conexiunea PostgreSQL:', err.message);
});

module.exports = pool;
