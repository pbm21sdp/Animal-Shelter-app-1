export const petsDocs = {
    '/api/pets': {
        get: {
            tags: ['Pets'],
            summary: 'Get all pets',
            description: 'Retrieve a list of all available pets',
            parameters: [
                {
                    in: 'query',
                    name: 'type',
                    schema: {
                        type: 'string',
                        enum: ['dog', 'cat', 'bird', 'other', 'any']
                    },
                    description: 'Filter by pet type'
                },
                {
                    in: 'query',
                    name: 'city',
                    schema: { type: 'string' },
                    description: 'Filter by city'
                },
                {
                    in: 'query',
                    name: 'zipCode',
                    schema: { type: 'string' },
                    description: 'Filter by zip code'
                },
                {
                    in: 'query',
                    name: 'limit',
                    schema: { type: 'integer' },
                    description: 'Limit the number of results'
                },
                {
                    in: 'query',
                    name: 'showAll',
                    schema: { type: 'boolean' },
                    description: 'Include pets with all adoption statuses (admin only)'
                }
            ],
            responses: {
                200: {
                    description: 'A list of pets',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    pets: {
                                        type: 'array',
                                        items: { $ref: '#/components/schemas/Pet' }
                                    }
                                }
                            }
                        }
                    }
                },
                500: { $ref: '#/components/responses/ServerError' }
            }
        },
        post: {
            tags: ['Pets'],
            summary: 'Create a new pet (Admin only)',
            security: [{ cookieAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['name', 'type'],
                            properties: {
                                name: { type: 'string', example: 'Buddy' },
                                type: {
                                    type: 'string',
                                    enum: ['dog', 'cat', 'bird', 'other'],
                                    example: 'dog'
                                },
                                breed: { type: 'string', example: 'Golden Retriever' },
                                age_category: {
                                    type: 'string',
                                    enum: ['puppy', 'young', 'adult', 'senior'],
                                    example: 'adult'
                                },
                                gender: {
                                    type: 'string',
                                    enum: ['male', 'female'],
                                    example: 'male'
                                },
                                size: {
                                    type: 'string',
                                    enum: ['small', 'medium', 'large', 'extra-large'],
                                    example: 'large'
                                },
                                color: { type: 'string', example: 'Golden' },
                                coat: { type: 'string', example: 'Long' },
                                fee: { type: 'number', example: 150 },
                                description: { type: 'string', example: 'Friendly and energetic dog' },
                                health_status: { type: 'string', example: 'Healthy, all vaccinations up to date' },
                                story: { type: 'string', example: 'Buddy was rescued from...' },
                                location_city: { type: 'string', example: 'New York' },
                                zip_code: { type: 'string', example: '10001' },
                                traits: {
                                    type: 'array',
                                    items: { type: 'string' },
                                    example: ['friendly', 'housetrained', 'good with kids']
                                }
                            }
                        }
                    }
                }
            },
            responses: {
                201: {
                    description: 'Pet created successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'Pet created successfully' },
                                    pet: { $ref: '#/components/schemas/Pet' }
                                }
                            }
                        }
                    }
                },
                400: { $ref: '#/components/responses/ValidationError' },
                401: { $ref: '#/components/responses/UnauthorizedError' },
                403: { $ref: '#/components/responses/ForbiddenError' }
            }
        }
    },
    '/api/pets/search': {
        get: {
            tags: ['Pets'],
            summary: 'Search for pets',
            parameters: [
                {
                    in: 'query',
                    name: 'type',
                    schema: {
                        type: 'string',
                        enum: ['dog', 'cat', 'bird', 'other', 'any']
                    },
                    description: 'Filter by pet type'
                },
                {
                    in: 'query',
                    name: 'radius',
                    schema: { type: 'string' },
                    description: 'Search radius in miles'
                },
                {
                    in: 'query',
                    name: 'zipCode',
                    schema: { type: 'string' },
                    description: 'ZIP code for location-based search'
                },
                {
                    in: 'query',
                    name: 'term',
                    schema: { type: 'string' },
                    description: 'Search term for name, breed, or description'
                },
                {
                    in: 'query',
                    name: 'gender',
                    schema: {
                        type: 'string',
                        enum: ['male', 'female', 'any']
                    },
                    description: 'Filter by gender'
                },
                {
                    in: 'query',
                    name: 'ageCategory',
                    schema: {
                        type: 'string',
                        enum: ['puppy', 'young', 'adult', 'senior', 'any']
                    },
                    description: 'Filter by age category'
                },
                {
                    in: 'query',
                    name: 'size',
                    schema: {
                        type: 'string',
                        enum: ['small', 'medium', 'large', 'extra-large', 'any']
                    },
                    description: 'Filter by size'
                },
                {
                    in: 'query',
                    name: 'color',
                    schema: { type: 'string' },
                    description: 'Filter by color'
                },
                {
                    in: 'query',
                    name: 'breed',
                    schema: { type: 'string' },
                    description: 'Filter by breed'
                },
                {
                    in: 'query',
                    name: 'sortBy',
                    schema: {
                        type: 'string',
                        enum: ['newest', 'oldest', 'nearest']
                    },
                    description: 'Sort results by specified criteria'
                }
            ],
            responses: {
                200: {
                    description: 'Search results',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    totalCount: { type: 'integer', example: 10 },
                                    pets: {
                                        type: 'array',
                                        items: { $ref: '#/components/schemas/Pet' }
                                    }
                                }
                            }
                        }
                    }
                },
                500: { $ref: '#/components/responses/ServerError' }
            }
        }
    },
    '/api/pets/suggestions': {
        get: {
            tags: ['Pets'],
            summary: 'Get search suggestions for autocomplete',
            parameters: [
                {
                    in: 'query',
                    name: 'term',
                    schema: { type: 'string' },
                    required: true,
                    description: 'Partial search term for suggestions'
                }
            ],
            responses: {
                200: {
                    description: 'Search suggestions',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    suggestions: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                text: { type: 'string', example: 'Golden Retriever' },
                                                category: { type: 'string', example: 'Breed' }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                500: { $ref: '#/components/responses/ServerError' }
            }
        }
    },
    '/api/pets/{id}': {
        get: {
            tags: ['Pets'],
            summary: 'Get pet details by ID',
            security: [{ cookieAuth: [] }],
            parameters: [
                {
                    in: 'path',
                    name: 'id',
                    schema: { type: 'integer' },
                    required: true,
                    description: 'Pet ID'
                }
            ],
            responses: {
                200: {
                    description: 'Pet details',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    pet: { $ref: '#/components/schemas/Pet' }
                                }
                            }
                        }
                    }
                },
                404: { $ref: '#/components/responses/NotFoundError' },
                500: { $ref: '#/components/responses/ServerError' }
            }
        },
        put: {
            tags: ['Pets'],
            summary: 'Update pet details (Admin only)',
            security: [{ cookieAuth: [] }],
            parameters: [
                {
                    in: 'path',
                    name: 'id',
                    schema: { type: 'integer' },
                    required: true,
                    description: 'Pet ID'
                }
            ],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                name: { type: 'string' },
                                breed: { type: 'string' },
                                age_category: {
                                    type: 'string',
                                    enum: ['puppy', 'young', 'adult', 'senior']
                                },
                                description: { type: 'string' },
                                health_status: { type: 'string' },
                                fee: { type: 'number' },
                                adoption_status: {
                                    type: 'string',
                                    enum: ['available', 'pending', 'adopted']
                                },
                                traits: {
                                    type: 'array',
                                    items: { type: 'string' }
                                }
                            }
                        }
                    }
                }
            },
            responses: {
                200: {
                    description: 'Pet updated successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'Pet updated successfully' },
                                    pet: { $ref: '#/components/schemas/Pet' }
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
        },
        delete: {
            tags: ['Pets'],
            summary: 'Delete a pet (Admin only)',
            security: [{ cookieAuth: [] }],
            parameters: [
                {
                    in: 'path',
                    name: 'id',
                    schema: { type: 'integer' },
                    required: true,
                    description: 'Pet ID'
                }
            ],
            responses: {
                200: {
                    description: 'Pet deleted successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'Pet deleted successfully' }
                                }
                            }
                        }
                    }
                },
                401: { $ref: '#/components/responses/UnauthorizedError' },
                403: { $ref: '#/components/responses/ForbiddenError' },
                404: { $ref: '#/components/responses/NotFoundError' }
            }
        }
    },
    '/api/pets/{id}/similar': {
        get: {
            tags: ['Pets'],
            summary: 'Get similar pets to the specified pet',
            parameters: [
                {
                    in: 'path',
                    name: 'id',
                    schema: { type: 'integer' },
                    required: true,
                    description: 'Pet ID'
                }
            ],
            responses: {
                200: {
                    description: 'Similar pets',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    pets: {
                                        type: 'array',
                                        items: { $ref: '#/components/schemas/Pet' }
                                    }
                                }
                            }
                        }
                    }
                },
                500: { $ref: '#/components/responses/ServerError' }
            }
        }
    },
    '/api/pets/{petId}/photos': {
        get: {
            tags: ['Pets'],
            summary: 'Get all photos for a pet',
            parameters: [
                {
                    in: 'path',
                    name: 'petId',
                    schema: { type: 'integer' },
                    required: true,
                    description: 'Pet ID'
                }
            ],
            responses: {
                200: {
                    description: 'Pet photos',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    photos: {
                                        type: 'array',
                                        items: { $ref: '#/components/schemas/PetPhoto' }
                                    }
                                }
                            }
                        }
                    }
                },
                404: { $ref: '#/components/responses/NotFoundError' },
                500: { $ref: '#/components/responses/ServerError' }
            }
        },
        post: {
            tags: ['Pets'],
            summary: 'Upload a photo for a pet (Admin only)',
            security: [{ cookieAuth: [] }],
            parameters: [
                {
                    in: 'path',
                    name: 'petId',
                    schema: { type: 'integer' },
                    required: true,
                    description: 'Pet ID'
                }
            ],
            requestBody: {
                required: true,
                content: {
                    'multipart/form-data': {
                        schema: {
                            type: 'object',
                            properties: {
                                photo: {
                                    type: 'string',
                                    format: 'binary',
                                    description: 'Pet photo to upload'
                                }
                            }
                        }
                    }
                }
            },
            responses: {
                201: {
                    description: 'Photo uploaded successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'Photo uploaded successfully' },
                                    photo: { $ref: '#/components/schemas/PetPhoto' }
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
    '/api/pets/photos/{photoId}': {
        get: {
            tags: ['Pets'],
            summary: 'Get pet photo by ID',
            parameters: [
                {
                    in: 'path',
                    name: 'photoId',
                    schema: { type: 'integer' },
                    required: true,
                    description: 'Photo ID'
                }
            ],
            responses: {
                200: {
                    description: 'Pet photo binary data',
                    content: {
                        'image/*': {
                            schema: {
                                type: 'string',
                                format: 'binary'
                            }
                        }
                    }
                },
                404: { $ref: '#/components/responses/NotFoundError' },
                500: { $ref: '#/components/responses/ServerError' }
            }
        }
    },
    '/api/pets/{petId}/photos/{photoId}': {
        delete: {
            tags: ['Pets'],
            summary: 'Delete a pet photo (Admin only)',
            security: [{ cookieAuth: [] }],
            parameters: [
                {
                    in: 'path',
                    name: 'petId',
                    schema: { type: 'integer' },
                    required: true,
                    description: 'Pet ID'
                },
                {
                    in: 'path',
                    name: 'photoId',
                    schema: { type: 'integer' },
                    required: true,
                    description: 'Photo ID'
                }
            ],
            responses: {
                200: {
                    description: 'Photo deleted successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'Photo deleted successfully' }
                                }
                            }
                        }
                    }
                },
                401: { $ref: '#/components/responses/UnauthorizedError' },
                403: { $ref: '#/components/responses/ForbiddenError' },
                404: { $ref: '#/components/responses/NotFoundError' }
            }
        }
    },
    '/api/pets/{petId}/photos/{photoId}/primary': {
        put: {
            tags: ['Pets'],
            summary: 'Set a photo as primary for a pet (Admin only)',
            security: [{ cookieAuth: [] }],
            parameters: [
                {
                    in: 'path',
                    name: 'petId',
                    schema: { type: 'integer' },
                    required: true,
                    description: 'Pet ID'
                },
                {
                    in: 'path',
                    name: 'photoId',
                    schema: { type: 'integer' },
                    required: true,
                    description: 'Photo ID'
                }
            ],
            responses: {
                200: {
                    description: 'Photo set as primary',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'Photo set as primary' },
                                    photo: { $ref: '#/components/schemas/PetPhoto' }
                                }
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