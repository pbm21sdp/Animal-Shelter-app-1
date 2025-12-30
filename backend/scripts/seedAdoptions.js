import mongoose from 'mongoose';
import { Adoption } from '../src/models/adoption.model.js';
import { User } from '../src/models/user.model.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

// Generate random date for a specific day
const randomDateInDay = (date) => {
    const dayStart = new Date(date);
    dayStart.setHours(9, 0, 0, 0); // Start at 9 AM

    const dayEnd = new Date(date);
    dayEnd.setHours(18, 0, 0, 0); // End at 6 PM

    return new Date(dayStart.getTime() + Math.random() * (dayEnd.getTime() - dayStart.getTime()));
};



```
---

## What This Enhanced Script Does

### 1. **6 Months of Data** (instead of 3)
- More historical data for better predictions
- ~800-1000 total adoptions

### 2. **Realistic Weekly Patterns**
- **Weekends (Sat/Sun)**: 5-8 adoptions/day
- **Friday**: 4-6 adoptions/day
- **Tuesday-Thursday**: 3-5 adoptions/day
- **Monday**: 2-4 adoptions/day (lowest)

### 3. **Seasonal Trends**
- **Spring/Summer** (March-August): 20% more adoptions
- **Fall** (September-November): Normal rates
- **Winter** (December-February): 20% fewer adoptions

### 4. **Smart Status Distribution**
- Last 3 days: Mostly pending
- Last week: Mix of pending/approved
- Older: Mostly approved (~75%), some rejected (~15%)

### 5. **Better Statistics Output**
Shows:
- Monthly breakdown with averages
- Weekly pattern (which days are busiest)
- Pet type distribution
- Percentage calculations

---

## Expected Output

Generating adoptions from 5/25/2024 to 11/25/2024
This may take a moment...

Inserting 847 adoptions...
Progress: 847/847

✅ Dummy adoptions created successfully!

    Overall Statistics:
    - Total Adoptions: 847
- Approved: 639 (75.4%)
- Pending: 156 (18.4%)
- Rejected: 52 (6.1%)

Adoptions by Pet Type:
    - dog: 389 (45.9%)
- cat: 301 (35.5%)
- bird: 98 (11.6%)
- rabbit: 59 (7.0%)

Monthly Breakdown (Approved only):
- May 2024: 87 adoptions (avg 2.9/day)
- Jun 2024: 124 adoptions (avg 4.1/day)
- Jul 2024: 131 adoptions (avg 4.4/day)
- Aug 2024: 118 adoptions (avg 3.9/day)
- Sep 2024: 95 adoptions (avg 3.2/day)
- Oct 2024: 84 adoptions (avg 2.8/day)

Weekly Pattern (Last 30 Days, Approved only):
- Sun: 18 adoptions
- Mon: 8 adoptions
- Tue: 12 adoptions
- Wed: 13 adoptions
- Thu: 11 adoptions
- Fri: 15 adoptions
- Sat: 19 adoptions
```

// Pet types and breeds
const petData = {
    dog: ['Labrador', 'Golden Retriever', 'German Shepherd', 'Bulldog', 'Beagle', 'Poodle', 'Husky', 'Rottweiler', 'Border Collie', 'Dachshund'],
    cat: ['Persian', 'Siamese', 'Maine Coon', 'British Shorthair', 'Ragdoll', 'Bengal', 'Sphynx', 'Scottish Fold', 'Russian Blue'],
    bird: ['Parrot', 'Canary', 'Cockatiel', 'Budgie', 'Finch', 'Macaw', 'Lovebird'],
    rabbit: ['Holland Lop', 'Netherland Dwarf', 'Mini Rex', 'Lionhead', 'Flemish Giant']
};

const livingArrangements = ['House with yard', 'Apartment', 'House without yard', 'Condo', 'Townhouse'];
const reasons = [
    'Looking for a companion',
    'Want to give a pet a loving home',
    'Family pet for children',
    'Experienced pet owner',
    'Recently lost a pet',
    'Always wanted this breed',
    'Ready for the responsibility',
    'Love animals'
];

