# CLAUDE.MD - AI Development Guide
> Quick reference for Claude Code sessions working on the Paws Animal Shelter Platform

**Last Updated:** December 30, 2025
**Project:** Paws - Animal Shelter Management Platform
**Status:** Active Development

---

## 📋 Quick Context

**What is this?** Full-stack animal shelter management platform with pet adoption, donations (Stripe), ML predictions, and admin dashboard.

**Stack Summary:**
- **Frontend:** React 19 + Vite + Zustand + Tailwind + Recharts
- **Backend:** Node.js + Express + PostgreSQL + MongoDB
- **ML Service:** Python Flask (SARIMA/ETS forecasting)
- **Payments:** Stripe Checkout + Webhooks
- **Email:** Mailtrap
- **Auth:** JWT (HTTP-only cookies) + bcrypt

**Two Databases:**
- **PostgreSQL:** Pet data, photos, traits (relational)
- **MongoDB:** Users, adoptions, donations, messages, meetings (documents)

---

## 🗂️ Project Structure

```
paws-shelter/
├── backend/
│   ├── src/
│   │   ├── app.js                          # Express app entry point
│   │   ├── controllers/                     # Business logic
│   │   │   ├── __tests__/                   # Controller unit tests ✨ NEW
│   │   │   │   └── adoption.controller.test.js
│   │   │   ├── auth.controller.js
│   │   │   ├── pet.controller.js
│   │   │   ├── adoption.controller.js
│   │   │   ├── donation.controller.js
│   │   │   ├── message.controller.js
│   │   │   ├── scheduledMeeting.controller.js
│   │   │   ├── user.controller.js
│   │   │   └── prediction.controller.js
│   │   ├── routes/                          # API routes
│   │   │   ├── auth.routes.js
│   │   │   ├── pet.routes.js
│   │   │   ├── adoptions.routes.js
│   │   │   ├── donations.routes.js
│   │   │   ├── message.routes.js
│   │   │   ├── scheduledMeeting.routes.js
│   │   │   ├── user.routes.js
│   │   │   └── predictions.routes.js
│   │   ├── middleware/
│   │   │   └── auth.middleware.js           # verifyToken, isAdmin, checkIfAdmin
│   │   ├── models/                          # MongoDB models (Mongoose)
│   │   │   ├── __mocks__/                   # Model mocks for testing ✨ NEW
│   │   │   │   ├── adoption.model.js
│   │   │   │   ├── pet.model.js
│   │   │   │   └── user.model.js
│   │   │   ├── user.model.js
│   │   │   ├── adoption.model.js
│   │   │   ├── donation.model.js
│   │   │   ├── message.model.js
│   │   │   └── scheduledMeeting.model.js
│   │   ├── __tests__/                       # Test utilities ✨ NEW
│   │   │   ├── setup.js                     # Test environment config
│   │   │   └── helpers/
│   │   │       ├── dbSetup.js               # PostgreSQL test helpers
│   │   │       ├── mongoSetup.js            # MongoDB test helpers
│   │   │       └── seedData.js              # Test data fixtures
│   │   ├── db/
│   │   │   ├── connectDB.js                 # MongoDB connection
│   │   │   ├── postgres.js                  # PostgreSQL connection
│   │   │   └── init.sql                     # PostgreSQL schema
│   │   ├── mailtrap/
│   │   │   ├── mailtrap.config.js
│   │   │   └── emails.js                    # Email templates
│   │   └── utils/
│   │       └── generateToken.js
│   ├── ml-service/                          # Python Flask microservice
│   │   ├── app.py                           # ML prediction service
│   │   ├── requirements.txt
│   │   └── venv/
│   ├── scripts/
│   │   └── seedAdoptions.js                 # Generate test data
│   ├── uploads/                             # User avatars
│   │   └── avatars/
│   ├── docs/                                # Swagger docs
│   │   ├── swagger.config.js
│   │   ├── routes/
│   │   └── schemas/
│   ├── docker-compose.yaml
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── pages/                           # Page components
│   │   │   ├── PawsHomePage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── SignUpPage.jsx
│   │   │   ├── PetSearchPage.jsx
│   │   │   ├── PetDetailPage.jsx
│   │   │   ├── UserProfilePage.jsx
│   │   │   ├── AdminDashboardPage.jsx
│   │   │   └── Admin/
│   │   │       ├── PetsManagement.jsx
│   │   │       ├── AdoptionsManagement.jsx
│   │   │       ├── MeetingsManagement.jsx
│   │   │       ├── UsersManagement.jsx
│   │   │       ├── MessagesInbox.jsx
│   │   │       └── StatisticsManagement.jsx
│   │   ├── components/                      # Reusable components
│   │   ├── store/                           # Zustand state management
│   │   │   ├── authStore.js
│   │   │   ├── petStore.js
│   │   │   ├── adoptionStore.js
│   │   │   ├── donationStore.js
│   │   │   ├── messageStore.js
│   │   │   ├── meetingStore.js
│   │   │   └── userStore.js
│   │   └── utils/
│   └── package.json
├── PRD.md                                   # Product Requirements Document
├── CLAUDE.MD                                # This file
├── PLANNING.MD                              # Strategic planning document
├── TASKS.MD                                 # Development milestones & tasks
├── jest.config.js                           # Jest testing configuration ✨ NEW
└── package.json                             # Root scripts
```

