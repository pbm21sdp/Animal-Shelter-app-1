export const schemas = {
    schemas: {
        // Auth Schemas
        AuthResponse: {
            type: 'object',
            properties: {
                success: {
                    type: 'boolean',
                    example: true
                },
                message: {
                    type: 'string',
                    example: 'Operation successful'
                },
                user: {
                    $ref: '#/components/schemas/User'
                }
            }
        },
        User: {
            type: 'object',
            properties: {
                _id: {
                    type: 'string',
                    example: '60b9c3d4f8e1234567890abc'
                },
                name: {
                    type: 'string',
                    example: 'John Doe'
                },
                email: {
                    type: 'string',
                    format: 'email',
                    example: 'john@example.com'
                },
                isAdmin: {
                    type: 'boolean',
                    example: false
                },
                isVerified: {
                    type: 'boolean',
                    example: true
                },
                avatar: {
                    type: 'string',
                    example: '/uploads/avatars/avatar-123.jpg'
                },
                lastLogin: {
                    type: 'string',
                    format: 'date-time'
                },
                createdAt: {
                    type: 'string',
                    format: 'date-time'
                },
                updatedAt: {
                    type: 'string',
                    format: 'date-time'
                }
            }
        },

        // Pet Schemas
        Pet: {
            type: 'object',
            properties: {
                id: {
                    type: 'integer',
                    example: 1
                },
                name: {
                    type: 'string',
                    example: 'Buddy'
                },
                type: {
                    type: 'string',
                    enum: ['dog', 'cat', 'bird', 'other'],
                    example: 'dog'
                },
                breed: {
                    type: 'string',
                    example: 'Golden Retriever'
                },
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
                color: {
                    type: 'string',
                    example: 'Golden'
                },
                coat: {
                    type: 'string',
                    example: 'Long'
                },
                fee: {
                    type: 'number',
                    example: 150.00
                },
                adoption_status: {
                    type: 'string',
                    enum: ['available', 'pending', 'adopted'],
                    example: 'available'
                },
                is_available: {
                    type: 'boolean',
                    example: true
                },
                location_city: {
                    type: 'string',
                    example: 'New York'
                },
                zip_code: {
                    type: 'string',
                    example: '10001'
                },
                description: {
                    type: 'string',
                    example: 'Friendly and energetic dog'
                },
                health_status: {
                    type: 'string',
                    example: 'Healthy, all vaccinations up to date'
                },
                story: {
                    type: 'string',
                    example: 'Buddy was rescued from...'
                },
                photos: {
                    type: 'array',
                    items: {
                        $ref: '#/components/schemas/PetPhoto'
                    }
                },
                traits: {
                    type: 'array',
                    items: {
                        type: 'string'
                    },
                    example: ['friendly', 'housetrained', 'good with kids']
                },
                created_at: {
                    type: 'string',
                    format: 'date-time'
                }
            }
        },
        PetPhoto: {
            type: 'object',
            properties: {
                id: {
                    type: 'integer',
                    example: 1
                },
                pet_id: {
                    type: 'integer',
                    example: 1
                },
                photo_name: {
                    type: 'string',
                    example: 'buddy-photo-1.jpg'
                },
                is_primary: {
                    type: 'boolean',
                    example: true
                },
                created_at: {
                    type: 'string',
                    format: 'date-time'
                }
            }
        },

        // Adoption Schemas
        Adoption: {
            type: 'object',
            properties: {
                _id: {
                    type: 'string',
                    example: '60b9c3d4f8e1234567890def'
                },
                user: {
                    oneOf: [
                        { type: 'string', example: '60b9c3d4f8e1234567890abc' },
                        { $ref: '#/components/schemas/User' }
                    ]
                },
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
                petBreed: {
                    type: 'string',
                    example: 'Golden Retriever'
                },
                status: {
                    type: 'string',
                    enum: ['pending', 'in_review', 'approved', 'rejected'],
                    example: 'pending'
                },
                livingArrangement: {
                    type: 'string',
                    example: 'House with yard'
                },
                hasChildren: {
                    type: 'boolean',
                    example: false
                },
                hasOtherPets: {
                    type: 'boolean',
                    example: true
                },
                otherPetsDetails: {
                    type: 'string',
                    example: 'One cat, friendly with dogs'
                },
                adoptionReason: {
                    type: 'string',
                    example: 'Looking for a family companion'
                },
                adminNotes: {
                    type: 'string',
                    example: 'Approved - great fit for this pet'
                },
                fullName: {
                    type: 'string',
                    example: 'John Doe'
                },
                email: {
                    type: 'string',
                    format: 'email',
                    example: 'john@example.com'
                },
                phone: {
                    type: 'string',
                    example: '+1-555-123-4567'
                },
                address: {
                    type: 'string',
                    example: '123 Main St'
                },
                city: {
                    type: 'string',
                    example: 'New York'
                },
                postalCode: {
                    type: 'string',
                    example: '10001'
                },
                hasYard: {
                    type: 'string',
                    enum: ['yes', 'no'],
                    example: 'yes'
                },
                notes: {
                    type: 'string',
                    example: 'Additional notes about the application'
                },
                createdAt: {
                    type: 'string',
                    format: 'date-time'
                },
                updatedAt: {
                    type: 'string',
                    format: 'date-time'
                }
            }
        },

        // Message Schemas
        Message: {
            type: 'object',
            properties: {
                _id: {
                    type: 'string',
                    example: '60b9c3d4f8e1234567890ghi'
                },
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
                    example: 'I have a question about adopting a pet...'
                },
                read: {
                    type: 'boolean',
                    example: false
                },
                userId: {
                    type: 'string',
                    example: '60b9c3d4f8e1234567890abc'
                },
                createdAt: {
                    type: 'string',
                    format: 'date-time'
                }
            }
        },

        // Meeting Schemas
        ScheduledMeeting: {
            type: 'object',
            properties: {
                _id: {
                    type: 'string',
                    example: '60b9c3d4f8e1234567890jkl'
                },
                adoptionId: {
                    type: 'string',
                    example: '60b9c3d4f8e1234567890def'
                },
                userId: {
                    type: 'string',
                    example: '60b9c3d4f8e1234567890abc'
                },
                petId: {
                    type: 'integer',
                    example: 1
                },
                petName: {
                    type: 'string',
                    example: 'Buddy'
                },
                scheduledDate: {
                    type: 'string',
                    format: 'date',
                    example: '2024-01-20'
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
                    example: 'Bring identification documents'
                },
                adminMessage: {
                    type: 'string',
                    example: 'Please arrive 10 minutes early'
                },
                status: {
                    type: 'string',
                    enum: ['pending', 'accepted', 'rejected'],
                    example: 'pending'
                },
                responseDate: {
                    type: 'string',
                    format: 'date-time'
                },
                createdAt: {
                    type: 'string',
                    format: 'date-time'
                }
            }
        },

        // Donation Schemas
        Donation: {
            type: 'object',
            properties: {
                _id: {
                    type: 'string',
                    example: '60b9c3d4f8e1234567890mno'
                },
                user: {
                    oneOf: [
                        { type: 'string', example: '60b9c3d4f8e1234567890abc' },
                        { $ref: '#/components/schemas/User' }
                    ]
                },
                email: {
                    type: 'string',
                    format: 'email',
                    example: 'john@example.com'
                },
                amount: {
                    type: 'number',
                    example: 50.00
                },
                currency: {
                    type: 'string',
                    example: 'eur'
                },
                stripeSessionId: {
                    type: 'string',
                    example: 'cs_test_123456'
                },
                paymentIntentId: {
                    type: 'string',
                    example: 'pi_test_123456'
                },
                status: {
                    type: 'string',
                    enum: ['pending', 'completed', 'canceled'],
                    example: 'completed'
                },
                createdAt: {
                    type: 'string',
                    format: 'date-time'
                }
            }
        },

        // Common Error Schema
        ErrorResponse: {
            type: 'object',
            properties: {
                success: {
                    type: 'boolean',
                    example: false
                },
                message: {
                    type: 'string',
                    example: 'Error description'
                },
                error: {
                    type: 'string',
                    example: 'Detailed error message'
                }
            }
        }
    }
};