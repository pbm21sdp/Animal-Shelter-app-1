/**
 * redistributeAdoptionDates.js
 *
 * Redistributes timestamps for all is_adopted=true pets so the ML prediction
 * model has realistic historical data spread over ~3 months.
 *
 * STRICT chronological order enforced per pet:
 *   pets.created_at  <  pets.reviewed_at  <  notifications.created_at  <  pets.adopted_at
 *
 * Fields updated:
 *   pets            : created_at, reviewed_at, adopted_at, updated_at
 *   notifications   : created_at  (only for animal_approved notifications
 *                     linked to affected pets, to preserve the review timeline)
 *
 * Distribution strategy (adopted_at):
 *   r^1.5 bias toward recent dates:
 *   ≈49% last 30 days · 31% in 30-60 days · 20% in 60-88 days
 *   Simulates a growing platform with increasing adoption activity.
 *
 * Listing-to-reviewed gap : 1 to min(5, listing_days−2) days after created_at
 * Notification offset     : reviewed_at + 1-30 minutes (admin action → system notification)
 * Listing-to-adopted gap  : 3 to 30 days (randomised per animal)
 *
 * Usage:
 *   node scripts/redistributeAdoptionDates.js            # DRY RUN (safe preview)
 *   node scripts/redistributeAdoptionDates.js --confirm  # Write to DB
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

// ─── Configuration ────────────────────────────────────────────────────────────

const CONFIRM = process.argv.includes('--confirm');

const WINDOW_DAYS       = 88;   // adopted_at window: last ~3 months
const MIN_LISTING_DAYS  = 6;    // min gap: created_at → adopted_at (raised to 6 to fit review)
const MAX_LISTING_DAYS  = 30;   // max gap: created_at → adopted_at
const PLATFORM_DAYS     = 120;  // platform "birth" floor: never older than this

// ─── Helpers ──────────────────────────────────────────────────────────────────

const pool = new pg.Pool({
    host:     process.env.DB_HOST,
    port:     process.env.DB_PORT,
    user:     process.env.DB_USER,
    password: String(process.env.DB_PASSWORD),
    database: process.env.DB_NAME,
});

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/** Timestamp during working hours (UTC 07:00-18:00) on a given Date. */
const bizTime = (date, offsetMinutes = 0) => {
    const d = new Date(date);
    d.setUTCHours(randInt(7, 18), randInt(0, 59), randInt(0, 59), 0);
    return offsetMinutes ? new Date(d.getTime() + offsetMinutes * 60_000) : d;
};

/**
 * Biased random: r^1.5 gives ≈49% of values < 30 days ago (recent),
 * 31% in 30-60 days, 20% in 60-88 days. Simulates a growing platform.
 * Minimum 6 days ago so no adoption lands in the last 5 days.
 */
const biasedDaysAgo = () =>
    Math.round(Math.pow(Math.random(), 1.5) * (WINDOW_DAYS - 6)) + 6;

/** "YYYY-MM-DD HH:MM:SS" for console display. */
const fmt = (d) => d ? new Date(d).toISOString().replace('T', ' ').substring(0, 19) : 'NULL               ';

const pad = (s, n) => String(s ?? '').substring(0, n).padEnd(n);

// ─── Main ─────────────────────────────────────────────────────────────────────

