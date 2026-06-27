import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import { usePetStore } from '../store/petStore';
import { useAuthStore } from '../store/authStore';
import { buildPetTags } from '../utils/petTags';
import { getCityCoords, haversineKm, NEAR_RADIUS_KM, WIDER_RADIUS_KM } from '../data/romaniaCities';
import { formatPostedOn } from '../utils/date';

const API = 'http://localhost:5000/api';
const serif = "'Cormorant Garamond', serif";
const sans  = "'DM Sans', sans-serif";

const PHOTO_HEIGHT = 180;
// Max tags shown inline on a card before collapsing to "+N more"
const MAX_VISIBLE_TAGS = 3;

// ── Helpers ───────────────────────────────────────────────────────────────────
function getPrimaryPhotoUrl(photos) {
    if (!photos || photos.length === 0) return null;
    const primary = photos.find((p) => p.is_primary) || photos[0];
    if (!primary) return null;
    if (primary.id) return `${API}/pets/photos/${primary.id}`;
    if (primary.photo_url) return primary.photo_url;
    return null;
}


// ── Tag chip — used on cards ──────────────────────────────────────────────────
function TagChip({ label, variant }) {
    const base = {
        fontFamily: sans, fontSize: '8px', textTransform: 'uppercase',
        letterSpacing: '0.08em', padding: '2px 7px', borderRadius: '2px',
        fontWeight: 600, whiteSpace: 'nowrap',
    };
    const styles = {
        urgent:  { background: '#993C1D', color: '#FAF7F4', border: 'none' },
        accent:  { background: 'rgba(192,122,74,0.18)', color: '#8B4E28', border: '1px solid rgba(192,122,74,0.35)' },
        default: { background: 'rgba(45,31,20,0.08)', color: '#7A5C44', border: '1px solid rgba(45,31,20,0.12)' },
    };
    return (
        <span style={{ ...base, ...(styles[variant] || styles.default) }}>
            {label}
        </span>
    );
}

// Overflow chip "+N more"
function MoreChip({ count }) {
    return (
        <span style={{
            fontFamily: sans, fontSize: '8px', letterSpacing: '0.06em', padding: '2px 7px',
            borderRadius: '2px', fontWeight: 600, whiteSpace: 'nowrap',
            background: 'transparent', color: '#B09880', border: '1px solid rgba(45,31,20,0.1)',
        }}>
            +{count}
        </span>
    );
}

// ── Filter pill ───────────────────────────────────────────────────────────────
function Pill({ label, active, onClick, urgent, disabled, tooltip }) {
    const base = {
        fontFamily: sans, fontSize: '11px', padding: '5px 13px', borderRadius: '100px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(45,31,20,0.15)',
        color: disabled ? '#C4B0A0' : '#7A5C44',
        background: 'transparent', transition: 'all 0.15s', whiteSpace: 'nowrap',
        opacity: disabled ? 0.55 : 1,
        position: 'relative',
    };
    const urgDef  = { borderColor: 'rgba(192,74,74,0.3)', color: '#993C1D' };
    const actStyle = urgent
        ? { background: '#993C1D', color: '#FAF7F4', borderColor: '#993C1D' }
        : { background: '#2D1F14', color: '#FAF7F4', borderColor: '#2D1F14' };
    return (
        <div style={{ position: 'relative', display: 'inline-block' }} title={disabled && tooltip ? tooltip : undefined}>
            <button
                onClick={disabled ? undefined : onClick}
                style={{ ...base, ...(urgent && !active && !disabled ? urgDef : {}), ...(active && !disabled ? actStyle : {}) }}
            >
                {label}
            </button>
        </div>
    );
}

function Sep() {
    return <div style={{ width: '1px', height: '18px', backgroundColor: 'rgba(45,31,20,0.12)', flexShrink: 0, alignSelf: 'center' }} />;
}

