const mysql = require('mysql2/promise');
require('dotenv').config();

// Create connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'talk_to_syllabus',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

/**
 * Helper to run a query with prepared statements
 * Usage: const [rows] = await query('SELECT * FROM users WHERE id = ?', [1]);
 */
const query = (sql, params) => pool.execute(sql, params);

/**
 * Get a connection from the pool for transactions
 */
const getConnection = () => pool.getConnection();

module.exports = { pool, query, getConnection };
