export const authDocs = {
    '/api/auth/signup': {
        post: {
            tags: ['Authentication'],
            summary: 'Register a new user',
            description: 'Create a new user account and send verification email',
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['name', 'email', 'password'],
                            properties: {
                                name: {
                                    type: 'string',
                                    minLength: 2,
                                    example: 'John Doe'
                                },
                                email: {
                                    type: 'string',
                                    format: 'email',
                                    example: 'user@example.com'
                                },
                                password: {
                                    type: 'string',
                                    minLength: 6,
                                    example: 'password123'
                                }
                            }
                        }
                    }
                }
            },
            responses: {
                201: {
                    description: 'User created successfully',
                    headers: {
                        'Set-Cookie': {
                            schema: {
                                type: 'string',
                                example: 'token=abcde12345; Path=/; HttpOnly'
                            }
                        }
                    },
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/AuthResponse'
                            }
                        }
                    }
                },
                400: {
                    $ref: '#/components/responses/ValidationError'
                }
            }
        }
    },
    '/api/auth/login': {
        post: {
            tags: ['Authentication'],
            summary: 'Authenticate user',
            description: 'Log in with email and password',
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['email', 'password'],
                            properties: {
                                email: {
                                    type: 'string',
                                    format: 'email',
                                    example: 'user@example.com'
                                },
                                password: {
                                    type: 'string',
                                    example: 'password123'
                                }
                            }
                        }
                    }
                }
            },
            responses: {
                200: {
                    description: 'Successfully logged in',
                    headers: {
                        'Set-Cookie': {
                            schema: {
                                type: 'string',
                                example: 'token=abcde12345; Path=/; HttpOnly'
                            }
                        }
                    },
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/AuthResponse'
                            }
                        }
                    }
                },
                400: {
                    description: 'Invalid credentials',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ErrorResponse'
                            }
                        }
                    }
                }
            }
        }
    },
    '/api/auth/logout': {
        post: {
            tags: ['Authentication'],
            summary: 'Terminate session',
            description: 'Log out the current user',
            responses: {
                200: {
                    description: 'Successfully logged out',
                    headers: {
                        'Set-Cookie': {
                            schema: {
                                type: 'string',
                                example: 'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
                            }
                        }
                    },
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: {
                                        type: 'boolean',
                                        example: true
                                    },
                                    message: {
                                        type: 'string',
                                        example: 'Logged out successfully'
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    '/api/auth/verify-email': {
        post: {
            tags: ['Authentication'],
            summary: 'Verify email address',
            description: 'Confirm user\'s email with verification code',
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['code'],
                            properties: {
                                code: {
                                    type: 'string',
                                    description: '6-digit verification code',
                                    example: '123456'
                                }
                            }
                        }
                    }
                }
            },
            responses: {
                200: {
                    description: 'Email verified successfully',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/AuthResponse'
                            }
                        }
                    }
                },
                400: {
                    description: 'Invalid or expired verification code',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ErrorResponse'
                            }
                        }
                    }
                }
            }
        }
    },
    '/api/auth/forgot-password': {
        post: {
            tags: ['Authentication'],
            summary: 'Initiate password reset',
            description: 'Request password reset link via email',
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['email'],
                            properties: {
                                email: {
                                    type: 'string',
                                    format: 'email',
                                    example: 'user@example.com'
                                }
                            }
                        }
                    }
                }
            },
            responses: {
                200: {
                    description: 'Password reset link sent to email',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: {
                                        type: 'boolean',
                                        example: true
                                    },
                                    message: {
                                        type: 'string',
                                        example: 'Password reset link sent to your email'
                                    }
                                }
                            }
                        }
                    }
                },
                400: {
                    description: 'User not found',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ErrorResponse'
                            }
                        }
                    }
                }
            }
        }
    },
    '/api/auth/reset-password/{token}': {
        post: {
            tags: ['Authentication'],
            summary: 'Complete password reset',
            description: 'Set new password using reset token',
            parameters: [
                {
                    in: 'path',
                    name: 'token',
                    required: true,
                    schema: {
                        type: 'string'
                    },
                    description: 'Password reset token from email'
                }
            ],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['password'],
                            properties: {
                                password: {
                                    type: 'string',
                                    minLength: 6,
                                    example: 'newpassword123'
                                }
                            }
                        }
                    }
                }
            },
            responses: {
                200: {
                    description: 'Password reset successful',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: {
                                        type: 'boolean',
                                        example: true
                                    },
                                    message: {
                                        type: 'string',
                                        example: 'Password reset successful'
                                    }
                                }
                            }
                        }
                    }
                },
                400: {
                    description: 'Invalid or expired reset token',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ErrorResponse'
                            }
                        }
                    }
                }
            }
        }
    },
    '/api/auth/check-auth': {
        get: {
            tags: ['Authentication'],
            summary: 'Verify authentication status',
            description: 'Check if the current user is authenticated and get user data',
            security: [
                {
                    cookieAuth: []
                }
            ],
            responses: {
                200: {
                    description: 'Successfully authenticated',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/AuthResponse'
                            }
                        }
                    }
                },
                401: {
                    $ref: '#/components/responses/UnauthorizedError'
                },
                404: {
                    description: 'User not found',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ErrorResponse'
                            }
                        }
                    }
                }
            }
        }
    }
};