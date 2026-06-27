import { pool } from '../config/database/connectPostgresDB.js';

// GET /api/settings/reject-reasons?activeOnly=true
export const getRejectReasons = async (req, res) => {
    try {
        const activeOnly = req.query.activeOnly === 'true';
        const result = await pool.query(
            `SELECT * FROM reject_reasons ${activeOnly ? 'WHERE is_active = true' : ''} ORDER BY display_order ASC`
        );
        res.json({ success: true, reasons: result.rows });
    } catch (error) {
        console.error('Error fetching reject reasons:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch reject reasons' });
    }
};

// PATCH /api/settings/reject-reasons/:id/toggle
export const toggleRejectReason = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `UPDATE reject_reasons SET is_active = NOT is_active WHERE id = $1 RETURNING *`,
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Reason not found' });
        }
        res.json({ success: true, reason: result.rows[0] });
    } catch (error) {
        console.error('Error toggling reject reason:', error);
        res.status(500).json({ success: false, message: 'Failed to toggle reject reason' });
    }
};

// GET /api/settings/forbidden-words
export const getForbiddenWords = async (req, res) => {
    try {
        const result = await pool.query(`SELECT * FROM forbidden_words ORDER BY word ASC`);
        res.json({ success: true, words: result.rows });
    } catch (error) {
        console.error('Error fetching forbidden words:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch forbidden words' });
    }
};

// POST /api/settings/forbidden-words
export const addForbiddenWord = async (req, res) => {
    try {
        const { word } = req.body;
        if (!word || !word.trim()) {
            return res.status(400).json({ success: false, message: 'Word is required' });
        }
        const normalised = word.trim().toLowerCase();
        const result = await pool.query(
            `INSERT INTO forbidden_words (word) VALUES ($1) ON CONFLICT (word) DO NOTHING RETURNING *`,
            [normalised]
        );
        if (result.rows.length === 0) {
            return res.status(409).json({ success: false, message: 'Word already exists' });
        }
        res.status(201).json({ success: true, word: result.rows[0] });
    } catch (error) {
        console.error('Error adding forbidden word:', error);
        res.status(500).json({ success: false, message: 'Failed to add forbidden word' });
    }
};

// DELETE /api/settings/forbidden-words/:id
export const deleteForbiddenWord = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `DELETE FROM forbidden_words WHERE id = $1 RETURNING *`,
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Word not found' });
        }
        res.json({ success: true, message: 'Word deleted' });
    } catch (error) {
        console.error('Error deleting forbidden word:', error);
        res.status(500).json({ success: false, message: 'Failed to delete forbidden word' });
    }
};
