-- Migration: 002_create_users
-- Description: Create users table for student/user information
-- Created: 2026-02-11

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Authentication fields
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    
    -- Profile information
    full_name VARCHAR(150) NOT NULL,
    avatar_url TEXT,
    
    -- Academic context
    university VARCHAR(255),
    department VARCHAR(255),
    enrollment_year INTEGER,
    
    -- Account status
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Token / usage tracking
    total_queries INTEGER NOT NULL DEFAULT 0,
    last_login_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast email lookups during authentication
CREATE INDEX idx_users_email ON users (email);

-- Index for filtering active users  
CREATE INDEX idx_users_is_active ON users (is_active) WHERE is_active = TRUE;

-- Trigger to auto-update 'updated_at' on row modification
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
