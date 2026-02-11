-- Migration: 004_create_chat_history
-- Description: Create tables for chat sessions and message history
-- Created: 2026-02-11

-- A chat session represents a single conversation thread
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Who owns this chat
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Session metadata
    title VARCHAR(500),                         -- Auto-generated or user-provided session title
    
    -- Which document(s) this chat is scoped to (NULL = all user documents)
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    
    -- Session state
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    message_count INTEGER NOT NULL DEFAULT 0,
    
    -- Timestamps
    last_message_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Individual messages within a chat session
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Parent session
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    
    -- Message content
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    
    -- RAG context: which chunks were retrieved to answer this query
    -- Stored as an array of chunk IDs for full traceability
    retrieved_chunk_ids UUID[] DEFAULT '{}',
    
    -- Model / cost metadata
    model_used VARCHAR(100),
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    total_tokens INTEGER,
    
    -- Feedback from user on this response
    feedback_rating SMALLINT CHECK (feedback_rating BETWEEN 1 AND 5),
    feedback_text TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for chat_sessions
CREATE INDEX idx_sessions_user_id ON chat_sessions (user_id);
CREATE INDEX idx_sessions_document_id ON chat_sessions (document_id);
CREATE INDEX idx_sessions_last_message ON chat_sessions (user_id, last_message_at DESC);

-- Indexes for chat_messages
CREATE INDEX idx_messages_session_id ON chat_messages (session_id);
CREATE INDEX idx_messages_session_created ON chat_messages (session_id, created_at ASC);
CREATE INDEX idx_messages_role ON chat_messages (session_id, role);

-- Auto-update trigger for chat_sessions
CREATE TRIGGER trg_chat_sessions_updated_at
    BEFORE UPDATE ON chat_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-update session stats when a new message is inserted
CREATE OR REPLACE FUNCTION update_session_on_new_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chat_sessions
    SET 
        message_count = message_count + 1,
        last_message_at = NEW.created_at
    WHERE id = NEW.session_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_session_stats
    AFTER INSERT ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_session_on_new_message();
