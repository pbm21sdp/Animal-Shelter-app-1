import { pool } from '../config/database/connectPostgresDB.js';

let _cache = { words: [], loadedAt: 0 };
const TTL_MS = 5 * 60 * 1000;

async function ensureCache() {
    if (Date.now() - _cache.loadedAt < TTL_MS) return;
    const res = await pool.query('SELECT word FROM forbidden_words');
    _cache = { words: res.rows.map(r => r.word.toLowerCase()), loadedAt: Date.now() };
}

export async function refreshCache() {
    _cache.loadedAt = 0;
    await ensureCache();
}

function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function containsWholeWord(text, word) {
    if (!text || !word) return false;
    const esc = escapeRegex(word);

    // Unicode-aware whole-word match (modern Node.js supports \p{L} and \p{N})
    try {
        const re = new RegExp(`(?<![\\p{L}\\p{N}])${esc}(?![\\p{L}\\p{N}])`, 'iu');
        if (re.test(text)) return true;
    } catch (_) {}

    // Diacritic-normalised fallback (catches ă→a, â→a, î→i, ș→s, ț→t variants)
    const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    try {
        const re = new RegExp(`(?<![a-z0-9])${escapeRegex(norm(word))}(?![a-z0-9])`, 'i');
        if (re.test(norm(text))) return true;
    } catch (_) {}

    return false;
}

/**
 * Check an array of text strings for forbidden words.
 * Returns { ok: true } if clean, { ok: false, found: string[] } if violations found.
 */
export async function checkContent(texts) {
    await ensureCache();
    if (!_cache.words.length) return { ok: true, found: [] };

    const allTexts = (Array.isArray(texts) ? texts : [texts]).filter(Boolean).map(String);
    const found = [];

    for (const word of _cache.words) {
        for (const text of allTexts) {
            if (containsWholeWord(text, word) && !found.includes(word)) {
                found.push(word);
                break;
            }
        }
    }

    return { ok: found.length === 0, found };
}