---

## 🔑 Key Conventions & Patterns

### API Response Format
All API responses follow this structure:
```javascript
// Success
{ success: true, message: "...", data: {...} }

// Error
{ success: false, message: "...", error: "..." }
```

### Authentication Flow
1. JWT tokens stored in **HTTP-only cookies** (not localStorage)
2. Cookie name: `token`, expires in 7 days
3. Middleware: `verifyToken` → adds `req.userId` and `req.isAdmin`
4. Protected routes check `req.userId`, admin routes use `isAdmin` middleware

### Zustand Store Pattern
```javascript
export const useStore = create((set, get) => ({
  // State
  items: [],
  isLoading: false,
  error: null,

  // Actions
  fetchItems: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await axios.get('/api/items', { withCredentials: true });
      set({ items: res.data.data, isLoading: false });
    } catch (error) {
      set({ error: error.response?.data?.message, isLoading: false });
    }
  }
}));
```

### Database Interaction Patterns

**PostgreSQL (pets, photos, traits):**
```javascript
import pool from '../db/postgres.js';

// Parameterized queries ALWAYS
const result = await pool.query(
  'SELECT * FROM pets WHERE id = $1',
  [petId]
);
```

**MongoDB (users, adoptions, donations, messages, meetings):**
```javascript
import User from '../models/user.model.js';

// Always use Mongoose models
const user = await User.findById(userId).select('-password');
```

---

## 🚨 Important Gotchas

### 1. Stripe Webhook Handler
- **CRITICAL:** Webhook route MUST use `express.raw()` NOT `express.json()`
- Positioned BEFORE `express.json()` in middleware stack
- Signature verification requires raw body

```javascript
// In app.js - ORDER MATTERS!
app.use('/api/donations/webhook',
  express.raw({ type: 'application/json' }),
  donationRoutes
);

// THEN other middleware
app.use(express.json({ limit: '50mb' }));
```

### 2. Pet Availability Auto-Update
- PostgreSQL trigger automatically sets `is_available` based on `adoption_status`
- **Don't manually update `is_available`** - update `adoption_status` instead
- Trigger: `trigger_update_availability` on pets table

### 3. Adoption Status Flow
```
available → pending → in_review → approved/rejected
```
- When user applies: pet becomes "pending"
- When user accepts meeting: adoption becomes "in_review"
- When admin approves: pet becomes "adopted", all other applications rejected
- When admin rejects: pet returns to "available" (if no other pending apps)

### 4. ML Service Communication
- ML service runs on **port 5001** (separate Flask app)
- Backend calls ML service via HTTP: `http://localhost:5001/api/ml/predict`
- **Always handle timeout** (30s recommended)
- Fallback gracefully if ML service is down

### 5. File Uploads
- Avatars: max 5MB, stored in `backend/uploads/avatars/`
- Pet photos: stored as **BYTEA in PostgreSQL** (binary data)
- Multer handles uploads, auto-cleanup old files
- Always validate file type and size

