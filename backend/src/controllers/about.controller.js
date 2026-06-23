// controllers/about.controller.js
import { pool } from '../config/database/connectPostgresDB.js';
import { User } from '../models/user.model.js';
import Anthropic from '@anthropic-ai/sdk';

// ─── Forecast helpers ─────────────────────────────────────────────────────────
function linReg(values) {
    const n = values.length;
    if (n <= 1) return { slope: 0, intercept: values[0] || 0 };
    const meanX = (n - 1) / 2;
    const meanY = values.reduce((a, b) => a + b, 0) / n;
    let num = 0, den = 0;
    for (let i = 0; i < n; i++) {
        num += (i - meanX) * (values[i] - meanY);
        den += (i - meanX) ** 2;
    }
    const slope = den !== 0 ? num / den : 0;
    return { slope, intercept: meanY - slope * meanX };
}

function forecastSteps(values, steps) {
    if (values.length === 0) return Array(steps).fill(0);
    if (values.length < 2) return Array(steps).fill(Math.max(0, Math.round(values[0])));
    const { slope, intercept } = linReg(values);
    const n = values.length;
    return Array.from({ length: steps }, (_, i) =>
        Math.max(0, Math.round(intercept + slope * (n + i)))
    );
}

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
        ] = await Promise.all([
            safeQuery('SELECT COUNT(*)::int AS count FROM pets'),
            // is_adopted added by migration — safe fallback if column missing
            safeQuery('SELECT COUNT(*)::int AS count FROM pets WHERE is_adopted = true'),
            safeQuery("SELECT COUNT(*)::int AS count FROM pets WHERE is_available = true AND adoption_status = 'available' AND is_adopted = false"),
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
            available_count:  urgentRow.count      ?? 0,
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

// ─── Curated database of real Romanian rescue organizations ───────────────────
const RESCUE_ORGS_ROMANIA = [
    {
        name: 'Happy Tails Timișoara',
        city: 'timisoara',
        description: 'Volunteer-run ONG with 80+ dogs in care. Focused on rescues, adoptions, and donations in Timișoara.',
        contact: 'happytailstimisoara@gmail.com',
        website: 'https://www.facebook.com/HappyTailsTimisoara',
        tags: ['Dogs'],
    },
    {
        name: 'Angels 4 Animals Rescue',
        city: 'timisoara',
        description: 'Saves hundreds of animals annually, placing them with families in Romania and abroad through partner organizations.',
        contact: 'angels4animalsrescue@gmail.com',
        website: 'http://www.angels4animals.ro',
        tags: ['Dogs', 'Cats'],
    },
    {
        name: 'Speranța Animalelor Timișoara',
        city: 'timisoara',
        description: 'Shelter with 100+ spots in Timișoara. Sterilization campaigns, stray cat and dog adoptions.',
        contact: 'speranta.animalelor.tm@gmail.com',
        website: 'https://sperantaanimalelor.wixsite.com/adoptiianimaletimis',
        tags: ['Dogs', 'Cats'],
    },
    {
        name: 'ACT — Animal Care Team',
        city: 'timisoara',
        description: 'Private shelter in Liebling (31km from Timișoara) with 100 spots. Rescues, medical care, international adoptions.',
        contact: 'https://www.facebook.com/Animal-Care-Team-Timisoara-ACT',
        website: null,
        tags: ['Dogs'],
    },
    {
        name: 'Furrytales Timișoara',
        city: 'timisoara',
        description: 'Association based near Timișoara (Bucovăț). Animal rescues, fostering, and adoption events.',
        contact: 'claudia.foto.blanosi@gmail.com',
        website: 'https://asociatia-furrytales.blogspot.com',
        tags: ['Dogs', 'Cats'],
    },
    {
        name: 'Asociația Arca lui Noe Cluj',
        city: 'cluj',
        description: "One of Cluj's oldest animal protection associations. Adoption drives, sterilization campaigns.",
        contact: 'office@arcaluinoe.ro',
        website: 'https://www.arcaluinoe.ro',
        tags: ['Dogs', 'Cats'],
    },
    {
        name: 'THE SMART KITTIES Cluj',
        city: 'cluj',
        description: 'Cat rescue and TNR (trap-neuter-return) program in Cluj-Napoca area.',
        contact: 'smartkitties@gmail.com',
        website: null,
        tags: ['Cats'],
    },
    {
        name: 'Asociația NUCA Cluj',
        city: 'cluj',
        description: 'Cat shelter and adoption association in Cluj-Napoca. TNR programs and fostering network.',
        contact: 'contact@nuca.org.ro',
        website: 'http://www.nuca.org.ro',
        tags: ['Cats'],
    },
    {
        name: 'Vier Pfoten România',
        city: 'bucuresti',
        description: 'International animal welfare organization active in Romania. Stray dog programs and shelter support.',
        contact: 'office@vier-pfoten.ro',
        website: 'https://www.vier-pfoten.ro',
        tags: ['Dogs', 'Cats'],
    },
    {
        name: 'Asociația GIA București',
        city: 'bucuresti',
        description: 'Group Initiative for Animals — rescues, adoptions, and TNR programs in Bucharest.',
        contact: 'office@gia.org.ro',
        website: 'http://www.gia.org.ro',
        tags: ['Dogs', 'Cats'],
    },
    {
        name: 'Asociația Milioane de Prieteni',
        city: 'bucuresti',
        description: 'Active since 1997. One of Romania\'s oldest animal protection organizations. Shelter, medical care, adoptions.',
        contact: 'contact@millionsoffriends.org',
        website: 'https://millionsoffriends.org',
        tags: ['Dogs', 'Cats'],
    },
    {
        name: 'SOS Dogs Oradea',
        city: 'oradea',
        description: 'Animal rescue and adoption organization serving Oradea and Bihor county.',
        contact: 'contact@sosdogs.ro',
        website: 'https://www.sosdogs.ro',
        tags: ['Dogs'],
    },
    {
        name: 'No Limit Pets Bacău',
        city: 'bacau',
        description: 'Dedicated to saving, caring for and rehabilitating abandoned animals in Bacău with community support.',
        contact: 'nolimitpets@gmail.com',
        website: null,
        tags: ['Dogs', 'Cats'],
    },
    {
        name: 'Asociația Animed Arad',
        city: 'arad',
        description: 'Animal protection association serving Arad. Rescues, adoptions, and sterilization programs.',
        contact: 'office@animed.ro',
        website: 'https://www.animed.ro',
        tags: ['Dogs', 'Cats'],
    },
];

// Normalize diacritics and casing for fuzzy city matching
const normalizeCity = (str) =>
    str.toLowerCase()
        .replace(/ș|ş/g, 's').replace(/ț|ţ/g, 't')
        .replace(/ă/g, 'a').replace(/î/g, 'i').replace(/â/g, 'a');

// ─── POST /api/ai/organizations ───────────────────────────────────────────────
export const getAIOrganizations = async (req, res) => {
    try {
        const { city } = req.body;
        if (!city) {
            return res.status(400).json({ success: false, message: 'City is required' });
        }

        const cityNorm = normalizeCity(city);
        const firstWord = cityNorm.split(/[\s-]/)[0]; // handle "Cluj-Napoca", "Baia Mare", etc.

        // Step 1 — exact/substring match against curated DB
        let matches = RESCUE_ORGS_ROMANIA.filter(org =>
            cityNorm.includes(org.city) || org.city.includes(firstWord)
        );

        let usedFallbackCity = null;

        // Step 2 — if no match, ask Claude to pick the closest city from our list
        if (matches.length === 0) {
            const cities = [...new Set(RESCUE_ORGS_ROMANIA.map(o => o.city))];
            console.log('[orgs] No direct match for', city, '— asking Claude for closest city in:', cities);

            if (process.env.ANTHROPIC_API_KEY) {
                try {
                    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
                    const msg = await client.messages.create({
                        model: 'claude-opus-4-5',
                        max_tokens: 50,
                        messages: [{
                            role: 'user',
                            content: `The user is looking for animal rescue organizations in "${city}", Romania. Which of these cities is closest or most relevant: ${cities.join(', ')}? Reply with ONLY the city name from the list, nothing else.`,
                        }],
                    });
                    const suggested = msg.content[0]?.text?.trim().toLowerCase() || '';
                    console.log('[orgs] Claude suggested city:', suggested);
                    matches = RESCUE_ORGS_ROMANIA.filter(org => org.city === suggested);
                    if (matches.length > 0) usedFallbackCity = suggested;
                } catch (aiErr) {
                    console.warn('[orgs] Claude city suggestion failed:', aiErr.message);
                }
            }
        } else {
            // Matched a different city than typed (e.g. typed "Cluj-Napoca", matched "cluj")
            const matchedCity = matches[0]?.city;
            if (matchedCity && !cityNorm.includes(matchedCity)) {
                usedFallbackCity = matchedCity;
            }
        }

        // Step 3 — generic fallback: first 4 from entire list
        if (matches.length === 0) {
            console.log('[orgs] No AI match either — returning generic top-4 fallback');
            matches = RESCUE_ORGS_ROMANIA.slice(0, 4);
            usedFallbackCity = 'general';
        }

        const result = matches.slice(0, 4);
        console.log('[orgs] Returning', result.length, 'organizations for', city,
            usedFallbackCity ? `(fallback city: ${usedFallbackCity})` : '');

        res.status(200).json({
            success: true,
            organizations: result,
            city,
            fallbackCity: usedFallbackCity,  // frontend uses this to show the "nearest area" note
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
        let forecastLabels = [], forecastUploads = [], forecastAdoptions = [];
        let next30 = null, next90 = null;

        // Scale the current (partial) month's counts to a projected full-month
        // value so the regression isn't pulled downward by an incomplete month.
        const now = new Date();
        const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const daysInMonth  = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const scaleFactor  = daysInMonth / now.getDate();

        const regressionUploads   = allMonths.map(m => {
            const v = uploadsMap[m] || 0;
            return m === currentMonthStr ? Math.round(v * scaleFactor) : v;
        });
        const regressionAdoptions = allMonths.map(m => {
            const v = adoptionsMap[m] || 0;
            return m === currentMonthStr ? Math.round(v * scaleFactor) : v;
        });

        if (allMonths.length >= MIN_MONTHS) {
            forecastUploads   = forecastSteps(regressionUploads,   FORECAST_MONTHS);
            forecastAdoptions = forecastSteps(regressionAdoptions, FORECAST_MONTHS);

            let d = new Date(allMonths[allMonths.length - 1] + '-01');
            for (let i = 0; i < FORECAST_MONTHS; i++) {
                d = new Date(d.getFullYear(), d.getMonth() + 1, 1);
                forecastLabels.push(d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));
            }
            next30 = forecastAdoptions[0];
            next90 = forecastAdoptions.slice(0, 3).reduce((a, b) => a + b, 0);
        }

        const insufficientForecast = allMonths.length < MIN_MONTHS;

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
                    insufficient: insufficientForecast,
                },
                forecast: { next30, next90, insufficient: insufficientForecast },
                metrics: { dog_adoption_rate: dogRate, cat_adoption_rate: catRate },
                needleInsights,
            },
        });
    } catch (error) {
        console.error('[analytics] Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch analytics', error: error.message });
    }
};
