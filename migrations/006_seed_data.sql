-- Migration: 006_seed_data
-- Description: Insert sample seed data for development and testing
-- Created: 2026-02-11
-- NOTE: This is for development only. Do NOT run in production.

-- Sample users (passwords are bcrypt hashes of 'password123')
INSERT INTO users (id, email, password_hash, full_name, university, department, enrollment_year, is_active, is_verified)
VALUES
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'alice@university.edu', '$2b$10$dummyhashfordevpurposesonly000000000000000000', 'Alice Johnson', 'State University', 'Computer Science', 2024, TRUE, TRUE),
    ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'bob@university.edu', '$2b$10$dummyhashfordevpurposesonly000000000000000001', 'Bob Williams', 'State University', 'Computer Science', 2024, TRUE, TRUE),
    ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'charlie@university.edu', '$2b$10$dummyhashfordevpurposesonly000000000000000002', 'Charlie Brown', 'State University', 'Data Science', 2025, TRUE, FALSE)
ON CONFLICT (email) DO NOTHING;

-- Sample documents
INSERT INTO documents (id, uploaded_by, title, file_name, file_url, course_name, course_code, semester, processing_status, total_chunks)
VALUES
    ('d4e5f6a7-b8c9-0123-defa-234567890123', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'CS301 - Data Structures Syllabus', 'cs301_syllabus.pdf', 'https://storage.example.com/docs/cs301_syllabus.pdf', 'Data Structures & Algorithms', 'CS301', 'Spring 2026', 'completed', 42),
    ('e5f6a7b8-c9d0-1234-efab-345678901234', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'CS405 - Machine Learning Syllabus', 'cs405_syllabus.pdf', 'https://storage.example.com/docs/cs405_syllabus.pdf', 'Machine Learning', 'CS405', 'Spring 2026', 'completed', 38),
    ('f6a7b8c9-d0e1-2345-fabc-456789012345', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'DS201 - Statistics Fundamentals', 'ds201_syllabus.pdf', 'https://storage.example.com/docs/ds201_syllabus.pdf', 'Statistics Fundamentals', 'DS201', 'Spring 2026', 'pending', 0)
ON CONFLICT DO NOTHING;

-- Sample chat session
INSERT INTO chat_sessions (id, user_id, title, document_id, is_active, message_count)
VALUES
    ('11111111-2222-3333-4444-555555555555', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Questions about Data Structures midterm', 'd4e5f6a7-b8c9-0123-defa-234567890123', TRUE, 2)
ON CONFLICT DO NOTHING;

-- Sample chat messages
INSERT INTO chat_messages (session_id, role, content, model_used, prompt_tokens, completion_tokens, total_tokens)
VALUES
    ('11111111-2222-3333-4444-555555555555', 'user', 'What topics are covered in the midterm exam for CS301?', NULL, NULL, NULL, NULL),
    ('11111111-2222-3333-4444-555555555555', 'assistant', 'Based on the CS301 syllabus, the midterm exam covers the following topics:\n\n1. Arrays and Linked Lists\n2. Stacks and Queues\n3. Trees (Binary Trees, BST, AVL Trees)\n4. Hash Tables\n5. Time and Space Complexity Analysis\n\nThe exam is scheduled for Week 8 and will be a 2-hour closed-book examination worth 30% of your final grade.', 'gemini-2.0-flash', 1250, 180, 1430)
ON CONFLICT DO NOTHING;

-- Sample document share
INSERT INTO document_shares (document_id, shared_by, shared_with, permission)
VALUES
    ('d4e5f6a7-b8c9-0123-defa-234567890123', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'read')
ON CONFLICT DO NOTHING;
