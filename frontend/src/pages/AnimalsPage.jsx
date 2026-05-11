import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { usePetStore } from '../store/petStore';

const API = 'http://localhost:5000/api';
const serif = "'Cormorant Garamond', serif";
const sans  = "'DM Sans', sans-serif";

// Heights cycle so masonry columns feel organic
const HEIGHTS = [200, 130, 160];

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
    const base    = { fontFamily: sans, fontSize: '11px', padding: '5px 13px', borderRadius: '100px', cursor: 'pointer', border: '1px solid rgba(45,31,20,0.15)', color: '#7A5C44', background: 'transparent', transition: 'all 0.15s', whiteSpace: 'nowrap' };
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
    const { pets, isLoading, getAllPets } = usePetStore();

    const initialStatus = searchParams.get('status') || 'all';

    const [typeFilter,   setTypeFilter]   = useState('all');
    const [statusFilter, setStatusFilter] = useState(initialStatus);
    const [areaFilter,   setAreaFilter]   = useState('timisoara');
    const [sortBy,       setSortBy]       = useState('recent');
    const [searchQuery,  setSearchQuery]  = useState(searchParams.get('search') || '');

    useEffect(() => {
        getAllPets();
    }, [getAllPets]);

    useEffect(() => {
        const q = searchParams.get('search');
        if (q !== null) setSearchQuery(q);
    }, [searchParams]);

    // ── Filtering & sorting ───────────────────────────────────────────────────
    const filtered = pets
        .filter((p) => {
            const typeMatch = typeFilter === 'all' || (p.type || '').toLowerCase() === typeFilter;
            const badge     = (p.health_status || '').toLowerCase();
            const statusMatch = statusFilter === 'all' || badge === statusFilter;
            const q = searchQuery.trim().toLowerCase();
            const searchMatch = !q
                || (p.name        || '').toLowerCase().includes(q)
                || (p.description || '').toLowerCase().includes(q)
                || (p.breed       || '').toLowerCase().includes(q);
            return typeMatch && statusMatch && searchMatch;
        })
        .sort((a, b) => {
            if (sortBy === 'urgent') {
                const aU = (a.health_status || '') === 'Urgent';
                const bU = (b.health_status || '') === 'Urgent';
                if (aU && !bU) return -1;
                if (bU && !aU) return  1;
            }
            // 'recent' / 'nearest' — sort by created_at desc
            return new Date(b.created_at) - new Date(a.created_at);
        });

    const typePills = [
        { label: 'All',   value: 'all'   },
        { label: 'Dogs',  value: 'dog'   },
        { label: 'Cats',  value: 'cat'   },
        { label: 'Other', value: 'other' },
    ];

    const statusPills = [
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
                    <Pill key={value} label={label} active={typeFilter === value} onClick={() => setTypeFilter(value)} />
                ))}

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

            {/* ── MASONRY GRID ─────────────────────────────────────────── */}
            <div style={{ padding: '20px 48px 40px', columnCount: 3, columnGap: '16px' }}>
                {isLoading ? (
                    <div style={{ columnSpan: 'all', padding: '48px 0', textAlign: 'center', fontFamily: serif, fontSize: '18px', fontStyle: 'italic', color: '#B09880' }}>
                        Loading animals…
                    </div>
                ) : filtered.length > 0 ? (
                    filtered.map((pet, idx) => (
                        <AnimalCard key={pet.id} pet={pet} height={HEIGHTS[idx % HEIGHTS.length]} />
                    ))
                ) : (
                    <div style={{ columnSpan: 'all', padding: '48px 0', textAlign: 'center', fontFamily: serif, fontSize: '18px', fontStyle: 'italic', color: '#B09880' }}>
                        No animals match the current filters.
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Animal card ───────────────────────────────────────────────────────────────
function AnimalCard({ pet, height }) {
    const navigate = useNavigate();
    const [hovered, setHovered] = useState(false);
    const photoUrl = getPrimaryPhotoUrl(pet.photos);

    const location = pet.location_city || pet.location_address || '';
    const age      = pet.age_category  || '';
    const badge    = pet.health_status || '';
    const title    = pet.name          || 'Unknown animal';

    return (
        <div
            onClick={() => navigate(`/pet/${pet.id}`)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                breakInside: 'avoid',
                marginBottom: '16px',
                backgroundColor: '#fff',
                border: '1px solid rgba(45,31,20,0.1)',
                borderRadius: '3px',
                overflow: 'hidden',
                transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
                transition: 'transform 0.2s ease',
                cursor: 'pointer',
            }}
        >
            {photoUrl ? (
                <img
                    src={photoUrl}
                    alt={title}
                    style={{ width: '100%', height: `${height}px`, objectFit: 'cover', display: 'block' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                />
            ) : (
                <div style={{ width: '100%', height: `${height}px`, backgroundColor: '#F0E8E0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: serif, fontSize: '32px', color: '#C07A4A', opacity: 0.4 }}>🐾</span>
                </div>
            )}
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
