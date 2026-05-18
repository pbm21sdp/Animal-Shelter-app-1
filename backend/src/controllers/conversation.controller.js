import { pool } from '../config/database/connectPostgresDB.js';
import { User } from '../models/user.model.js';

export const startConversation = async (req, res) => {
    try {
        const { pet_id, recipient_id, message } = req.body;
        const sender_id = req.userId;
        if (!recipient_id || !message?.trim())
            return res.status(400).json({ success: false, message: 'recipient_id and message required' });
        if (sender_id === recipient_id)
            return res.status(400).json({ success: false, message: 'Cannot message yourself' });

        let convResult = await pool.query(
            `SELECT id FROM conversations
             WHERE pet_id IS NOT DISTINCT FROM $1
               AND ((participant_one=$2 AND participant_two=$3) OR (participant_one=$3 AND participant_two=$2))`,
            [pet_id || null, sender_id, recipient_id]
        );

        let conversationId;
        if (convResult.rows.length > 0) {
            conversationId = convResult.rows[0].id;
        } else {
            const newConv = await pool.query(
                `INSERT INTO conversations (pet_id, participant_one, participant_two) VALUES ($1, $2, $3) RETURNING id`,
                [pet_id || null, sender_id, recipient_id]
            );
            conversationId = newConv.rows[0].id;
        }

        await pool.query(
            `INSERT INTO conversation_messages (conversation_id, sender_id, content) VALUES ($1, $2, $3)`,
            [conversationId, sender_id, message.trim()]
        );
        await pool.query(`UPDATE conversations SET updated_at=NOW() WHERE id=$1`, [conversationId]);

        res.status(201).json({ success: true, conversation_id: conversationId });
    } catch (err) {
        console.error('startConversation error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getConversations = async (req, res) => {
    try {
        const userId = req.userId;
        const result = await pool.query(
            `SELECT c.id, c.pet_id, c.participant_one, c.participant_two, c.updated_at,
                p.name AS pet_name, p.location_city,
                pp.id AS pet_photo_id,
                (SELECT content FROM conversation_messages WHERE conversation_id=c.id ORDER BY created_at DESC LIMIT 1) AS last_message,
                (SELECT created_at FROM conversation_messages WHERE conversation_id=c.id ORDER BY created_at DESC LIMIT 1) AS last_message_at,
                (SELECT COUNT(*) FROM conversation_messages WHERE conversation_id=c.id AND sender_id!=$1 AND is_read=false) AS unread_count
             FROM conversations c
             LEFT JOIN pets p ON p.id=c.pet_id
             LEFT JOIN pet_photos pp ON pp.pet_id=c.pet_id AND pp.is_primary=true
             WHERE (c.participant_one=$1 OR c.participant_two=$1)
               AND NOT (c.participant_one=$1 AND c.deleted_by_one=true)
               AND NOT (c.participant_two=$1 AND c.deleted_by_two=true)
             ORDER BY c.updated_at DESC`,
            [userId]
        );

        const conversations = await Promise.all(result.rows.map(async (conv) => {
            const otherId = conv.participant_one === userId ? conv.participant_two : conv.participant_one;
            let otherUser = null;
            try { otherUser = await User.findById(otherId).select('name avatar'); } catch (e) {}
            return {
                ...conv,
                other_user: otherUser
                    ? { id: otherUser._id, name: otherUser.name, avatar: otherUser.avatar }
                    : { id: otherId, name: 'User' },
                unread_count: parseInt(conv.unread_count) || 0,
            };
        }));

        res.json({ success: true, conversations });
    } catch (err) {
        console.error('getConversations error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getMessages = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const convCheck = await pool.query(
            `SELECT * FROM conversations WHERE id=$1 AND (participant_one=$2 OR participant_two=$2)`,
            [id, userId]
        );
        if (convCheck.rows.length === 0)
            return res.status(403).json({ success: false, message: 'Not authorized' });

        await pool.query(
            `UPDATE conversation_messages SET is_read=true WHERE conversation_id=$1 AND sender_id!=$2`,
            [id, userId]
        );

        const result = await pool.query(
            `SELECT id, sender_id, content, is_read, created_at FROM conversation_messages WHERE conversation_id=$1 ORDER BY created_at ASC`,
            [id]
        );

        res.json({ success: true, messages: result.rows, conversation: convCheck.rows[0] });
    } catch (err) {
        console.error('getMessages error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const sendMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const userId = req.userId;

        if (!content?.trim())
            return res.status(400).json({ success: false, message: 'Empty message' });

        const convCheck = await pool.query(
            `SELECT * FROM conversations WHERE id=$1 AND (participant_one=$2 OR participant_two=$2)`,
            [id, userId]
        );
        if (convCheck.rows.length === 0)
            return res.status(403).json({ success: false, message: 'Not authorized' });

        await pool.query(
            `INSERT INTO conversation_messages (conversation_id, sender_id, content) VALUES ($1, $2, $3)`,
            [id, userId, content.trim()]
        );
        await pool.query(`UPDATE conversations SET updated_at=NOW() WHERE id=$1`, [id]);

        res.status(201).json({ success: true });
    } catch (err) {
        console.error('sendMessage error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const deleteConversation = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const conv = await pool.query('SELECT * FROM conversations WHERE id=$1', [id]);
        if (conv.rows.length === 0) return res.status(404).json({ success: false, message: 'Not found' });
        const c = conv.rows[0];
        if (c.participant_one !== userId && c.participant_two !== userId) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        if (c.participant_one === userId) {
            await pool.query('UPDATE conversations SET deleted_by_one=true WHERE id=$1', [id]);
        } else {
            await pool.query('UPDATE conversations SET deleted_by_two=true WHERE id=$1', [id]);
        }
        res.json({ success: true });
    } catch (err) {
        console.error('deleteConversation error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getUnreadCount = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT COUNT(*) as count FROM conversation_messages cm
             JOIN conversations c ON c.id=cm.conversation_id
             WHERE (c.participant_one=$1 OR c.participant_two=$1) AND cm.sender_id!=$1 AND cm.is_read=false`,
            [req.userId]
        );
        res.json({ success: true, count: parseInt(result.rows[0].count) || 0 });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