### 6. CORS Configuration
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- **Must use** `withCredentials: true` in Axios for cookies
- CORS configured in `app.js`

---

## 🔧 Common Development Tasks

### Start Development Environment
```bash
# Option 1: Run all services concurrently (from root)
npm run app:dev

# Option 2: Run individually
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev

# Terminal 3 - ML Service
cd backend/ml-service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
python app.py

# Terminal 4 - Stripe CLI (for webhooks)
stripe listen --forward-to localhost:5000/api/donations/webhook
```

### Seed Test Data
```bash
# Generate 6 months of adoption data for ML predictions
cd backend && npm run seed:adoptions
```

### Access Swagger Docs
```
http://localhost:5000/api-docs
```

### Test Stripe Payments (Local)
```bash
# Start Stripe webhook listener
stripe listen --forward-to localhost:5000/api/donations/webhook

# Test cards
4242 4242 4242 4242  # Success
4000 0000 0000 9995  # Decline
```

### Database Queries
```bash
# PostgreSQL
psql -U postgres -d paws_db
\dt  # List tables
SELECT * FROM pets LIMIT 5;

# MongoDB (via mongosh or MongoDB Compass)
# Connection string in .env: MONGO_URI
```

---

## 📝 Git Workflow

### Commit Message Format
```
<type>: <description>

<optional body with details>

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

**Types:** feat, fix, docs, style, refactor, test, chore

### Branches
- `main` - production
- `master` - current development branch (legacy, being merged to main)
- Create feature branches for new work

### Before Committing
1. Test locally
2. Run linter (if configured)
3. Check for console errors
4. Verify no hardcoded secrets

---

## 🌐 Environment Variables

### Backend (.env)
```env
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
MONGO_URI=mongodb+srv://...

# JWT
JWT_SECRET=your_secret_here

# Mailtrap
MAILTRAP_TOKEN=...
MAILTRAP_SENDER_EMAIL=noreply@pawsshelter.com

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# ML Service
ML_SERVICE_URL=http://localhost:5001
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## 🎯 Feature-Specific Notes

### Pet Search & Filtering
- Uses PostgreSQL full-text search
- Autocomplete debounced to 300ms
- Filters: type, gender, age_category, size, color, location
- Only shows `is_available = true` to regular users
- Admins see all pets

### Adoption Applications
- **Duplicate prevention:** Check if user already has active (pending/in_review) application for pet
- Endpoint: `GET /api/adoptions/check/:petId`
- Form validation on both frontend and backend
- Email sent on submission, status change, and approval/rejection

### Donation System (Stripe)
- **Currency:** EUR only
- **Session expiration:** 30 minutes
- **Webhook events:** `checkout.session.completed`, `checkout.session.expired`
- Anonymous donations allowed (no userId)
- Status: pending → completed/canceled/failed
- Admin can cleanup abandoned sessions

### ML Predictions
- **Requires:** Minimum 7 approved adoptions
- **Models:** SARIMA (primary), Exponential Smoothing (fallback)
- **Views:** Daily (30 days), Weekly (12 weeks), Monthly (3 months)
- **Filters:** All pets or by type (dog, cat, bird, rabbit, other)
- Data aggregated by applicationDate from MongoDB

### Meetings
- **Only** for "pending" adoptions
- One active meeting per adoption
- User accepts → adoption moves to "in_review"
- User rejects → adoption moves to "rejected", pet becomes available

### Email Templates
- Located: `backend/src/mailtrap/emails.js`
- Uses HTML with inline CSS
- Categories: Authentication, Adoption, Donation, Administrative
- Sent via MailtrapClient

---

## 🔐 Security Checklist

- [ ] **Never** return password in API responses (use `.select('-password')`)
- [ ] **Always** use parameterized queries for PostgreSQL
- [ ] **Always** validate user input server-side
- [ ] **Always** verify JWT token on protected routes
- [ ] **Always** check ownership for user-specific resources
- [ ] **Always** validate file uploads (type, size)
- [ ] **Never** commit `.env` files
- [ ] **Never** log sensitive data (passwords, tokens, API keys)

