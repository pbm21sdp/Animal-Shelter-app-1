import express from 'express';
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User authentication
 */

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: User registered
 */
router.post('/register', (req, res) => {
    res.send('User registered');
});

export default router;