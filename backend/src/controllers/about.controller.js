// controllers/about.controller.js
import { pool } from '../config/database/connectPostgresDB.js';
import { User } from '../models/user.model.js';
import Anthropic from '@anthropic-ai/sdk';
import axios from 'axios';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:5001';

// ─── GET /api/animals/stats ───────────────────────────────────────────────────
// Each query is isolated — one failing column doesn't kill all stats.
const safeQuery = async (sql, fallback = 0) => {
    try {
        const result = await pool.query(sql);
        return result.rows[0];
    } catch (err) {
        console.warn('[stats] Query failed, using fallback:', err.message);
        return { count: fallback, avg_days: fallback };
    }
};

export const getStats = async (req, res) => {
    try {
        // Run every stat independently so a missing column never blanks the whole response
        const [
            totalRow,
            foundHomeRow,
            urgentRow,
            vaccinatedRow,
            avgDaysRow,
            availableRow,
        ] = await Promise.all([
            safeQuery("SELECT COUNT(*)::int AS count FROM pets WHERE status = 'approved' AND is_available = true AND is_adopted = false"),
            // is_adopted added by migration — safe fallback if column missing
            safeQuery("SELECT COUNT(*)::int AS count FROM pets WHERE is_adopted = true AND status = 'approved'"),
            safeQuery(`
                SELECT COUNT(DISTINCT p.id)::int AS count
                FROM pets p
                JOIN pet_traits pt ON pt.pet_id = p.id
                WHERE pt.trait = 'Urgent'
                  AND p.is_available = true
                  AND p.is_adopted = false
            `),
            safeQuery("SELECT COUNT(*)::int AS count FROM pets WHERE LOWER(health_status) LIKE '%vacc%'"),
            // adopted_at also from migration — fallback to 0 avg if missing
            safeQuery(`
                SELECT COALESCE(
                    ROUND(AVG(EXTRACT(EPOCH FROM (adopted_at - created_at)) / 86400))::int,
                    0
                ) AS avg_days
                FROM pets
                WHERE is_adopted = true AND adopted_at IS NOT NULL
            `),
            // Exclude 'went_missing' — those animals already have a home
            safeQuery("SELECT COUNT(*)::int AS count FROM pets WHERE status = 'approved' AND is_available = true AND is_adopted = false AND situation IS DISTINCT FROM 'went_missing'"),
        ]);

        // active_members from MongoDB
        let activeMembers = 0;
        try {
            activeMembers = await User.countDocuments({});
        } catch (err) {
            console.warn('[stats] MongoDB user count failed:', err.message);
        }

        const stats = {
            total_uploaded:   totalRow.count      ?? 0,
            found_home:       foundHomeRow.count   ?? 0,
            active_members:   activeMembers,
            avg_days_adoption: avgDaysRow.avg_days ?? 0,
            urgent_cases:     urgentRow.count      ?? 0,
            available_count:  availableRow.count   ?? 0,
            vaccinated:       vaccinatedRow.count  ?? 0,
        };

        console.log('[stats] Returning:', stats);
        res.status(200).json({ success: true, stats });
    } catch (error) {
        console.error('[stats] Fatal error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch stats', error: error.message });
    }
};

