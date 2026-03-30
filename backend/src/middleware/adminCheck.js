import { User } from '../models/user.model.js';

export const isAdmin = async (req, res, next) => {
    try {
        // Fast path: Check JWT token first (avoids DB query)
        if (req.isAdmin === true) {
            return next();
        }

        // Fallback: Verify with database (for backward compatibility with old tokens)
        const user = await User.findById(req.userId);

        if (!user || !user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }

        // Update flag for this request
        req.isAdmin = true;
        next();
    } catch (error) {
        console.error('Error in isAdmin middleware:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

export const checkIfAdmin = async (req, res, next) => {
    try {
        // Find the user by ID
        const user = await User.findById(req.userId);

        // Set isAdmin flag based on user data
        req.isAdmin = user && user.isAdmin === true;

        // Move to next middleware/controller regardless of admin status
        next();
    } catch (error) {
        console.error('Error in checkIfAdmin middleware:', error);
        // Continue to next middleware even if there's an error
        req.isAdmin = false;
        next();
    }
};