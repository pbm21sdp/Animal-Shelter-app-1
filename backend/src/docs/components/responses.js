export const responses = {
    responses: {
        UnauthorizedError: {
            description: 'Authentication information is missing or invalid',
            content: {
                'application/json': {
                    schema: {
                        $ref: '#/components/schemas/ErrorResponse'
                    }
                }
            }
        },
        ForbiddenError: {
            description: 'Access denied. Admin privileges required.',
            content: {
                'application/json': {
                    schema: {
                        $ref: '#/components/schemas/ErrorResponse'
                    }
                }
            }
        },
        ValidationError: {
            description: 'Validation error in request data',
            content: {
                'application/json': {
                    schema: {
                        $ref: '#/components/schemas/ErrorResponse'
                    }
                }
            }
        },
        NotFoundError: {
            description: 'Resource not found',
            content: {
                'application/json': {
                    schema: {
                        $ref: '#/components/schemas/ErrorResponse'
                    }
                }
            }
        },
        ServerError: {
            description: 'Internal server error',
            content: {
                'application/json': {
                    schema: {
                        $ref: '#/components/schemas/ErrorResponse'
                    }
                }
            }
        },
        ConflictError: {
            description: 'Resource already exists or conflict',
            content: {
                'application/json': {
                    schema: {
                        $ref: '#/components/schemas/ErrorResponse'
                    }
                }
            }
        },
        TooManyRequestsError: {
            description: 'Rate limit exceeded',
            content: {
                'application/json': {
                    schema: {
                        $ref: '#/components/schemas/ErrorResponse'
                    }
                }
            }
        }
    }
};