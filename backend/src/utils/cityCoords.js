// Romania city coordinates for geographic proximity in findSimilar queries.
// Mirrors frontend/src/data/romaniaCities.js — keep both in sync if new cities are added.

const ROMANIA_CITIES = {
    'Alba Iulia':              { lat: 46.0619, lng: 23.5699 },
    'Arad':                    { lat: 46.1866, lng: 21.3123 },
    'Pitești':                 { lat: 44.8565, lng: 24.8691 },
    'Bacău':                   { lat: 46.5671, lng: 26.9146 },
    'Oradea':                  { lat: 47.0722, lng: 21.9217 },
    'Bistrița':                { lat: 47.1337, lng: 24.4963 },
    'Botoșani':                { lat: 47.7484, lng: 26.6652 },
    'Brașov':                  { lat: 45.6427, lng: 25.5887 },
    'Brăila':                  { lat: 45.2692, lng: 27.9574 },
    'București':               { lat: 44.4268, lng: 26.1025 },
    'Bucharest':               { lat: 44.4268, lng: 26.1025 },
    'Buzău':                   { lat: 45.1500, lng: 26.8200 },
    'Reșița':                  { lat: 45.2971, lng: 21.8894 },
    'Cluj-Napoca':             { lat: 46.7712, lng: 23.6236 },
    'Constanța':               { lat: 44.1598, lng: 28.6348 },
    'Sfântu Gheorghe':         { lat: 45.8671, lng: 25.7878 },
    'Târgoviște':              { lat: 44.9247, lng: 25.4561 },
    'Deva':                    { lat: 45.8791, lng: 22.9115 },
    'Drobeta-Turnu Severin':   { lat: 44.6369, lng: 22.6565 },
    'Focșani':                 { lat: 45.6961, lng: 27.1849 },
    'Galați':                  { lat: 45.4353, lng: 28.0080 },
    'Giurgiu':                 { lat: 43.9037, lng: 25.9699 },
    'Târgu Jiu':               { lat: 45.0354, lng: 23.2748 },
    'Miercurea Ciuc':          { lat: 46.3593, lng: 25.8027 },
    'Iași':                    { lat: 47.1585, lng: 27.6014 },
    'Alexandria':              { lat: 43.9770, lng: 25.3364 },
    'Baia Mare':               { lat: 47.6560, lng: 23.5680 },
    'Târgu Mureș':             { lat: 46.5386, lng: 24.5575 },
    'Piatra Neamț':            { lat: 46.9234, lng: 26.3718 },
    'Slatina':                 { lat: 44.4310, lng: 24.3644 },
    'Ploiești':                { lat: 44.9364, lng: 26.0228 },
    'Satu Mare':               { lat: 47.7921, lng: 22.8862 },
    'Zalău':                   { lat: 47.1912, lng: 23.0573 },
    'Sibiu':                   { lat: 45.7983, lng: 24.1256 },
    'Suceava':                 { lat: 47.6515, lng: 26.2557 },
    'Timișoara':               { lat: 45.7489, lng: 21.2087 },
    'Timisoara':               { lat: 45.7489, lng: 21.2087 },
    'Tulcea':                  { lat: 45.1787, lng: 28.8021 },
    'Vaslui':                  { lat: 46.6406, lng: 27.7282 },
    'Râmnicu Vâlcea':          { lat: 45.1047, lng: 24.3694 },
    'Râmnicu Valcea':          { lat: 45.1047, lng: 24.3694 },
};

export function haversineKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Case-insensitive, diacritic-tolerant city lookup.
// Returns null for unknown/empty cities (candidates with null distance go to end of list).
export function getCityCoords(cityName) {
    if (!cityName) return null;
    const normalized = cityName.trim();
    if (ROMANIA_CITIES[normalized]) return ROMANIA_CITIES[normalized];
    const lower = normalized.toLowerCase();
    for (const [key, coords] of Object.entries(ROMANIA_CITIES)) {
        if (key.toLowerCase() === lower) return coords;
    }
    for (const [key, coords] of Object.entries(ROMANIA_CITIES)) {
        if (key.toLowerCase().startsWith(lower) || lower.startsWith(key.toLowerCase())) {
            return coords;
        }
    }
    return null;
}
