import React, { useState, useEffect, useRef } from 'react';
import { LOCALITIES_BY_COUNTY } from '../data/romaniaLocalities';

const sans = "'DM Sans', sans-serif";

const COUNTIES = [
    'Alba', 'Arad', 'Argeș', 'Bacău', 'Bihor', 'Bistrița-Năsăud', 'Botoșani',
    'Brăila', 'Brașov', 'Buzău', 'Caraș-Severin', 'Călărași', 'Cluj', 'Constanța', 'Covasna',
    'Dâmbovița', 'Dolj', 'Galați', 'Giurgiu', 'Gorj', 'Harghita', 'Hunedoara',
    'Ialomița', 'Iași', 'Ilfov', 'Maramureș', 'Mehedinți', 'Mureș', 'Neamț',
    'Olt', 'Prahova', 'Sălaj', 'Satu Mare', 'Sibiu', 'Suceava', 'Teleorman',
    'Timiș', 'Tulcea', 'Vâlcea', 'Vaslui', 'Vrancea', 'Municipiul București',
];

// Photon (komoot.io) — autocomplete-optimised geocoder on OSM data.
// bbox hard-constrains results to ~12 km around the locality, which keeps out
// streets from other cities that share the same name.
async function photonStreetSearch(query, lat, lon) {
    try {
        const d = 0.12; // ~12 km
        const bbox = `${(lon-d).toFixed(5)},${(lat-d).toFixed(5)},${(lon+d).toFixed(5)},${(lat+d).toFixed(5)}`;
        const url =
            `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}` +
            `&lat=${lat}&lon=${lon}&limit=8&layer=street&bbox=${bbox}`;
        const res = await fetch(url);
        const data = await res.json();
        return data.features || [];
    } catch {
        return [];
    }
}

// Build the subtitle shown in the dropdown (differentiating details).
function streetSub(p) {
    const parts = [];
    if (p.district || p.locality) parts.push(p.district || p.locality);
    if (p.postcode) parts.push(p.postcode);
    if (p.city)    parts.push(p.city);
    return parts.join(' · ');
}

// Build the full string that lands in the input when the user picks a street.
function streetFullName(p) {
    const parts = [p.name];
    if (p.district)       parts.push(p.district);
    else if (p.locality)  parts.push(p.locality);
    if (p.postcode)       parts.push(p.postcode);
    return parts.filter(Boolean).join(', ');
}

// Starts-with matches rank above contains matches.
function filterLocalities(county, term) {
    const list = LOCALITIES_BY_COUNTY[county] || [];
    if (!term.trim()) return [];
    const lower = term.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const starts = [], contains = [];
    list.forEach(loc => {
        const norm = loc.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
        if (norm.startsWith(lower))      starts.push(loc);
        else if (norm.includes(lower))   contains.push(loc);
    });
    return [...starts, ...contains].slice(0, 8);
}