const main = async () => {
    const now           = new Date();
    const platformFloor = new Date(now.getTime() - PLATFORM_DAYS * 86_400_000);

    console.log('\n' + '═'.repeat(80));
    console.log('  REDISTRIBUTE ADOPTION DATES — Paws Shelter Platform');
    console.log('═'.repeat(80));
    console.log(`  Mode     : ${CONFIRM ? '⚡ WRITE (--confirm)' : '👁  DRY RUN (preview only)'}`);
    console.log(`  Window   : last ${WINDOW_DAYS} days  (${new Date(now - WINDOW_DAYS * 86_400_000).toDateString()} → today)`);
    console.log(`  Gap      : ${MIN_LISTING_DAYS}-${MAX_LISTING_DAYS} days from created_at to adopted_at`);
    console.log(`  Floor    : ${platformFloor.toDateString()}  (${PLATFORM_DAYS} days ago)`);
    console.log('');

    // ── Fetch adopted pets (with reviewed_at) ────────────────────────────────
    const { rows: pets } = await pool.query(
        `SELECT id, name, type, created_at, reviewed_at, adopted_at
         FROM pets
         WHERE is_adopted = true
         ORDER BY id`
    );

    // Fetch ALL notifications linked to adopted pets (any type)
    let notifRows = [];
    try {
        const { rows } = await pool.query(
            `SELECT n.id, n.related_animal_id, n.type, n.created_at
             FROM notifications n
             WHERE n.related_animal_id IN (
                 SELECT id FROM pets WHERE is_adopted = true
             )
             ORDER BY n.related_animal_id, n.created_at`
        );
        notifRows = rows;
    } catch {
        // notifications table may not exist in this environment
    }

    console.log(`  Found ${pets.length} adopted pet(s),  ${notifRows.length} linked notification(s).\n`);

    if (pets.length === 0) {
        console.log('  Nothing to redistribute. Exiting.\n');
        await pool.end();
        return;
    }

    // ── Generate new dates with STRICT chronological order ───────────────────
    const updates = pets.map(pet => {
        // 1. adopted_at — biased-recent random within window
        const daysAgo      = biasedDaysAgo();
        const newAdoptedAt = bizTime(new Date(now.getTime() - daysAgo * 86_400_000));

        // 2. created_at — MIN_LISTING_DAYS to MAX_LISTING_DAYS before adopted_at
        const listingDays = randInt(MIN_LISTING_DAYS, MAX_LISTING_DAYS);
        let createdBase   = new Date(newAdoptedAt.getTime() - listingDays * 86_400_000);

        // Clamp to platform floor
        if (createdBase < platformFloor) {
            createdBase = new Date(platformFloor.getTime() + randInt(0, 3) * 86_400_000);
        }
        // Safety: created_at must be strictly before adopted_at
        if (createdBase >= newAdoptedAt) {
            createdBase = new Date(newAdoptedAt.getTime() - MIN_LISTING_DAYS * 86_400_000);
        }

        const newCreatedAt = bizTime(createdBase);

        // 3. reviewed_at — 1 to min(5, listingDays-2) days after created_at
        //    Leaves at least 2 clear days between review and adoption.
        const reviewWindowDays = Math.max(1, listingDays - 2);
        const reviewOffsetDays = randInt(1, Math.min(5, reviewWindowDays));
        const reviewBase       = new Date(newCreatedAt.getTime() + reviewOffsetDays * 86_400_000);

        // Safety: reviewed_at must be strictly before adopted_at
        const newReviewedAt = reviewBase < newAdoptedAt
            ? bizTime(reviewBase)
            : new Date(newCreatedAt.getTime() + Math.floor(listingDays / 2) * 86_400_000);

        // 4. Notifications for this pet: shift created_at to reviewed_at + 1-30 min
        const petNotifs = notifRows.filter(n => n.related_animal_id === pet.id);
        const notifUpdates = petNotifs.map(n => ({
            id:         n.id,
            type:       n.type,
            oldDate:    n.created_at,
            newDate:    new Date(newReviewedAt.getTime() + randInt(1, 30) * 60_000),
        }));

        return {
            id:            pet.id,
            name:          pet.name,
            type:          pet.type || '',
            oldCreatedAt:  pet.created_at,
            oldReviewedAt: pet.reviewed_at,
            oldAdoptedAt:  pet.adopted_at,
            newCreatedAt,
            newReviewedAt,
            newAdoptedAt,
            listingDays,
            reviewOffsetDays,
            daysAgo,
            notifUpdates,
        };
    });

    // ── Preview: main dates table ─────────────────────────────────────────────
    console.log('DATES BEFORE → AFTER (all 9 animals)');
    console.log('─'.repeat(100));
    console.log(
        pad('ID',   4) + ' ' +
        pad('Name', 20) + ' ' +
        pad('Type', 7) + '  ' +
        pad('created_at NEW',   19) + '  ' +
        pad('reviewed_at NEW',  19) + '  ' +
        pad('adopted_at NEW',   19) + '  ' +
        'Gap(days)'
    );
    console.log('─'.repeat(100));

    updates.forEach(u => {
        // Verify strict order
        const ok = u.newCreatedAt < u.newReviewedAt && u.newReviewedAt < u.newAdoptedAt;
        const badge = ok ? '✓' : '✗';
        console.log(
            pad(u.id,           4) + ' ' +
            pad(u.name,        20) + ' ' +
            pad(u.type,         7) + ' ' +
            badge + ' ' +
            fmt(u.newCreatedAt)  + '  ' +
            fmt(u.newReviewedAt) + '  ' +
            fmt(u.newAdoptedAt)  + '  ' +
            `created→review: ${u.reviewOffsetDays}d  review→adopt: ${u.listingDays - u.reviewOffsetDays}d`
        );
    });
    console.log('─'.repeat(100));

    // ── Preview: notifications fix table ─────────────────────────────────────
    const allNotifUpdates = updates.flatMap(u => u.notifUpdates);

    console.log('\nNOTIFICATIONS — BEFORE → AFTER');
    console.log('─'.repeat(95));
    if (allNotifUpdates.length === 0) {
        console.log('  (no notifications linked to adopted pets)');
    } else {
        console.log(
            pad('Notif#', 7) + ' ' +
            pad('Pet ID', 6) + ' ' +
            pad('Pet name', 20) + ' ' +
            pad('Type', 18) + '  ' +
            pad('Old created_at',   19) + '  ' +
            pad('New created_at',   19) + '  Chrono'
        );
        console.log('─'.repeat(95));
        updates.forEach(u => {
            u.notifUpdates.forEach(n => {
                const afterReview  = n.newDate >= u.newReviewedAt;
                const beforeAdopt  = n.newDate  < u.newAdoptedAt;
                const badge = (afterReview && beforeAdopt) ? '✓' : '✗';
                console.log(
                    pad('#' + n.id,     7) + ' ' +
                    pad(u.id,           6) + ' ' +
                    pad(u.name,        20) + ' ' +
                    pad(n.type,        18) + '  ' +
                    fmt(n.oldDate)  + '  ' +
                    fmt(n.newDate)  + '  ' + badge
                );
            });
        });
    }
    console.log('─'.repeat(95));

    // ── Full chronology verification ──────────────────────────────────────────
    console.log('\nFULL CHRONOLOGY CHECK  (created_at < reviewed_at < notifications < adopted_at)');
    console.log('─'.repeat(95));
    let allOk = true;
    updates.forEach(u => {
        const cr = u.newCreatedAt  < u.newReviewedAt;
        const ra = u.newReviewedAt < u.newAdoptedAt;
        const notifOk = u.notifUpdates.every(n =>
            n.newDate >= u.newReviewedAt && n.newDate < u.newAdoptedAt
        );
        const ok = cr && ra && notifOk;
        if (!ok) allOk = false;
        const badge = ok ? '✓' : '✗';
        const issues = [
            !cr      && 'created_at >= reviewed_at',
            !ra      && 'reviewed_at >= adopted_at',
            !notifOk && 'notification outside window',
        ].filter(Boolean).join(' | ');

        console.log(
            `  ${badge}  #${String(u.id).padEnd(3)} ${pad(u.name, 18)} ` +
            `${fmt(u.newCreatedAt)} < ${fmt(u.newReviewedAt)} < ${fmt(u.newAdoptedAt)}` +
            (issues ? `  ⚠️  ${issues}` : '')
        );
    });
    console.log('─'.repeat(95));
    console.log(allOk
        ? '  ✅ All chronologies valid.'
        : '  ❌ Some entries have chronology violations — do NOT run --confirm.');

    // ── Distribution summary ──────────────────────────────────────────────────
    const months       = [...new Set(updates.map(u => u.newAdoptedAt.toISOString().substring(0, 7)))].sort();
    const distinctDays = new Set(updates.map(u => u.newAdoptedAt.toISOString().substring(0, 10))).size;
    const recent       = updates.filter(u => u.daysAgo <= 30).length;
    const middle       = updates.filter(u => u.daysAgo > 30 && u.daysAgo <= 60).length;
    const older        = updates.filter(u => u.daysAgo > 60).length;

    console.log('\nDISTRIBUTION SUMMARY');
    console.log('─'.repeat(60));
    console.log(`  Calendar months  : ${months.join(', ')}  (${months.length} months)`);
    console.log(`  Distinct days    : ${distinctDays}`);
    console.log(`  Last 30 days     : ${recent} animal(s)  (${Math.round(recent/updates.length*100)}%)`);
    console.log(`  30-60 days ago   : ${middle} animal(s)  (${Math.round(middle/updates.length*100)}%)`);
    console.log(`  60-88 days ago   : ${older}  animal(s)  (${Math.round(older/updates.length*100)}%)`);

    // ── ML model readiness ────────────────────────────────────────────────────
    console.log('\nML MODEL READINESS (projected)');
    console.log('─'.repeat(60));
    console.log(`  ${updates.length >= 7  ? '✓' : '✗'} Total adopted : ${updates.length}  (need ≥7 for predictions endpoint)`);
    console.log(`  ${distinctDays  >= 14  ? '✓' : distinctDays >= 7 ? '~' : '✗'} Distinct days : ${distinctDays}  (≥14 ideal for daily; ≥7 for weekly)`);
    console.log(`  ${months.length >= 3   ? '✓' : '~'} Months        : ${months.length}  (need ≥3 for platform analytics forecast)`);

    // ── Exit or apply ─────────────────────────────────────────────────────────
    if (!CONFIRM) {
        console.log('\n' + '═'.repeat(80));
        console.log('  DRY RUN COMPLETE — nothing written to DB.');
        console.log('  If the preview looks good, run with --confirm:');
        console.log('');
        console.log('      node scripts/redistributeAdoptionDates.js --confirm');
        console.log('═'.repeat(80) + '\n');
        await pool.end();
        return;
    }

    if (!allOk) {
        console.error('\n❌ Chronology violations detected — aborting. Fix the script before running --confirm.\n');
        await pool.end();
        process.exit(1);
    }

    // ── Apply updates ─────────────────────────────────────────────────────────
    console.log('\n' + '─'.repeat(60));
    console.log('  APPLYING UPDATES...');
    console.log('─'.repeat(60));

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        for (const u of updates) {
            await client.query(
                `UPDATE pets
                 SET created_at  = $1,
                     reviewed_at = $2,
                     adopted_at  = $3,
                     updated_at  = CURRENT_TIMESTAMP
                 WHERE id = $4`,
                [u.newCreatedAt, u.newReviewedAt, u.newAdoptedAt, u.id]
            );
            console.log(`  ✓ pet #${String(u.id).padEnd(4)} ${pad(u.name, 22)} created:${fmt(u.newCreatedAt).substring(0,10)}  reviewed:${fmt(u.newReviewedAt).substring(0,10)}  adopted:${fmt(u.newAdoptedAt).substring(0,10)}`);

            for (const n of u.notifUpdates) {
                await client.query(
                    `UPDATE notifications SET created_at = $1 WHERE id = $2`,
                    [n.newDate, n.id]
                );
                console.log(`    ↳ notif #${n.id} (${n.type})  old:${fmt(n.oldDate).substring(0,10)} → new:${fmt(n.newDate).substring(0,10)}`);
            }
        }

        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('\n❌ Transaction rolled back:', err.message);
        await pool.end();
        process.exit(1);
    } finally {
        client.release();
    }

    // ── Post-update verification query ────────────────────────────────────────
    const { rows: v } = await pool.query(
        `SELECT
             COUNT(*)::int                                          AS total,
             COUNT(DISTINCT DATE(adopted_at AT TIME ZONE 'UTC'))::int  AS distinct_days,
             COUNT(DISTINCT TO_CHAR(adopted_at AT TIME ZONE 'UTC','YYYY-MM'))::int AS months,
             MIN(adopted_at AT TIME ZONE 'UTC')::date              AS earliest,
             MAX(adopted_at AT TIME ZONE 'UTC')::date              AS latest,
             ROUND(AVG(EXTRACT(EPOCH FROM (adopted_at - created_at))/86400))::int AS avg_days
         FROM pets
         WHERE is_adopted = true AND adopted_at IS NOT NULL`
    );
    const r = v[0];

    console.log('\n' + '═'.repeat(80));
    console.log('  ✅ UPDATE COMPLETE');
    console.log('═'.repeat(80));
    console.log(`  Pets updated       : ${updates.length}`);
    console.log(`  Notifications fixed: ${allNotifUpdates.length}`);
    console.log(`  Total adopted (DB) : ${r.total}`);
    console.log(`  Distinct days      : ${r.distinct_days}  ${r.distinct_days >= 14 ? '✓' : r.distinct_days >= 7 ? '~ (weekly ok)' : '✗'}`);
    console.log(`  Calendar months    : ${r.months}  ${r.months >= 3 ? '✓' : '~'}`);
    console.log(`  Date range         : ${r.earliest} → ${r.latest}`);
    console.log(`  Avg days to adopt  : ${r.avg_days} days`);
    console.log('');
    console.log('  Next steps to verify:');
    console.log('  1. POST /api/predictions/adoptions  — expect predictions, not "insufficient data"');
    console.log('  2. GET  /api/analytics/platform     — time series should span 3 months');
    console.log('  3. GET  /api/animals/stats          — avg_days_adoption should show realistic value');
    console.log('═'.repeat(80) + '\n');

    await pool.end();
};

main().catch(err => {
    console.error('\n❌ Fatal error:', err.message);
    process.exit(1);
});
