-- Migration: 001_create_extensions
-- Description: Enable required PostgreSQL extensions
-- Created: 2026-02-11

-- UUID generation support
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- pgvector for storing and querying embeddings (used in RAG)
CREATE EXTENSION IF NOT EXISTS "vector";

-- Full-text search improvements
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
