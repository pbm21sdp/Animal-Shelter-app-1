// Documentation for Message-related API endpoints
export const messagesDocs = {
    '/api/messages': {
        post: {
            tags: ['Messages'],
            summary: 'Create a new message',
            description: 'Send a message to the shelter (public route)',
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['email', 'message'],
                            properties: {
                                name: {
                                    type: 'string',
                                    example: 'John Doe'
                                },
                                email: {
                                    type: 'string',
                                    format: 'email',
                                    example: 'john@example.com'
                                },
                                message: {
                                    type: 'string',
                                    maxLength: 1800,
                                    example: 'I have a question about adopting a pet...'
                                }
                            }
                        }
                    }
                }
            },
            responses: {
                201: {
                    description: 'Message sent successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'Your message has been sent successfully' }
                                }
                            }
                        }
                    }
                },
                400: {
                    description: 'Validation error',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: false },
                                    message: { type: 'string', example: 'Email and message are required' }
                                }
                            }
                        }
                    }
                },
                500: { $ref: '#/components/responses/ServerError' }
            }
        }
    },
    '/api/messages/user': {
        get: {
            tags: ['Messages'],
            summary: 'Get user\'s messages',
            description: 'Retrieve all messages sent by the authenticated user',
            security: [{ cookieAuth: [] }],
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
                401: { $ref: '#/components/responses/UnauthorizedError' },
                500: { $ref: '#/components/responses/ServerError' }
            }
        }
    },
    '/api/messages/admin': {
        get: {
            tags: ['Messages'],
            summary: 'Get all messages (Admin only)',
            description: 'Retrieve all messages sent to the shelter',
            security: [{ cookieAuth: [] }],
            responses: {
                200: {
                    description: 'Messages retrieved successfully',
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
                401: { $ref: '#/components/responses/UnauthorizedError' },
                403: { $ref: '#/components/responses/ForbiddenError' },
                500: { $ref: '#/components/responses/ServerError' }
            }
        }
    },
    '/api/messages/admin/{id}/mark-read': {
        put: {
            tags: ['Messages'],
            summary: 'Mark message as read (Admin only)',
            description: 'Mark a message as read by an administrator',
            security: [{ cookieAuth: [] }],
            parameters: [
                {
                    in: 'path',
                    name: 'id',
                    schema: { type: 'string' },
                    required: true,
                    description: 'Message ID'
                }
            ],
            responses: {
                200: {
                    description: 'Message marked as read',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'Message marked as read' }
                                }
                            }
                        }
                    }
                },
                400: { $ref: '#/components/responses/ValidationError' },
                401: { $ref: '#/components/responses/UnauthorizedError' },
                403: { $ref: '#/components/responses/ForbiddenError' },
                404: { $ref: '#/components/responses/NotFoundError' },
                500: { $ref: '#/components/responses/ServerError' }
            }
        }
    },
    '/api/messages/admin/{id}': {
        delete: {
            tags: ['Messages'],
            summary: 'Delete a message (Admin only)',
            description: 'Delete a message from the database',
            security: [{ cookieAuth: [] }],
            parameters: [
                {
                    in: 'path',
                    name: 'id',
                    schema: { type: 'string' },
                    required: true,
                    description: 'Message ID'
                }
            ],
            responses: {
                200: {
                    description: 'Message deleted successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'Message deleted successfully' }
                                }
                            }
                        }
                    }
                },
                400: { $ref: '#/components/responses/ValidationError' },
                401: { $ref: '#/components/responses/UnauthorizedError' },
                403: { $ref: '#/components/responses/ForbiddenError' },
                404: { $ref: '#/components/responses/NotFoundError' },
                500: { $ref: '#/components/responses/ServerError' }
            }
        }
    },
    '/api/messages/admin/reply': {
        post: {
            tags: ['Messages'],
            summary: 'Reply to a message (Admin only)',
            description: 'Send a reply to a message',
            security: [{ cookieAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['messageId', 'email', 'replyText'],
                            properties: {
                                messageId: {
                                    type: 'string',
                                    example: '60b9c3d4f8e1234567890ghi'
                                },
                                email: {
                                    type: 'string',
                                    format: 'email',
                                    example: 'john@example.com'
                                },
                                replyText: {
                                    type: 'string',
                                    example: 'Thank you for your inquiry. Here is our response...'
                                }
                            }
                        }
                    }
                }
            },
            responses: {
                200: {
                    description: 'Reply sent successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'Reply sent successfully' }
                                }
                            }
                        }
                    }
                },
                400: { $ref: '#/components/responses/ValidationError' },
                401: { $ref: '#/components/responses/UnauthorizedError' },
                403: { $ref: '#/components/responses/ForbiddenError' },
                404: { $ref: '#/components/responses/NotFoundError' },
                500: { $ref: '#/components/responses/ServerError' }
            }
        }
    },
    '/api/messages/admin/user/{userId}': {
        get: {
            tags: ['Messages'],
            summary: 'Get messages for a specific user (Admin only)',
            description: 'Retrieve all messages sent by a specific user',
            security: [{ cookieAuth: [] }],
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
                400: { $ref: '#/components/responses/ValidationError' },
                401: { $ref: '#/components/responses/UnauthorizedError' },
                403: { $ref: '#/components/responses/ForbiddenError' },
                404: { $ref: '#/components/responses/NotFoundError' },
                500: { $ref: '#/components/responses/ServerError' }
            }
        }
    }
};