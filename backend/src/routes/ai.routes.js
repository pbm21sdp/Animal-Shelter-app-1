// routes/ai.routes.js
import express from 'express';
import axios from 'axios';
import { getAIOrganizations } from '../controllers/about.controller.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

// POST /api/ai/insights — proxy to Flask statistical insights generator
router.post('/insights', async (req, res) => {
    try {
        const response = await axios.post('http://127.0.0.1:5001/api/ml/insights', req.body, {
            timeout: 10000
        });
        res.json(response.data);
    } catch (error) {
        console.error('Flask insights error:', error.message);
        res.status(503).json({
            success: false,
            insights: [
                { text: 'Our community is making a difference — every animal uploaded gets a chance at a loving home.', trend: 'positive' },
                { text: 'Complete listings with photos are adopted significantly faster than those without.', trend: 'positive' }
            ]
        });
    }
});

// POST /api/ai/organizations — public: curated DB lookup + Claude fallback, no user data exposed
router.post('/organizations', getAIOrganizations);

// POST /api/ai/generate-description — proxy to Flask ML service, template-NLP description generator
router.post('/generate-description', verifyToken, async (req, res) => {
    try {
        const response = await axios.post('http://127.0.0.1:5001/api/ml/generate-description', req.body, {
            timeout: 10000
        });
        res.json(response.data);
    } catch (error) {
        console.error('Flask proxy error:', {
            message: error.message,
            code: error.code,
            url: 'http://127.0.0.1:5001/api/ml/generate-description',
            response: error.response?.data
        });
        res.status(503).json({
            error: 'Description generation service unavailable',
            fallback: true
        });
    }
});

// POST /api/ai/analyse-image — proxy to Flask CLIP image analyser
router.post('/analyse-image', verifyToken, async (req, res) => {
    try {
        const response = await axios.post('http://127.0.0.1:5001/api/ml/analyse-image', req.body, {
            timeout: 60000
        });
        res.json(response.data);
    } catch (error) {
        console.error('CLIP analysis error:', error.message);
        res.status(503).json({ error: 'Image analysis service unavailable' });
    }
});

// GET /api/ai/contract — proxy to Flask PDF contract generator
router.get('/contract', async (req, res) => {
    try {
        const axios = (await import('axios')).default;
        const response = await axios.get('http://127.0.0.1:5001/api/ml/generate-contract', {
            params: req.query,
            responseType: 'arraybuffer',
            timeout: 15000
        });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="paws_adoption_agreement.pdf"');
        res.send(Buffer.from(response.data));
    } catch (error) {
        console.error('Contract generation error:', error.message);
        res.status(503).json({ error: 'Contract generation unavailable' });
    }
});

export default router;
