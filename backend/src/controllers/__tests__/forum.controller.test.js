import { jest, describe, test, expect, beforeEach } from '@jest/globals';

const mockPoolQuery = jest.fn();

const mockSharpInstance = {
    resize: jest.fn().mockReturnThis(),
    jpeg: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('fake-image-data')),
};
const mockSharp = jest.fn(() => mockSharpInstance);

jest.unstable_mockModule('../../config/database/connectPostgresDB.js', () => ({
    pool: { query: mockPoolQuery },
    connectPostgresDB: jest.fn(),
}));

jest.unstable_mockModule('sharp', () => ({
    default: mockSharp,
}));

const {
    getAllPosts,
    getPostById,
    getPostPhoto,
    createPost,
    updatePost,
    deletePost,
} = await import('../forum.controller.js');

describe('Forum Controller', () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();

        // Re-initialize sharp mock (resetMocks: true clears jest.fn() implementations)
        mockSharp.mockImplementation(() => mockSharpInstance);
        mockSharpInstance.resize.mockReturnThis();
        mockSharpInstance.jpeg.mockReturnThis();
        mockSharpInstance.toBuffer.mockResolvedValue(Buffer.from('fake-image-data'));

        req = {
            query: {},
            params: {},
            body: {},
            userId: 'admin-user-id',
            files: undefined,
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            set: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
        };
    });

    // ──────────────────────────────────────────────────────────────────────────
    describe('getAllPosts', () => {
        test('should return all posts without category filter', async () => {
            const mockPosts = [{ id: 1, title: 'Post 1', category: 'announcement' }];
            mockPoolQuery
                .mockResolvedValueOnce({ rows: [{ count: '1' }] })
                .mockResolvedValueOnce({ rows: mockPosts });

            await getAllPosts(req, res);

            const countSql = mockPoolQuery.mock.calls[0][0];
            expect(countSql).not.toContain('WHERE');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                posts: mockPosts,
                total: 1,
            });
        });

        test('should filter posts by valid category', async () => {
            req.query = { category: 'announcement' };
            mockPoolQuery
                .mockResolvedValueOnce({ rows: [{ count: '3' }] })
                .mockResolvedValueOnce({ rows: [] });

            await getAllPosts(req, res);

            const countSql = mockPoolQuery.mock.calls[0][0];
            expect(countSql).toContain('WHERE category = $1');
            const countParams = mockPoolQuery.mock.calls[0][1];
            expect(countParams).toContain('announcement');
        });

        test('should ignore invalid category (not in VALID_CATEGORIES)', async () => {
            req.query = { category: 'invalid-category' };
            mockPoolQuery
                .mockResolvedValueOnce({ rows: [{ count: '0' }] })
                .mockResolvedValueOnce({ rows: [] });

            await getAllPosts(req, res);

            const countSql = mockPoolQuery.mock.calls[0][0];
            expect(countSql).not.toContain('WHERE');
        });

        test('should return 500 on database error', async () => {
            mockPoolQuery.mockRejectedValue(new Error('DB error'));

            await getAllPosts(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Failed to fetch posts',
            });
        });
    });

    // ──────────────────────────────────────────────────────────────────────────
    describe('getPostById', () => {
        test('should return post with its photos', async () => {
            req.params = { id: '5' };
            const mockPost = { id: 5, title: 'Forum Post', category: 'transparency' };
            const mockPhotos = [{ id: 10 }, { id: 11 }];

            mockPoolQuery
                .mockResolvedValueOnce({ rows: [mockPost] })
                .mockResolvedValueOnce({ rows: mockPhotos });

            await getPostById(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                post: { ...mockPost, photos: mockPhotos },
            });
        });

        test('should return 404 when post not found', async () => {
            req.params = { id: '999' };
            mockPoolQuery.mockResolvedValueOnce({ rows: [] });

            await getPostById(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Post not found',
            });
        });

        test('should return 500 on database error', async () => {
            req.params = { id: '1' };
            mockPoolQuery.mockRejectedValue(new Error('DB error'));

            await getPostById(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    // ──────────────────────────────────────────────────────────────────────────
    describe('getPostPhoto', () => {
        test('should serve photo bytes with correct content type', async () => {
            req.params = { photoId: '20' };
            const fakeBuffer = Buffer.from('binary-image-data');
            mockPoolQuery.mockResolvedValue({ rows: [{ photo_data: fakeBuffer }] });

            await getPostPhoto(req, res);

            expect(res.set).toHaveBeenCalledWith(
                expect.objectContaining({ 'Content-Type': 'image/jpeg' })
            );
            expect(res.send).toHaveBeenCalledWith(fakeBuffer);
        });

        test('should return 404 when photo not found', async () => {
            req.params = { photoId: '999' };
            mockPoolQuery.mockResolvedValue({ rows: [] });

            await getPostPhoto(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Photo not found',
            });
        });
    });

    // ──────────────────────────────────────────────────────────────────────────
    describe('createPost', () => {
        test('should return 400 when title is missing', async () => {
            req.body = { content: 'Some content', category: 'announcement' };

            await createPost(req, res);

            expect(mockPoolQuery).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Title is required',
            });
        });

        test('should return 400 when content is missing', async () => {
            req.body = { title: 'My Post', category: 'announcement' };

            await createPost(req, res);

            expect(mockPoolQuery).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Content is required',
            });
        });

        test('should return 400 when category is invalid', async () => {
            req.body = { title: 'My Post', content: 'Content', category: 'random' };

            await createPost(req, res);

            expect(mockPoolQuery).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ success: false, message: expect.stringContaining('Category') })
            );
        });

        test('should create post without photos', async () => {
            req.body = { title: 'New Post', content: 'Body text', category: 'announcement' };
            const newPost = { id: 3, title: 'New Post', content: 'Body text', category: 'announcement' };
            mockPoolQuery.mockResolvedValue({ rows: [newPost] });

            await createPost(req, res);

            expect(mockPoolQuery).toHaveBeenCalledTimes(1);
            expect(mockSharp).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Post created successfully',
                post: newPost,
            });
        });

        test('should resize and store photos when files are provided', async () => {
            req.body = { title: 'Post with photo', content: 'Body', category: 'urgent_appeal' };
            req.files = [
                { buffer: Buffer.from('photo1'), originalname: 'photo1.jpg', mimetype: 'image/jpeg' },
            ];
            const newPost = { id: 4, title: 'Post with photo' };
            mockPoolQuery
                .mockResolvedValueOnce({ rows: [newPost] })  // INSERT forum_posts
                .mockResolvedValueOnce({ rows: [] });          // INSERT forum_post_photos

            await createPost(req, res);

            expect(mockSharp).toHaveBeenCalledTimes(1);
            expect(mockPoolQuery).toHaveBeenCalledTimes(2);
            expect(res.status).toHaveBeenCalledWith(201);
        });

        test('should return 500 on database error', async () => {
            req.body = { title: 'My Post', content: 'Content', category: 'community_spotlight' };
            mockPoolQuery.mockRejectedValue(new Error('DB error'));

            await createPost(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Failed to create post',
            });
        });
    });

    // ──────────────────────────────────────────────────────────────────────────
    describe('updatePost', () => {
        test('should return 404 when post not found', async () => {
            req.params = { id: '99' };
            req.body = { title: 'New Title' };
            mockPoolQuery.mockResolvedValue({ rows: [] });

            await updatePost(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Post not found',
            });
        });

        test('should return 400 when no fields to update', async () => {
            req.params = { id: '1' };
            req.body = {}; // no title, content, or category
            mockPoolQuery.mockResolvedValue({ rows: [{ id: 1 }] });

            await updatePost(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'No fields to update',
            });
        });

        test('should return 400 for invalid category', async () => {
            req.params = { id: '1' };
            req.body = { category: 'invalid' };
            mockPoolQuery.mockResolvedValue({ rows: [{ id: 1 }] });

            await updatePost(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid category',
            });
        });

        test('should update post with valid fields', async () => {
            req.params = { id: '1' };
            req.body = { title: 'Updated Title', category: 'transparency' };
            const updated = { id: 1, title: 'Updated Title', category: 'transparency' };

            mockPoolQuery
                .mockResolvedValueOnce({ rows: [{ id: 1 }] })  // SELECT existing
                .mockResolvedValueOnce({ rows: [updated] });     // UPDATE RETURNING *

            await updatePost(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Post updated',
                post: updated,
            });
        });

        test('should return 500 on database error', async () => {
            req.params = { id: '1' };
            req.body = { title: 'Title' };
            mockPoolQuery.mockRejectedValue(new Error('DB error'));

            await updatePost(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    // ──────────────────────────────────────────────────────────────────────────
    describe('deletePost', () => {
        test('should delete post and return success', async () => {
            req.params = { id: '7' };
            mockPoolQuery.mockResolvedValue({ rows: [{ id: 7 }] });

            await deletePost(req, res);

            expect(mockPoolQuery).toHaveBeenCalledWith(
                expect.stringContaining('DELETE FROM forum_posts'),
                ['7']
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Post deleted successfully',
            });
        });

        test('should return 404 when post not found', async () => {
            req.params = { id: '999' };
            mockPoolQuery.mockResolvedValue({ rows: [] });

            await deletePost(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Post not found',
            });
        });

        test('should return 500 on database error', async () => {
            req.params = { id: '1' };
            mockPoolQuery.mockRejectedValue(new Error('DB error'));

            await deletePost(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });
});
