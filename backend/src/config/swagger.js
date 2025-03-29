import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Animal Shelter API',
            version: '1.0.0',
            description: 'API for managing animal shelter operations and user authentication',
            contact: {
                name: "API Support",
                email: "support@animalshelter.com"
            }
        },
        servers: [
            {
                url: 'http://localhost:5000',
                description: 'Local development server'
            }
        ],
        components: {
            schemas: {
                User: {
                    type: "object",
                    properties: {
                        _id: {
                            type: "string",
                            example: "507f1f77bcf86cd799439011"
                        },
                        name: {
                            type: "string",
                            example: "John Doe"
                        },
                        email: {
                            type: "string",
                            format: "email",
                            example: "user@example.com"
                        },
                        isVerified: {
                            type: "boolean",
                            example: true
                        },
                        lastLogin: {
                            type: "string",
                            format: "date-time",
                            example: "2023-07-01T12:00:00Z"
                        },
                        createdAt: {
                            type: "string",
                            format: "date-time"
                        },
                        updatedAt: {
                            type: "string",
                            format: "date-time"
                        }
                    }
                },
                AuthResponse: {
                    type: "object",
                    properties: {
                        success: {
                            type: "boolean"
                        },
                        message: {
                            type: "string"
                        },
                        user: {
                            $ref: "#/components/schemas/User"
                        }
                    }
                },
                ErrorResponse: {
                    type: "object",
                    properties: {
                        success: {
                            type: "boolean",
                            example: false
                        },
                        message: {
                            type: "string",
                            example: "Error description"
                        }
                    }
                }
            },
            securitySchemes: {
                cookieAuth: {
                    type: "apiKey",
                    in: "cookie",
                    name: "token",
                    description: "JWT authentication token"
                }
            },
            responses: {
                UnauthorizedError: {
                    description: "Unauthorized access",
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/ErrorResponse"
                            }
                        }
                    }
                },
                ValidationError: {
                    description: "Invalid request data",
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/ErrorResponse"
                            }
                        }
                    }
                }
            }
        },
        security: [{
            cookieAuth: []
        }]
    },
    apis: [
        path.join(__dirname, '../routes/*.js'),
        path.join(__dirname, '../routes/**/*.js')
    ],
};

const specs = swaggerJsdoc(options);
export default specs;