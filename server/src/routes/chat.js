const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { retrieveRelevantChunks, generateRAGResponse } = require('../services/rag');

const router = express.Router();

/**
 * POST /api/chat/sessions
 */
router.post('/sessions', authenticateToken, async (req, res) => {
    try {
        const { title, documentId } = req.body;

        // Optional document check
        if (documentId) {
            const result = await pool.query(
                `SELECT id FROM documents 
         WHERE id = $1 AND is_deleted = FALSE
           AND (user_id = $2 OR id IN (SELECT document_id FROM document_shares WHERE shared_with = $2))`,
                [documentId, req.user.id]
            );
            if (result.rows.length === 0) return res.status(404).json({ error: 'Document not found or access denied.' });
        }

        const result = await pool.query(
            `INSERT INTO chat_sessions (user_id, title, document_id) 
             VALUES ($1, $2, $3) RETURNING *`,
            [req.user.id, title || 'New Chat', documentId || null]
        );

        res.status(201).json({ session: result.rows[0] });

    } catch (error) {
        console.error('Create session error:', error);
        res.status(500).json({ error: 'Failed to create chat session.' });
    }
});

/**
 * GET /api/chat/sessions
 */
router.get('/sessions', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT cs.id, cs.title, cs.document_id, cs.message_count, cs.last_message_at, cs.created_at,
              d.title as document_title, d.course_name
       FROM chat_sessions cs
       LEFT JOIN documents d ON d.id = cs.document_id
       WHERE cs.user_id = $1 AND cs.is_active = TRUE
       ORDER BY COALESCE(cs.last_message_at, cs.created_at) DESC`,
            [req.user.id]
        );
        res.json({ sessions: result.rows });
    } catch (error) {
        console.error('List sessions error:', error);
        res.status(500).json({ error: 'Failed to fetch sessions.' });
    }
});

/**
 * GET /api/chat/sessions/:sessionId/messages
 */
router.get('/sessions/:sessionId/messages', authenticateToken, async (req, res) => {
    try {
        // Verify session ownership
        const session = await pool.query('SELECT id FROM chat_sessions WHERE id = $1 AND user_id = $2', [req.params.sessionId, req.user.id]);
        if (session.rows.length === 0) return res.status(404).json({ error: 'Chat session not found.' });

        const result = await pool.query(
            `SELECT id, role, content, retrieved_chunk_ids, model_used, 
              prompt_tokens, completion_tokens, total_tokens,
              feedback_rating, created_at
       FROM chat_messages
       WHERE session_id = $1
       ORDER BY created_at ASC`,
            [req.params.sessionId]
        );

        res.json({ messages: result.rows });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ error: 'Failed to fetch messages.' });
    }
});

/**
 * POST /api/chat/sessions/:sessionId/messages
 * RAG Pipeline: User Msg -> Pinecone Search -> Gemini -> AI Msg
 */
router.post('/sessions/:sessionId/messages', authenticateToken, async (req, res) => {
    try {
        const { content } = req.body;
        if (!content || !content.trim()) return res.status(400).json({ error: 'Message content is required.' });

        // 1. Validate session
        const sessions = await pool.query('SELECT id, document_id FROM chat_sessions WHERE id = $1 AND user_id = $2', [req.params.sessionId, req.user.id]);
        if (sessions.rows.length === 0) return res.status(404).json({ error: 'Chat session not found.' });
        const session = sessions.rows[0];

        // 2. Save user message
        await pool.query(
            `INSERT INTO chat_messages (session_id, role, content) VALUES ($1, 'user', $2)`,
            [session.id, content]
        );

        // 3. RAG Retrieval (Pinecone)
        const retrievedChunks = await retrieveRelevantChunks(content, session.document_id, 5);
        const chunkIds = retrievedChunks.map(c => c.id);

        // 4. Get chat history
        const historyRows = await pool.query(
            `SELECT role, content FROM chat_messages WHERE session_id = $1 ORDER BY created_at DESC LIMIT 10`,
            [session.id]
        );
        const chatHistory = historyRows.rows.reverse();

        // 5. Generate AI Response
        const aiResponse = await generateRAGResponse(content, retrievedChunks, chatHistory);

        // 6. Save AI message
        const aiMsg = await pool.query(
            `INSERT INTO chat_messages 
       (session_id, role, content, retrieved_chunk_ids, model_used, prompt_tokens, completion_tokens, total_tokens)
       VALUES ($1, 'assistant', $2, $3, $4, $5, $6, $7) RETURNING *`,
            [
                session.id,
                aiResponse.content,
                JSON.stringify(chunkIds),
                aiResponse.model,
                aiResponse.promptTokens,
                aiResponse.completionTokens,
                aiResponse.totalTokens
            ]
        );

        // 7. Update session stats
        await pool.query(
            `UPDATE chat_sessions 
       SET message_count = message_count + 2, last_message_at = NOW() 
       WHERE id = $1`,
            [session.id]
        );

        // Return response
        const sources = retrievedChunks.map(chunk => ({
            documentTitle: chunk.document_title,
            courseName: chunk.course_name,
            pageNumber: chunk.page_number,
            similarity: chunk.similarity?.toFixed(3),
            preview: chunk.chunk_text.substring(0, 150) + '...'
        }));

        res.json({
            message: aiMsg.rows[0],
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
router.delete('/sessions/:sessionId', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'UPDATE chat_sessions SET is_active = FALSE, updated_at = NOW() WHERE id = $1 AND user_id = $2',
            [req.params.sessionId, req.user.id]
        );
        if (result.rowCount === 0) return res.status(404).json({ error: 'Chat session not found.' });
        res.json({ message: 'Chat session deleted.' });
    } catch (error) {
        console.error('Delete session error:', error);
        res.status(500).json({ error: 'Failed to delete session.' });
    }
});

module.exports = router;
