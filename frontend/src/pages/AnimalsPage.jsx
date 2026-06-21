import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import { usePetStore } from '../store/petStore';
import { useAuthStore } from '../store/authStore';

const API = 'http://localhost:5000/api';
const serif = "'Cormorant Garamond', serif";
const sans  = "'DM Sans', sans-serif";

const PHOTO_HEIGHT = 180;

// ── Helpers ───────────────────────────────────────────────────────────────────
function getPrimaryPhotoUrl(photos) {
    if (!photos || photos.length === 0) return null;
    const primary = photos.find((p) => p.is_primary) || photos[0];
    if (!primary) return null;
    // BYTEA photos are served by ID; URL photos have photo_url
    if (primary.id) return `${API}/pets/photos/${primary.id}`;
    if (primary.photo_url) return primary.photo_url;
    return null;
}

function timeAgo(dateStr) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60)  return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)   return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}

// ── Badge ─────────────────────────────────────────────────────────────────────
function Badge({ type }) {
    const styles = {
        Found:      { background: '#2D1F14', color: '#FAF7F4', border: 'none' },
        Urgent:     { background: '#993C1D', color: '#FAF7F4', border: 'none' },
        Vaccinated: { background: 'rgba(29,158,117,0.12)', color: '#0F6E56', border: '1px solid rgba(29,158,117,0.2)' },
    };
    const s = styles[type] || { background: 'rgba(45,31,20,0.08)', color: '#7A5C44', border: '1px solid rgba(45,31,20,0.12)' };
    return (
        <span style={{ fontFamily: sans, fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '2px 7px', borderRadius: '2px', fontWeight: 600, ...s }}>
            {type || 'Listed'}
        </span>
    );
}

