import axios from 'axios';
import { Adoption } from "../models/adoption.model.js";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:5001';

export const getAdoptionPredictions = async (req, res) => {
    try {
        const { viewMode = 'daily', petType = 'all' } = req.body;

        // Build query
        const query = { status: 'approved' };

        // Add pet type filter if not 'all'
        if (petType && petType !== 'all') {
            query.petType = petType;
        }

        // Fetch only approved adoptions with minimal data
        const adoptions = await Adoption.find(
            query,
            { createdAt: 1, _id: 0 } // Only fetch createdAt field
        ).lean();

        // Check if we have enough data
        if (adoptions.length < 7) {
            return res.status(400).json({
                success: false,
                message: `Not enough data for predictions. Need at least 7 approved adoptions${petType !== 'all' ? ` for ${petType}s` : ''}.`
            });
        }

        // Send minimal data to Python service
        const response = await axios.post(
            `${ML_SERVICE_URL}/api/ml/predict`,
            {
                adoptions: adoptions.map(a => ({ createdAt: a.createdAt })),
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