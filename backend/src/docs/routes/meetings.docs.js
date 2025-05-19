// Documentation for Scheduled Meeting-related API endpoints
export const meetingsDocs = {
    '/api/meetings/admin': {
        post: {
            tags: ['Meetings'],
            summary: 'Schedule an adoption meeting (Admin only)',
            description: 'Create a scheduled meeting for an adoption application',
            security: [{ cookieAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['adoptionId', 'scheduledDate', 'scheduledTime', 'location'],
                            properties: {
                                adoptionId: {
                                    type: 'string',
                                    example: '60b9c3d4f8e1234567890def'
                                },
                                scheduledDate: {
                                    type: 'string',
                                    format: 'date',
                                    example: '2024-06-15'
                                },
                                scheduledTime: {
                                    type: 'string',
                                    example: '14:00'
                                },
                                location: {
                                    type: 'string',
                                    example: 'Animal Shelter - Meeting Room 1'
                                },
                                notes: {
                                    type: 'string',
                                    example: 'Please bring identification documents'
                                },
                                adminMessage: {
                                    type: 'string',
                                    example: 'We look forward to meeting you and discussing the adoption'
                                }
                            }
                        }
                    }
                }
            },
            responses: {
                201: {
                    description: 'Meeting scheduled successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'Meeting scheduled successfully' },
                                    meeting: { $ref: '#/components/schemas/ScheduledMeeting' }
                                }
                            }
                        }
                    }
                },
                400: {
                    description: 'Validation error or existing pending meeting',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: false },
                                    message: { type: 'string', example: 'There is already a pending meeting for this adoption' }
                                }
                            }
                        }
                    }
                },
                401: { $ref: '#/components/responses/UnauthorizedError' },
                403: { $ref: '#/components/responses/ForbiddenError' },
                404: { $ref: '#/components/responses/NotFoundError' },
                500: { $ref: '#/components/responses/ServerError' }
            }
        },
        get: {
            tags: ['Meetings'],
            summary: 'Get all scheduled meetings (Admin only)',
            description: 'Retrieve all scheduled meetings for adoptions',
            security: [{ cookieAuth: [] }],
            parameters: [
                {
                    in: 'query',
                    name: 'status',
                    schema: {
                        type: 'string',
                        enum: ['all', 'pending', 'accepted', 'rejected']
                    },
                    description: 'Filter meetings by status'
                }
            ],
            responses: {
                200: {
                    description: 'Meetings retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    meetings: {
                                        type: 'array',
                                        items: { $ref: '#/components/schemas/ScheduledMeeting' }
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
    '/api/meetings/user': {
        get: {
            tags: ['Meetings'],
            summary: 'Get user\'s scheduled meetings',
            description: 'Retrieve all meetings scheduled for the authenticated user',
            security: [{ cookieAuth: [] }],
            responses: {
                200: {
                    description: 'User meetings retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    meetings: {
                                        type: 'array',
                                        items: { $ref: '#/components/schemas/ScheduledMeeting' }
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
    '/api/meetings/respond/{meetingId}': {
        put: {
            tags: ['Meetings'],
            summary: 'Respond to a meeting invitation',
            description: 'Accept or reject a scheduled meeting invitation',
            security: [{ cookieAuth: [] }],
            parameters: [
                {
                    in: 'path',
                    name: 'meetingId',
                    schema: { type: 'string' },
                    required: true,
                    description: 'Meeting ID'
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
                                    enum: ['accepted', 'rejected'],
                                    example: 'accepted'
                                }
                            }
                        }
                    }
                }
            },
            responses: {
                200: {
                    description: 'Meeting response processed successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'Meeting accepted successfully' },
                                    meeting: { $ref: '#/components/schemas/ScheduledMeeting' }
                                }
                            }
                        }
                    }
                },
                400: {
                    description: 'Invalid status or meeting not in pending state',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: false },
                                    message: { type: 'string', example: 'Invalid status. Must be either "accepted" or "rejected"' }
                                }
                            }
                        }
                    }
                },
                401: { $ref: '#/components/responses/UnauthorizedError' },
                403: {
                    description: 'Not authorized to respond to this meeting',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: false },
                                    message: { type: 'string', example: 'Not authorized to respond to this meeting' }
                                }
                            }
                        }
                    }
                },
                404: { $ref: '#/components/responses/NotFoundError' },
                500: { $ref: '#/components/responses/ServerError' }
            }
        }
    },
    '/api/meetings/admin/{meetingId}': {
        get: {
            tags: ['Meetings'],
            summary: 'Get meeting details (Admin only)',
            description: 'Retrieve detailed information about a specific meeting',
            security: [{ cookieAuth: [] }],
            parameters: [
                {
                    in: 'path',
                    name: 'meetingId',
                    schema: { type: 'string' },
                    required: true,
                    description: 'Meeting ID'
                }
            ],
            responses: {
                200: {
                    description: 'Meeting details retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    meeting: { $ref: '#/components/schemas/ScheduledMeeting' },
                                    adoption: { $ref: '#/components/schemas/Adoption' }
                                }
                            }
                        }
                    }
                },
                401: { $ref: '#/components/responses/UnauthorizedError' },
                403: { $ref: '#/components/responses/ForbiddenError' },
                404: { $ref: '#/components/responses/NotFoundError' },
                500: { $ref: '#/components/responses/ServerError' }
            }
        },
        put: {
            tags: ['Meetings'],
            summary: 'Update meeting details (Admin only)',
            description: 'Update scheduled meeting information',
            security: [{ cookieAuth: [] }],
            parameters: [
                {
                    in: 'path',
                    name: 'meetingId',
                    schema: { type: 'string' },
                    required: true,
                    description: 'Meeting ID'
                }
            ],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                scheduledDate: {
                                    type: 'string',
                                    format: 'date',
                                    example: '2024-06-20'
                                },
                                scheduledTime: {
                                    type: 'string',
                                    example: '15:30'
                                },
                                location: {
                                    type: 'string',
                                    example: 'Animal Shelter - Meeting Room 2'
                                },
                                notes: {
                                    type: 'string',
                                    example: 'Updated meeting notes'
                                },
                                adminMessage: {
                                    type: 'string',
                                    example: 'We had to reschedule the meeting'
                                },
                                status: {
                                    type: 'string',
                                    enum: ['pending', 'accepted', 'rejected'],
                                    example: 'pending'
                                }
                            }
                        }
                    }
                }
            },
            responses: {
                200: {
                    description: 'Meeting updated successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'Meeting updated successfully' },
                                    meeting: { $ref: '#/components/schemas/ScheduledMeeting' }
                                }
                            }
                        }
                    }
                },
                401: { $ref: '#/components/responses/UnauthorizedError' },
                403: { $ref: '#/components/responses/ForbiddenError' },
                404: { $ref: '#/components/responses/NotFoundError' },
                500: { $ref: '#/components/responses/ServerError' }
            }
        },
        delete: {
            tags: ['Meetings'],
            summary: 'Delete a meeting (Admin only)',
            description: 'Remove a scheduled meeting from the database',
            security: [{ cookieAuth: [] }],
            parameters: [
                {
                    in: 'path',
                    name: 'meetingId',
                    schema: { type: 'string' },
                    required: true,
                    description: 'Meeting ID'
                }
            ],
            responses: {
                200: {
                    description: 'Meeting deleted successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'Meeting deleted successfully' }
                                }
                            }
                        }
                    }
                },
                401: { $ref: '#/components/responses/UnauthorizedError' },
                403: { $ref: '#/components/responses/ForbiddenError' },
                404: { $ref: '#/components/responses/NotFoundError' },
                500: { $ref: '#/components/responses/ServerError' }
            }
        }
    }
};