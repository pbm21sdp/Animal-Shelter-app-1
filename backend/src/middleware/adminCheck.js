// middleware/adminCheck.js
import { User } from '../models/user.model.js';

export const isAdmin = async (req, res, next) => {
    try {
        // This uses your MongoDB User model
        const user = await User.findById(req.userId);

        if (!user || !user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.log("Error in isAdmin middleware:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while checking admin privileges"
        });
    }
};