// value: { county, city, address, latitude, longitude }
// onChange: (value) => void
export default function LocationPicker({ value, onChange }) {
    const { county = '', city = '', address = '', latitude = null, longitude = null } = value || {};

    const [localityInput, setLocalityInput] = useState(city);
    const [localitySugs,  setLocalitySugs]  = useState([]);
    const [showLocSugs,   setShowLocSugs]   = useState(false);

    const [addressInput,  setAddressInput]  = useState(address);
    const [addressSugs,   setAddressSugs]   = useState([]);
    const [showAddrSugs,  setShowAddrSugs]  = useState(false);

    const debounceAddrRef = useRef(null);
    const containerRef    = useRef(null);

    useEffect(() => { setLocalityInput(city); },   [city]);
    useEffect(() => { setAddressInput(address); }, [address]);

    useEffect(() => {
        const handler = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setShowLocSugs(false);
                setShowAddrSugs(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleCountyChange = (newCounty) => {
        setLocalityInput('');
        setAddressInput('');
        setLocalitySugs([]);
        setAddressSugs([]);
        onChange({ county: newCounty, city: '', address: '', latitude: null, longitude: null });
    };

    const handleLocalityInput = (text) => {
        setLocalityInput(text);
        onChange({ county, city: text, address: '', latitude: null, longitude: null });
        if (!text.trim() || !county) {
            setLocalitySugs([]);
            setShowLocSugs(false);
            return;
        }
        const matches = filterLocalities(county, text);
        setLocalitySugs(matches);
        setShowLocSugs(matches.length > 0);
    };

    const handleLocalitySelect = (name) => {
        setLocalityInput(name);
        setLocalitySugs([]);
        setShowLocSugs(false);
        setAddressInput('');
        // One Nominatim call to get lat/lng for Photon's proximity + bbox
        fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(name + ', ' + county + ', Romania')}&format=json&limit=1&accept-language=ro`,
            { headers: { 'User-Agent': 'Paws-ShelterApp/1.0' } }
        )
            .then(r => r.json())
            .then(results => {
                const lat = results[0] ? parseFloat(results[0].lat) : null;
                const lon = results[0] ? parseFloat(results[0].lon) : null;
                onChange({ county, city: name, address: '', latitude: lat, longitude: lon });
            })
            .catch(() => onChange({ county, city: name, address: '', latitude: null, longitude: null }));
    };

    const handleAddressInput = (text) => {
        setAddressInput(text);
        onChange({ county, city, address: text, latitude, longitude });
        if (debounceAddrRef.current) clearTimeout(debounceAddrRef.current);
        if (!text.trim() || !city) { setAddressSugs([]); setShowAddrSugs(false); return; }
        debounceAddrRef.current = setTimeout(async () => {
            const lat = latitude  ?? 45.9432;
            const lon = longitude ?? 24.9668;
            const features = await photonStreetSearch(text, lat, lon);
            setAddressSugs(features);
            setShowAddrSugs(features.length > 0);
        }, 250);
    };

    const handleAddressSelect = (feature) => {
        const p = feature.properties;
        const [lon, lat] = feature.geometry.coordinates;
        const full = streetFullName(p);
        setAddressInput(full);
        setAddressSugs([]);
        setShowAddrSugs(false);
        onChange({ county, city, address: full, latitude: lat, longitude: lon });
    };

    const inputStyle = {
        fontFamily: sans, fontSize: '13px', color: '#2D1F14',
        border: 'none', borderBottom: '1px solid rgba(45,31,20,0.15)',
        background: 'none', outline: 'none',
        padding: '6px 0', width: '100%', boxSizing: 'border-box',
    };

    const labelStyle = {
        fontFamily: sans, fontSize: '9px', textTransform: 'uppercase',
        letterSpacing: '0.14em', color: '#C07A4A', fontWeight: 500,
        marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px',
    };

    const dropdownStyle = {
        position: 'absolute', top: 'calc(100% + 2px)', left: 0, right: 0,
        background: '#fff', border: '1px solid rgba(45,31,20,0.12)',
        borderRadius: '6px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
        zIndex: 2000, maxHeight: '180px', overflowY: 'auto',
    };

    return (
        <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* County */}
            <div>
                <div style={labelStyle}>County</div>
                <select
                    value={county}
                    onChange={e => handleCountyChange(e.target.value)}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                >
                    <option value="">Select county…</option>
                    {COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>

            {/* Locality */}
            {county && (
                <div style={{ position: 'relative' }}>
                    <div style={labelStyle}>
                        Locality
                        {latitude && longitude && !address && (
                            <span style={{ color: '#5C8A5C', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                                ✓ located
                            </span>
                        )}
                    </div>
                    <input
                        type="text"
                        placeholder="City, town, village…"
                        value={localityInput}
                        onChange={e => handleLocalityInput(e.target.value)}
                        style={inputStyle}
                    />
                    {showLocSugs && localitySugs.length > 0 && (
                        <div style={dropdownStyle}>
                            {localitySugs.map((name, i) => (
                                <SugItem
                                    key={name}
                                    label={name}
                                    sub={`${county}, Romania`}
                                    last={i === localitySugs.length - 1}
                                    onSelect={() => handleLocalitySelect(name)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Street address */}
            {city && (
                <div style={{ position: 'relative' }}>
                    <div style={labelStyle}>
                        Street
                        <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#B09880' }}>optional</span>
                        {latitude && longitude && address && (
                            <span style={{ color: '#5C8A5C', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                                ✓ exact location
                            </span>
                        )}
                    </div>
                    <input
                        type="text"
                        placeholder="e.g. Str. Gheorghe Lazăr 12"
                        value={addressInput}
                        onChange={e => handleAddressInput(e.target.value)}
                        style={inputStyle}
                    />
                    {showAddrSugs && addressSugs.length > 0 && (
                        <div style={dropdownStyle}>
                            {addressSugs.map((feature, i) => (
                                <SugItem
                                    key={i}
                                    label={feature.properties.name || ''}
                                    sub={streetSub(feature.properties)}
                                    last={i === addressSugs.length - 1}
                                    onSelect={() => handleAddressSelect(feature)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function SugItem({ label, sub, last, onSelect }) {
    return (
        <div
            onMouseDown={onSelect}
            style={{
                padding: '8px 12px', fontFamily: sans, fontSize: '12px',
                color: '#5C4030', cursor: 'pointer',
                borderBottom: last ? 'none' : '1px solid rgba(45,31,20,0.06)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#FAF7F4'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
        >
            <div style={{ fontWeight: 500 }}>{label}</div>
            {sub && (
                <div style={{ fontSize: '10px', color: '#B09880', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {sub}
                </div>
            )}
        </div>
    );
}