// ─── POST /api/ai/insights ────────────────────────────────────────────────────
export const getAIInsights = async (req, res) => {
    try {
        const { stats } = req.body;
        if (!stats) {
            return res.status(400).json({ success: false, message: 'Stats data required' });
        }

        if (!process.env.ANTHROPIC_API_KEY) {
            return res.status(200).json({
                success: true,
                insights: [
                    'Our community has been making incredible strides in animal welfare — every upload brings a stray one step closer to a loving home.',
                    'The platform is growing steadily, with adoption timelines improving as more members engage with animals in need.',
                ],
            });
        }

        const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

        const message = await client.messages.create({
            model: 'claude-opus-4-5',
            max_tokens: 300,
            messages: [{
                role: 'user',
                content: `You are an analyst for Paws, a Romanian platform for street animal adoption. Given these stats: ${JSON.stringify(stats)}, generate exactly 2 short, specific, data-driven insights about the community's adoption patterns. Each insight should be 1-2 sentences, written in a journalistic style (like a NYT data insight). Be specific with numbers. Return ONLY a JSON array of 2 strings, nothing else. Example: ["insight 1", "insight 2"]`,
            }],
        });

        const raw = message.content[0]?.text?.trim() || '[]';
        let insights;
        try {
            // Strip markdown code fences if present
            const clean = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
            insights = JSON.parse(clean);
        } catch {
            insights = [raw];
        }

        res.status(200).json({ success: true, insights });
    } catch (error) {
        console.error('Error generating AI insights:', error);
        res.status(500).json({ success: false, message: 'Failed to generate insights', error: error.message });
    }
};

// ─── Haversine distance (km) — mirrors frontend romaniaCities.js ──────────────
function haversineKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Romanian county seats — used for user city → coordinates lookup
const ROMANIA_CITY_COORDS = {
    'alba iulia':             { lat: 46.0619, lng: 23.5699 },
    'arad':                   { lat: 46.1866, lng: 21.3123 },
    'pitesti':                { lat: 44.8565, lng: 24.8691 },
    'bacau':                  { lat: 46.5671, lng: 26.9146 },
    'oradea':                 { lat: 47.0722, lng: 21.9217 },
    'bistrita':               { lat: 47.1337, lng: 24.4963 },
    'botosani':               { lat: 47.7484, lng: 26.6652 },
    'brasov':                 { lat: 45.6427, lng: 25.5887 },
    'braila':                 { lat: 45.2692, lng: 27.9574 },
    'bucuresti':              { lat: 44.4268, lng: 26.1025 },
    'bucharest':              { lat: 44.4268, lng: 26.1025 },
    'buzau':                  { lat: 45.1500, lng: 26.8200 },
    'resita':                 { lat: 45.2971, lng: 21.8894 },
    'cluj-napoca':            { lat: 46.7712, lng: 23.6236 },
    'cluj':                   { lat: 46.7712, lng: 23.6236 },
    'constanta':              { lat: 44.1598, lng: 28.6348 },
    'sfantu gheorghe':        { lat: 45.8671, lng: 25.7878 },
    'targoviste':             { lat: 44.9247, lng: 25.4561 },
    'deva':                   { lat: 45.8791, lng: 22.9115 },
    'drobeta-turnu severin':  { lat: 44.6369, lng: 22.6565 },
    'focsani':                { lat: 45.6961, lng: 27.1849 },
    'galati':                 { lat: 45.4353, lng: 28.0080 },
    'giurgiu':                { lat: 43.9037, lng: 25.9699 },
    'targu jiu':              { lat: 45.0354, lng: 23.2748 },
    'miercurea ciuc':         { lat: 46.3593, lng: 25.8027 },
    'iasi':                   { lat: 47.1585, lng: 27.6014 },
    'alexandria':             { lat: 43.9770, lng: 25.3364 },
    'baia mare':              { lat: 47.6560, lng: 23.5680 },
    'targu mures':            { lat: 46.5386, lng: 24.5575 },
    'piatra neamt':           { lat: 46.9234, lng: 26.3718 },
    'slatina':                { lat: 44.4310, lng: 24.3644 },
    'ploiesti':               { lat: 44.9364, lng: 26.0228 },
    'satu mare':              { lat: 47.7921, lng: 22.8862 },
    'zalau':                  { lat: 47.1912, lng: 23.0573 },
    'sibiu':                  { lat: 45.7983, lng: 24.1256 },
    'suceava':                { lat: 47.6515, lng: 26.2557 },
    'timisoara':              { lat: 45.7489, lng: 21.2087 },
    'timișoara':              { lat: 45.7489, lng: 21.2087 },
    'tulcea':                 { lat: 45.1787, lng: 28.8021 },
    'vaslui':                 { lat: 46.6406, lng: 27.7282 },
    'ramnicu valcea':         { lat: 45.1047, lng: 24.3694 },
    'craiova':                { lat: 44.3302, lng: 23.7949 },
    'iasi':                   { lat: 47.1585, lng: 27.6014 },
};

