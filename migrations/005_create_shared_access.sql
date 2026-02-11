-- Migration: 005_create_shared_access
-- Description: Allow users to share documents with other students
-- Created: 2026-02-11

-- Enables collaborative document access between students
CREATE TABLE IF NOT EXISTS document_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- The document being shared
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    
    -- Who shared it and who it's shared with
    shared_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shared_with UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Permission level
    permission VARCHAR(20) NOT NULL DEFAULT 'read'
        CHECK (permission IN ('read', 'read_write')),
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Prevent duplicate shares
    UNIQUE (document_id, shared_with)
);

-- Indexes for shared access lookups
CREATE INDEX idx_shares_shared_with ON document_shares (shared_with);
CREATE INDEX idx_shares_document ON document_shares (document_id);
CREATE INDEX idx_shares_shared_by ON document_shares (shared_by);
