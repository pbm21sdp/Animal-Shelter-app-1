# Product Requirements Document (PRD)
# Paws - Animal Shelter Management Platform

**Version:** 1.0
**Last Updated:** December 30, 2025
**Status:** Active Development

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Product Overview](#2-product-overview)C
3. [Tech Stack](#3-tech-stack)
4. [System Architecture](#4-system-architecture)
5. [Database Design](#5-database-design)
6. [Core Features](#6-core-features)
7. [User Roles & Permissions](#7-user-roles--permissions)
8. [API Documentation](#8-api-documentation)
9. [Integrations](#9-integrations)
10. [Security & Compliance](#10-security--compliance)
11. [User Experience](#11-user-experience)
12. [Development & Deployment](#12-development--deployment)
13. [Future Roadmap](#13-future-roadmap)

---

## 1. Executive Summary

### 1.1 Product Name
**Paws** - Animal Shelter Management Platform

### 1.2 Vision
To create a comprehensive digital platform that streamlines animal shelter operations, connects potential adopters with pets in need, and facilitates community support through donations and engagement.

### 1.3 Mission
Simplify the pet adoption process, increase adoption rates through data-driven insights, and provide shelter administrators with powerful management tools to run efficient and compassionate operations.

### 1.4 Target Users
- **Primary Users:**
  - Animal shelter administrators and staff
  - Potential pet adopters
  - Shelter donors and supporters

- **Secondary Users:**
  - Shelter volunteers
  - Community members seeking information

### 1.5 Key Value Propositions
- **For Adopters:** Streamlined search and application process with comprehensive pet information
- **For Shelters:** Complete management suite with ML-powered adoption predictions
- **For Donors:** Secure and transparent donation system with Stripe integration
- **For Administrators:** Real-time analytics and data-driven decision-making tools

---

## 2. Product Overview

### 2.1 Product Description
Paws is a full-stack web application that serves as a complete digital solution for animal shelters. It combines:
- Public-facing pet adoption platform
- Secure donation processing
- Comprehensive administrative dashboard
- ML-powered adoption forecasting
- Communication and meeting scheduling tools

### 2.2 Core Objectives
1. **Increase Adoption Rates:** Make it easier for people to find and adopt pets
2. **Improve Efficiency:** Automate administrative tasks and workflows
3. **Enhance Transparency:** Provide clear information about pets and adoption processes
4. **Predict Trends:** Use ML to forecast adoption patterns and optimize operations
5. **Secure Funding:** Facilitate easy and secure donations

### 2.3 Success Metrics
- Number of successful adoptions per month
- Time from pet listing to adoption
- User application completion rate
- Total donation amount
- Admin time saved on manual tasks
- User satisfaction scores
- Prediction accuracy of ML models

---

## 3. Tech Stack

### 3.1 Frontend Stack
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.0.0 | UI Framework |
| Vite | 6.2.0 | Build Tool & Dev Server |
| React Router DOM | 6.30.0 | Client-side Routing |
| Zustand | 5.0.3 | State Management |
| Tailwind CSS | 3.4.17 | Styling Framework |
| Framer Motion | 12.6.2 | Animations |
| Recharts | 3.3.0 | Data Visualization |
| Axios | 1.8.4 | HTTP Client |
| Stripe.js | 7.2.0 | Payment Integration |
| React Hot Toast | 2.5.2 | Notifications |
| Lucide React | - | Icons |

### 3.2 Backend Stack
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | - | Runtime Environment |
| Express.js | 4.21.2 | Web Framework |
| PostgreSQL | 15-alpine | Relational Database |
| MongoDB | - | Document Database |
| JWT | 9.0.2 | Authentication |
| bcryptjs | 3.0.2 | Password Hashing |
| Stripe | 18.1.0 | Payment Processing |
| Multer | 2.0.2 | File Upload |
| Mailtrap | 4.0.0 | Email Service |
| Swagger | - | API Documentation |
| Nodemon | 3.1.9 | Development Hot Reload |

### 3.3 ML Service Stack
| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.x | Programming Language |
| Flask | 3.0.0 | Web Framework |
| pandas | 2.1.4 | Data Manipulation |
| numpy | 1.26.2 | Numerical Computing |
| statsmodels | 0.14.1 | Statistical Modeling |
| scipy | 1.11.4 | Scientific Computing |
| flask-cors | 4.0.0 | CORS Support |

### 3.4 DevOps
- **Containerization:** Docker & Docker Compose
- **Version Control:** Git
- **API Testing:** Swagger UI
- **Payment Testing:** Stripe CLI

---

## 4. System Architecture

### 4.1 High-Level Architecture
```
┌─────────────────────────────────────────────────────────┐
│                     Frontend Layer                       │
│              React SPA (Port 5173)                       │
│     (Vite Dev Server / Production Build)                │
└─────────────────┬───────────────────────────────────────┘
                  │ HTTP/HTTPS
                  │ REST API Calls
                  ▼
┌─────────────────────────────────────────────────────────┐
│                   Backend Layer                          │
│              Express.js API (Port 5000)                  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Controllers  │  Routes  │  Middleware  │  Utils  │  │
│  └──────────────────────────────────────────────────┘  │
└───┬─────────┬────────────┬──────────────┬──────────────┘
    │         │            │              │
    │         │            │              │
    ▼         ▼            ▼              ▼
┌────────┐ ┌─────────┐ ┌────────┐  ┌──────────────┐
│ PostgreSQL│ │ MongoDB │ │ Stripe │  │ ML Service   │
│ (Pets)  │ │ (Users) │ │  API   │  │ Flask (5001) │
│ Port    │ │ Atlas   │ └────────┘  └──────────────┘
│ 5432    │ │         │
└────────┘ └─────────┘

External Services:
- Mailtrap (Email)
- Stripe (Payments)
```

### 4.2 Data Flow

**Adoption Application Flow:**
```
User → Frontend → Backend API → MongoDB (Save Application)
                              → PostgreSQL (Update Pet Status)
                              → Email Service (Notification)
```

**Donation Flow:**
```
User → Frontend → Backend → Stripe API (Create Session)
                          ← Session URL
User → Stripe Checkout → Payment
Stripe → Webhook → Backend → MongoDB (Update Donation)
                            → Email Service (Confirmation)
```

**ML Prediction Flow:**
```
Admin → Frontend → Backend → ML Service (Flask)
                            → MongoDB (Fetch Historical Data)
                            → Python Models (SARIMA/ETS)
                            ← Predictions
                  ← JSON Response
Admin Dashboard ← Visualization (Recharts)
```

### 4.3 Microservices Architecture
1. **Main API Service** (Node.js/Express) - Port 5000
2. **ML Prediction Service** (Python/Flask) - Port 5001
3. **Frontend Service** (React/Vite) - Port 5173
4. **PostgreSQL Database** - Port 5432
5. **MongoDB Database** - Cloud Atlas
6. **Stripe Webhook Listener** - Via Stripe CLI

---

## 5. Database Design

### 5.1 PostgreSQL Schema (Relational Data)

#### Pets Table
```sql
CREATE TABLE pets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    breed VARCHAR(100),
    age_category VARCHAR(50),
    gender VARCHAR(20),
    size VARCHAR(50),
    color VARCHAR(50),
    coat VARCHAR(50),
    fee DECIMAL(10, 2),
    description TEXT,
    health_status TEXT,
    story TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    adoption_status VARCHAR(50) DEFAULT 'available',
    location_address VARCHAR(255),
    location_city VARCHAR(100),
    location_country VARCHAR(100),
    zip_code VARCHAR(20),
    shelter_contact_email VARCHAR(255),
    shelter_contact_phone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pets_type ON pets(type);
CREATE INDEX idx_pets_available ON pets(is_available);
CREATE INDEX idx_pets_city ON pets(location_city);
CREATE INDEX idx_pets_status ON pets(adoption_status);
```

**Adoption Status Values:**
- `available` - Pet is available for adoption
- `pending` - Application submitted, under review
- `in_review` - Meeting scheduled/completed, final review
- `adopted` - Pet has been adopted
- `unavailable` - Temporarily unavailable

#### Pet Photos Table
```sql
CREATE TABLE pet_photos (
    id SERIAL PRIMARY KEY,
    pet_id INTEGER REFERENCES pets(id) ON DELETE CASCADE,
    photo_data BYTEA,
    photo_name VARCHAR(255),
    content_type VARCHAR(50),
    photo_url TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pet_photos_pet_id ON pet_photos(pet_id);
```

#### Pet Traits Table
```sql
CREATE TABLE pet_traits (
    id SERIAL PRIMARY KEY,
    pet_id INTEGER REFERENCES pets(id) ON DELETE CASCADE,
    trait VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pet_traits_pet_id ON pet_traits(pet_id);
```

#### Database Triggers
```sql
-- Auto-update is_available based on adoption_status
CREATE OR REPLACE FUNCTION update_pet_availability()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.adoption_status = 'available' THEN
        NEW.is_available := TRUE;
    ELSE
        NEW.is_available := FALSE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_availability
BEFORE INSERT OR UPDATE ON pets
FOR EACH ROW
EXECUTE FUNCTION update_pet_availability();
```

### 5.2 MongoDB Schema (Document Data)

#### Users Collection
```javascript
{
  _id: ObjectId,
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    // Hashed with bcryptjs, never returned in queries
  },
  name: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    default: null
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  resetPasswordToken: String,
  resetPasswordExpiresAt: Date,
  verificationToken: String,
  verificationTokenExpiresAt: Date,
  createdAt: Date,
  updatedAt: Date
}

// Indexes
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ verificationToken: 1 })
db.users.createIndex({ resetPasswordToken: 1 })
```

#### Adoptions Collection
```javascript
{
  _id: ObjectId,
  user: {
    type: ObjectId,
    ref: 'User',
    required: true
  },
  petId: {
    type: Number,
    required: true
  },
  petName: String,
  petType: String,
  petBreed: String,
  status: {
    type: String,
    enum: ['pending', 'in_review', 'approved', 'rejected'],
    default: 'pending'
  },
  applicationDate: {
    type: Date,
    default: Date.now
  },

  // Application Form Data
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: String,
  city: String,
  postalCode: String,

  livingArrangement: String,
  housingType: String,
  hasYard: String,
  hasChildren: Boolean,
  hasOtherPets: Boolean,
  otherPetsDetails: String,
  previousPetExperience: String,
  adoptionReason: String,
  message: String,

  // Admin Fields
  notes: String,
  adminNotes: String,

  createdAt: Date,
  updatedAt: Date
}

// Indexes
db.adoptions.createIndex({ user: 1 })
db.adoptions.createIndex({ petId: 1 })
db.adoptions.createIndex({ status: 1 })
db.adoptions.createIndex({ applicationDate: -1 })
db.adoptions.createIndex({ user: 1, petId: 1 })
```

#### Donations Collection
```javascript
{
  _id: ObjectId,
  user: {
    type: ObjectId,
    ref: 'User',
    required: false
  },
  email: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'eur'
  },
  stripeSessionId: {
    type: String,
    unique: true,
    sparse: true
  },
  paymentIntentId: String,
  status: {
    type: String,
    enum: ['pending', 'completed', 'canceled', 'failed'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
}

// Indexes
db.donations.createIndex({ user: 1 })
db.donations.createIndex({ stripeSessionId: 1 }, { unique: true, sparse: true })
db.donations.createIndex({ status: 1 })
db.donations.createIndex({ createdAt: -1 })
```

#### Messages Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true,
    maxlength: 1800
  },
  read: {
    type: Boolean,
    default: false
  },
  userId: {
    type: ObjectId,
    ref: 'User'
  },
  createdAt: Date,
  updatedAt: Date
}

// Indexes
db.messages.createIndex({ userId: 1 })
db.messages.createIndex({ read: 1 })
db.messages.createIndex({ createdAt: -1 })
```

#### Scheduled Meetings Collection
```javascript
{
  _id: ObjectId,
  adoptionId: {
    type: ObjectId,
    ref: 'Adoption',
    required: true
  },
  userId: {
    type: ObjectId,
    ref: 'User',
    required: true
  },
  petId: {
    type: Number,
    required: true
  },
  petName: String,
  scheduledDate: {
    type: Date,
    required: true
  },
  scheduledTime: {
    type: String,
    required: true
  },
  location: String,
  notes: String,
  adminMessage: String,
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  responseDate: Date,
  createdAt: Date,
  updatedAt: Date
}

// Indexes
db.scheduledMeetings.createIndex({ adoptionId: 1 })
db.scheduledMeetings.createIndex({ userId: 1 })
db.scheduledMeetings.createIndex({ status: 1 })
db.scheduledMeetings.createIndex({ scheduledDate: 1 })
```

### 5.3 Data Relationships

```
Users (MongoDB)
  ├── 1:N → Adoptions (MongoDB)
  ├── 1:N → Donations (MongoDB)
  ├── 1:N → Messages (MongoDB)
  └── 1:N → Scheduled Meetings (MongoDB)

Pets (PostgreSQL)
  ├── 1:N → Pet Photos (PostgreSQL)
  ├── 1:N → Pet Traits (PostgreSQL)
  └── 1:N → Adoptions (MongoDB) [via petId reference]

Adoptions (MongoDB)
  └── 1:1 → Scheduled Meeting (MongoDB)
```

---

## 6. Core Features

### 6.1 User Authentication & Authorization

#### 6.1.1 Registration & Login
**User Stories:**
- As a new user, I want to register with email and password so that I can access the platform
- As a registered user, I want to log in securely to access my account
- As a user, I want to verify my email to ensure account security

**Requirements:**
- Email-based registration with password strength validation
- Email verification with time-limited tokens (24 hours)
- Secure password hashing using bcryptjs (10 rounds)
- JWT-based authentication with HTTP-only cookies
- Session persistence across browser sessions
- "Remember me" functionality

**Technical Implementation:**
- JWT tokens stored in HTTP-only cookies (7-day expiration)
- Verification emails sent via Mailtrap
- Password requirements: minimum 6 characters
- Email uniqueness validation
- Automatic login after successful verification

**Endpoints:**
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/verify-email` - Email verification
- `GET /api/auth/check-auth` - Check authentication status

#### 6.1.2 Password Management
**User Stories:**
- As a user, I want to reset my password if I forget it
- As a user, I want to receive a secure reset link via email

**Requirements:**
- Password reset flow with email verification
- Time-limited reset tokens (1 hour expiration)
- Secure token generation with crypto
- Password update with re-hashing
- Automatic token cleanup after use

**Endpoints:**
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password/:token` - Reset password with token

#### 6.1.3 Role-Based Access Control (RBAC)
**User Roles:**

1. **Regular User:**
   - Browse and search pets
   - Submit adoption applications
   - Make donations
   - Send messages
   - View own profile and history
   - Respond to meeting invitations

2. **Admin:**
   - All user permissions, plus:
   - Access admin dashboard
   - Manage pets (CRUD operations)
   - Review and approve/reject adoptions
   - Manage donations
   - Schedule meetings
   - View all users
   - Access analytics and ML predictions
   - Manage messages
   - View comprehensive statistics

**Middleware:**
- `verifyToken` - Validates JWT token
- `isAdmin` - Enforces admin-only access (throws error if not admin)
- `checkIfAdmin` - Checks admin status (returns boolean, doesn't block)

---

### 6.2 Pet Management System

#### 6.2.1 Pet Browsing & Search (User-Facing)

**User Stories:**
- As a potential adopter, I want to browse available pets to find my perfect match
- As a user, I want to filter pets by various criteria to narrow my search
- As a user, I want to see detailed information about a pet before applying

**Features:**
1. **Advanced Search & Filtering**
   - Text search by name, breed, description
   - Filter by:
     - Pet type (dog, cat, bird, rabbit, other)
     - Gender (male, female)
     - Age category (puppy/kitten, young, adult, senior)
     - Size (small, medium, large, extra large)
     - Color
     - Location/zip code
   - Real-time autocomplete suggestions
   - Debounced search (300ms delay)

2. **Pet Listings**
   - Grid layout with responsive cards
   - Primary photo display
   - Key details: name, type, breed, age, gender
   - Adoption fee
   - "View Details" and "Apply to Adopt" actions
   - Only shows available pets to regular users

3. **Pet Detail View**
   - Photo gallery with multiple images
   - Complete pet information:
     - Physical characteristics (size, color, coat)
     - Health status
     - Pet story/background
     - Personality traits (tags)
     - Location and contact information
   - Similar pet recommendations
   - Direct adoption application button
   - Social sharing options

4. **Similar Pets Feature**
   - Algorithm considers: same type, similar size, same location
   - Helps users discover alternatives
   - Displays up to 4 similar pets

**Technical Implementation:**
- PostgreSQL full-text search
- Indexed queries for performance
- Pagination support
- Image optimization
- Lazy loading for images

**Endpoints:**
- `GET /api/pets` - Get all available pets with filters
- `GET /api/pets/search` - Advanced search with autocomplete
- `GET /api/pets/suggestions` - Search suggestions
- `GET /api/pets/:id` - Get single pet details
- `GET /api/pets/:id/similar` - Get similar pets

#### 6.2.2 Pet Management (Admin)

**User Stories:**
- As an admin, I want to add new pets to the system
- As an admin, I want to update pet information as needed
- As an admin, I want to upload multiple photos for each pet
- As an admin, I want to manage pet availability status

**Features:**
1. **Pet CRUD Operations**
   - Create new pet listings
   - Edit existing pet information
   - Delete pets (cascades to photos and traits)
   - Bulk operations support

2. **Photo Management**
   - Upload multiple photos per pet
   - Set primary photo
   - Photos stored as binary data (BYTEA) in PostgreSQL
   - Support for JPEG, PNG formats
   - Automatic content-type detection
   - Delete individual photos

3. **Trait Management**
   - Add/remove personality traits
   - Predefined trait suggestions:
     - Good with kids
     - House-trained
     - Friendly with other pets
     - High energy
     - Calm temperament
     - Special needs
   - Custom trait input

4. **Status Management**
   - Update adoption status:
     - Available
     - Pending (application received)
     - In Review (under consideration)
     - Adopted (successful adoption)
     - Unavailable (temporarily off-market)
   - Automatic availability toggle based on status
   - Status change history tracking

5. **Admin Pet View**
   - View all pets (including unavailable)
   - Advanced filtering and sorting
   - Bulk status updates
   - Quick actions menu
   - Search functionality

**Business Logic:**
- Automatic `is_available` flag update via PostgreSQL trigger
- Prevent deletion of pets with active adoptions
- Photo cascade deletion on pet removal
- Trait cascade deletion on pet removal

**Endpoints:**
- `POST /api/pets` - Create new pet (admin only)
- `PUT /api/pets/:id` - Update pet (admin only)
- `DELETE /api/pets/:id` - Delete pet (admin only)

**Validation Rules:**
- Name: required, max 100 characters
- Type: required, valid enum value
- Fee: positive number or 0
- Photos: max 5MB per image
- Description: max 2000 characters

---

### 6.3 Adoption Application System

#### 6.3.1 Application Submission (User)

**User Stories:**
- As a potential adopter, I want to submit an adoption application for a pet I'm interested in
- As a user, I want to track the status of my applications
- As a user, I want to provide comprehensive information to increase approval chances

**Application Form Fields:**

1. **Personal Information:**
   - Full name (required)
   - Email address (required)
   - Phone number (required)
   - Address, city, postal code

2. **Housing Information:**
   - Living arrangement (own, rent, etc.)
   - Housing type (house, apartment, etc.)
   - Has yard? (yes/no/shared)
   - Has children? (boolean)
   - Has other pets? (boolean)
   - Other pets details (if applicable)

3. **Experience & Motivation:**
   - Previous pet experience (text)
   - Reason for adoption (text, required)
   - Additional message/notes

**Features:**
- Form validation with real-time feedback
- Save draft functionality (browser local storage)
- Application preview before submission
- Duplicate application prevention
- Automatic pet status update to "pending"
- Confirmation email to applicant

**Business Rules:**
- Users can only have ONE active application per pet
- Active = status is "pending" or "in_review"
- Rejected applications allow re-application after 30 days
- Approved applications are final

**User Dashboard:**
- View all my applications
- Filter by status
- Track application timeline
- View admin notes (if provided)
- Cancel pending applications

**Endpoints:**
- `POST /api/adoptions` - Submit adoption application
- `GET /api/adoptions/user` - Get user's applications
- `GET /api/adoptions/check/:petId` - Check if already applied
- `GET /api/adoptions/:id` - Get application details

#### 6.3.2 Application Review (Admin)

**User Stories:**
- As an admin, I want to review all adoption applications
- As an admin, I want to filter applications by status and pet type
- As an admin, I want to add internal notes to applications
- As an admin, I want to approve or reject applications with feedback

**Admin Dashboard Features:**

1. **Application List View:**
   - Paginated table of all applications
   - Columns: Applicant name, pet name, type, status, date
   - Filter by:
     - Status (all, pending, in_review, approved, rejected)
     - Pet type
     - Date range
   - Sort by: newest, oldest, status
   - Search by applicant name or pet name

2. **Application Detail Modal:**
   - Complete applicant information
   - Pet details with photo
   - Application form responses
   - Timeline of status changes
   - Admin notes section
   - Action buttons (approve, reject, schedule meeting)

3. **Status Management:**
   - Update application status
   - Add admin notes visible to staff
   - Add public notes visible to applicant
   - Status change triggers:
     - Email notification to applicant
     - Pet status update
     - Meeting creation (if applicable)

4. **Bulk Actions:**
   - Select multiple applications
   - Bulk status updates
   - Bulk email sending
   - Export to CSV

**Application Workflow:**

```
[User Submits] → Pending
                    ↓
              [Admin Reviews]
                    ↓
            ┌───────┴───────┐
            ↓               ↓
       In Review        Rejected
            ↓               ↓
     [Schedule Meeting]  [Pet Available]
            ↓
    [Meeting Accepted]
            ↓
      [Final Review]
            ↓
    ┌───────┴───────┐
    ↓               ↓
Approved        Rejected
    ↓               ↓
[Pet Adopted]  [Pet Available]
```

**Endpoints:**
- `GET /api/adoptions/admin` - Get all applications (admin)
- `GET /api/adoptions/admin/details/:id` - Get application details (admin)
- `PUT /api/adoptions/admin/:id` - Update application status (admin)
- `DELETE /api/adoptions/admin/:id` - Delete application (admin)
- `GET /api/adoptions/admin/user/:userId` - Get user's applications (admin)

**Validation & Business Logic:**
- Only "pending" applications can be moved to "in_review"
- Only "in_review" applications can be approved
- Approving an adoption:
  - Updates pet status to "adopted"
  - Pet becomes unavailable
  - Rejects all other pending applications for same pet
- Rejecting an adoption:
  - Returns pet to "available" (if no other pending apps)
  - Sends rejection email with reason

---

### 6.4 Donation System

#### 6.4.1 Donation Processing (User)

**User Stories:**
- As a supporter, I want to make a secure donation to the shelter
- As a donor, I want to choose my donation amount
- As a donor, I want to receive confirmation of my donation
- As a donor, I want to view my donation history

**Features:**

1. **Donation Modal:**
   - Quick-access donation button
   - Preset amounts: €5, €10, €25, €50, €100
   - Custom amount input (min €1)
   - One-time donation support
   - Guest or authenticated donation
   - Stripe-powered checkout

2. **Checkout Flow:**
   - User clicks "Donate"
   - Selects or enters amount
   - Backend creates Stripe checkout session
   - User redirected to Stripe-hosted checkout
   - Secure payment processing (PCI compliant)
   - Success/cancel redirection
   - Automatic donation record creation

3. **Donation Confirmation:**
   - Success page with donation details
   - Confirmation email
   - Receipt (via Stripe)
   - Social sharing options
   - Option to donate again

4. **Donation History:**
   - View all my donations
   - Donation date, amount, status
   - Download receipts
   - Recurring donation management (future feature)

**Payment Processing:**
- Currency: EUR (Euro)
- Payment methods: All Stripe-supported methods
  - Credit/debit cards
  - Apple Pay, Google Pay
  - SEPA Direct Debit
  - iDEAL (Netherlands)
  - More based on geography

**Technical Implementation:**
```javascript
// Frontend: Create donation
const response = await axios.post('/api/donations/create-checkout', {
  userId: user?._id,
  email: user?.email || guestEmail,
  amountInCents: amount * 100
});

// Backend: Create Stripe session
const session = await stripe.checkout.sessions.create({
  customer_email: email,
  line_items: [{
    price_data: {
      currency: 'eur',
      product_data: { name: 'Donation to Paws Animal Shelter' },
      unit_amount: amountInCents
    },
    quantity: 1
  }],
  mode: 'payment',
  success_url: `${CLIENT_URL}/donation-success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${CLIENT_URL}/?donation=canceled`,
  expires_at: Math.floor(Date.now() / 1000) + 1800 // 30 minutes
});

// Webhook: Confirm payment
stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
// Update donation status to 'completed'
```

**Endpoints:**
- `POST /api/donations/create-checkout` - Create Stripe checkout session
- `POST /api/donations/webhook` - Stripe webhook handler
- `GET /api/donations/user` - Get user's donations
- `GET /api/donations/verify/:sessionId` - Verify donation completion

#### 6.4.2 Donation Management (Admin)

**User Stories:**
- As an admin, I want to view all donations
- As an admin, I want to track donation statistics
- As an admin, I want to filter and search donations
- As an admin, I want to handle refunds and cancellations

**Admin Features:**

1. **Donation Dashboard:**
   - Two-column layout:
     - Left: User list with donation counts
     - Right: Donation table for selected user or all
   - Real-time donation statistics:
     - Total donations (all time)
     - Total amount donated
     - Average donation amount
     - Donations this month
     - Donations this week
     - Completed vs pending ratio

2. **Donation Table:**
   - Columns: Donor, amount, status, date, Stripe ID
   - Pagination (10, 25, 50, 100 per page)
   - Filter by:
     - Status (all, completed, pending, canceled, failed)
     - Date range
     - User
   - Sort by: date, amount, status
   - Search by donor name/email

3. **Donation Actions:**
   - View donation details
   - Edit donation (amount, status, date)
   - Delete donation (with confirmation)
   - Copy Stripe session ID
   - View Stripe payment details
   - Issue refund (via Stripe)
   - Export to CSV

4. **Donation Analytics:**
   - Monthly donation trends (chart)
   - Top donors list
   - Donation source breakdown
   - Average donation by campaign
   - Goal tracking and progress

5. **Session Management:**
   - Cleanup abandoned sessions (auto-run daily)
   - Sessions older than 30 minutes and pending → mark as canceled
   - Prevent database bloat from incomplete checkouts

**Endpoints:**
- `GET /api/donations/admin` - Get all donations with pagination (admin)
- `GET /api/donations/admin/user/:userId` - Get user donations (admin)
- `PUT /api/donations/admin/:id` - Update donation (admin)
- `DELETE /api/donations/admin/:id` - Delete donation (admin)
- `GET /api/donations/admin/cleanup-abandoned` - Cleanup old sessions (admin)

**Business Logic:**
- Donations are immutable once completed
- Edits only allowed on pending/failed donations
- Refunds update status to 'canceled'
- Webhook is source of truth for payment status
- Anonymous donations allowed (no userId)

**Webhook Events Handled:**
- `checkout.session.completed` - Payment successful
- `checkout.session.expired` - Session expired without payment

---

### 6.5 Scheduled Meetings System

#### 6.5.1 Meeting Scheduling (Admin)

**User Stories:**
- As an admin, I want to schedule in-person meetings with adoption applicants
- As an admin, I want to provide meeting details (date, time, location)
- As an admin, I want to add notes and instructions for the applicant

**Features:**

1. **Schedule New Meeting:**
   - Select adoption application
   - Choose date (date picker)
   - Select time (dropdown or time picker)
   - Specify location (text input with suggestions)
   - Add admin notes (internal)
   - Add message to applicant (visible to user)
   - Send notification email

2. **Meeting Details:**
   - Adoption details (pet, applicant)
   - Scheduled date and time
   - Location with map link
   - Admin notes
   - Applicant message
   - Status (pending, accepted, rejected)
   - Response tracking

3. **Meeting Management:**
   - View all scheduled meetings
   - Filter by:
     - Status (all, pending, accepted, rejected)
     - Date range
     - Pet type
   - Update meeting details
   - Reschedule meetings
   - Cancel meetings
   - Delete meetings

4. **Meeting Actions:**
   - Edit meeting time/location
   - Send reminder email
   - Mark as completed
   - Add follow-up notes

**Business Rules:**
- Only "pending" adoptions can have meetings scheduled
- One active meeting per adoption
- Accepting a meeting moves adoption to "in_review"
- Rejecting a meeting moves adoption to "rejected"
- Meeting date must be in the future
- Location is required

**Endpoints:**
- `POST /api/meetings/admin/schedule` - Schedule meeting (admin)
- `GET /api/meetings/admin` - Get all meetings (admin)
- `GET /api/meetings/admin/:id` - Get meeting details (admin)
- `PUT /api/meetings/admin/:id` - Update meeting (admin)
- `DELETE /api/meetings/admin/:id` - Delete meeting (admin)

#### 6.5.2 Meeting Response (User)

**User Stories:**
- As an applicant, I want to see my scheduled meetings
- As an applicant, I want to accept or reject a meeting invitation
- As an applicant, I want to receive meeting reminders

**Features:**

1. **Meeting Invitations:**
   - Email notification with meeting details
   - In-app notification badge
   - Meeting card with details:
     - Pet name and photo
     - Date and time
     - Location with directions link
     - Admin message
     - Accept/Reject buttons

2. **Meeting Response:**
   - Accept meeting:
     - Confirms attendance
     - Moves adoption to "in_review"
     - Sends confirmation email
     - Pet remains unavailable
   - Reject meeting:
     - Declines invitation
     - Moves adoption to "rejected"
     - Pet returns to "available"
     - Option to provide reason

3. **Meeting Calendar:**
   - View all my meetings
   - Filter by status
   - Upcoming meetings highlighted
   - Add to calendar (iCal export)
   - Meeting reminders (24 hours, 1 hour before)

**Endpoints:**
- `GET /api/meetings/user` - Get user's meetings
- `PUT /api/meetings/:id/respond` - Accept or reject meeting

**Automated Actions:**
```javascript
// When user accepts meeting:
- Meeting status → 'accepted'
- Adoption status → 'in_review'
- Pet status → remains 'pending'
- Send confirmation email
- Set response date

// When user rejects meeting:
- Meeting status → 'rejected'
- Adoption status → 'rejected'
- Pet status → 'available' (if no other pending applications)
- Send notification to admin
- Set response date
```

---

### 6.6 Messaging System

#### 6.6.1 Contact Form (User)

**User Stories:**
- As a visitor, I want to send a message to the shelter
- As a user, I want to ask questions about pets or adoption process
- As a user, I want to receive a response to my inquiry

**Features:**

1. **Contact Form:**
   - Fields: name, email, message (required)
   - Character limit: 1800 characters
   - Real-time character counter
   - Form validation
   - Rate limiting (prevent spam)
   - Guest or authenticated submission

2. **Message Types:**
   - General inquiries
   - Pet-specific questions
   - Adoption process questions
   - Donation questions
   - Feedback and suggestions
   - Bug reports

3. **Confirmation:**
   - Success message after submission
   - Auto-reply email confirming receipt
   - Expected response time notification
   - Reference number for tracking

**Endpoints:**
- `POST /api/messages` - Create new message

#### 6.6.2 Inbox Management (Admin)

**User Stories:**
- As an admin, I want to view all incoming messages
- As an admin, I want to mark messages as read/unread
- As an admin, I want to reply to messages via email
- As an admin, I want to search and filter messages

**Features:**

1. **Message Inbox:**
   - List of all messages
   - Unread message counter (badge)
   - Message preview
   - Sender information
   - Timestamp
   - Read/unread indicator
   - Quick actions menu

2. **Message Details:**
   - Full message content
   - Sender details (name, email)
   - User profile link (if registered)
   - Timestamp
   - Read status
   - Message history (if repeat sender)

3. **Message Actions:**
   - Mark as read/unread
   - Reply via email
   - Delete message
   - Archive message (future)
   - Flag as spam (future)
   - Assign to team member (future)

4. **Inbox Filters:**
   - All messages
   - Unread only
   - Read only
   - By date range
   - By sender
   - Search message content

5. **Reply System:**
   - Email reply interface
   - Template responses (saved replies)
   - Signature inclusion
   - CC/BCC options
   - Attachment support

**Endpoints:**
- `GET /api/messages/admin` - Get all messages (admin)
- `GET /api/messages/admin/user/:userId` - Get user's messages (admin)
- `PUT /api/messages/admin/:id/read` - Mark as read (admin)
- `DELETE /api/messages/admin/:id` - Delete message (admin)
- `POST /api/messages/admin/reply` - Reply to message (admin)

**Business Logic:**
- Messages from authenticated users link to user profile
- Anonymous messages store email only
- Auto-mark as read when viewed
- Delete permanently (no soft delete)
- Reply sends email via Mailtrap

---

### 6.7 ML-Powered Adoption Predictions

#### 6.7.1 Prediction System Architecture

**Overview:**
The ML prediction system is a microservice built with Python Flask that provides adoption forecasting using advanced statistical models. It helps shelter administrators make data-driven decisions about resource allocation, marketing campaigns, and capacity planning.

**Technology Stack:**
- **Flask:** Lightweight web framework
- **pandas:** Data manipulation and analysis
- **statsmodels:** Time series forecasting (SARIMA, Exponential Smoothing)
- **numpy:** Numerical computations
- **scipy:** Scientific computing

**Models Used:**

1. **Exponential Smoothing (ETS):**
   - Simple, fast, suitable for shorter time series
   - Captures trend and seasonality
   - Used as fallback if SARIMA fails

2. **SARIMA (Seasonal AutoRegressive Integrated Moving Average):**
   - Advanced time series model
   - Handles seasonality, trends, and autocorrelation
   - More accurate for longer time series
   - Parameters: (1,1,1) x (1,1,1,7) for weekly seasonality

**Prediction Views:**

1. **Daily View:**
   - Forecasts next 30 days
   - Requires: minimum 7 approved adoptions
   - Best for: short-term planning, daily operations

2. **Weekly View:**
   - Forecasts next 12 weeks
   - Aggregates daily data into weeks
   - Best for: medium-term planning, campaign scheduling

3. **Monthly View:**
   - Forecasts next 3 months
   - Aggregates daily data into months
   - Best for: long-term planning, budget forecasting

#### 6.7.2 Prediction Features (Admin)

**User Stories:**
- As an admin, I want to predict future adoption trends
- As an admin, I want to filter predictions by pet type
- As an admin, I want to view historical vs predicted data
- As an admin, I want to understand trend directions

**Dashboard Features:**

1. **Prediction Controls:**
   - View mode selector (Daily, Weekly, Monthly)
   - Pet type filter (All, Dogs, Cats, Birds, Rabbits, Other)
   - Date range selector
   - Refresh predictions button
   - Export predictions (CSV, PDF)

2. **Visualizations:**
   - Line chart with dual series:
     - Historical data (blue line)
     - Predicted data (red line)
   - Chart features:
     - Interactive tooltips
     - Zoom and pan
     - Responsive design
     - Grid lines for readability
     - Legend
   - Recharts library integration

3. **Statistical Insights:**
   - Historical average adoptions
   - Predicted average adoptions
   - Expected total adoptions (forecast period)
   - Trend analysis:
     - Increasing / Decreasing / Stable
     - Percentage change
   - Confidence intervals (future enhancement)

4. **Prediction Cards:**
   - Total predicted adoptions
   - Comparison to historical average
   - Peak adoption periods
   - Recommendations based on trends

**Data Requirements:**

```javascript
// Minimum data requirements
Daily View: {
  minAdoptions: 7,
  minTimeSpan: "2 weeks"
}

Weekly View: {
  minAdoptions: 7,
  minTimeSpan: "8 weeks"
}

Monthly View: {
  minAdoptions: 7,
  minTimeSpan: "3 months"
}
```

**Prediction Algorithm Flow:**

```python
# 1. Fetch historical adoption data from MongoDB
historical_data = fetch_adoptions(filters)

# 2. Aggregate by time period (daily/weekly/monthly)
time_series = aggregate_data(historical_data, view_mode)

# 3. Prepare data for modeling
dates, values = prepare_time_series(time_series)

# 4. Train SARIMA model
try:
    model = SARIMAX(values, order=(1,1,1), seasonal_order=(1,1,1,7))
    fitted_model = model.fit()
    predictions = fitted_model.forecast(steps=forecast_steps)
except:
    # Fallback to Exponential Smoothing
    model = ExponentialSmoothing(values, seasonal='add', seasonal_periods=7)
    fitted_model = model.fit()
    predictions = fitted_model.forecast(steps=forecast_steps)

# 5. Generate future dates
future_dates = generate_future_dates(last_date, forecast_steps, view_mode)

# 6. Calculate statistics
stats = {
    'historicalAvg': mean(values),
    'predictedAvg': mean(predictions),
    'totalPredicted': sum(predictions),
    'trend': calculate_trend(values, predictions)
}

# 7. Return results
return {
    'historical': [{'date': d, 'adoptions': v} for d, v in zip(dates, values)],
    'predictions': [{'date': d, 'adoptions': v} for d, v in zip(future_dates, predictions)],
    'stats': stats
}
```

**Endpoints:**
- `POST /api/predictions/adoptions` - Generate adoption predictions
- `GET /api/ml/health` - ML service health check

**Request Format:**
```javascript
POST /api/predictions/adoptions
{
  "viewMode": "daily", // or "weekly", "monthly"
  "petType": "all"     // or "dog", "cat", "bird", "rabbit", "other"
}
```

**Response Format:**
```javascript
{
  "success": true,
  "data": {
    "historical": [
      { "date": "2024-01-01", "adoptions": 5 },
      { "date": "2024-01-02", "adoptions": 3 },
      ...
    ],
    "predictions": [
      { "date": "2024-02-01", "adoptions": 4.2 },
      { "date": "2024-02-02", "adoptions": 5.1 },
      ...
    ],
    "stats": {
      "historicalAverage": 4.5,
      "predictedAverage": 4.8,
      "expectedTotal": 144,
      "trend": "increasing",
      "trendPercentage": 6.7
    }
  }
}
```

**Error Handling:**
- Insufficient data: Returns user-friendly message
- ML service unavailable: Graceful fallback
- Invalid parameters: Validation errors
- Model fitting failures: Automatic fallback to simpler model

**Business Value:**
- **Resource Planning:** Predict busy periods to allocate staff
- **Marketing Optimization:** Time campaigns during predicted slow periods
- **Inventory Management:** Prepare supplies based on forecasted adoptions
- **Financial Forecasting:** Estimate adoption fee revenue
- **Capacity Planning:** Understand shelter capacity needs

---

### 6.8 User Profile Management

#### 6.8.1 Profile Features

**User Stories:**
- As a user, I want to view and edit my profile information
- As a user, I want to upload a profile picture
- As a user, I want to see my adoption history
- As a user, I want to see my donation history

**Profile Sections:**

1. **Personal Information:**
   - Name (editable)
   - Email (editable, must remain unique)
   - Avatar/profile picture
   - Account creation date
   - Last login date
   - Email verification status

2. **Avatar Management:**
   - Upload profile picture
   - Supported formats: JPEG, PNG, GIF
   - Maximum file size: 5MB
   - Automatic resizing (future)
   - Default avatar if none uploaded
   - Delete current avatar

3. **Activity Dashboard:**
   - Adoption applications summary
   - Donation history summary
   - Scheduled meetings summary
   - Messages sent summary

4. **Detailed History Tabs:**

   **a) Adoption History:**
   - List of all adoption applications
   - Status badges (color-coded)
   - Pet information with photos
   - Application date
   - Current status
   - View full application details
   - Download application PDF (future)

   **b) Donation History:**
   - List of all donations
   - Amount and date
   - Payment status
   - Stripe receipt links
   - Total donations amount
   - Tax receipt download (future)

   **c) Meetings:**
   - Upcoming meetings highlighted
   - Past meetings history
   - Meeting details (date, time, location)
   - Status (pending, accepted, rejected)
   - Quick accept/reject actions

   **d) Messages:**
   - Sent messages history
   - Message status (read/replied)
   - Admin responses
   - Send new message button

5. **Account Settings:**
   - Change password
   - Email preferences (future)
   - Notification settings (future)
   - Privacy settings (future)
   - Delete account (future)

**Endpoints:**
- `GET /api/users/profile` - Get own profile
- `PUT /api/users/profile` - Update profile
- `POST /api/users/avatar` - Upload avatar

**Avatar Upload Implementation:**
```javascript
// Frontend: File upload
const formData = new FormData();
formData.append('avatar', file);

const response = await axios.post('/api/users/avatar', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
  withCredentials: true
});

// Backend: Multer handling
const storage = multer.diskStorage({
  destination: './uploads/avatars/',
  filename: (req, file, cb) => {
    const uniqueName = `${req.userId}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const isValid = allowedTypes.test(file.mimetype);
    cb(null, isValid);
  }
});

// Delete old avatar before saving new one
if (user.avatar) {
  fs.unlinkSync(path.join(__dirname, '..', user.avatar));
}

user.avatar = `/uploads/avatars/${file.filename}`;
await user.save();
```

---

### 6.9 Admin Dashboard

#### 6.9.1 Dashboard Overview

**User Stories:**
- As an admin, I want a centralized dashboard to manage all shelter operations
- As an admin, I want to see key metrics at a glance
- As an admin, I want quick access to all management sections

**Dashboard Layout:**

1. **Header:**
   - Shelter logo and name
   - Admin user profile dropdown
   - Notification badges
   - Quick actions menu
   - Logout button

2. **Sidebar Navigation:**
   - Statistics (overview & predictions)
   - Pets Management
   - Adoptions Management
   - Meetings Management
   - Users Management
   - Messages (Inbox)
   - Settings
   - Mobile-responsive (hamburger menu)

3. **Statistics Overview (Landing Page):**

   **Key Metrics Cards:**
   - Total Adoptions
     - Count with status breakdown
     - Approval rate percentage
     - Month-over-month change

   - Total Donations
     - Sum of all donations
     - Average donation amount
     - Recent donations (last 7 days)

   - Pending Applications
     - Count of applications awaiting review
     - Quick link to review

   - Available Pets
     - Count of pets ready for adoption
     - By type breakdown

   **Charts & Visualizations:**
   - Pet adoption distribution (pie chart)
   - Adoption trends over time (line chart)
   - Donation trends (bar chart)
   - Monthly statistics comparison

   **Recent Activity Feed:**
   - Latest adoptions
   - Recent donations
   - New applications
   - Unread messages

4. **Quick Actions:**
   - Add new pet
   - Review pending applications
   - Schedule meeting
   - View unread messages
   - Generate reports

#### 6.9.2 Management Panels

Each management panel follows consistent UX patterns:
- **Search bar** with real-time filtering
- **Filter dropdowns** for advanced filtering
- **Sort options** (newest, oldest, status, etc.)
- **Pagination** with items-per-page selector
- **Bulk actions** with multi-select
- **Quick actions** menu (view, edit, delete)
- **Modal dialogs** for details and forms
- **Confirmation dialogs** for destructive actions
- **Export options** (CSV, PDF future)

**Responsive Design:**
- Desktop: Full table view with all columns
- Tablet: Condensed table with essential columns
- Mobile: Card-based layout

---

## 7. User Roles & Permissions

### 7.1 Permission Matrix

| Feature | Public | User | Admin |
|---------|--------|------|-------|
| **Authentication** |
| Sign up / Log in | ✅ | ✅ | ✅ |
| Email verification | ✅ | ✅ | ✅ |
| Password reset | ✅ | ✅ | ✅ |
| **Pets** |
| Browse available pets | ✅ | ✅ | ✅ |
| Search & filter pets | ✅ | ✅ | ✅ |
| View pet details | ✅ | ✅ | ✅ |
| View unavailable pets | ❌ | ❌ | ✅ |
| Create pet | ❌ | ❌ | ✅ |
| Update pet | ❌ | ❌ | ✅ |
| Delete pet | ❌ | ❌ | ✅ |
| Upload pet photos | ❌ | ❌ | ✅ |
| Manage pet traits | ❌ | ❌ | ✅ |
| **Adoptions** |
| Submit application | ❌ | ✅ | ✅ |
| View own applications | ❌ | ✅ | ✅ |
| Cancel own application | ❌ | ✅ | ✅ |
| View all applications | ❌ | ❌ | ✅ |
| Approve/reject applications | ❌ | ❌ | ✅ |
| Add admin notes | ❌ | ❌ | ✅ |
| Delete applications | ❌ | ❌ | ✅ |
| **Donations** |
| Make donation | ✅ | ✅ | ✅ |
| View own donations | ❌ | ✅ | ✅ |
| View all donations | ❌ | ❌ | ✅ |
| Edit donations | ❌ | ❌ | ✅ |
| Delete donations | ❌ | ❌ | ✅ |
| View donation statistics | ❌ | ❌ | ✅ |
| **Meetings** |
| View own meetings | ❌ | ✅ | ✅ |
| Accept/reject meetings | ❌ | ✅ | ✅ |
| Schedule meetings | ❌ | ❌ | ✅ |
| View all meetings | ❌ | ❌ | ✅ |
| Update meetings | ❌ | ❌ | ✅ |
| Delete meetings | ❌ | ❌ | ✅ |
| **Messages** |
| Send message | ✅ | ✅ | ✅ |
| View own messages | ❌ | ✅ | ✅ |
| View all messages | ❌ | ❌ | ✅ |
| Mark as read/unread | ❌ | ❌ | ✅ |
| Reply to messages | ❌ | ❌ | ✅ |
| Delete messages | ❌ | ❌ | ✅ |
| **Users** |
| View own profile | ❌ | ✅ | ✅ |
| Update own profile | ❌ | ✅ | ✅ |
| Upload avatar | ❌ | ✅ | ✅ |
| View all users | ❌ | ❌ | ✅ |
| Update user admin status | ❌ | ❌ | ✅ |
| View user details | ❌ | ❌ | ✅ |
| **Analytics & Predictions** |
| View statistics dashboard | ❌ | ❌ | ✅ |
| Generate ML predictions | ❌ | ❌ | ✅ |
| Export reports | ❌ | ❌ | ✅ |

---

## 8. API Documentation

### 8.1 API Overview

**Base URL:** `http://localhost:5000/api`

**Authentication:** JWT tokens sent via HTTP-only cookies

**Response Format:** JSON

**Standard Response Structure:**
```javascript
// Success
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}

// Error
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

**HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (not authorized)
- `404` - Not Found
- `500` - Internal Server Error

### 8.2 API Routes Summary

**Full API documentation available at:** `/api-docs` (Swagger UI)

#### Authentication Routes (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/signup` | Register new user | No |
| POST | `/login` | Login user | No |
| POST | `/logout` | Logout user | Yes |
| POST | `/verify-email` | Verify email with token | No |
| POST | `/forgot-password` | Request password reset | No |
| POST | `/reset-password/:token` | Reset password | No |
| GET | `/check-auth` | Check auth status | Yes |

#### Pet Routes (`/api/pets`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get all pets with filters | No |
| GET | `/search` | Advanced search | No |
| GET | `/suggestions` | Autocomplete suggestions | No |
| GET | `/:id` | Get pet by ID | No |
| GET | `/:id/similar` | Get similar pets | No |
| POST | `/` | Create new pet | Admin |
| PUT | `/:id` | Update pet | Admin |
| DELETE | `/:id` | Delete pet | Admin |

#### Adoption Routes (`/api/adoptions`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/` | Submit application | User |
| GET | `/user` | Get user's adoptions | User |
| GET | `/check/:petId` | Check if applied | User |
| GET | `/:id` | Get adoption details | User |
| GET | `/admin` | Get all adoptions | Admin |
| GET | `/admin/user/:userId` | Get user adoptions | Admin |
| GET | `/admin/details/:id` | Get adoption details | Admin |
| PUT | `/admin/:id` | Update adoption status | Admin |
| DELETE | `/admin/:id` | Delete adoption | Admin |

#### Donation Routes (`/api/donations`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/create-checkout` | Create Stripe session | No |
| POST | `/webhook` | Stripe webhook | No (verified) |
| GET | `/user` | Get user donations | User |
| GET | `/verify/:sessionId` | Verify donation | No |
| GET | `/admin` | Get all donations | Admin |
| GET | `/admin/user/:userId` | Get user donations | Admin |
| PUT | `/admin/:id` | Update donation | Admin |
| DELETE | `/admin/:id` | Delete donation | Admin |
| GET | `/admin/cleanup-abandoned` | Cleanup sessions | Admin |

#### Message Routes (`/api/messages`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/` | Create message | No |
| GET | `/admin` | Get all messages | Admin |
| GET | `/admin/user/:userId` | Get user messages | Admin |
| PUT | `/admin/:id/read` | Mark as read | Admin |
| DELETE | `/admin/:id` | Delete message | Admin |
| POST | `/admin/reply` | Reply to message | Admin |

#### Meeting Routes (`/api/meetings`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/admin/schedule` | Schedule meeting | Admin |
| GET | `/user` | Get user meetings | User |
| GET | `/admin` | Get all meetings | Admin |
| GET | `/admin/:id` | Get meeting details | Admin |
| PUT | `/admin/:id` | Update meeting | Admin |
| PUT | `/:id/respond` | Respond to meeting | User |
| DELETE | `/admin/:id` | Delete meeting | Admin |

#### User Routes (`/api/users`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/profile` | Get own profile | User |
| PUT | `/profile` | Update profile | User |
| POST | `/avatar` | Upload avatar | User |
| GET | `/admin` | Get all users | Admin |
| GET | `/admin/:userId` | Get user by ID | Admin |
| PUT | `/admin/:userId/admin-status` | Update admin status | Admin |

#### Prediction Routes (`/api/predictions`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/adoptions` | Generate predictions | Admin |

### 8.3 Swagger Documentation

The API includes comprehensive Swagger/OpenAPI documentation:

**Access:** `http://localhost:5000/api-docs`

**Features:**
- Interactive API explorer
- Try-it-out functionality
- Request/response schemas
- Authentication testing
- Example requests
- Model schemas

**Documentation Files:**
- Route docs: `/backend/docs/routes/*.docs.js`
- Component schemas: `/backend/docs/schemas/*.docs.js`
- Swagger config: `/backend/docs/swagger.config.js`

---

## 9. Integrations

### 9.1 Stripe Payment Integration

**Purpose:** Secure payment processing for donations

**Features:**
- Hosted checkout pages (PCI compliant)
- Multiple payment methods
- Webhook integration for real-time updates
- Session-based checkout
- Automatic receipt generation

**Implementation:**
```javascript
// Environment Variables
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

// Create Checkout Session
const session = await stripe.checkout.sessions.create({
  customer_email: email,
  line_items: [{
    price_data: {
      currency: 'eur',
      product_data: {
        name: 'Donation to Paws Animal Shelter',
        description: 'One-time donation'
      },
      unit_amount: amountInCents
    },
    quantity: 1
  }],
  mode: 'payment',
  success_url: `${CLIENT_URL}/donation-success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${CLIENT_URL}/?donation=canceled`,
  expires_at: Math.floor(Date.now() / 1000) + 1800 // 30 min
});

// Webhook Handler
const event = stripe.webhooks.constructEvent(
  rawBody,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET
);

if (event.type === 'checkout.session.completed') {
  const session = event.data.object;
  await Donation.findOneAndUpdate(
    { stripeSessionId: session.id },
    {
      status: 'completed',
      paymentIntentId: session.payment_intent
    }
  );
}
```

**Testing:**
- Stripe CLI for local webhook testing
- Test mode API keys
- Test card numbers for various scenarios

**Webhook Events:**
- `checkout.session.completed` - Payment successful
- `checkout.session.expired` - Session expired

### 9.2 Mailtrap Email Service

**Purpose:** Transactional email delivery

**Email Types:**
1. **Authentication Emails:**
   - Email verification
   - Welcome email
   - Password reset

2. **Adoption Emails:**
   - Application confirmation
   - Status update notifications
   - Meeting invitations
   - Approval/rejection notifications

3. **Donation Emails:**
   - Donation confirmation
   - Tax receipts
   - Thank you messages

4. **Administrative Emails:**
   - New application alerts
   - System notifications

**Implementation:**
```javascript
import { MailtrapClient } from "mailtrap";

const client = new MailtrapClient({
  token: process.env.MAILTRAP_TOKEN
});

const sender = {
  email: process.env.MAILTRAP_SENDER_EMAIL,
  name: "Paws Animal Shelter"
};

// Send Email
await client.send({
  from: sender,
  to: [{ email: recipient.email }],
  subject: "Email Subject",
  html: emailHtmlTemplate,
  category: "Authentication" // or "Adoption", "Donation", etc.
});
```

**Email Templates:**
- HTML templates with inline CSS
- Responsive design
- Consistent branding
- Call-to-action buttons
- Unsubscribe links (future)

### 9.3 ML Service Integration

**Architecture:** Microservice communication via HTTP

**Flow:**
```
Backend API → HTTP Request → ML Service (Flask)
           ← JSON Response ←
```

**Configuration:**
```javascript
// Backend environment
ML_SERVICE_URL=http://localhost:5001

// API call
const response = await axios.post(
  `${process.env.ML_SERVICE_URL}/api/ml/predict`,
  {
    adoptions: historicalData,
    viewMode: 'daily',
    petType: 'all'
  },
  { timeout: 30000 } // 30 second timeout
);
```

**Error Handling:**
- Service unavailable fallback
- Timeout handling
- Graceful degradation
- User-friendly error messages

**Health Check:**
```javascript
GET /api/ml/health
Response: { "status": "healthy", "timestamp": "..." }
```

---

## 10. Security & Compliance

### 10.1 Authentication Security

**Password Security:**
- bcryptjs hashing with salt rounds: 10
- Minimum password length: 6 characters
- No password in API responses (excluded in queries)
- Password reset tokens expire after 1 hour
- One-time use tokens

**JWT Security:**
- HTTP-only cookies (prevents XSS attacks)
- Secure flag in production (HTTPS only)
- SameSite attribute (prevents CSRF)
- 7-day token expiration
- Refresh token rotation (future)

**Email Verification:**
- Required for account activation
- Time-limited tokens (24 hours)
- Cryptographically secure token generation
- Auto-cleanup of expired tokens

### 10.2 Authorization

**Middleware Stack:**
```javascript
// Authentication check
verifyToken(req, res, next)

// Admin authorization
isAdmin(req, res, next)

// Optional admin check
checkIfAdmin(req, res, next)
```

**Protected Routes:**
- All `/admin/*` endpoints require admin role
- User-specific endpoints check ownership
- Token validation on every protected route

### 10.3 Data Protection

**Sensitive Data:**
- Passwords: bcrypt hashed, never logged or returned
- JWT tokens: HTTP-only cookies
- Reset tokens: cryptographically random, one-time use
- User emails: validated, not shared publicly

**Input Validation:**
- Server-side validation for all inputs
- Email format validation
- File upload restrictions (type, size)
- SQL injection prevention (parameterized queries)
- NoSQL injection prevention (sanitization)
- XSS prevention (escaping user input)

**File Upload Security:**
```javascript
const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Invalid file type'));
  }
});
```

### 10.4 API Security

**CORS Configuration:**
```javascript
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

**Rate Limiting (Future):**
- Login attempts: 5 per 15 minutes
- API requests: 100 per 15 minutes per IP
- Donation creation: 3 per hour per user

**Webhook Security:**
```javascript
// Stripe webhook verification
const signature = req.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(
  rawBody,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET
);
```

### 10.5 Database Security

**PostgreSQL:**
- Parameterized queries (SQL injection prevention)
- Connection pooling with pg
- Encrypted connections in production
- Regular backups
- Least privilege access

**MongoDB:**
- Connection string encryption
- Atlas network access whitelist
- Query sanitization
- Indexed sensitive fields
- Encrypted connections (TLS)

**Backup Strategy (Future):**
- Daily automated backups
- Point-in-time recovery
- Backup encryption
- Off-site backup storage
- Disaster recovery plan

### 10.6 Compliance Considerations

**GDPR (General Data Protection Regulation):**
- User consent for data collection
- Right to access personal data
- Right to deletion (future: account deletion)
- Data portability (export features)
- Privacy policy
- Cookie consent

**PCI DSS (Payment Card Industry):**
- No storage of credit card data
- Stripe handles all payment data (PCI Level 1)
- Secure transmission (HTTPS)
- Regular security audits

**Data Retention:**
- User accounts: Until deletion requested
- Adoptions: Indefinite (historical records)
- Donations: 7 years (tax compliance)
- Messages: 1 year
- Logs: 90 days

---

## 11. User Experience

### 11.1 Design Principles

**Accessibility:**
- WCAG 2.1 Level AA compliance
- Semantic HTML elements
- ARIA labels for screen readers
- Keyboard navigation support
- Color contrast ratio ≥ 4.5:1
- Alt text for all images
- Focus indicators

**Responsive Design:**
- Mobile-first approach
- Breakpoints:
  - Mobile: < 640px
  - Tablet: 640px - 1024px
  - Desktop: > 1024px
- Touch-friendly UI (min 44x44px targets)
- Flexible layouts (CSS Grid, Flexbox)
- Responsive images

**Performance:**
- Lazy loading for images
- Code splitting (React.lazy)
- Optimized bundle size
- Cached API responses
- Debounced search inputs
- Pagination for large datasets

### 11.2 UI Components

**Tailwind CSS Utility Classes:**
- Consistent spacing scale
- Color palette system
- Typography scale
- Shadow system
- Transition utilities

**Framer Motion Animations:**
- Page transitions
- Modal entrance/exit
- Button hover effects
- Loading states
- Micro-interactions

**Component Library:**
- Reusable UI components
- Consistent styling
- Accessible by default
- Customizable props

### 11.3 User Feedback

**Notifications (React Hot Toast):**
- Success messages (green)
- Error messages (red)
- Info messages (blue)
- Warning messages (yellow)
- Loading states
- Auto-dismiss (configurable)

**Loading States:**
- Skeleton screens
- Spinner components
- Progress bars
- Shimmer effects

**Error States:**
- User-friendly error messages
- Fallback UI components
- Retry mechanisms
- Error boundaries

**Confirmation Dialogs:**
- Destructive action warnings
- Two-step confirmation
- Explanatory text
- Clear action buttons

### 11.4 Navigation

**User Navigation:**
- Clear menu structure
- Breadcrumbs for deep pages
- Back button support
- Active link highlighting
- Mobile hamburger menu

**Admin Navigation:**
- Persistent sidebar
- Collapsible sections
- Icon + label
- Active section indicator
- Quick search (future)

---

## 12. Development & Deployment

### 12.1 Development Environment

**Prerequisites:**
- Node.js 16+ and npm
- Python 3.8+
- PostgreSQL 15
- MongoDB Atlas account (or local MongoDB)
- Stripe account (test mode)
- Mailtrap account
- Git
- Docker & Docker Compose (optional)

**Environment Variables:**

**Backend (.env):**
```env
# Server
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=paws_db

# MongoDB
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/paws

# Authentication
JWT_SECRET=your_jwt_secret_key_here

# Email (Mailtrap)
MAILTRAP_TOKEN=your_mailtrap_token
MAILTRAP_SENDER_EMAIL=noreply@pawsshelter.com

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# ML Service
ML_SERVICE_URL=http://localhost:5001
```

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:5000/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 12.2 Installation & Setup

**Clone Repository:**
```bash
git clone https://github.com/yourusername/paws-shelter.git
cd paws-shelter
```

**Backend Setup:**
```bash
cd backend

# Install dependencies
npm install

# Setup PostgreSQL database
psql -U postgres -f db/init.sql

# Run database migrations
npm run migrate

# Start development server
npm run backend:nodemon
```

**Frontend Setup:**
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

**ML Service Setup:**
```bash
cd backend/ml-service

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start Flask server
python app.py
```

**Docker Setup (Alternative):**
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 12.3 Development Scripts

**Package.json Scripts:**

**Root:**
```json
{
  "app:dev": "concurrently \"npm run backend:nodemon\" \"npm run frontend:dev --prefix frontend\"",
  "backend:nodemon": "cd backend && nodemon src/app.js",
  "frontend:dev": "cd frontend && npm run dev",
  "seed:adoptions": "cd backend && node scripts/seedAdoptions.js"
}
```

**Backend:**
```json
{
  "dev": "nodemon src/app.js",
  "start": "node src/app.js",
  "migrate": "node db/migrate.js",
  "seed": "node scripts/seed.js"
}
```

**Frontend:**
```json
{
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "lint": "eslint src"
}
```

### 12.4 Testing

**Unit Tests (Future):**
- Jest for backend
- React Testing Library for frontend
- pytest for ML service

**Integration Tests (Future):**
- API endpoint testing
- Database integration
- Stripe webhook testing

**E2E Tests (Future):**
- Playwright or Cypress
- User flow testing
- Admin dashboard testing

**Manual Testing:**
- Stripe CLI for webhook testing
- Postman/Insomnia for API testing
- Browser DevTools

### 12.5 Deployment

**Production Checklist:**

**Environment:**
- [ ] Set `NODE_ENV=production`
- [ ] Use production Stripe keys
- [ ] Enable HTTPS
- [ ] Set secure cookie flags
- [ ] Configure CORS for production domain
- [ ] Update `CLIENT_URL` to production URL

**Database:**
- [ ] PostgreSQL production instance
- [ ] MongoDB Atlas production cluster
- [ ] Database backups configured
- [ ] Connection pooling enabled
- [ ] SSL/TLS connections

**Security:**
- [ ] Environment variables secured
- [ ] API rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] HTTPS enforced
- [ ] Security headers (Helmet.js)
- [ ] DDoS protection

**Monitoring:**
- [ ] Error tracking (Sentry, future)
- [ ] Performance monitoring
- [ ] Uptime monitoring
- [ ] Log aggregation
- [ ] Alerts configured

**Deployment Platforms:**
- **Frontend:** Vercel, Netlify, AWS S3 + CloudFront
- **Backend:** Heroku, AWS EC2/ECS, DigitalOcean
- **Database:** AWS RDS (PostgreSQL), MongoDB Atlas
- **ML Service:** AWS Lambda, Google Cloud Functions, dedicated server

**CI/CD Pipeline (Future):**
- GitHub Actions
- Automated testing
- Automated deployment
- Environment-based builds
- Rollback capabilities

---

## 13. Future Roadmap

### 13.1 Short-term Enhancements (3-6 months)

**User Features:**
- [ ] Save favorite pets (wishlist)
- [ ] Pet comparison tool
- [ ] Advanced search filters (behavior traits, compatibility)
- [ ] Pet adoption alerts (email notifications for matching pets)
- [ ] Social sharing (share pets on social media)
- [ ] Pet adoption calculator (cost estimator)

**Donation Features:**
- [ ] Recurring donations (monthly, yearly)
- [ ] Donation campaigns
- [ ] Fundraising goals with progress bars
- [ ] Donor leaderboard
- [ ] Memorial/honor donations
- [ ] Corporate matching

**Communication:**
- [ ] In-app messaging system
- [ ] Real-time chat with admins
- [ ] Automated chatbot for FAQs
- [ ] SMS notifications
- [ ] Push notifications (PWA)

**Admin Tools:**
- [ ] Advanced analytics dashboard
- [ ] Custom report builder
- [ ] Email campaign manager
- [ ] CRM integration
- [ ] Volunteer management
- [ ] Inventory management

### 13.2 Medium-term Features (6-12 months)

**Mobile Application:**
- [ ] React Native mobile app
- [ ] Native iOS and Android apps
- [ ] Mobile-specific features (location-based search)
- [ ] Offline mode

**Advanced ML Features:**
- [ ] Pet-adopter matching algorithm
- [ ] Predict adoption likelihood for individual pets
- [ ] Optimize pricing recommendations
- [ ] Identify at-risk animals
- [ ] Predict shelter capacity needs
- [ ] Natural language processing for application reviews

**Multi-shelter Support:**
- [ ] Multi-tenancy architecture
- [ ] Shelter directory
- [ ] Cross-shelter pet search
- [ ] Centralized administration
- [ ] White-label solution

**Community Features:**
- [ ] Public user profiles
- [ ] Adoption success stories
- [ ] Pet parent community forum
- [ ] Reviews and ratings
- [ ] Adoption anniversary reminders

### 13.3 Long-term Vision (12+ months)

**Expansion:**
- [ ] Foster program management
- [ ] Lost & found pets
- [ ] Pet training resources
- [ ] Veterinary partnerships
- [ ] Pet supply marketplace
- [ ] Adoption insurance

**Integration:**
- [ ] Integration with national pet databases
- [ ] Veterinary clinic integrations
- [ ] Pet supply retailers
- [ ] Social media platforms
- [ ] Google Maps integration
- [ ] Calendar app integration

**Internationalization:**
- [ ] Multi-language support
- [ ] Multi-currency support
- [ ] Regional adaptations
- [ ] Compliance with local regulations

**Advanced Analytics:**
- [ ] Predictive analytics dashboard
- [ ] A/B testing framework
- [ ] User behavior analytics
- [ ] Conversion optimization tools
- [ ] Data visualization suite

---

## Appendix

### A. Glossary

- **Adoption Application:** A formal request submitted by a user to adopt a specific pet
- **Admin:** A user with elevated permissions to manage the platform
- **SARIMA:** Seasonal AutoRegressive Integrated Moving Average - a time series forecasting model
- **Stripe Checkout:** Stripe's hosted payment page
- **Webhook:** HTTP callback that occurs when an event happens (e.g., payment completed)
- **JWT:** JSON Web Token - authentication token format
- **CORS:** Cross-Origin Resource Sharing - security mechanism for APIs
- **Mailtrap:** Email testing and delivery service

### B. Contact Information

**Development Team:**
- Lead Developer: [Your Name]
- Email: [contact@pawsshelter.com]
- GitHub: [repository URL]

**Support:**
- User Support: [support@pawsshelter.com]
- Technical Issues: [tech@pawsshelter.com]

### C. Change Log

**Version 1.0 (Current):**
- Initial release
- Core features implemented
- ML prediction service
- Stripe payment integration
- Admin dashboard
- User authentication and authorization

---

**Document End**

*This PRD is a living document and will be updated as the product evolves.*