function FilterLabel({ children }) {
    return (
        <span style={{ fontFamily: sans, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#C07A4A', fontWeight: 500, alignSelf: 'center', whiteSpace: 'nowrap' }}>
            {children}
        </span>
    );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AnimalsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const { pets, isLoading, getAllPets } = usePetStore();
    const { user: currentUser } = useAuthStore();

    const initialStatus = searchParams.get('status') || 'all';

    const [typeFilter,    setTypeFilter]    = useState('all');
    const [otherSubtype,  setOtherSubtype]  = useState('');
    const [statusFilter,  setStatusFilter]  = useState(initialStatus);
    const [areaFilter,    setAreaFilter]    = useState('everywhere');
    const [sortBy,        setSortBy]        = useState('recent');
    const [searchQuery,   setSearchQuery]   = useState(searchParams.get('search') || '');
    const [savedPets, setSavedPets] = useState(new Set());

    useEffect(() => { getAllPets(); }, [getAllPets]);

    useEffect(() => {
        const q = searchParams.get('search');
        if (q !== null) setSearchQuery(q);
    }, [searchParams]);

    const clearSearch = () => {
        setSearchQuery('');
        const p = new URLSearchParams(searchParams);
        p.delete('search');
        setSearchParams(p, { replace: true });
    };

    useEffect(() => {
        if (!currentUser?._id) return;
        axios.get(`${API}/users/${currentUser._id}/saved`, { withCredentials: true })
            .then(r => {
                const ids = (r.data.pets || []).map(p => p.id);
                setSavedPets(new Set(ids));
            })
            .catch(() => {});
    }, [currentUser?._id]);

    const toggleSave = async (e, petId) => {
        e.stopPropagation();
        if (!currentUser) { navigate('/login'); return; }
        const isSaved = savedPets.has(petId);
        try {
            if (isSaved) {
                await axios.delete(`${API}/users/me/saved/${petId}`, { withCredentials: true });
                setSavedPets(prev => { const s = new Set(prev); s.delete(petId); return s; });
                toast.success('Removed from saved');
            } else {
                await axios.post(`${API}/users/me/saved/${petId}`, {}, { withCredentials: true });
                setSavedPets(prev => new Set([...prev, petId]));
                toast.success('Saved!');
            }
        } catch { /* ignore */ }
    };

    // ── Location filter helpers ───────────────────────────────────────────────
    // Resolve user's city coordinates once; null means filter should be disabled
    const userCoords = getCityCoords(currentUser?.city);

    // Whether proximity filters are usable
    const proximityEnabled = !!userCoords;

    function matchesAreaFilter(pet, filter) {
        if (filter === 'everywhere') return true;
        // Animals without location_city never match proximity filters
        if (!pet.location_city) return false;
        const petCoords = getCityCoords(pet.location_city);
        // Animal city not in our list → exclude from proximity results
        if (!petCoords) return false;
        // User city not resolved → filters are disabled; treat as no match
        if (!userCoords) return false;
        const dist = haversineKm(userCoords.lat, userCoords.lng, petCoords.lat, petCoords.lng);
        if (filter === 'near')      return dist <= NEAR_RADIUS_KM;
        if (filter === 'timisoara') return dist <= WIDER_RADIUS_KM;
        return true;
    }

    // ── Filtering & sorting ───────────────────────────────────────────────────
    const filtered = pets
        .filter((p) => {
            const petType = (p.type || '').toLowerCase();
            const typeMatch =
                typeFilter === 'all' ? true :
                typeFilter === 'other'
                    ? (!['dog', 'cat'].includes(petType) && (otherSubtype === '' || petType === otherSubtype))
                    : petType === typeFilter;

            const as          = (p.adoption_status || '').toLowerCase();
            const isAdoptedPet = p.is_adopted === true || as === 'adopted';

            // Adopted animals never appear on this page
            if (isAdoptedPet) return false;

            // Status filter uses new columns where available, falls back to legacy
            const statusMatch =
                statusFilter === 'all'        ? true :
                statusFilter === 'urgent'     ? (p.current_status === 'needs_urgent_care' || (p.health_status || '').toLowerCase().includes('urgent') || p.is_urgent === true) :
                statusFilter === 'vaccinated' ? (p.vaccination_status === 'fully' || (p.health_status || '').toLowerCase().includes('vacc')) :
                statusFilter === 'lost'       ? (p.situation === 'appears_lost' || (p.found_how || '').toLowerCase().includes('lost') || (p.found_how || '').toLowerCase().includes('appear')) :
                statusFilter === 'missing'    ? (p.situation === 'went_missing' || (p.found_how || '').toLowerCase().includes('missing')) :
                statusFilter === 'found'      ? (p.situation === 'found_on_street' || p.situation === 'rescued_from_danger' || (!p.situation && !(p.found_how || '').toLowerCase().includes('missing') && !(p.found_how || '').toLowerCase().includes('lost') && !(p.found_how || '').toLowerCase().includes('appear') && (as === 'available' || !p.found_how))) :
                true;

            const q = searchQuery.trim().toLowerCase();
            const qSingular = q.endsWith('s') && q.length > 3 ? q.slice(0, -1) : q;
            const searchMatch = !q
                || petType === q
                || petType === qSingular
                || (p.name        || '').toLowerCase().includes(q)
                || (p.description || '').toLowerCase().includes(q)
                || (p.breed       || '').toLowerCase().includes(q);

            const areaMatch = matchesAreaFilter(p, areaFilter);

            return typeMatch && statusMatch && searchMatch && areaMatch;
        })
        .sort((a, b) => {
            if (sortBy === 'urgent') {
                const aU = a.current_status === 'needs_urgent_care' || (a.health_status || '').toLowerCase().includes('urgent');
                const bU = b.current_status === 'needs_urgent_care' || (b.health_status || '').toLowerCase().includes('urgent');
                if (aU && !bU) return -1;
                if (bU && !aU) return  1;
            }
            if (sortBy === 'nearest' && userCoords) {
                const aCoords = getCityCoords(a.location_city);
                const bCoords = getCityCoords(b.location_city);
                const aDist = aCoords ? haversineKm(userCoords.lat, userCoords.lng, aCoords.lat, aCoords.lng) : Infinity;
                const bDist = bCoords ? haversineKm(userCoords.lat, userCoords.lng, bCoords.lat, bCoords.lng) : Infinity;
                if (aDist !== bDist) return aDist - bDist;
            }
            return new Date(b.created_at) - new Date(a.created_at);
        });

    const typePills = [
        { label: 'All',   value: 'all'   },
        { label: 'Dogs',  value: 'dog'   },
        { label: 'Cats',  value: 'cat'   },
        { label: 'Other', value: 'other' },
    ];

    const statusPills = [
        { label: 'All',        value: 'all',        urgent: false },
        { label: 'Urgent',     value: 'urgent',     urgent: true  },
        { label: 'Vaccinated', value: 'vaccinated', urgent: false },
        { label: 'Found',      value: 'found',      urgent: false },
        { label: 'Lost',       value: 'lost',       urgent: false },
        { label: 'Missing',    value: 'missing',    urgent: false },
    ];

    const proximityTooltip = 'Add your city in profile settings to use this filter';

    const areaPills = [
        { label: 'Near me',         value: 'near',       disabled: !proximityEnabled, tooltip: proximityTooltip },
        { label: 'Wider vicinity',  value: 'timisoara',  disabled: !proximityEnabled, tooltip: proximityTooltip },
        { label: 'Everywhere',      value: 'everywhere', disabled: false,             tooltip: '' },
    ];

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', backgroundColor: '#FAF7F4', overflowY: 'auto' }}>
            <Navbar />

            {/* ── PAGE HEADER ──────────────────────────────────────────── */}
            <div style={{ padding: '20px 48px 16px', borderBottom: '3px double rgba(45,31,20,0.15)' }}>
                <div style={{ fontFamily: serif, fontSize: '32px', fontWeight: 700, color: '#2D1F14', lineHeight: 1, marginBottom: '5px' }}>
                    Animals
                </div>
                <div style={{ fontFamily: serif, fontSize: '13px', fontStyle: 'italic', color: '#7A5C44' }}>
                    {isLoading
                        ? 'Loading…'
                        : `${filtered.length} animal${filtered.length !== 1 ? 's' : ''} found all over the country`
                    }
                </div>
            </div>

            {/* ── FILTER BAR ───────────────────────────────────────────── */}
            <div style={{ padding: '14px 48px', borderBottom: '1px solid rgba(45,31,20,0.08)', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', backgroundColor: '#FAF7F4' }}>
                {searchQuery && (
                    <span style={{
                        fontFamily: sans, fontSize: '11px', color: '#2D1F14',
                        background: 'rgba(45,31,20,0.08)', border: '1px solid rgba(45,31,20,0.2)',
                        borderRadius: '100px', padding: '4px 10px',
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                    }}>
                        Search: <strong>{searchQuery}</strong>
                        <button onClick={clearSearch} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#7A5C44', fontSize: '14px', lineHeight: 1 }}>×</button>
                    </span>
                )}
                {searchQuery && <Sep />}
                <FilterLabel>Type</FilterLabel>
                {typePills.map(({ label, value }) => (
                    <Pill
                        key={value}
                        label={label}
                        active={typeFilter === value}
                        onClick={() => { setTypeFilter(value); setOtherSubtype(''); clearSearch(); }}
                    />
                ))}
                {typeFilter === 'other' && (
                    <>
                        <Sep />
                        <FilterLabel>Species</FilterLabel>
                        {[
                            { label: 'All',          value: ''           },
                            { label: 'Birds',        value: 'bird'       },
                            { label: 'Rabbits',      value: 'rabbit'     },
                            { label: 'Fish',         value: 'fish'       },
                            { label: 'Hamsters',     value: 'hamster'    },
                            { label: 'Guinea pigs',  value: 'guinea pig' },
                            { label: 'Reptiles',     value: 'reptile'    },
                        ].map(({ label, value }) => (
                            <Pill
                                key={value || 'all-other'}
                                label={label}
                                active={otherSubtype === value}
                                onClick={() => setOtherSubtype(value)}
                            />
                        ))}
                    </>
                )}

                <Sep />

                <FilterLabel>Status</FilterLabel>
                {statusPills.map(({ label, value, urgent }) => (
                    <Pill
                        key={value}
                        label={label}
                        active={statusFilter === value}
                        urgent={urgent}
                        onClick={() => setStatusFilter(statusFilter === value ? 'all' : value)}
                    />
                ))}

                <Sep />

                <FilterLabel>Area</FilterLabel>
                {areaPills.map(({ label, value, disabled, tooltip }) => (
                    <Pill
                        key={value}
                        label={label}
                        active={areaFilter === value}
                        disabled={disabled}
                        tooltip={tooltip}
                        onClick={() => setAreaFilter(value)}
                    />
                ))}

                {/* Inline hint when proximity filters are disabled */}
                {!proximityEnabled && (
                    <span style={{ fontFamily: sans, fontSize: '10px', color: '#B09880', fontStyle: 'italic' }}>
                        Set your city in profile to use Near me
                    </span>
                )}

                <Sep />

                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    style={{
                        fontFamily: sans, fontSize: '11px', color: '#7A5C44',
                        border: '1px solid rgba(45,31,20,0.15)', borderRadius: '100px',
                        padding: '5px 13px', paddingRight: '24px',
                        background: 'transparent', cursor: 'pointer', outline: 'none',
                        appearance: 'none', WebkitAppearance: 'none',
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%237A5C44' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
                    }}
                >
                    <option value="recent">Most recent</option>
                    <option value="nearest" disabled={!proximityEnabled}>Nearest{!proximityEnabled ? ' (set city in profile)' : ''}</option>
                    <option value="urgent">Urgent first</option>
                </select>
            </div>

            {/* ── GRID ─────────────────────────────────────────────────── */}
            <div style={{ padding: '20px 48px 40px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', alignItems: 'start' }}>
                {isLoading ? (
                    <div style={{ gridColumn: '1/-1', padding: '48px 0', textAlign: 'center', fontFamily: serif, fontSize: '18px', fontStyle: 'italic', color: '#B09880' }}>
                        Loading animals…
                    </div>
                ) : filtered.length > 0 ? (
                    filtered.map((pet) => (
                        <AnimalCard
                            key={pet.id}
                            pet={pet}
                            isSaved={savedPets.has(pet.id)}
                            onToggleSave={toggleSave}
                        />
                    ))
                ) : (
                    <div style={{ gridColumn: '1/-1', padding: '48px 0', textAlign: 'center', fontFamily: serif, fontSize: '18px', fontStyle: 'italic', color: '#B09880' }}>
                        No animals match the current filters.
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Animal card ───────────────────────────────────────────────────────────────
function AnimalCard({ pet, isSaved, onToggleSave }) {
    const navigate = useNavigate();
    const [hovered, setHovered] = useState(false);
    const photoUrl = getPrimaryPhotoUrl(pet.photos);

    const location = pet.location_city || pet.location_address || '';
    const age      = pet.age_category  || '';
    const title    = pet.name          || 'Unknown animal';

    const allTags   = buildPetTags(pet);
    const visible   = allTags.slice(0, MAX_VISIBLE_TAGS);
    const overflow  = allTags.length - visible.length;

    return (
        <div
            onClick={() => navigate(`/pet/${pet.id}`)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                backgroundColor: '#fff',
                border: '1px solid rgba(45,31,20,0.1)',
                borderRadius: '3px',
                transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
                transition: 'transform 0.2s ease',
                cursor: 'pointer',
            }}
        >
            <div style={{ position: 'relative', height: `${PHOTO_HEIGHT}px`, overflow: 'hidden', backgroundColor: '#F0E8E0', borderRadius: '3px 3px 0 0' }}>
                {photoUrl ? (
                    <img
                        src={photoUrl}
                        alt={title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%', display: 'block' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontFamily: serif, fontSize: '32px', color: '#C07A4A', opacity: 0.4 }}>🐾</span>
                    </div>
                )}
                <button
                    onClick={(e) => onToggleSave(e, pet.id)}
                    title={isSaved ? 'Remove from saved' : 'Save for later'}
                    style={{
                        position: 'absolute', top: '8px', right: '8px',
                        background: 'rgba(250,247,244,0.92)',
                        border: 'none', borderRadius: '50%',
                        width: '28px', height: '28px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', fontSize: '13px',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                        color: isSaved ? '#C07A4A' : 'rgba(45,31,20,0.4)',
                        opacity: isSaved ? 1 : 0.85,
                        transition: 'opacity 0.15s, color 0.15s',
                    }}
                >
                    🔖
                </button>
            </div>
            <div style={{ padding: '10px 12px 12px' }}>
                {/* Tags row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', marginBottom: '7px', minHeight: '18px' }}>
                    {visible.length > 0 ? (
                        <>
                            {visible.map((t, i) => <TagChip key={i} label={t.label} variant={t.variant} />)}
                            {overflow > 0 && <MoreChip count={overflow} />}
                        </>
                    ) : (
                        <TagChip label="Listed" variant="default" />
                    )}
                    <span style={{ marginLeft: 'auto', fontFamily: sans, fontSize: '9px', color: '#B09880', flexShrink: 0 }}>{formatPostedOn(pet.created_at)}</span>
                </div>
                <div style={{ fontFamily: serif, fontSize: '15px', fontWeight: 700, color: '#2D1F14', lineHeight: 1.25, marginBottom: '6px' }}>
                    {title}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: sans, fontSize: '10px', color: '#9A7A60' }}>
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#C07A4A', display: 'inline-block', flexShrink: 0 }} />
                    {location && <span>{location}</span>}
                    {location && age && <span style={{ color: '#B09880' }}>·</span>}
                    {age && <span>{age}</span>}
                </div>
            </div>
        </div>
    );
}