### Admin Middleware
```javascript
// Use isAdmin for hard block
router.delete('/pets/:id', verifyToken, isAdmin, deletePet);

// Use checkIfAdmin for conditional logic (doesn't block)
router.get('/pets', verifyToken, checkIfAdmin, getAllPets);
```

---

## 🐛 Common Debugging

### Issue: "withCredentials" error
- **Cause:** CORS not configured for credentials
- **Fix:** Ensure `credentials: true` in CORS config AND `withCredentials: true` in Axios

### Issue: Stripe webhook failing
- **Cause:** Using `express.json()` before webhook route
- **Fix:** Webhook route must come BEFORE `express.json()`

### Issue: ML predictions error "insufficient data"
- **Cause:** Not enough approved adoptions in database
- **Fix:** Run `npm run seed:adoptions` to generate test data

### Issue: Pet not becoming available after rejection
- **Cause:** Other pending applications exist
- **Fix:** Check if other users have pending/in_review applications for same pet

### Issue: JWT token not persisting
- **Cause:** Cookie not being sent/received
- **Fix:**
  1. Check `withCredentials: true` in frontend
  2. Check CORS `credentials: true` in backend
  3. Check cookie settings (httpOnly, sameSite)

---

## 📊 Database Schema Quick Reference

### PostgreSQL - Pets
```sql
adoption_status: 'available' | 'pending' | 'in_review' | 'adopted' | 'unavailable'
is_available: boolean (auto-updated via trigger)
```

### MongoDB - Users
```javascript
isVerified: boolean
isAdmin: boolean
avatar: string (file path)
```

### MongoDB - Adoptions
```javascript
status: 'pending' | 'in_review' | 'approved' | 'rejected'
user: ObjectId (ref User)
petId: number (PostgreSQL pet ID)
```

### MongoDB - Donations
```javascript
status: 'pending' | 'completed' | 'canceled' | 'failed'
amount: number (in cents for Stripe, display in euros)
stripeSessionId: string
```

### MongoDB - Meetings
```javascript
status: 'pending' | 'accepted' | 'rejected'
adoptionId: ObjectId (ref Adoption)
```

---

## 🧪 Testing Guidelines

### Automated Testing (NEW - Dec 30, 2025)
**Framework:** Jest 30.2.0 + Supertest 7.1.4

**Run Tests:**
```bash
npm test                    # Run all tests
npm test:watch              # Watch mode
npm test:coverage           # Coverage report
```

**Test Structure:**
```
backend/src/
├── __tests__/
│   ├── setup.js                           # Test environment config
│   └── helpers/
│       ├── dbSetup.js                     # PostgreSQL test utilities
│       ├── mongoSetup.js                  # MongoDB test utilities
│       └── seedData.js                    # Test data fixtures
├── controllers/__tests__/
│   ├── adoption.controller.test.js        # ✅ 21 passing tests
│   ├── donation.controller.test.js        # TODO
│   └── pet.controller.test.js             # TODO
└── models/__mocks__/
    ├── adoption.model.js                  # Mongoose mocks
    ├── pet.model.js                       # PostgreSQL mocks
    └── user.model.js                      # Mongoose mocks
```

**Writing Tests:**
```javascript
import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { myController } from '../myController.js';

// Mock models
jest.mock('../../models/myModel.js');

describe('My Controller', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { body: {}, params: {}, userId: '507f1f77bcf86cd799439011' };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  test('should handle success case', async () => {
    // Arrange
    req.body = { data: 'test' };

    // Act
    await myController(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true })
    );
  });
});
```

**Coverage Targets:**
- Statements: > 70%
- Branches: > 60%
- Functions: > 70%
- Lines: > 70%

### Manual Testing Checklist
1. **Auth Flow:** Signup → Email verify → Login → Logout
2. **Pet Search:** Filter, search, view details, similar pets
3. **Adoption:** Apply → Admin reviews → Meeting scheduled → Accept → Approve
4. **Donation:** Create → Stripe checkout → Webhook → Confirm
5. **Admin Dashboard:** All CRUD operations, filters, pagination

### Test User Accounts
Create via signup or seed script:
- Regular user: `isAdmin: false`
- Admin user: `isAdmin: true` (set manually in DB)

