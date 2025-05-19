// Documentation for User-related API endpoints
export const usersDocs = {
    '/api/users/profile': {
        get: {
            tags: ['Users'],
            summary: 'Get current user profile',
            security: [{ cookieAuth: [] }],
            description: 'Retrieve the authenticated user\'s profile information',
            responses: {
                200: {
                    description: 'User profile retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    user: { $ref: '#/components/schemas/User' }
                                }
                            }
                        }
                    }
                },
                401: { $ref: '#/components/responses/UnauthorizedError' },
                404: { $ref: '#/components/responses/NotFoundError' }
            }
        },
        put: {
            tags: ['Users'],
            summary: 'Update user profile',
            security: [{ cookieAuth: [] }],
            description: 'Update the authenticated user\'s profile information',
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                name: { type: 'string', example: 'John Doe' },
                                email: { type: 'string', format: 'email', example: 'john@example.com' }
                            }
                        }
                    }
                }
            },
            responses: {
                200: {
                    description: 'Profile updated successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'Profile updated successfully' },
                                    user: { $ref: '#/components/schemas/User' }
                                }
                            }
                        }
                    }
                },
                400: { $ref: '#/components/responses/ValidationError' },
                401: { $ref: '#/components/responses/UnauthorizedError' },
                404: { $ref: '#/components/responses/NotFoundError' }
            }
        }
    },
    '/api/users/avatar': {
        post: {
            tags: ['Users'],
            summary: 'Upload user avatar',
            security: [{ cookieAuth: [] }],
            description: 'Upload or update the authenticated user\'s profile picture',
            requestBody: {
                required: true,
                content: {
                    'multipart/form-data': {
                        schema: {
                            type: 'object',
                            properties: {
                                avatar: {
                                    type: 'string',
                                    format: 'binary',
                                    description: 'User avatar image'
                                }
                            }
                        }
                    }
                }
            },
            responses: {
                200: {
                    description: 'Avatar uploaded successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'Avatar uploaded successfully' },
                                    avatarUrl: { type: 'string', example: '/uploads/avatars/avatar-123.jpg' }
                                }
                            }
                        }
                    }
                },
                400: { $ref: '#/components/responses/ValidationError' },
                401: { $ref: '#/components/responses/UnauthorizedError' },
                404: { $ref: '#/components/responses/NotFoundError' }
            }
        }
    },
    '/api/users/messages': {
        get: {
            tags: ['Users'],
            summary: 'Get user\'s messages',
            security: [{ cookieAuth: [] }],
            description: 'Retrieve all messages for the authenticated user',
            responses: {
                200: {
                    description: 'User messages retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    messages: {
                                        type: 'array',
                                        items: { $ref: '#/components/schemas/Message' }
                                    }
                                }
                            }
                        }
                    }
                },
                401: { $ref: '#/components/responses/UnauthorizedError' }
            }
        }
    },
    '/api/users/adoptions': {
        get: {
            tags: ['Users'],
            summary: 'Get user\'s adoption requests',
            security: [{ cookieAuth: [] }],
            description: 'Retrieve all adoption requests for the authenticated user',
            responses: {
                200: {
                    description: 'User adoptions retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    adoptions: {
                                        type: 'array',
                                        items: { $ref: '#/components/schemas/Adoption' }
                                    }
                                }
                            }
                        }
                    }
                },
                401: { $ref: '#/components/responses/UnauthorizedError' }
            }
        }
    },
    '/api/users/admin': {
        get: {
            tags: ['Users'],
            summary: 'Get all users (Admin only)',
            security: [{ cookieAuth: [] }],
            description: 'Retrieve a list of all registered users',
            responses: {
                200: {
                    description: 'Users retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    users: {
                                        type: 'array',
                                        items: { $ref: '#/components/schemas/User' }
                                    }
                                }
                            }
                        }
                    }
                },
                401: { $ref: '#/components/responses/UnauthorizedError' },
                403: { $ref: '#/components/responses/ForbiddenError' }
            }
        }
    },
    '/api/users/admin/{userId}': {
        get: {
            tags: ['Users'],
            summary: 'Get user by ID (Admin only)',
            security: [{ cookieAuth: [] }],
            description: 'Retrieve a specific user\'s information by ID',
            parameters: [
                {
                    in: 'path',
                    name: 'userId',
                    schema: { type: 'string' },
                    required: true,
                    description: 'User ID'
                }
            ],
            responses: {
                200: {
                    description: 'User retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    user: { $ref: '#/components/schemas/User' }
                                }
                            }
                        }
                    }
                },
                400: { $ref: '#/components/responses/ValidationError' },
                401: { $ref: '#/components/responses/UnauthorizedError' },
                403: { $ref: '#/components/responses/ForbiddenError' },
                404: { $ref: '#/components/responses/NotFoundError' }
            }
        }
    },
    '/api/users/admin/{userId}/toggle-admin': {
        put: {
            tags: ['Users'],
            summary: 'Update user admin status (Admin only)',
            security: [{ cookieAuth: [] }],
            description: 'Grant or revoke administrator privileges for a user',
            parameters: [
                {
                    in: 'path',
                    name: 'userId',
                    schema: { type: 'string' },
                    required: true,
                    description: 'User ID'
                }
            ],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['isAdmin'],
                            properties: {
                                isAdmin: {
                                    type: 'boolean',
                                    example: true,
                                    description: 'Administrator status to set'
                                }
                            }
                        }
                    }
                }
            },
            responses: {
                200: {
                    description: 'User admin status updated successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'User admin status updated to true' },
                                    user: { $ref: '#/components/schemas/User' }
                                }
                            }
                        }
                    }
                },
                400: {
                    description: 'Cannot remove your own admin status',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ErrorResponse'
                            }
                        }
                    }
                },
                401: { $ref: '#/components/responses/UnauthorizedError' },
                403: { $ref: '#/components/responses/ForbiddenError' },
                404: { $ref: '#/components/responses/NotFoundError' }
            }
        }
    }
};