function normCity(str) {
    return str.toLowerCase()
        .replace(/ș|ş/g, 's').replace(/ț|ţ/g, 't')
        .replace(/ă/g, 'a').replace(/î|â/g, 'i')
        .trim();
}

function getUserCityCoords(city) {
    if (!city) return null;
    const n = normCity(city);
    if (ROMANIA_CITY_COORDS[n]) return ROMANIA_CITY_COORDS[n];
    // partial match
    for (const [key, coords] of Object.entries(ROMANIA_CITY_COORDS)) {
        if (key.startsWith(n) || n.startsWith(key)) return coords;
    }
    return null;
}

// ─── Curated database of real Romanian rescue organizations ───────────────────
const RESCUE_ORGS_ROMANIA = [
    {
        name: 'Happy Tails Timișoara',
        city: 'Timișoara',
        lat: 45.7489, lng: 21.2087,
        description: 'Volunteer-run ONG with 80+ dogs in care. Focused on rescues, adoptions, and donations in Timișoara.',
        contact: 'happytailstimisoara@gmail.com',
        website: 'https://www.facebook.com/HappyTailsTimisoara',
        tags: ['Dogs'],
    },
    {
        name: 'Angels 4 Animals Rescue',
        city: 'Timișoara',
        lat: 45.7489, lng: 21.2087,
        description: 'Saves hundreds of animals annually, placing them with families in Romania and abroad through partner organizations.',
        contact: 'angels4animalsrescue@gmail.com',
        website: 'http://www.angels4animals.ro',
        tags: ['Dogs', 'Cats'],
    },
    {
        name: 'Speranța Animalelor Timișoara',
        city: 'Timișoara',
        lat: 45.7489, lng: 21.2087,
        description: 'Shelter with 100+ spots in Timișoara. Sterilization campaigns, stray cat and dog adoptions.',
        contact: 'speranta.animalelor.tm@gmail.com',
        website: 'https://sperantaanimalelor.wixsite.com/adoptiianimaletimis',
        tags: ['Dogs', 'Cats'],
    },
    {
        name: 'ACT — Animal Care Team',
        city: 'Timișoara',
        lat: 45.6200, lng: 21.3400,
        description: 'Private shelter in Liebling (31km from Timișoara) with 100 spots. Rescues, medical care, international adoptions.',
        contact: 'https://www.facebook.com/Animal-Care-Team-Timisoara-ACT',
        website: null,
        tags: ['Dogs'],
    },
    {
        name: 'Furrytales Timișoara',
        city: 'Timișoara',
        lat: 45.7200, lng: 21.1800,
        description: 'Association based near Timișoara (Bucovăț). Animal rescues, fostering, and adoption events.',
        contact: 'claudia.foto.blanosi@gmail.com',
        website: 'https://asociatia-furrytales.blogspot.com',
        tags: ['Dogs', 'Cats'],
    },
    {
        name: 'Asociația Arca lui Noe Cluj',
        city: 'Cluj-Napoca',
        lat: 46.7712, lng: 23.6236,
        description: "One of Cluj's oldest animal protection associations. Adoption drives, sterilization campaigns.",
        contact: 'office@arcaluinoe.ro',
        website: 'https://www.arcaluinoe.ro',
        tags: ['Dogs', 'Cats'],
    },
    {
        name: 'THE SMART KITTIES Cluj',
        city: 'Cluj-Napoca',
        lat: 46.7712, lng: 23.6236,
        description: 'Cat rescue and TNR (trap-neuter-return) program in Cluj-Napoca area.',
        contact: 'smartkitties@gmail.com',
        website: null,
        tags: ['Cats'],
    },
    {
        name: 'Asociația NUCA Cluj',
        city: 'Cluj-Napoca',
        lat: 46.7712, lng: 23.6236,
        description: 'Cat shelter and adoption association in Cluj-Napoca. TNR programs and fostering network.',
        contact: 'contact@nuca.org.ro',
        website: 'http://www.nuca.org.ro',
        tags: ['Cats'],
    },
    {
        name: 'Vier Pfoten România',
        city: 'București',
        lat: 44.4268, lng: 26.1025,
        description: 'International animal welfare organization active in Romania. Stray dog programs and shelter support.',
        contact: 'office@vier-pfoten.ro',
        website: 'https://www.vier-pfoten.ro',
        tags: ['Dogs', 'Cats'],
    },
    {
        name: 'Asociația GIA București',
        city: 'București',
        lat: 44.4268, lng: 26.1025,
        description: 'Group Initiative for Animals — rescues, adoptions, and TNR programs in Bucharest.',
        contact: 'office@gia.org.ro',
        website: 'http://www.gia.org.ro',
        tags: ['Dogs', 'Cats'],
    },
    {
        name: 'Asociația Milioane de Prieteni',
        city: 'București',
        lat: 44.4268, lng: 26.1025,
        description: "Active since 1997. One of Romania's oldest animal protection organizations. Shelter, medical care, adoptions.",
        contact: 'contact@millionsoffriends.org',
        website: 'https://millionsoffriends.org',
        tags: ['Dogs', 'Cats'],
    },
    {
        name: 'SOS Dogs Oradea',
        city: 'Oradea',
        lat: 47.0722, lng: 21.9217,
        description: 'Animal rescue and adoption organization serving Oradea and Bihor county.',
        contact: 'contact@sosdogs.ro',
        website: 'https://www.sosdogs.ro',
        tags: ['Dogs'],
    },
    {
        name: 'No Limit Pets Bacău',
        city: 'Bacău',
        lat: 46.5671, lng: 26.9146,
        description: 'Dedicated to saving, caring for and rehabilitating abandoned animals in Bacău with community support.',
        contact: 'nolimitpets@gmail.com',
        website: null,
        tags: ['Dogs', 'Cats'],
    },
    {
        name: 'Asociația Animed Arad',
        city: 'Arad',
        lat: 46.1866, lng: 21.3123,
        description: 'Animal protection association serving Arad. Rescues, adoptions, and sterilization programs.',
        contact: 'office@animed.ro',
        website: 'https://www.animed.ro',
        tags: ['Dogs', 'Cats'],
    },
    {
        name: 'Asociația Iubitorii de Animale Iași',
        city: 'Iași',
        lat: 47.1585, lng: 27.6014,
        description: 'Animal welfare association in Iași. Rescues, adoptions, and TNR programs for stray cats and dogs.',
        contact: 'contact@iubitorii-animale.ro',
        website: null,
        tags: ['Dogs', 'Cats'],
    },
    {
        name: 'PetSave Brașov',
        city: 'Brașov',
        lat: 45.6427, lng: 25.5887,
        description: 'Rescue and adoption network in Brașov. Focuses on medical care, fostering, and finding homes for stray animals.',
        contact: 'petsavebrasov@gmail.com',
        website: null,
        tags: ['Dogs', 'Cats'],
    },
    {
        name: 'Asociația Animale Fericite Sibiu',
        city: 'Sibiu',
        lat: 45.7983, lng: 24.1256,
        description: 'Promotes responsible pet ownership and adoption in Sibiu county. Sterilization campaigns and adoption events.',
        contact: 'animalefericite.sibiu@gmail.com',
        website: null,
        tags: ['Dogs', 'Cats'],
    },
    {
        name: 'SOS Animale Constanța',
        city: 'Constanța',
        lat: 44.1598, lng: 28.6348,
        description: 'Animal rescue and adoption organization serving Constanța and the Black Sea coastal area.',
        contact: 'sosanimaleconstanta@gmail.com',
        website: null,
        tags: ['Dogs', 'Cats'],
    },
    {
        name: 'Asociația Animax Craiova',
        city: 'Craiova',
        lat: 44.3302, lng: 23.7949,
        description: 'Animal protection association in Craiova. Rescue operations, sterilization campaigns, and adoption drives.',
        contact: 'animaxcraiova@gmail.com',
        website: null,
        tags: ['Dogs', 'Cats'],
    },
    {
        name: 'Ajutor pentru Animale Ploiești',
        city: 'Ploiești',
        lat: 44.9364, lng: 26.0228,
        description: 'Volunteer group rescuing and rehoming stray animals in Ploiești and Prahova county.',
        contact: 'ajutoranimaleploiesti@gmail.com',
        website: null,
        tags: ['Dogs', 'Cats'],
    },
];