### Stripe Test Mode
- Use test API keys (sk_test_..., pk_test_...)
- Test cards in Stripe docs
- Use Stripe CLI for webhook testing locally

---

## 📦 Dependencies to Know

### Critical Backend Dependencies
- `express` - Web framework
- `pg` - PostgreSQL client
- `mongoose` - MongoDB ODM
- `jsonwebtoken` - JWT auth
- `bcryptjs` - Password hashing
- `stripe` - Payment processing
- `multer` - File uploads
- `mailtrap` - Email service
- `swagger-jsdoc` & `swagger-ui-express` - API docs

### Testing Dependencies
- `jest` - Testing framework
- `supertest` - HTTP assertion library
- `@types/jest` - TypeScript definitions for Jest
- `cross-env` - Cross-platform environment variables

### Critical Frontend Dependencies
- `react` & `react-dom` - UI framework
- `react-router-dom` - Routing
- `zustand` - State management
- `axios` - HTTP client
- `recharts` - Charts for ML predictions
- `@stripe/stripe-js` - Stripe integration
- `framer-motion` - Animations
- `react-hot-toast` - Notifications
- `lucide-react` - Icons

### ML Service Dependencies (Python)
- `flask` - Web framework
- `pandas` - Data manipulation
- `statsmodels` - SARIMA/ETS models
- `flask-cors` - CORS support

---

## 🚀 Deployment Notes

### Production Environment Changes
1. Set `NODE_ENV=production`
2. Use production Stripe keys
3. Enable HTTPS
4. Set `secure: true` in cookie config
5. Update CORS origin to production domain
6. Use production MongoDB Atlas cluster
7. Use production PostgreSQL instance
8. Configure ML service on separate server/lambda

### Environment-Specific Code
```javascript
// Example in app.js
if (!process.env.DOCKER_ENV) {
  dotenv.config();
} else {
  console.log('Running in Docker environment');
}
```

---

## 📞 Useful Resources

- **Full PRD:** See `PRD.md` for comprehensive documentation
- **Swagger API Docs:** `http://localhost:5000/api-docs`
- **Stripe Docs:** https://stripe.com/docs
- **Mailtrap Docs:** https://mailtrap.io/docs
- **PostgreSQL Docs:** https://www.postgresql.org/docs/
- **MongoDB Docs:** https://docs.mongodb.com/
- **Statsmodels (SARIMA):** https://www.statsmodels.org/

---

## 💡 Pro Tips for Future Claude Sessions

1. **Always read this file first** when starting work on this project
2. **Check PRD.md** for comprehensive feature requirements
3. **Test locally** before committing (especially Stripe webhooks)
4. **Use existing patterns** - consistency matters
5. **Update this file** if you discover new patterns or gotchas
6. **Reference specific file:line** when discussing code (e.g., `app.js:25`)
7. **Check both databases** when debugging data issues
8. **Verify middleware order** in app.js - it's critical
9. **Test admin vs user permissions** for new features
10. **Keep security in mind** - this handles payments and personal data

---

## 🔄 Recent Changes & Context

**Session: Testing Infrastructure Setup (Dec 30, 2025)**

Implemented comprehensive automated testing framework for backend API (Milestone 11: Testing & Quality Assurance - Phase 1).

**What Was Built:**
1. **Jest Testing Framework**
   - Installed Jest 30.2.0, supertest 7.1.4, @types/jest
   - Configured for ES modules (`"type": "module"` in package.json)
   - Added cross-env for Windows compatibility
   - Created test scripts: `npm test`, `npm test:watch`, `npm test:coverage`

2. **Jest Configuration** (`jest.config.js`)
   - Node environment for backend testing
   - ES module support with experimental VM modules
   - Test file pattern: `**/backend/src/**/__tests__/**/*.test.js`
   - Coverage thresholds: 70% statements, 60% branches, 70% functions, 70% lines
   - Auto-mock clearing between tests

3. **Test Environment Setup**
   - `backend/.env.test` - Test database configuration
   - `backend/src/__tests__/setup.js` - Test initialization
   - Separate test databases (PostgreSQL + MongoDB)
   - Disabled external services (Stripe, Mailtrap, ML service)

