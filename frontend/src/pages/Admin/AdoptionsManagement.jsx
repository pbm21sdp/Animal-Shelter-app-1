import React, { useState, useEffect, useMemo } from 'react';
import { useAdoptionStore } from '../../store/adoptionStore';
import AdminPagination from './shared/AdminPagination';
import AdminSearchBar from './shared/AdminSearchBar';

const serif = "'Cormorant Garamond', serif";
const sans  = "'DM Sans', sans-serif";

const cap = str => str ? str.charAt(0).toUpperCase() + str.slice(1) : '—';

const PET_TYPES = [
    { value: 'all',        label: 'All types' },
    { value: 'dog',        label: 'Dogs' },
    { value: 'cat',        label: 'Cats' },
    { value: 'rabbit',     label: 'Rabbits' },
    { value: 'bird',       label: 'Birds' },
    { value: 'fish',       label: 'Fish' },
    { value: 'hamster',    label: 'Hamsters' },
    { value: 'guinea pig', label: 'Guinea pigs' },
    { value: 'reptile',    label: 'Reptiles' },
    { value: 'other',      label: 'Other' },
];

const SORT_OPTIONS = [
    { value: 'newest',       label: 'Newest first' },
    { value: 'oldest',       label: 'Oldest first' },
    { value: 'alpha_pet',    label: 'Animal A–Z' },
    { value: 'alpha_poster', label: 'Poster A–Z' },
];

const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('ro-RO', {
        day: '2-digit', month: 'short', year: 'numeric',
        timeZone: 'Europe/Bucharest',
    });
};

const selectStyle = {
    fontFamily: sans, fontSize: '12px', color: '#7A5C44',
    border: '1px solid rgba(45,31,20,0.15)', borderRadius: '100px',
    padding: '6px 14px', background: 'transparent', cursor: 'pointer',
    outline: 'none', appearance: 'none', WebkitAppearance: 'none',
    paddingRight: '28px',
};