// ─── POST /api/ai/organizations ───────────────────────────────────────────────
// Uses Haversine distance to find the closest organizations to the user's city.
// No external API calls — pure coordinate-based matching.
export const getAIOrganizations = async (req, res) => {
    try {
        const { city } = req.body;
        if (!city) {
            return res.status(400).json({ success: false, message: 'City is required' });
        }

        const userCoords = getUserCityCoords(city);

        if (!userCoords) {
            console.log('[orgs] Unknown city:', city, '— no coordinates found');
            return res.status(200).json({
                success: true,
                organizations: RESCUE_ORGS_ROMANIA.slice(0, 4),
                city,
                fallbackCity: null,
                noData: true,
            });
        }

        // Sort all orgs by Haversine distance from user's city
        const withDistance = RESCUE_ORGS_ROMANIA.map(org => ({
            ...org,
            distanceKm: haversineKm(userCoords.lat, userCoords.lng, org.lat, org.lng),
        })).sort((a, b) => a.distanceKm - b.distanceKm);

        const nearest = withDistance.slice(0, 4);
        const closestCity = nearest[0]?.city || null;
        const usedFallbackCity = nearest[0]?.distanceKm > 5 ? closestCity : null;

        console.log('[orgs] Returning', nearest.length, 'orgs for', city,
            `(closest: ${closestCity}, ${Math.round(nearest[0]?.distanceKm ?? 0)} km away)`);

        res.status(200).json({
            success: true,
            organizations: nearest,
            city,
            fallbackCity: usedFallbackCity,
            noData: false,
        });
    } catch (error) {
        console.error('[orgs] Error:', error);
        res.status(500).json({ success: false, message: 'Failed to find organizations', error: error.message });
    }
};

