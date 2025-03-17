import express from 'express';
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Adoptions
 *   description: Adoption requests
 */

/**
 * @swagger
 * /api/adoptions:
 *   post:
 *     summary: Submit an adoption request
 *     tags: [Adoptions]
 *     responses:
 *       200:
 *         description: Request submitted
 */
router.post('/', (req, res) => {
    res.send('Adoption request submitted');
});

export default router;