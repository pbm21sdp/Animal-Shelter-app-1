import axios from 'axios';
import { pool } from "../config/database/connectPostgresDB.js";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:5001';

export const getAdoptionPredictions = async (req, res) => {
    try {
        const { viewMode = 'daily', petType = 'all' } = req.body;

        // Build PostgreSQL query — source of truth for adopted animals
        let sql = 'SELECT adopted_at FROM pets WHERE is_adopted = true AND adopted_at IS NOT NULL';
        const params = [];

        if (petType && petType !== 'all') {
            if (petType === 'other') {
                sql += ` AND type NOT IN ('dog', 'cat')`;
            } else {
                params.push(petType);
                sql += ` AND type = $${params.length}`;
            }
        }

        const { rows } = await pool.query(sql, params);

        // Check if we have enough data
        if (rows.length < 7) {
            return res.status(400).json({
                success: false,
                message: `Not enough data for predictions. Need at least 7 adopted animals${petType !== 'all' ? ` for ${petType}s` : ''}.`
            });
        }

        // Send minimal data to Python service — use 'createdAt' key for Flask compatibility
        const response = await axios.post(
            `${ML_SERVICE_URL}/api/ml/predict`,
            {
                adoptions: rows.map(r => ({ createdAt: r.adopted_at })),
                viewMode,
                petType: 'all' // Already filtered by backend
            },
            {
                timeout: 30000,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        res.json({
            success: true,
            data: response.data
        });

    } catch (error) {
        console.error('Prediction error:', error.message);

        if (error.code === 'ECONNREFUSED') {
            return res.status(503).json({
                success: false,
                message: 'ML service is not running. Please start the Python service first.'
            });
        }

        res.status(500).json({
            success: false,
            message: error.response?.data?.error || 'Failed to generate predictions'
        });
    }
};