// ── Filter pill ───────────────────────────────────────────────────────────────
function Pill({ label, active, onClick, urgent }) {
    const base    = { fontFamily: sans, fontSize: '11px', padding: '5px 13px', borderRadius: '100px', cursor: 'pointer', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(45,31,20,0.15)', color: '#7A5C44', background: 'transparent', transition: 'all 0.15s', whiteSpace: 'nowrap' };
    const urgDef  = { borderColor: 'rgba(192,74,74,0.3)', color: '#993C1D' };
    const actStyle = urgent ? { background: '#993C1D', color: '#FAF7F4', borderColor: '#993C1D' } : { background: '#2D1F14', color: '#FAF7F4', borderColor: '#2D1F14' };
    return (
        <button onClick={onClick} style={{ ...base, ...(urgent && !active ? urgDef : {}), ...(active ? actStyle : {}) }}>
            {label}
        </button>
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
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { pets, isLoading, getAllPets } = usePetStore();
    const { user: currentUser } = useAuthStore();

    const initialStatus = searchParams.get('status') || 'all';

    const [typeFilter,    setTypeFilter]    = useState('all');
    const [otherSubtype,  setOtherSubtype]  = useState('');
    const [statusFilter, setStatusFilter] = useState(initialStatus);
    const [areaFilter,   setAreaFilter]   = useState('everywhere');
    const [sortBy,       setSortBy]       = useState('recent');
    const [searchQuery,  setSearchQuery]  = useState(searchParams.get('search') || '');
    const [savedPets,    setSavedPets]    = useState(new Set());

    useEffect(() => {
        getAllPets();
    }, [getAllPets]);

    useEffect(() => {
        const q = searchParams.get('search');
        if (q !== null) setSearchQuery(q);
    }, [searchParams]);

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
        } catch {
            // ignore
        }
    };

    // ── Filtering & sorting ───────────────────────────────────────────────────
    const filtered = pets
        .filter((p) => {
            const petType = (p.type || '').toLowerCase();
            const typeMatch =
                typeFilter === 'all' ? true :
                typeFilter === 'other'
                    ? (!['dog', 'cat'].includes(petType) && (otherSubtype === '' || petType === otherSubtype))
                    : petType === typeFilter;
            const hs = (p.health_status || '').toLowerCase();
            const as = (p.adoption_status || '').toLowerCase();
            const statusMatch =
                statusFilter === 'all'        ? true :
                statusFilter === 'urgent'     ? (hs.includes('urgent') || as === 'urgent' || p.is_urgent === true) :
                statusFilter === 'vaccinated' ? hs.includes('vacc') :
                statusFilter === 'found'      ? (as === 'available' || hs.includes('found') || (p.type || '').toLowerCase().includes('found')) :
                true;
            const q = searchQuery.trim().toLowerCase();
            const searchMatch = !q
                || (p.name        || '').toLowerCase().includes(q)
                || (p.description || '').toLowerCase().includes(q)
                || (p.breed       || '').toLowerCase().includes(q);
            const city = (p.location_city || '').toLowerCase();
            const areaMatch =
                areaFilter === 'everywhere' ? true :
                areaFilter === 'timisoara'  ? city.includes('timi') :
                areaFilter === 'near'       ? (
                    currentUser?.city
                        ? city.includes(currentUser.city.toLowerCase())
                        : city.includes('timi')
                ) : true;
            return typeMatch && statusMatch && searchMatch && areaMatch;
        })
        .sort((a, b) => {
            if (sortBy === 'urgent') {
                const aU = (a.health_status || '').toLowerCase().includes('urgent');
                const bU = (b.health_status || '').toLowerCase().includes('urgent');
                if (aU && !bU) return -1;
                if (bU && !aU) return  1;
            }
            if (sortBy === 'nearest') {
                const userCity = (currentUser?.city || 'timișoara').toLowerCase();
                const aMatch = (a.location_city || '').toLowerCase().includes(userCity) ? 0 : 1;
                const bMatch = (b.location_city || '').toLowerCase().includes(userCity) ? 0 : 1;
                if (aMatch !== bMatch) return aMatch - bMatch;
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
    ];

    const areaPills = [
        { label: 'Near me',       value: 'near'       },
        { label: 'All Timișoara', value: 'timisoara'  },
        { label: 'Everywhere',    value: 'everywhere' },
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
                        : `${filtered.length} animal${filtered.length !== 1 ? 's' : ''} found in Timișoara and surrounding areas`
                    }
                </div>
            </div>

            {/* ── FILTER BAR ───────────────────────────────────────────── */}
            <div style={{ padding: '14px 48px', borderBottom: '1px solid rgba(45,31,20,0.08)', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', backgroundColor: '#FAF7F4' }}>
                <FilterLabel>Type</FilterLabel>
                {typePills.map(({ label, value }) => (
                    <Pill
                        key={value}
                        label={label}
                        active={typeFilter === value}
                        onClick={() => { setTypeFilter(value); setOtherSubtype(''); }}
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
                {areaPills.map(({ label, value }) => (
                    <Pill key={value} label={label} active={areaFilter === value} onClick={() => setAreaFilter(value)} />
                ))}

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
                    <option value="nearest">Nearest</option>
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

// ── Badge type helper ─────────────────────────────────────────────────────────
function getBadgeType(pet) {
    const hs = (pet.health_status || '').toLowerCase();
    const as = (pet.adoption_status || '').toLowerCase();
    if (hs.includes('urgent')) return 'Urgent';
    if (hs.includes('vacc')) return 'Vaccinated';
    if (as === 'adopted' || pet.is_adopted) return 'Adopted';
    return 'Found';
}

// ── Animal card ───────────────────────────────────────────────────────────────
function AnimalCard({ pet, isSaved, onToggleSave }) {
    const navigate = useNavigate();
    const [hovered, setHovered] = useState(false);
    const photoUrl = getPrimaryPhotoUrl(pet.photos);

    const location = pet.location_city || pet.location_address || '';
    const age      = pet.age_category  || '';
    const badge    = getBadgeType(pet);
    const title    = pet.name          || 'Unknown animal';

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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '7px' }}>
                    <Badge type={badge} />
                    <span style={{ fontFamily: sans, fontSize: '9px', color: '#B09880' }}>{timeAgo(pet.created_at)}</span>
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
