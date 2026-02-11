const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /api/auth/me
 * Get current user profile (from Supabase Auth)
 */
router.get('/me', authenticateToken, async (req, res) => {
    try {
        // User data is already attached by middleware
        res.json({ user: req.user });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Failed to fetch user data' });
    }
});

/**
 * POST /api/auth/signout
 * Sign out (optional server-side cleanup)
 */
router.post('/signout', authenticateToken, async (req, res) => {
    try {
        // Supabase handles session management client-side
        // This endpoint is optional for any server-side cleanup
        res.json({ message: 'Signed out successfully' });
    } catch (error) {
        console.error('Signout error:', error);
        res.status(500).json({ error: 'Failed to sign out' });
    }
});

module.exports = router;
