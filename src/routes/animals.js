const express = require('express');
const router = express.Router();

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
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   breed:
 *                     type: string
 *               example:
 *                 - name: "Buddy"
 *                   breed: "Labrador"
 */
router.get('/', (req, res) => {
    res.json([{ name: "Buddy", breed: "Labrador" }]);
});

module.exports = router;