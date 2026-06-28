import { pool } from '../config/database/connectPostgresDB.js';
import { User } from '../models/user.model.js';
import { checkContent } from '../utils/contentFilter.js';

export const startConversation = async (req, res) => {
    try {
        const { pet_id, recipient_id, message, is_adoption_request } = req.body;
        const sender_id = req.userId;
        if (!recipient_id || !message?.trim())
            return res.status(400).json({ success: false, message: 'recipient_id and message required' });

        const contentCheck = await checkContent([message]);
        if (!contentCheck.ok) {
            return res.status(400).json({
                success: false,
                message: "Your submission contains language that isn't allowed. Please revise and try again.",
            });
        }
        if (sender_id === recipient_id)
            return res.status(400).json({ success: false, message: 'Cannot message yourself' });

        let convResult = await pool.query(
            `SELECT id, participant_one FROM conversations
             WHERE pet_id IS NOT DISTINCT FROM $1
               AND ((participant_one=$2 AND participant_two=$3) OR (participant_one=$3 AND participant_two=$2))`,
            [pet_id || null, sender_id, recipient_id]
        );

        let conversationId;
        if (convResult.rows.length > 0) {
            conversationId = convResult.rows[0].id;
            // Only clear the SENDER's deletion state — never touch the other participant's
            const existingConv = convResult.rows[0];
            if (existingConv.participant_one === sender_id) {
                await pool.query(
                    `UPDATE conversations SET deleted_by_one=false, deleted_at_one=NULL WHERE id=$1`,
                    [conversationId]
                );
            } else {
                await pool.query(
                    `UPDATE conversations SET deleted_by_two=false, deleted_at_two=NULL WHERE id=$1`,
                    [conversationId]
                );
            }
        } else {
            const newConv = await pool.query(
                `INSERT INTO conversations (pet_id, participant_one, participant_two, is_adoption_request) VALUES ($1, $2, $3, $4) RETURNING id`,
                [pet_id || null, sender_id, recipient_id, is_adoption_request || false]
            );
            conversationId = newConv.rows[0].id;
        }

        if (is_adoption_request) {
            await pool.query(
                `UPDATE conversations SET is_adoption_request=true WHERE id=$1`,
                [conversationId]
            );
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
            `SELECT c.id, c.pet_id, c.is_adoption_request, c.participant_one, c.participant_two, c.updated_at,
                p.name AS pet_name, p.location_city, p.uploader_id AS pet_uploader_id,
                p.is_adopted AS pet_is_adopted,
                pp.id AS pet_photo_id,
                (SELECT content FROM conversation_messages
                 WHERE conversation_id=c.id AND (cutoff.ts IS NULL OR created_at > cutoff.ts)
                 ORDER BY created_at DESC LIMIT 1) AS last_message,
                (SELECT created_at FROM conversation_messages
                 WHERE conversation_id=c.id AND (cutoff.ts IS NULL OR created_at > cutoff.ts)
                 ORDER BY created_at DESC LIMIT 1) AS last_message_at,
                (SELECT COUNT(*) FROM conversation_messages
                 WHERE conversation_id=c.id AND sender_id!=$1 AND is_read=false
                   AND (cutoff.ts IS NULL OR created_at > cutoff.ts)) AS unread_count
             FROM conversations c
             LEFT JOIN pets p ON p.id=c.pet_id
             LEFT JOIN pet_photos pp ON pp.pet_id=c.pet_id AND pp.is_primary=true,
             LATERAL (
                 SELECT
                     CASE
                         WHEN c.participant_one=$1 AND c.deleted_by_one=true THEN c.deleted_at_one
                         WHEN c.participant_two=$1 AND c.deleted_by_two=true THEN c.deleted_at_two
                         ELSE NULL
                     END AS ts,
                     CASE
                         WHEN c.participant_one=$1 AND c.deleted_by_one=true THEN true
                         WHEN c.participant_two=$1 AND c.deleted_by_two=true THEN true
                         ELSE false
                     END AS was_deleted
             ) AS cutoff
             WHERE (c.participant_one=$1 OR c.participant_two=$1)
               AND (
                   NOT cutoff.was_deleted
                   OR (cutoff.ts IS NOT NULL AND EXISTS (
                       SELECT 1 FROM conversation_messages
                       WHERE conversation_id=c.id AND created_at > cutoff.ts
                   ))
               )
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

        const conv = convCheck.rows[0];

        // Determine from which point this user can see messages (based on when they deleted)
        let cutoffTime = null;
        if (conv.participant_one === userId && conv.deleted_by_one && conv.deleted_at_one) {
            cutoffTime = conv.deleted_at_one;
        } else if (conv.participant_two === userId && conv.deleted_by_two && conv.deleted_at_two) {
            cutoffTime = conv.deleted_at_two;
        }

        if (cutoffTime) {
            await pool.query(
                `UPDATE conversation_messages SET is_read=true
                 WHERE conversation_id=$1 AND sender_id!=$2 AND created_at > $3`,
                [id, userId, cutoffTime]
            );
        } else {
            await pool.query(
                `UPDATE conversation_messages SET is_read=true
                 WHERE conversation_id=$1 AND sender_id!=$2`,
                [id, userId]
            );
        }

        const result = await pool.query(
            cutoffTime
                ? `SELECT id, sender_id, content, is_read, created_at FROM conversation_messages WHERE conversation_id=$1 AND created_at > $2 ORDER BY created_at ASC`
                : `SELECT id, sender_id, content, is_read, created_at FROM conversation_messages WHERE conversation_id=$1 ORDER BY created_at ASC`,
            cutoffTime ? [id, cutoffTime] : [id]
        );

        res.json({ success: true, messages: result.rows, conversation: conv });
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

        const contentCheck = await checkContent([content]);
        if (!contentCheck.ok) {
            return res.status(400).json({
                success: false,
                message: "Your submission contains language that isn't allowed. Please revise and try again.",
            });
        }

        const convCheck = await pool.query(
            `SELECT * FROM conversations WHERE id=$1 AND (participant_one=$2 OR participant_two=$2)`,
            [id, userId]
        );
        if (convCheck.rows.length === 0)
            return res.status(403).json({ success: false, message: 'Not authorized' });

        const insertResult = await pool.query(
            `INSERT INTO conversation_messages (conversation_id, sender_id, content) VALUES ($1, $2, $3) RETURNING id, created_at`,
            [id, userId, content.trim()]
        );
        const newMsgId        = insertResult.rows[0].id;
        const newMsgCreatedAt = insertResult.rows[0].created_at;

        await pool.query(`UPDATE conversations SET updated_at=NOW() WHERE id=$1`, [id]);

        // Mark unreplied messages from the other participant, but ONLY those from the current
        // "conversation round" — messages sent after our previous last message.
        // Fallback: if we never sent before, use a 7-day window to avoid marking ancient messages.
        const conv = convCheck.rows[0];
        const otherUserId = conv.participant_one === userId ? conv.participant_two : conv.participant_one;
        await pool.query(
            `UPDATE conversation_messages
             SET replied_at = $4
             WHERE conversation_id = $1
               AND sender_id = $2
               AND replied_at IS NULL
               AND created_at > COALESCE(
                   (SELECT MAX(created_at) FROM conversation_messages
                    WHERE conversation_id = $1 AND sender_id = $3 AND id != $5),
                   $4 - INTERVAL '7 days'
               )`,
            [id, otherUserId, userId, newMsgCreatedAt, newMsgId]
        );

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
            await pool.query('UPDATE conversations SET deleted_by_one=true, deleted_at_one=NOW() WHERE id=$1', [id]);
        } else {
            await pool.query('UPDATE conversations SET deleted_by_two=true, deleted_at_two=NOW() WHERE id=$1', [id]);
        }
        res.json({ success: true });
    } catch (err) {
        console.error('deleteConversation error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getReceivedCount = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT COUNT(*) as count FROM conversation_messages cm
             JOIN conversations c ON c.id=cm.conversation_id
             WHERE (c.participant_one=$1 OR c.participant_two=$1)
               AND cm.sender_id!=$1`,
            [req.userId]
        );
        res.json({ success: true, count: parseInt(result.rows[0].count) || 0 });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getUnreadCount = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT COUNT(*) as count FROM conversation_messages cm
             JOIN conversations c ON c.id=cm.conversation_id
             WHERE (c.participant_one=$1 OR c.participant_two=$1)
               AND cm.sender_id!=$1 AND cm.is_read=false
               AND NOT (c.participant_one=$1 AND c.deleted_by_one=true AND
                        (c.deleted_at_one IS NULL OR cm.created_at <= c.deleted_at_one))
               AND NOT (c.participant_two=$1 AND c.deleted_by_two=true AND
                        (c.deleted_at_two IS NULL OR cm.created_at <= c.deleted_at_two))`,
            [req.userId]
        );
        res.json({ success: true, count: parseInt(result.rows[0].count) || 0 });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
