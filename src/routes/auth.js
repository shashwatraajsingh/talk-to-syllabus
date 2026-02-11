const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/auth/register
 */
router.post('/register', async (req, res) => {
    try {
        const { email, password, fullName, university, department, enrollmentYear } = req.body;

        if (!email || !password || !fullName) {
            return res.status(400).json({ error: 'Email, password, and full name are required.' });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters.' });
        }

        // Check if email already exists
        const [existing] = await query('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
        if (existing.length > 0) {
            return res.status(409).json({ error: 'An account with this email already exists.' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        const userId = uuidv4();

        // Create user
        await query(
            `INSERT INTO users (id, email, password_hash, full_name, university, department, enrollment_year, is_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)`,
            [userId, email.toLowerCase(), passwordHash, fullName, university || null, department || null, enrollmentYear || null]
        );

        // Generate JWT 
        const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            message: 'Account created successfully!',
            token,
            user: {
                id: userId,
                email: email.toLowerCase(),
                fullName,
                university,
                department,
                enrollmentYear,
            },
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Failed to create account.' });
    }
});

/**
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        const [rows] = await query(
            'SELECT id, email, password_hash, full_name, university, department, is_active FROM users WHERE email = ?',
            [email.toLowerCase()]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const user = rows[0];

        if (!user.is_active) {
            return res.status(403).json({ error: 'Account is deactivated.' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        await query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [user.id]);

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({
            message: 'Login successful!',
            token,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                university: user.university,
                department: user.department,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed.' });
    }
});

/**
 * GET /api/auth/me
 */
router.get('/me', authenticate, async (req, res) => {
    try {
        const [rows] = await query(
            `SELECT id, email, full_name, avatar_url, university, department, enrollment_year, 
              total_queries, created_at, last_login_at
       FROM users WHERE id = ?`,
            [req.user.id]
        );

        const user = rows[0];
        res.json({
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            avatarUrl: user.avatar_url,
            university: user.university,
            department: user.department,
            enrollmentYear: user.enrollment_year,
            totalQueries: user.total_queries,
            createdAt: user.created_at,
            lastLoginAt: user.last_login_at,
        });
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch profile.' });
    }
});

module.exports = router;