function FilterSelect({ value, onChange, options }) {
    return (
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
            <select value={value} onChange={e => onChange(e.target.value)} style={selectStyle}>
                {options.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                ))}
            </select>
            <span style={{ position: 'absolute', right: '10px', pointerEvents: 'none', fontSize: '9px', color: '#B09880' }}>▼</span>
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────
const AdoptionsManagement = () => {
    const { adoptions, isLoading, error, getAllAdoptions } = useAdoptionStore();

    const [search,      setSearch]      = useState('');
    const [petType,     setPetType]     = useState('all');
    const [sort,        setSort]        = useState('newest');
    const [currentPage, setCurrentPage] = useState(1);
    const PER_PAGE = 12;

    useEffect(() => {
        const serverSort = sort.startsWith('alpha') ? 'newest' : sort;
        getAllAdoptions({ petType: petType !== 'all' ? petType : undefined, sort: serverSort });
    }, [petType, sort]);

    const filtered = useMemo(() => {
        let list = [...(adoptions || [])];

        if (search.trim()) {
            const s = search.toLowerCase();
            list = list.filter(a =>
                a.petName?.toLowerCase().includes(s)    ||
                a.petType?.toLowerCase().includes(s)    ||
                a.petBreed?.toLowerCase().includes(s)   ||
                a.city?.toLowerCase().includes(s)       ||
                a.uploaderName?.toLowerCase().includes(s)  ||
                a.uploaderEmail?.toLowerCase().includes(s)
            );
        }

        if (sort === 'alpha_pet')    list.sort((a, b) => (a.petName || '').localeCompare(b.petName || ''));
        if (sort === 'alpha_poster') list.sort((a, b) => (a.uploaderName || '').localeCompare(b.uploaderName || ''));

        return list;
    }, [adoptions, search, sort]);

    useEffect(() => { setCurrentPage(1); }, [filtered.length, search]);

    const paginated  = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);
    const globalOff  = (currentPage - 1) * PER_PAGE;
    const total      = (adoptions || []).length;

    const COLS = ['#', 'Animal', 'City', 'Found its home', 'Posted by'];

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
                <h2 style={{ fontFamily: serif, fontSize: '24px', fontWeight: 700, color: '#2D1F14', margin: 0 }}>
                    Adoptions
                </h2>
                {total > 0 && (
                    <span style={{ fontFamily: sans, fontSize: '12px', color: '#B09880' }}>
                        {total} animal{total !== 1 ? 's' : ''} found a home
                    </span>
                )}
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '16px' }}>
                <AdminSearchBar
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by animal, city, poster…"
                />
                <FilterSelect value={petType} onChange={setPetType} options={PET_TYPES} />
                <FilterSelect value={sort}    onChange={setSort}    options={SORT_OPTIONS} />
            </div>

            {/* Error */}
            {error && (
                <div style={{
                    background: 'rgba(153,60,29,0.06)', border: '1px solid rgba(153,60,29,0.2)',
                    borderRadius: '8px', padding: '12px 16px', marginBottom: '16px',
                    fontFamily: sans, fontSize: '13px', color: '#993C1D',
                }}>
                    {error}
                </div>
            )}

            {/* Table */}
            <div style={{
                backgroundColor: '#FFFAF7',
                border: '1px solid rgba(45,31,20,0.1)',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 1px 4px rgba(45,31,20,0.06)',
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: sans }}>
                    <thead>
                        <tr style={{ backgroundColor: 'rgba(45,31,20,0.03)', borderBottom: '1px solid rgba(45,31,20,0.1)' }}>
                            {COLS.map(h => (
                                <th key={h} style={{
                                    padding: '8px 10px', fontSize: '10px', fontWeight: 600,
                                    color: '#B09880', textTransform: 'uppercase', letterSpacing: '0.06em',
                                    textAlign: 'left', whiteSpace: 'nowrap',
                                }}>
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={COLS.length} style={{ padding: '48px', textAlign: 'center', fontFamily: sans, fontSize: '13px', color: '#B09880' }}>
                                    Loading…
                                </td>
                            </tr>
                        ) : paginated.length === 0 ? (
                            <tr>
                                <td colSpan={COLS.length} style={{ padding: '48px', textAlign: 'center', fontFamily: sans, fontSize: '13px', color: '#B09880' }}>
                                    {search ? 'No adoptions match your search.' : 'No completed adoptions yet.'}
                                </td>
                            </tr>
                        ) : paginated.map((adoption, idx) => (
                            <AdoptionRow
                                key={adoption._id}
                                adoption={adoption}
                                index={globalOff + idx + 1}
                            />
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {filtered.length > PER_PAGE && (
                <div style={{ marginTop: '20px' }}>
                    <AdminPagination
                        itemsPerPage={PER_PAGE}
                        totalItems={filtered.length}
                        currentPage={currentPage}
                        paginate={setCurrentPage}
                    />
                </div>
            )}
        </div>
    );
};

// ── Row ───────────────────────────────────────────────────────────────────────
function AdoptionRow({ adoption, index }) {
    const [hover, setHover] = useState(false);

    const days = adoption.daysToAdoption;
    const daysLabel = days != null
        ? days === 0 ? 'same day as posting'
        : days === 1 ? '1 day after posting'
        : `${days} days after posting`
        : null;

    return (
        <tr
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
                borderTop: '1px solid rgba(45,31,20,0.06)',
                background: hover ? 'rgba(192,122,74,0.03)' : 'transparent',
                transition: 'background 0.1s',
            }}
        >
            {/* # */}
            <td style={{ padding: '10px 10px', width: '40px' }}>
                <span style={{ fontFamily: sans, fontSize: '11px', color: '#B09880', fontWeight: 500 }}>{index}</span>
            </td>

            {/* Animal */}
            <td style={{ padding: '10px 10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '30px', height: '30px', borderRadius: '50%',
                        background: '#E8D4C8', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: sans, fontSize: '11px', fontWeight: 700, color: '#7A5C44',
                    }}>
                        {(adoption.petName || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div style={{ fontFamily: sans, fontSize: '13px', fontWeight: 500, color: '#2D1F14' }}>
                            {adoption.petName || '—'}
                        </div>
                        <div style={{ fontFamily: sans, fontSize: '11px', color: '#B09880' }}>
                            {cap(adoption.petType)}{adoption.petBreed ? ` · ${adoption.petBreed}` : ''}
                        </div>
                    </div>
                </div>
            </td>

            {/* City */}
            <td style={{ padding: '10px 10px', whiteSpace: 'nowrap' }}>
                <span style={{ fontFamily: sans, fontSize: '12px', color: adoption.city ? '#2D1F14' : '#B09880' }}>
                    {adoption.city || '—'}
                </span>
            </td>

            {/* Found its home */}
            <td style={{ padding: '10px 10px', whiteSpace: 'nowrap' }}>
                <div style={{ fontFamily: sans, fontSize: '12px', color: '#2D1F14', fontWeight: 500 }}>
                    {formatDate(adoption.adoptedAt)}
                </div>
                {daysLabel && (
                    <div style={{ fontFamily: sans, fontSize: '10px', color: '#B09880', marginTop: '2px' }}>
                        {daysLabel}
                    </div>
                )}
            </td>

            {/* Posted by */}
            <td style={{ padding: '10px 10px' }}>
                <div style={{ fontFamily: sans, fontSize: '12px', fontWeight: 500, color: '#2D1F14' }}>
                    {adoption.uploaderName || '—'}
                </div>
                {adoption.uploaderEmail && (
                    <div style={{ fontFamily: sans, fontSize: '11px', color: '#B09880' }}>
                        {adoption.uploaderEmail}
                    </div>
                )}
            </td>
        </tr>
    );
}

export default AdoptionsManagement;
