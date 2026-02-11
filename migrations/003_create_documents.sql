-- Migration: 003_create_documents
-- Description: Create tables for PDF document storage and chunked embeddings for RAG
-- Created: 2026-02-11

-- Stores metadata about each uploaded PDF syllabus/document
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Who uploaded it
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Document metadata
    title VARCHAR(500) NOT NULL,
    description TEXT,
    file_name VARCHAR(500) NOT NULL,
    file_url TEXT NOT NULL,                     -- Cloud storage URL (GCS / S3)
    file_size_bytes BIGINT,
    mime_type VARCHAR(100) NOT NULL DEFAULT 'application/pdf',
    page_count INTEGER,
    
    -- Course context for better organization
    course_name VARCHAR(255),
    course_code VARCHAR(50),
    semester VARCHAR(50),
    
    -- Processing status for the RAG pipeline
    -- pending -> processing -> completed -> failed
    processing_status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    processing_error TEXT,
    processed_at TIMESTAMPTZ,
    
    -- Chunk statistics (populated after processing)
    total_chunks INTEGER DEFAULT 0,
    
    -- Soft delete support
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Stores text chunks extracted from PDFs, each with its vector embedding
-- This is the core table that powers the RAG retrieval step
CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Parent document reference
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    
    -- Chunk content
    chunk_text TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,               -- Order within the document
    page_number INTEGER,                        -- Which PDF page this came from
    
    -- Vector embedding for similarity search (1536 dimensions = OpenAI ada-002)
    -- Adjust dimension if using a different embedding model
    embedding vector(1536),
    
    -- Metadata for filtering / context enrichment
    token_count INTEGER,
    metadata JSONB DEFAULT '{}',                -- Flexible metadata (headings, section, etc.)
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for documents table
CREATE INDEX idx_documents_uploaded_by ON documents (uploaded_by);
CREATE INDEX idx_documents_course ON documents (course_code, course_name);
CREATE INDEX idx_documents_status ON documents (processing_status);
CREATE INDEX idx_documents_not_deleted ON documents (is_deleted) WHERE is_deleted = FALSE;

-- Indexes for document_chunks table
CREATE INDEX idx_chunks_document_id ON document_chunks (document_id);
CREATE INDEX idx_chunks_ordering ON document_chunks (document_id, chunk_index);

-- HNSW index for fast approximate nearest-neighbor search on embeddings
-- This makes vector similarity queries (the heart of RAG) performant
CREATE INDEX idx_chunks_embedding ON document_chunks
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- Auto-update trigger for documents
CREATE TRIGGER trg_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