// Generate realistic adoption patterns (varies by day of week)
const getAdoptionsForDay = (date) => {
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

    // Weekend = more adoptions, mid-week = moderate, Monday = fewer
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        // Saturday/Sunday: 5-8 adoptions
        return Math.floor(Math.random() * 4) + 5;
    } else if (dayOfWeek === 1) {
        // Monday: 2-4 adoptions
        return Math.floor(Math.random() * 3) + 2;
    } else if (dayOfWeek === 5) {
        // Friday: 4-6 adoptions
        return Math.floor(Math.random() * 3) + 4;
    } else {
        // Tuesday-Thursday: 3-5 adoptions
        return Math.floor(Math.random() * 3) + 3;
    }
};

// Add seasonal trend (more adoptions in spring/summer)
const getSeasonalMultiplier = (date) => {
    const month = date.getMonth(); // 0 = January, 11 = December

    // Spring/Summer (March-August): Higher adoption rates
    if (month >= 2 && month <= 7) {
        return 1.2;
    }
    // Fall (September-November): Moderate
    else if (month >= 8 && month <= 10) {
        return 1.0;
    }
    // Winter (December-February): Lower
    else {
        return 0.8;
    }
};

// Seed function
const seedAdoptions = async () => {
    try {
        await connectDB();

        // Get existing users or create test users
        let users = await User.find();

        if (users.length === 0) {
            console.log('No users found. Creating test users...');
            const testUsers = [
                {
                    name: 'John Doe',
                    email: 'john@example.com',
                    password: 'hashedpassword123',
                    isVerified: true
                },
                {
                    name: 'Jane Smith',
                    email: 'jane@example.com',
                    password: 'hashedpassword123',
                    isVerified: true
                },
                {
                    name: 'Mike Johnson',
                    email: 'mike@example.com',
                    password: 'hashedpassword123',
                    isVerified: true
                }
            ];

            for (const userData of testUsers) {
                const user = new User(userData);
                await user.save();
                users.push(user);
            }
        }

        // Clear existing adoptions
        console.log('Clearing existing adoptions...');
        await Adoption.deleteMany({});

        // Generate adoptions over the last 6 months for better patterns
        const today = new Date();
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(today.getMonth() - 6);

        const adoptions = [];
        let currentDate = new Date(sixMonthsAgo);
        let petCounter = 1;

        console.log('\nGenerating adoptions from', sixMonthsAgo.toLocaleDateString(), 'to', today.toLocaleDateString());
        console.log('This may take a moment...\n');

        // Generate adoptions for each day
        while (currentDate <= today) {
            // Get base number of adoptions for this day
            let numAdoptionsToday = getAdoptionsForDay(currentDate);

            // Apply seasonal multiplier
            const seasonalMultiplier = getSeasonalMultiplier(currentDate);
            numAdoptionsToday = Math.round(numAdoptionsToday * seasonalMultiplier);

            // Generate adoptions for this day
            for (let i = 0; i < numAdoptionsToday; i++) {
                // Random pet type
                const petTypes = Object.keys(petData);
                const petType = petTypes[Math.floor(Math.random() * petTypes.length)];
                const breeds = petData[petType];
                const breed = breeds[Math.floor(Math.random() * breeds.length)];

                // Random user
                const user = users[Math.floor(Math.random() * users.length)];

                // Determine status based on how recent the adoption is
                let status;
                const daysSinceAdoption = Math.floor((today - currentDate) / (1000 * 60 * 60 * 24));

                if (daysSinceAdoption < 3) {
                    // Last 3 days: mostly pending
                    status = Math.random() > 0.2 ? 'pending' : 'approved';
                } else if (daysSinceAdoption < 7) {
                    // Last week: mix of pending and approved
                    status = Math.random() > 0.5 ? 'approved' : 'pending';
                } else {
                    // Older: mostly approved, some rejected
                    const rand = Math.random();
                    if (rand > 0.85) {
                        status = 'rejected';
                    } else if (rand > 0.1) {
                        status = 'approved';
                    } else {
                        status = 'pending';
                    }
                }

                const adoptionTime = randomDateInDay(currentDate);

                const adoption = {
                    user: user._id,
                    petId: petCounter,
                    petName: `${breed} #${petCounter}`,
                    petType: petType,
                    petBreed: breed,
                    status: status,
                    livingArrangement: livingArrangements[Math.floor(Math.random() * livingArrangements.length)],
                    hasChildren: Math.random() > 0.5,
                    hasOtherPets: Math.random() > 0.6,
                    otherPetsDetails: Math.random() > 0.6 ? 'Have experience with pets' : '',
                    adoptionReason: reasons[Math.floor(Math.random() * reasons.length)],
                    veterinarianInfo: Math.random() > 0.5 ? 'Dr. Smith - Pet Clinic' : '',
                    timeAvailability: 'Full time',
                    homeVisitAgreement: true,
                    createdAt: adoptionTime,
                    updatedAt: adoptionTime
                };

                adoptions.push(adoption);
                petCounter++;
            }

            // Move to next day
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Insert all adoptions in batches (faster)
        console.log(`Inserting ${adoptions.length} adoptions...`);
        const batchSize = 100;
        for (let i = 0; i < adoptions.length; i += batchSize) {
            const batch = adoptions.slice(i, i + batchSize);
            await Adoption.insertMany(batch);
            process.stdout.write(`Progress: ${Math.min(i + batchSize, adoptions.length)}/${adoptions.length}\r`);
        }

        // Show statistics
        const approved = adoptions.filter(a => a.status === 'approved').length;
        const pending = adoptions.filter(a => a.status === 'pending').length;
        const rejected = adoptions.filter(a => a.status === 'rejected').length;

        console.log('\n\n✅ Dummy adoptions created successfully!');
        console.log(`\nOverall Statistics:`);
        console.log(`- Total Adoptions: ${adoptions.length}`);
        console.log(`- Approved: ${approved} (${((approved/adoptions.length)*100).toFixed(1)}%)`);
        console.log(`- Pending: ${pending} (${((pending/adoptions.length)*100).toFixed(1)}%)`);
        console.log(`- Rejected: ${rejected} (${((rejected/adoptions.length)*100).toFixed(1)}%)`);

        console.log(`\nAdoptions by Pet Type:`);
        const byType = adoptions.reduce((acc, a) => {
            acc[a.petType] = (acc[a.petType] || 0) + 1;
            return acc;
        }, {});

        Object.entries(byType).forEach(([type, count]) => {
            console.log(`- ${type}: ${count} (${((count/adoptions.length)*100).toFixed(1)}%)`);
        });

        // Show monthly breakdown
        console.log(`\nMonthly Breakdown (Approved only):`);
        const monthlyApproved = {};
        adoptions.filter(a => a.status === 'approved').forEach(a => {
            const monthKey = a.createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
            monthlyApproved[monthKey] = (monthlyApproved[monthKey] || 0) + 1;
        });

        Object.entries(monthlyApproved).sort().forEach(([month, count]) => {
            const avgPerDay = (count / 30).toFixed(1);
            console.log(`- ${month}: ${count} adoptions (avg ${avgPerDay}/day)`);
        });

        // Show weekly pattern
        console.log(`\nWeekly Pattern (Last 30 Days, Approved only):`);
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);

        const recentApproved = adoptions.filter(a =>
            a.status === 'approved' && a.createdAt >= thirtyDaysAgo
        );

        const byDay = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        recentApproved.forEach(a => {
            const dayName = dayNames[a.createdAt.getDay()];
            byDay[dayName]++;
        });

        dayNames.forEach(day => {
            console.log(`- ${day}: ${byDay[day]} adoptions`);
        });

        mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('Error seeding adoptions:', error);
        process.exit(1);
    }
};

// Run the seed function
seedAdoptions();