4. **Database Test Utilities**
   - `backend/src/__tests__/helpers/dbSetup.js` - PostgreSQL test helpers
   - `backend/src/__tests__/helpers/mongoSetup.js` - MongoDB test helpers
   - `backend/src/__tests__/helpers/seedData.js` - Test data fixtures
   - Functions: setupTestDB, teardownTestDB, clearTestDB, seedPets, createTestUser

5. **Model Mocks**
   - `backend/src/models/__mocks__/adoption.model.js`
   - `backend/src/models/__mocks__/pet.model.js`
   - `backend/src/models/__mocks__/user.model.js`

6. **Adoption Controller Tests** (`backend/src/controllers/__tests__/adoption.controller.test.js`)
   - 22 test cases, 21 passing, 1 skipped (requires integration testing)
   - Coverage: submitAdoptionApplication, getUserAdoptions, updateAdoptionStatus, getAllAdoptions, deleteAdoption
   - Tests validation, authorization, error handling, business logic

**Test Results:**
```
✅ PASS backend/src/controllers/__tests__/adoption.controller.test.js
Test Suites: 1 passed, 1 total
Tests:       1 skipped, 21 passed, 22 total
```

**How to Run Tests:**
```bash
# Run all tests
npm test

# Run specific test file
npm test -- adoption.controller.test.js

# Watch mode
npm test:watch

# Coverage report
npm test:coverage
```

**Important Notes:**
- Jest uses `NODE_OPTIONS=--experimental-vm-modules` for ES module support
- Mock files must import `jest` from `@jest/globals`
- Mongoose model constructor tests require integration testing (complex to mock)
- One test skipped: "should successfully submit adoption application" - marked for integration tests

**Files Created:**
- `jest.config.js`
- `backend/.env.test`
- `backend/src/__tests__/setup.js`
- `backend/src/__tests__/helpers/dbSetup.js`
- `backend/src/__tests__/helpers/mongoSetup.js`
- `backend/src/__tests__/helpers/seedData.js`
- `backend/src/models/__mocks__/adoption.model.js`
- `backend/src/models/__mocks__/pet.model.js`
- `backend/src/models/__mocks__/user.model.js`
- `backend/src/controllers/__tests__/adoption.controller.test.js`

**Files Modified:**
- `package.json` - Added test scripts and devDependencies

**Next Steps for Testing:**
- Write unit tests for donation controller (with Stripe mocking)
- Write unit tests for pet controller (with PostgreSQL mocking)
- Write unit tests for user controller
- Write integration tests using real test databases
- Add React Testing Library for frontend tests
- Set up GitHub Actions CI pipeline
- Configure coverage reporting and badges

---

**Session: Project Structure Refactoring (Dec 30, 2025)**

Restructured project to move backend dependencies from root to backend folder, creating a consistent structure where both frontend and backend are self-contained.

**What Was Done:**
1. **Backend Package.json**
   - Created `backend/package.json` with backend-specific dependencies
   - Moved 15 production dependencies (express, pg, mongoose, stripe, etc.)
   - Moved 2 dev dependencies (nodemon, dotenv-cli)
   - Created backend scripts: `dev`, `docker`, `seed:adoptions`
   - Generated `backend/package-lock.json`

2. **Root Package.json Cleanup**
   - Removed all backend dependencies
   - Kept only coordination scripts: `app:dev`, `frontend:dev`
   - Kept testing infrastructure: `test`, `test:watch`, `test:coverage`
   - Kept testing devDependencies (jest, supertest, cross-env, concurrently)
   - Added `"type": "module"` for jest.config.js ES module support

3. **Docker Configuration Updates**
   - Updated `backend/docker-compose.yaml` to reference local package files
   - Changed build context from `../` to `.` (backend folder)
   - Updated volume mounts to use `./package.json` instead of `../package.json`
   - Simplified `backend/Dockerfile` to work with backend-local package files

4. **Bug Fixes**
   - Fixed `backend/scripts/seedAdoptions.js` - removed embedded markdown documentation
   - Script now works correctly from backend folder

