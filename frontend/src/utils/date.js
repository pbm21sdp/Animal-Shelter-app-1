function ensureUtc(dateStr) {
    if (!dateStr) return dateStr;
    const s = String(dateStr).trim();
    if (s.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(s)) return s;
    return s + 'Z';
}

// 'short' → "27 Jun 2026"
// 'full'  → "27 Jun 2026, 11:23"
export function formatDate(dateStr, format = 'full') {
    if (!dateStr) return '—';
    const d = new Date(ensureUtc(dateStr));
    if (isNaN(d.getTime())) return '—';
    if (format === 'short') {
        return d.toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short', year: 'numeric',
            timeZone: 'Europe/Bucharest',
        });
    }
    return d.toLocaleString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
        timeZone: 'Europe/Bucharest',
    });
}

// Returns "Posted on 27 Jun 2026 at 11:23"
export function formatPostedOn(dateStr) {
    if (!dateStr) return '';
    const d = new Date(ensureUtc(dateStr));
    if (isNaN(d.getTime())) return '';
    const datePart = d.toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric',
        timeZone: 'Europe/Bucharest',
    });
    const timePart = d.toLocaleTimeString('en-GB', {
        hour: '2-digit', minute: '2-digit',
        timeZone: 'Europe/Bucharest',
    });
    return `Posted on ${datePart} at ${timePart}`;
}

// "just now", "5m ago", "3h ago", "2d ago"
export function formatTimeAgo(dateStr) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(ensureUtc(dateStr)).getTime();
    if (diff < 60000) return 'just now';
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}