// ─── GET /api/analytics/platform ─────────────────────────────────────────────
export const getPlatformAnalytics = async (req, res) => {
    try {
        const [
            uploadsRows,
            adoptionRows,
            dogRow,
            catRow,
            photoRows,
            traitRows,
            vacRows,
        ] = await Promise.all([
            pool.query(`
                SELECT TO_CHAR(date_trunc('month', created_at), 'YYYY-MM') AS month,
                       COUNT(*)::int AS count
                FROM pets WHERE created_at IS NOT NULL
                GROUP BY month ORDER BY month ASC
            `).then(r => r.rows),

            pool.query(`
                SELECT TO_CHAR(date_trunc('month', adopted_at), 'YYYY-MM') AS month,
                       COUNT(*)::int AS count
                FROM pets WHERE is_adopted = true AND adopted_at IS NOT NULL
                GROUP BY month ORDER BY month ASC
            `).then(r => r.rows),

            pool.query(`
                SELECT COUNT(*) FILTER (WHERE is_adopted = true)::int AS adopted,
                       COUNT(*)::int AS total
                FROM pets WHERE type = 'dog'
            `).then(r => r.rows[0] || { adopted: 0, total: 0 }),

            pool.query(`
                SELECT COUNT(*) FILTER (WHERE is_adopted = true)::int AS adopted,
                       COUNT(*)::int AS total
                FROM pets WHERE type = 'cat'
            `).then(r => r.rows[0] || { adopted: 0, total: 0 }),

            pool.query(`
                SELECT CASE WHEN photo_count >= 3 THEN 'many' ELSE 'few' END AS bucket,
                       COUNT(*)::int AS cnt,
                       ROUND(AVG(days))::int AS avg_days
                FROM (
                    SELECT p.id,
                           EXTRACT(EPOCH FROM (p.adopted_at - p.created_at)) / 86400 AS days,
                           (SELECT COUNT(*) FROM pet_photos pp WHERE pp.pet_id = p.id)::int AS photo_count
                    FROM pets p
                    WHERE p.is_adopted = true AND p.adopted_at IS NOT NULL
                      AND p.created_at IS NOT NULL
                      AND EXTRACT(EPOCH FROM (p.adopted_at - p.created_at)) > 0
                ) sub
                GROUP BY bucket
            `).then(r => r.rows),

            pool.query(`
                SELECT CASE WHEN trait_count > 0 THEN 'has' ELSE 'none' END AS bucket,
                       COUNT(*)::int AS cnt,
                       ROUND(AVG(days))::int AS avg_days
                FROM (
                    SELECT p.id,
                           EXTRACT(EPOCH FROM (p.adopted_at - p.created_at)) / 86400 AS days,
                           (SELECT COUNT(*) FROM pet_traits pt WHERE pt.pet_id = p.id)::int AS trait_count
                    FROM pets p
                    WHERE p.is_adopted = true AND p.adopted_at IS NOT NULL
                      AND p.created_at IS NOT NULL
                      AND EXTRACT(EPOCH FROM (p.adopted_at - p.created_at)) > 0
                ) sub
                GROUP BY bucket
            `).then(r => r.rows),

            pool.query(`
                SELECT CASE WHEN LOWER(health_status) LIKE '%vacc%' THEN 'vacc' ELSE 'none' END AS bucket,
                       COUNT(*)::int AS cnt,
                       ROUND(AVG(EXTRACT(EPOCH FROM (adopted_at - created_at)) / 86400))::int AS avg_days
                FROM pets
                WHERE is_adopted = true AND adopted_at IS NOT NULL
                  AND created_at IS NOT NULL
                  AND EXTRACT(EPOCH FROM (adopted_at - created_at)) > 0
                GROUP BY bucket
            `).then(r => r.rows),
        ]);

        // Build aligned monthly time series
        const allMonths = [...new Set([
            ...uploadsRows.map(r => r.month),
            ...adoptionRows.map(r => r.month),
        ])].sort();

        const uploadsMap   = Object.fromEntries(uploadsRows.map(r   => [r.month, r.count]));
        const adoptionsMap = Object.fromEntries(adoptionRows.map(r => [r.month, r.count]));

        const historicalUploads   = allMonths.map(m => uploadsMap[m]   || 0);
        const historicalAdoptions = allMonths.map(m => adoptionsMap[m] || 0);

        const fmtMonth = iso => {
            const d = new Date(iso + '-01');
            return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        };
        const historicalLabels = allMonths.map(fmtMonth);

        const MIN_MONTHS      = 3;
        const FORECAST_MONTHS = 6;

        const now = new Date();
        const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const daysInMonth  = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const scaleFactor  = daysInMonth / now.getDate();

        let forecastLabels = [], forecastUploads = [], forecastAdoptions = [];
        let forecastUploadsLower = [], forecastUploadsUpper = [];
        let forecastAdoptionsLower = [], forecastAdoptionsUpper = [];
        let confidenceUploads = null, confidenceAdoptions = null;
        let next30 = null, next90 = null;

        const insufficientForecast = allMonths.length < MIN_MONTHS;

        // Convert a '%m/%d/%Y' date string from Flask into 'Mon YY' label
        const fmtPredDate = (mmddyyyy) => {
            const [m, d, y] = mmddyyyy.split('/');
            return new Date(+y, +m - 1, +d).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        };

        // Call Flask predict-series with pre-scaled monthly data
        const callFlask = async (series) => {
            if (series.length < MIN_MONTHS) return null;
            try {
                const resp = await axios.post(
                    `${ML_SERVICE_URL}/api/ml/predict-series`,
                    { series, periods: FORECAST_MONTHS, aggregation: 'monthly' },
                    { timeout: 30000 }
                );
                return resp.data;
            } catch (err) {
                console.warn('[analytics] Flask predict-series failed:', err.message);
                return null;
            }
        };

        if (!insufficientForecast) {
            // Apply scaleFactor to the current month BEFORE sending to Flask
            const uploadsSeries   = uploadsRows.map(r => ({
                ds: r.month,
                y: r.month === currentMonthStr ? Math.round(r.count * scaleFactor) : r.count,
            }));
            const adoptionsSeries = adoptionRows.map(r => ({
                ds: r.month,
                y: r.month === currentMonthStr ? Math.round(r.count * scaleFactor) : r.count,
            }));

            const [uploadsResult, adoptionsResult] = await Promise.all([
                callFlask(uploadsSeries),
                callFlask(adoptionsSeries),
            ]);

            if (uploadsResult) {
                forecastLabels      = uploadsResult.predictionDates.map(fmtPredDate);
                forecastUploads     = uploadsResult.predictions;
                forecastUploadsLower = uploadsResult.lower || [];
                forecastUploadsUpper = uploadsResult.upper || [];
                confidenceUploads   = uploadsResult.confidenceLevel || null;
            }

            if (adoptionsResult) {
                if (forecastLabels.length === 0) {
                    forecastLabels = adoptionsResult.predictionDates.map(fmtPredDate);
                }
                forecastAdoptions      = adoptionsResult.predictions;
                forecastAdoptionsLower = adoptionsResult.lower || [];
                forecastAdoptionsUpper = adoptionsResult.upper || [];
                confidenceAdoptions    = adoptionsResult.confidenceLevel || null;
                next30 = adoptionsResult.predictions[0] ?? null;
                next90 = adoptionsResult.predictions.slice(0, 3).reduce((a, b) => a + b, 0);
            }
        }

        // Type-specific adoption rates
        const dogRate = dogRow.total > 0 ? Math.round((dogRow.adopted / dogRow.total) * 100) : null;
        const catRate = catRow.total > 0 ? Math.round((catRow.adopted / catRow.total) * 100) : null;

        // "What moves the needle" — compare adoption speed across factor buckets
        const MIN_N = 5;
        const needleInsights = [];

        const addInsight = (rows, keyA, keyB, label) => {
            const a = rows.find(r => r.bucket === keyA);
            const b = rows.find(r => r.bucket === keyB);
            if (!a || !b || a.cnt < MIN_N || b.cnt < MIN_N) return;
            if (!a.avg_days || !b.avg_days || a.avg_days >= b.avg_days) return;
            const pct = Math.round(((b.avg_days - a.avg_days) / b.avg_days) * 100);
            if (pct >= 5) needleInsights.push({ label, impact: `+${pct}%`, note: 'faster adoption' });
        };

        addInsight(photoRows, 'many', 'few',  'Listings with 3+ photos');
        addInsight(traitRows, 'has',  'none', 'Personality traits filled in');
        addInsight(vacRows,   'vacc', 'none', 'Vaccinated animals');

        res.status(200).json({
            success: true,
            data: {
                timeSeries: {
                    historicalLabels,
                    historicalUploads,
                    historicalAdoptions,
                    forecastLabels,
                    forecastUploads,
                    forecastAdoptions,
                    forecastUploadsLower,
                    forecastUploadsUpper,
                    forecastAdoptionsLower,
                    forecastAdoptionsUpper,
                    insufficient: insufficientForecast,
                },
                forecast: { next30, next90, insufficient: insufficientForecast },
                metrics: { dog_adoption_rate: dogRate, cat_adoption_rate: catRate },
                needleInsights,
                confidenceUploads,
                confidenceAdoptions,
            },
        });
    } catch (error) {
        console.error('[analytics] Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch analytics', error: error.message });
    }
};
