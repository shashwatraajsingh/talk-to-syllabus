const pool = require('./src/config/database');
require('dotenv').config();

async function setup() {
    const client = await pool.connect();
    try {
        console.log('🔌 Connected to Supabase PostgreSQL');

        // Note: Supabase handles users via auth.users table automatically
        // We only need to create our application tables

        // Documents Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS documents (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL, -- References auth.users(id)
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
                processing_status VARCHAR(20) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
                processing_error TEXT,
                processed_at TIMESTAMPTZ,
                total_chunks INT DEFAULT 0,
                is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
        `);
        console.log('✅ Documents table ready');

        // Chat Sessions
        await client.query(`
            CREATE TABLE IF NOT EXISTS chat_sessions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL,
                title VARCHAR(500),
                document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
                is_active BOOLEAN NOT NULL DEFAULT TRUE,
                message_count INT NOT NULL DEFAULT 0,
                last_message_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
        `);
        console.log('✅ Chat Sessions table ready');

        // Chat Messages
        await client.query(`
            CREATE TABLE IF NOT EXISTS chat_messages (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
                role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
                content TEXT NOT NULL,
                retrieved_chunk_ids JSONB,
                model_used VARCHAR(100),
                prompt_tokens INT,
                completion_tokens INT,
                total_tokens INT,
                feedback_rating SMALLINT,
                feedback_text TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
        `);
        console.log('✅ Chat Messages table ready');

        // Document Shares
        await client.query(`
            CREATE TABLE IF NOT EXISTS document_shares (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
                shared_by UUID NOT NULL,
                shared_with UUID NOT NULL,
                permission VARCHAR(20) DEFAULT 'read' CHECK (permission IN ('read', 'read_write')),
                created_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(document_id, shared_with)
            );
        `);
        console.log('✅ Document Shares table ready');

        console.log('\n✅ All tables created successfully!\n');

    } catch (err) {
        console.error('❌ Setup failed:', err);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

setup();
