export const adoptionsDocs = {
    '/api/adoptions': {
        post: {
            tags: ['Adoptions'],
            summary: 'Submit an adoption application',
            security: [{ cookieAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['petId', 'petName', 'petType'],
                            properties: {
                                petId: {
                                    type: 'integer',
                                    example: 1
                                },
                                petName: {
                                    type: 'string',
                                    example: 'Buddy'
                                },
                                petType: {
                                    type: 'string',
                                    example: 'dog'
                                },
                                livingArrangement: {
                                    type: 'string',
                                    example: 'House with yard'
                                },
                                adoptionReason: {
                                    type: 'string',
                                    example: 'Looking for a family companion'
                                }
                            }
                        }
                    }
                }
            },
            responses: {
                201: {
                    description: 'Adoption application submitted successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string' },
                                    application: { $ref: '#/components/schemas/Adoption' }
                                }
                            }
                        }
                    }
                },
                400: { $ref: '#/components/responses/ValidationError' },
                401: { $ref: '#/components/responses/UnauthorizedError' }
            }
        }
    },
    '/api/adoptions/user': {
        get: {
            tags: ['Adoptions'],
            summary: 'Get user\'s adoption applications',
            security: [{ cookieAuth: [] }],
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
    '/api/adoptions/admin': {
        get: {
            tags: ['Adoptions'],
            summary: 'Get all adoption applications (Admin only)',
            security: [{ cookieAuth: [] }],
            parameters: [
                {
                    in: 'query',
                    name: 'status',
                    schema: { type: 'string', enum: ['all', 'pending', 'in_review', 'approved', 'rejected'] },
                    description: 'Filter by status'
                },
                {
                    in: 'query',
                    name: 'petType',
                    schema: { type: 'string' },
                    description: 'Filter by pet type'
                }
            ],
            responses: {
                200: {
                    description: 'All adoptions retrieved successfully',
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
                401: { $ref: '#/components/responses/UnauthorizedError' },
                403: {
                    description: 'Access denied. Admin privileges required.',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ErrorResponse' }
                        }
                    }
                }
            }
        }
    },
    '/api/adoptions/admin/{adoptionId}': {
        put: {
            tags: ['Adoptions'],
            summary: 'Update adoption status (Admin only)',
            security: [{ cookieAuth: [] }],
            parameters: [
                {
                    in: 'path',
                    name: 'adoptionId',
                    required: true,
                    schema: { type: 'string' }
                }
            ],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['status'],
                            properties: {
                                status: {
                                    type: 'string',
                                    enum: ['pending', 'in_review', 'approved', 'rejected']
                                },
                                adminNotes: {
                                    type: 'string',
                                    description: 'Admin notes (required for rejected status)'
                                }
                            }
                        }
                    }
                }
            },
            responses: {
                200: {
                    description: 'Adoption status updated successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string' },
                                    adoption: { $ref: '#/components/schemas/Adoption' }
                                }
                            }
                        }
                    }
                },
                400: { $ref: '#/components/responses/ValidationError' },
                401: { $ref: '#/components/responses/UnauthorizedError' },
                403: {
                    description: 'Access denied. Admin privileges required.',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ErrorResponse' }
                        }
                    }
                },
                404: { $ref: '#/components/responses/NotFoundError' }
            }
        }
    }
};