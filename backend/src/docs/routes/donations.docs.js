// Documentation for Donation-related API endpoints
export const donationsDocs = {
    '/api/donations/create-checkout': {
        post: {
            tags: ['Donations'],
            summary: 'Create a donation checkout session',
            description: 'Create a payment session for processing a donation',
            security: [{ cookieAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['email'],
                            properties: {
                                amountInCents: {
                                    type: 'integer',
                                    description: 'Donation amount in cents',
                                    example: 1000
                                },
                                email: {
                                    type: 'string',
                                    format: 'email',
                                    example: 'donor@example.com'
                                }
                            }
                        }
                    }
                }
            },
            responses: {
                200: {
                    description: 'Checkout session created successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    sessionId: { type: 'string', example: 'cs_test_a1b2c3d4e5f6' },
                                    url: { type: 'string', example: 'https://checkout.stripe.com/pay/cs_test_a1b2c3d4e5f6' }
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
    '/api/donations/user': {
        get: {
            tags: ['Donations'],
            summary: 'Get user\'s donations',
            description: 'Retrieve all donations made by the authenticated user',
            security: [{ cookieAuth: [] }],
            responses: {
                200: {
                    description: 'User donations retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    donations: {
                                        type: 'array',
                                        items: { $ref: '#/components/schemas/Donation' }
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
    '/api/donations/verify/{sessionId}': {
        get: {
            tags: ['Donations'],
            summary: 'Verify a donation session',
            description: 'Check the status of a donation payment session',
            security: [{ cookieAuth: [] }],
            parameters: [
                {
                    in: 'path',
                    name: 'sessionId',
                    schema: { type: 'string' },
                    required: true,
                    description: 'Stripe session ID'
                }
            ],
            responses: {
                200: {
                    description: 'Donation verification successful',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    donation: { $ref: '#/components/schemas/Donation' }
                                }
                            }
                        }
                    }
                },
                401: { $ref: '#/components/responses/UnauthorizedError' },
                404: { $ref: '#/components/responses/NotFoundError' },
                500: { $ref: '#/components/responses/ServerError' }
            }
        }
    },
    '/api/donations/webhook': {
        post: {
            tags: ['Donations'],
            summary: 'Handle Stripe webhook events',
            description: 'Process webhook events from Stripe for payment confirmations and updates',
            parameters: [
                {
                    in: 'header',
                    name: 'stripe-signature',
                    schema: { type: 'string' },
                    required: true,
                    description: 'Stripe signature for verifying webhook authenticity'
                }
            ],
            responses: {
                200: {
                    description: 'Webhook processed successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    received: { type: 'boolean', example: true }
                                }
                            }
                        }
                    }
                },
                400: {
                    description: 'Invalid signature',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    error: { type: 'string', example: 'Webhook Error: Invalid signature' }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    '/api/donations/admin': {
        get: {
            tags: ['Donations'],
            summary: 'Get all donations (Admin only)',
            description: 'Retrieve all donations made to the shelter',
            security: [{ cookieAuth: [] }],
            responses: {
                200: {
                    description: 'Donations retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    donations: {
                                        type: 'array',
                                        items: { $ref: '#/components/schemas/Donation' }
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
    '/api/donations/admin/user/{userId}': {
        get: {
            tags: ['Donations'],
            summary: 'Get donations for a specific user (Admin only)',
            description: 'Retrieve all donations made by a specific user',
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
                    description: 'User donations retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    donations: {
                                        type: 'array',
                                        items: { $ref: '#/components/schemas/Donation' }
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
    },
    '/api/donations/admin/cleanup-abandoned': {
        get: {
            tags: ['Donations'],
            summary: 'Clean up abandoned donations (Admin only)',
            description: 'Find and mark abandoned donation sessions as canceled',
            security: [{ cookieAuth: [] }],
            parameters: [
                {
                    in: 'query',
                    name: 'minutes',
                    schema: { type: 'integer' },
                    description: 'Time threshold in minutes (defaults to 1)'
                }
            ],
            responses: {
                200: {
                    description: 'Abandoned donations cleaned up successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    expiredCount: { type: 'integer', example: 5 },
                                    timeThreshold: { type: 'string', example: '30 minute(s)' },
                                    message: { type: 'string', example: 'Successfully cleaned up 5 abandoned donations' }
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
    '/api/donations/admin/{id}': {
        put: {
            tags: ['Donations'],
            summary: 'Update a donation (Admin only)',
            description: 'Update donation details',
            security: [{ cookieAuth: [] }],
            parameters: [
                {
                    in: 'path',
                    name: 'id',
                    schema: { type: 'string' },
                    required: true,
                    description: 'Donation ID'
                }
            ],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                amount: { type: 'number', example: 25.00 },
                                status: {
                                    type: 'string',
                                    enum: ['pending', 'completed', 'canceled'],
                                    example: 'completed'
                                },
                                createdAt: { type: 'string', format: 'date-time' }
                            }
                        }
                    }
                }
            },
            responses: {
                200: {
                    description: 'Donation updated successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    donation: { $ref: '#/components/schemas/Donation' }
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
        },
        delete: {
            tags: ['Donations'],
            summary: 'Delete a donation (Admin only)',
            description: 'Remove a donation from the database',
            security: [{ cookieAuth: [] }],
            parameters: [
                {
                    in: 'path',
                    name: 'id',
                    schema: { type: 'string' },
                    required: true,
                    description: 'Donation ID'
                }
            ],
            responses: {
                200: {
                    description: 'Donation deleted successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'Donation deleted successfully' }
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