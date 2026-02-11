const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    multipleStatements: true,
};

async function setup() {
    let connection;
    try {
        // Connect without DB first to create it if needed
        connection = await mysql.createConnection(dbConfig);
        console.log('🔌 Connected to MySQL server.');

        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'talk_to_syllabus'}\`;`);
        console.log(`✅ Database ${process.env.DB_NAME} created/checked.`);

        await connection.changeUser({ database: process.env.DB_NAME || 'talk_to_syllabus' });

        // Users Table
        await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id CHAR(36) PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(150) NOT NULL,
        avatar_url TEXT,
        university VARCHAR(255),
        department VARCHAR(255),
        enrollment_year INT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        is_verified BOOLEAN NOT NULL DEFAULT FALSE,
        total_queries INT NOT NULL DEFAULT 0,
        last_login_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email)
      );
    `);
        console.log('✅ Users table ready.');

        // Documents Table
        await connection.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id CHAR(36) PRIMARY KEY,
        uploaded_by CHAR(36) NOT NULL,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        file_name VARCHAR(500) NOT NULL,
        file_url TEXT NOT NULL,
        file_size_bytes BIGINT,
        mime_type VARCHAR(100) DEFAULT 'application/pdf',
        page_count INT,
        course_name VARCHAR(255),
        course_code VARCHAR(50),
        semester VARCHAR(50),
        processing_status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
        processing_error TEXT,
        processed_at DATETIME,
        total_chunks INT DEFAULT 0,
        is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_uploaded_by (uploaded_by)
      );
    `);
        console.log('✅ Documents table ready.');

        // Chat Sessions
        await connection.query(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id CHAR(36) PRIMARY KEY,
        user_id CHAR(36) NOT NULL,
        title VARCHAR(500),
        document_id CHAR(36),
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        message_count INT NOT NULL DEFAULT 0,
        last_message_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL,
        INDEX idx_user_id (user_id)
      );
    `);
        console.log('✅ Chat Sessions table ready.');

        // Chat Messages
        await connection.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id CHAR(36) PRIMARY KEY,
        session_id CHAR(36) NOT NULL,
        role ENUM('user', 'assistant', 'system') NOT NULL,
        content TEXT NOT NULL,
        retrieved_chunk_ids JSON, -- Store IDs of Pinecone vectors used
        model_used VARCHAR(100),
        prompt_tokens INT,
        completion_tokens INT,
        total_tokens INT,
        feedback_rating TINYINT,
        feedback_text TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE,
        INDEX idx_session_id (session_id)
      );
    `);
        console.log('✅ Chat Messages table ready.');

        // Document Shares
        await connection.query(`
      CREATE TABLE IF NOT EXISTS document_shares (
        id CHAR(36) PRIMARY KEY,
        document_id CHAR(36) NOT NULL,
        shared_by CHAR(36) NOT NULL,
        shared_with CHAR(36) NOT NULL,
        permission ENUM('read', 'read_write') DEFAULT 'read',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_share (document_id, shared_with),
        FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
        FOREIGN KEY (shared_by) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (shared_with) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
        console.log('✅ Document Shares table ready.');

    } catch (err) {
        console.error('❌ Setup failed:', err);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

setup();
