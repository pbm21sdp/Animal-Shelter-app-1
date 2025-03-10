const express = require('express');
const router = express.Router();
const { pool } = require('../config/db'); // Import the pool

/**
 * @swagger
 * tags:
 *   - name: Animals
 *     description: All about animals
 *
 * /api/animals:
 *   get:
 *     tags: [Animals]
 *     summary: Get all animals
 *     responses:
 *       200:
 *         description: List of animals
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Animal'
 */
router.get('/', async (req, res) => {
    try {
        // Query the database
        const { rows } = await pool.query('SELECT * FROM animals');

        // Return actual database results
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Animal:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: "Buddy"
 *         breed:
 *           type: string
 *           example: "Labrador"
 */
module.exports = router;