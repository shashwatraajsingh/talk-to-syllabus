const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { retrieveRelevantChunks, generateRAGResponse } = require('../services/rag');

const router = express.Router();

/**
 * POST /api/chat/sessions
 */
router.post('/sessions', authenticate, async (req, res) => {
    try {
        const { title, documentId } = req.body;

        // Optional document check
        if (documentId) {
            const [rows] = await query(
                `SELECT id FROM documents 
         WHERE id = ? AND is_deleted = FALSE
           AND (uploaded_by = ? OR id IN (SELECT document_id FROM document_shares WHERE shared_with = ?))`,
                [documentId, req.user.id, req.user.id]
            );
            if (rows.length === 0) return res.status(404).json({ error: 'Document not found or access denied.' });
        }

        const sessionId = uuidv4();
        await query(
            `INSERT INTO chat_sessions (id, user_id, title, document_id) VALUES (?, ?, ?, ?)`,
            [sessionId, req.user.id, title || 'New Chat', documentId || null]
        );

        // Return session
        const [created] = await query('SELECT * FROM chat_sessions WHERE id = ?', [sessionId]);
        res.status(201).json({ session: created[0] });

    } catch (error) {
        console.error('Create session error:', error);
        res.status(500).json({ error: 'Failed to create chat session.' });
    }
});

/**
 * GET /api/chat/sessions
 */
router.get('/sessions', authenticate, async (req, res) => {
    try {
        const [rows] = await query(
            `SELECT cs.id, cs.title, cs.document_id, cs.message_count, cs.last_message_at, cs.created_at,
              d.title as document_title, d.course_name
       FROM chat_sessions cs
       LEFT JOIN documents d ON d.id = cs.document_id
       WHERE cs.user_id = ? AND cs.is_active = TRUE
       ORDER BY COALESCE(cs.last_message_at, cs.created_at) DESC`,
            [req.user.id]
        );
        res.json({ sessions: rows });
    } catch (error) {
        console.error('List sessions error:', error);
        res.status(500).json({ error: 'Failed to fetch sessions.' });
    }
});

/**
 * GET /api/chat/sessions/:sessionId/messages
 */
router.get('/sessions/:sessionId/messages', authenticate, async (req, res) => {
    try {
        // Verify session ownership
        const [session] = await query('SELECT id FROM chat_sessions WHERE id = ? AND user_id = ?', [req.params.sessionId, req.user.id]);
        if (session.length === 0) return res.status(404).json({ error: 'Chat session not found.' });

        const [rows] = await query(
            `SELECT id, role, content, retrieved_chunk_ids, model_used, 
              prompt_tokens, completion_tokens, total_tokens,
              feedback_rating, created_at
       FROM chat_messages
       WHERE session_id = ?
       ORDER BY created_at ASC`,
            [req.params.sessionId]
        );

        res.json({
            messages: rows.map(msg => ({
                ...msg,
                retrieved_chunk_ids: typeof msg.retrieved_chunk_ids === 'string'
                    ? JSON.parse(msg.retrieved_chunk_ids)
                    : msg.retrieved_chunk_ids
            }))
        });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ error: 'Failed to fetch messages.' });
    }
});

/**
 * POST /api/chat/sessions/:sessionId/messages
 * RAG Pipeline: User Msg -> Pinecone Search -> Gemini -> AI Msg
 */
router.post('/sessions/:sessionId/messages', authenticate, async (req, res) => {
    try {
        const { content } = req.body;
        if (!content || !content.trim()) return res.status(400).json({ error: 'Message content is required.' });

        // 1. Validate session
        const [sessions] = await query('SELECT id, document_id FROM chat_sessions WHERE id = ? AND user_id = ?', [req.params.sessionId, req.user.id]);
        if (sessions.length === 0) return res.status(404).json({ error: 'Chat session not found.' });
        const session = sessions[0];

        // 2. Save user message
        const [contentRes] = await query(
            `INSERT INTO chat_messages (id, session_id, role, content) VALUES (?, ?, 'user', ?)`,
            [uuidv4(), session.id, content]
        );

        // 3. RAG Retrieval (Pinecone)
        const retrievedChunks = await retrieveRelevantChunks(content, session.document_id, 5);
        const chunkIds = retrievedChunks.map(c => c.id); // Pinecone vector IDs

        // 4. Get chat history
        const [historyRows] = await query(
            `SELECT role, content FROM chat_messages WHERE session_id = ? ORDER BY created_at DESC LIMIT 10`,
            [session.id]
        );
        const chatHistory = historyRows.reverse();

        // 5. Generate AI Response
        const aiResponse = await generateRAGResponse(content, retrievedChunks, chatHistory);

        // 6. Save AI message
        const aiMsgId = uuidv4();
        await query(
            `INSERT INTO chat_messages 
       (id, session_id, role, content, retrieved_chunk_ids, model_used, prompt_tokens, completion_tokens, total_tokens)
       VALUES (?, ?, 'assistant', ?, ?, ?, ?, ?, ?)`,
            [
                aiMsgId,
                session.id,
                aiResponse.content,
                JSON.stringify(chunkIds), // Store as JSON string in MySQL
                aiResponse.model,
                aiResponse.promptTokens,
                aiResponse.completionTokens,
                aiResponse.totalTokens
            ]
        );

        // 7. Update session stats
        await query(
            `UPDATE chat_sessions 
       SET message_count = message_count + 2, last_message_at = NOW() 
       WHERE id = ?`,
            [session.id]
        );

        // 8. Update user active count
        await query('UPDATE users SET total_queries = total_queries + 1 WHERE id = ?', [req.user.id]);

        // Return response
        const sources = retrievedChunks.map(chunk => ({
            documentTitle: chunk.document_title,
            courseName: chunk.course_name,
            pageNumber: chunk.page_number,
            similarity: chunk.similarity?.toFixed(3),
            preview: chunk.chunk_text.substring(0, 150) + '...' // Pinecone ensures chunk_text is in metadata
        }));

        res.json({
            message: {
                id: aiMsgId,
                role: 'assistant',
                content: aiResponse.content,
                created_at: new Date().toISOString(),
            },
            sources,
        });

    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: 'Failed to generate response.' });
    }
});

/**
 * DELETE /api/chat/sessions/:sessionId
 */
router.delete('/sessions/:sessionId', authenticate, async (req, res) => {
    try {
        const [result] = await query(
            'UPDATE chat_sessions SET is_active = FALSE, updated_at = NOW() WHERE id = ? AND user_id = ?',
            [req.params.sessionId, req.user.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Chat session not found.' });
        res.json({ message: 'Chat session deleted.' });
    } catch (error) {
        console.error('Delete session error:', error);
        res.status(500).json({ error: 'Failed to delete session.' });
    }
});

module.exports = router;