5. **Documentation Updates**
   - Updated `CLAUDE.md` Quick Command Reference section
   - Updated seed command examples to show `cd backend` pattern
   - Updated `TASKS.md` to add "Refactoring: Project Structure Reorganization" section
   - `PLANNING.md` already had correct structure, no changes needed

**New Project Structure:**
```
root/
├── package.json          # Coordination scripts + testing only
├── jest.config.js        # Testing configuration (at root)
├── backend/
│   ├── package.json      # Backend dependencies + scripts ✨ NEW
│   ├── package-lock.json # Backend lock file ✨ NEW
│   ├── src/
│   └── ...
└── frontend/
    ├── package.json      # Frontend setup (unchanged)
    └── ...
```

**How to Use New Structure:**
```bash
# Backend (NEW workflow)
cd backend
npm run dev              # Start backend
npm run seed:adoptions   # Seed data
npm run docker           # Docker compose

# Frontend (unchanged)
cd frontend
npm run dev

# Root convenience scripts (unchanged)
npm run app:dev          # Start both services
npm test                 # Run tests
```

**Verification Results:**
```
✅ Backend starts from backend folder (npm run dev)
✅ Frontend starts from frontend folder (unchanged)
✅ Concurrent start works (npm run app:dev)
✅ All 21 tests passing (npm test)
✅ Seed script works (cd backend && npm run seed:adoptions)
✅ Docker configuration updated successfully
```

**Benefits Achieved:**
- ✅ Consistent structure - frontend and backend both self-contained
- ✅ Backend can be started independently from backend folder
- ✅ Root maintains convenience scripts for common workflows
- ✅ Testing stays centralized at root for cross-cutting concerns
- ✅ Cleaner separation of concerns
- ✅ Easier onboarding for new developers

**Files Created:**
- `backend/package.json`
- `backend/package-lock.json`

**Files Modified:**
- `package.json` (root) - Removed backend deps, kept coordination scripts
- `backend/docker-compose.yaml` - Updated volume mounts
- `backend/Dockerfile` - Updated for backend-local context
- `backend/scripts/seedAdoptions.js` - Fixed embedded markdown bug
- `CLAUDE.md` - Updated command examples
- `TASKS.md` - Added refactoring completion section

**Next Steps:**
- Continue with testing infrastructure (donation, pet, user controllers)
- Performance optimization tasks (Milestone 12)
- Security hardening (Milestone 13)

---

**Previous Work (Dec 30, 2025):**
- Added ML prediction service with SARIMA/ETS models
- Enhanced donation system with pagination and filtering
- Created StatisticsManagement page with ML predictions visualization
- Replaced donations tab with comprehensive statistics dashboard
- Added recharts for data visualization
- Increased JSON payload limit to 50mb for ML data
- Updated Docker config to use .env file

**Known Issues:**
- None currently tracked

**Next Priorities:**
- Complete testing infrastructure (donation, pet, user controllers)
- Security hardening (Milestone 13)
- Performance optimization (Milestone 12)
- See PRD.md Section 13 (Future Roadmap)

---

## 📝 Quick Command Reference

```bash
# Development
npm run app:dev                    # Start both backend and frontend (from root)
cd backend && npm run dev          # Backend only
cd frontend && npm run dev         # Frontend only
cd backend/ml-service && python app.py  # ML service

# Testing
npm test                           # Run all tests (from root)
npm test -- adoption.controller.test.js  # Run specific test file
npm test:watch                     # Run tests in watch mode
npm test:coverage                  # Generate coverage report

# Database
psql -U postgres -d paws_db        # PostgreSQL shell
cd backend && npm run seed:adoptions  # Seed adoption data

# Stripe
stripe listen --forward-to localhost:5000/api/donations/webhook

# Git
git status                         # Check status
git add .                          # Stage all
git commit -m "..."                # Commit
git push origin master             # Push to master branch

# Docker (alternative)
docker-compose up -d               # Start all services
docker-compose down                # Stop all services
docker-compose logs -f             # View logs
```

---

**Remember:** This is an active development project. When in doubt, check the PRD.md for detailed requirements, or explore the actual code. The codebase is well-structured and follows consistent patterns.

**Happy coding! 🐾**
