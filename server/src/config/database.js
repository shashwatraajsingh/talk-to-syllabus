const { Pool } = require('pg');
require('dotenv').config();

// Supabase PostgreSQL connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Required for Supabase
    },
    connectionTimeoutMillis: 10000, // 10s timeout
    idleTimeoutMillis: 30000,
    max: 10,
});

// Test connection
pool.on('connect', () => {
    console.log('✅ Connected to Supabase PostgreSQL');
});

pool.on('error', (err) => {
    console.error('❌ PostgreSQL pool error:', err.message);
    // Don't crash the server - just log the error
});

module.exports = pool;
