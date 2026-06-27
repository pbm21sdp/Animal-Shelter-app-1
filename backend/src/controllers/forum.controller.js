import { pool } from '../config/database/connectPostgresDB.js';
import sharp from 'sharp';

const VALID_CATEGORIES = ['transparency', 'announcement', 'urgent_appeal', 'community_spotlight', 'safety_awareness'];

export const getAllPosts = async (req, res) => {
    try {
        const { category, limit = 10, offset = 0 } = req.query;

        const countParams = [];
        let whereClause = '';

        if (category && VALID_CATEGORIES.includes(category)) {
            countParams.push(category);
            whereClause = `WHERE category = $1`;
        }

        const countResult = await pool.query(
            `SELECT COUNT(*) FROM forum_posts ${whereClause}`,
            countParams
        );

        const queryParams = [...countParams, parseInt(limit), parseInt(offset)];
        const limitIdx  = queryParams.length - 1;
        const offsetIdx = queryParams.length;

        const result = await pool.query(
            `SELECT fp.id, fp.author_id, fp.category, fp.title, fp.content,
                    fp.created_at, fp.updated_at,
                    (SELECT id FROM forum_post_photos WHERE post_id = fp.id
                     ORDER BY created_at ASC LIMIT 1) AS primary_photo_id
             FROM forum_posts fp
             ${whereClause}
             ORDER BY fp.created_at DESC
             LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
            queryParams
        );

        res.status(200).json({
            success: true,
            posts: result.rows,
            total: parseInt(countResult.rows[0].count),
        });
    } catch (error) {
        console.error('Error fetching forum posts:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch posts' });
    }
};

export const getPostById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT id, author_id, category, title, content, created_at, updated_at
             FROM forum_posts WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        const photosResult = await pool.query(
            'SELECT id, created_at FROM forum_post_photos WHERE post_id = $1 ORDER BY created_at ASC',
            [id]
        );

        res.status(200).json({
            success: true,
            post: { ...result.rows[0], photos: photosResult.rows },
        });
    } catch (error) {
        console.error('Error fetching forum post:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch post' });
    }
};

export const getPostPhoto = async (req, res) => {
    try {
        const { photoId } = req.params;

        const result = await pool.query(
            'SELECT photo_data FROM forum_post_photos WHERE id = $1',
            [photoId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Photo not found' });
        }

        res.set({
            'Content-Type': 'image/jpeg',
            'Cache-Control': 'public, max-age=31536000, immutable',
        });
        return res.send(result.rows[0].photo_data);
    } catch (error) {
        console.error('Error fetching post photo:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch photo' });
    }
};

export const createPost = async (req, res) => {
    try {
        const { title, content, category } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({ success: false, message: 'Title is required' });
        }
        if (!content || !content.trim()) {
            return res.status(400).json({ success: false, message: 'Content is required' });
        }
        if (!category || !VALID_CATEGORIES.includes(category)) {
            return res.status(400).json({
                success: false,
                message: `Category must be one of: ${VALID_CATEGORIES.join(', ')}`,
            });
        }

        const result = await pool.query(
            `INSERT INTO forum_posts (author_id, category, title, content)
             VALUES ($1, $2, $3, $4)
             RETURNING id, author_id, category, title, content, created_at, updated_at`,
            [req.userId, category, title.trim(), content.trim()]
        );

        const post = result.rows[0];

        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const resized = await sharp(file.buffer)
                    .resize(1200, 900, { fit: 'inside', withoutEnlargement: true })
                    .jpeg({ quality: 82 })
                    .toBuffer();

                await pool.query(
                    'INSERT INTO forum_post_photos (post_id, photo_data) VALUES ($1, $2)',
                    [post.id, resized]
                );
            }
        }

        res.status(201).json({ success: true, message: 'Post created successfully', post });
    } catch (error) {
        console.error('Error creating forum post:', error);
        res.status(500).json({ success: false, message: 'Failed to create post' });
    }
};

export const updatePost = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, category } = req.body;

        const existing = await pool.query('SELECT id FROM forum_posts WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        const updates = [];
        const params  = [];

        if (title !== undefined) {
            if (!title.trim()) return res.status(400).json({ success: false, message: 'Title cannot be empty' });
            params.push(title.trim());
            updates.push(`title = $${params.length}`);
        }
        if (content !== undefined) {
            if (!content.trim()) return res.status(400).json({ success: false, message: 'Content cannot be empty' });
            params.push(content.trim());
            updates.push(`content = $${params.length}`);
        }
        if (category !== undefined) {
            if (!VALID_CATEGORIES.includes(category)) {
                return res.status(400).json({ success: false, message: 'Invalid category' });
            }
            params.push(category);
            updates.push(`category = $${params.length}`);
        }

        if (updates.length === 0) {
            return res.status(400).json({ success: false, message: 'No fields to update' });
        }

        updates.push(`updated_at = NOW()`);
        params.push(id);

        const result = await pool.query(
            `UPDATE forum_posts SET ${updates.join(', ')} WHERE id = $${params.length} RETURNING *`,
            params
        );

        res.status(200).json({ success: true, message: 'Post updated', post: result.rows[0] });
    } catch (error) {
        console.error('Error updating forum post:', error);
        res.status(500).json({ success: false, message: 'Failed to update post' });
    }
};

export const deletePost = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM forum_posts WHERE id = $1 RETURNING id',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        res.status(200).json({ success: true, message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Error deleting forum post:', error);
        res.status(500).json({ success: false, message: 'Failed to delete post' });
    }
};
