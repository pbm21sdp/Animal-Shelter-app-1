import { pool } from '../config/database/connectPostgresDB.js';

// GET /api/notifications?limit=20&offset=0
export const getNotifications = async (req, res) => {
    try {
        const limit  = Math.min(parseInt(req.query.limit)  || 20, 100);
        const offset = Math.max(parseInt(req.query.offset) || 0,  0);

        const [rows, countRes] = await Promise.all([
            pool.query(
                `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
                [req.userId, limit, offset]
            ),
            pool.query(
                `SELECT COUNT(*) FROM notifications WHERE user_id = $1`,
                [req.userId]
            ),
        ]);

        res.json({
            success: true,
            notifications: rows.rows,
            total: parseInt(countRes.rows[0].count),
            limit,
            offset,
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
    }
};

// GET /api/notifications/unread-count
export const getUnreadCount = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false`,
            [req.userId]
        );
        res.json({ success: true, count: parseInt(result.rows[0].count) });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch unread count' });
    }
};

// PATCH /api/notifications/:id/read
export const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *`,
            [id, req.userId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }
        res.json({ success: true, notification: result.rows[0] });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ success: false, message: 'Failed to mark notification as read' });
    }
};

// PATCH /api/notifications/read-all
export const markAllAsRead = async (req, res) => {
    try {
        await pool.query(
            `UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false`,
            [req.userId]
        );
        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ success: false, message: 'Failed to mark all notifications as read' });
    }
};
