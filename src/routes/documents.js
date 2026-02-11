const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { processPDF } = require('../services/pdfProcessor');

const router = express.Router();

const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB) || 20) * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') cb(null, true);
        else cb(new Error('Only PDF files are allowed.'), false);
    },
});

/**
 * POST /api/documents/upload
 */
router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No PDF file uploaded.' });

        const { title, description, courseName, courseCode, semester } = req.body;
        if (!title) return res.status(400).json({ error: 'Document title is required.' });

        const result = await pool.query(
            `INSERT INTO documents 
       (user_id, title, description, file_name, file_url, file_size_bytes, mime_type, course_name, course_code, semester)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
            [
                req.user.id,
                title,
                description || null,
                req.file.originalname,
                req.file.path,
                req.file.size,
                req.file.mimetype,
                courseName || null,
                courseCode || null,
                semester || null,
            ]
        );

        const document = result.rows[0];

        // Process PDF async
        processPDF(document.id, req.file.path).catch((err) => {
            console.error(`Background PDF processing failed for ${document.id}:`, err.message);
        });

        res.status(201).json({
            message: 'Document uploaded! Processing will begin shortly.',
            document: {
                id: document.id,
                title: document.title,
                fileName: document.file_name,
                status: document.processing_status,
                createdAt: document.created_at,
            },
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload document.' });
    }
});

/**
 * GET /api/documents
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT d.id, d.title, d.description, d.file_name, d.course_name, d.course_code, 
              d.semester, d.processing_status, d.total_chunks, d.page_count, d.created_at,
              CASE WHEN d.user_id = $1 THEN 'owner' ELSE 'shared' END as access_type
       FROM documents d
       WHERE d.is_deleted = FALSE
         AND (d.user_id = $1 OR d.id IN (
           SELECT document_id FROM document_shares WHERE shared_with = $1
         ))
       ORDER BY d.created_at DESC`,
            [req.user.id]
        );
        res.json({ documents: result.rows });
    } catch (error) {
        console.error('List documents error:', error);
        res.status(500).json({ error: 'Failed to fetch documents.' });
    }
});

/**
 * DELETE /api/documents/:id
 */
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `UPDATE documents SET is_deleted = TRUE, updated_at = NOW()
       WHERE id = $1 AND user_id = $2 AND is_deleted = FALSE`,
            [req.params.id, req.user.id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Document not found or access denied.' });
        }

        res.json({ message: 'Document deleted successfully.' });
    } catch (error) {
        console.error('Delete document error:', error);
        res.status(500).json({ error: 'Failed to delete document.' });
    }
});

module.exports = router;
