import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import { useAuthStore } from '../store/authStore';

const API   = 'http://localhost:5000/api';
const serif = "'Cormorant Garamond', serif";
const sans  = "'DM Sans', sans-serif";

const C = {
    cream:    '#FAF7F4',
    espresso: '#2D1F14',
    brown:    '#C07A4A',
    muted:    '#7A5C44',
    light:    '#B09880',
    border:   'rgba(45,31,20,0.1)',
};

const TYPE_OPTIONS   = ['All', 'Dog', 'Cat', 'Bird', 'Rabbit', 'Other'];
const STATUS_OPTIONS = ['All', 'Listed', 'Missing', 'Pending review', 'Rejected', 'Adopted'];

function getPrimaryPhotoUrl(pet) {
    if (pet.primary_photo_id) return `${API}/pets/photos/${pet.primary_photo_id}`;
    if (!pet.photos || pet.photos.length === 0) return null;
    const primary = pet.photos.find(p => p.is_primary) || pet.photos[0];
    if (!primary) return null;
    if (primary.id) return `${API}/pets/photos/${primary.id}`;
    return null;
}

function timeAgo(dateStr) {
    if (!dateStr) return '';
    const parsed = dateStr.endsWith('Z') || dateStr.includes('+') ? dateStr : dateStr + 'Z';
    const diff = Date.now() - new Date(parsed).getTime();
    if (diff < 60000) return 'just now';
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

function getBadge(pet) {
    const hs = (pet.health_status || '').toLowerCase();
    const as = (pet.adoption_status || '').toLowerCase();
    const sit = (pet.situation || '').toLowerCase();
    if (pet.status === 'rejected') return { label: 'Rejected', bg: 'rgba(153,60,29,0.1)', color: '#993C1D', border: '1px solid rgba(153,60,29,0.25)' };
    if (pet.status === 'pending') return { label: 'Pending review', bg: '#FAF3E8', color: '#8B4E28', border: '1px solid rgba(192,122,74,0.25)' };
    if (pet.is_adopted || as === 'adopted') return { label: 'Adopted', bg: 'rgba(15,110,86,0.12)', color: '#0F6E56', border: '1px solid rgba(15,110,86,0.2)' };
    if (sit === 'went_missing') return { label: 'Missing', bg: 'rgba(90,60,200,0.1)', color: '#5A3CC8', border: '1px solid rgba(90,60,200,0.25)' };
    if (hs.includes('urgent')) return { label: 'Urgent', bg: '#993C1D', color: '#FAF7F4', border: 'none' };
    if (hs.includes('vacc')) return { label: 'Vaccinated', bg: 'rgba(29,158,117,0.12)', color: '#0F6E56', border: '1px solid rgba(29,158,117,0.2)' };
    return { label: 'Listed', bg: 'rgba(45,31,20,0.08)', color: '#7A5C44', border: '1px solid rgba(45,31,20,0.12)' };
}

function getStatusKey(pet) {
    const as  = (pet.adoption_status || '').toLowerCase();
    const sit = (pet.situation || '').toLowerCase();
    if (pet.status === 'rejected') return 'Rejected';
    if (pet.status === 'pending')  return 'Pending review';
    if (pet.is_adopted || as === 'adopted') return 'Adopted';
    // Missing: still active (not yet returned) OR returned to owner
    if (sit === 'went_missing') return 'Missing';
    return 'Listed';
}

export default function MyAnimalsPage() {
    const navigate = useNavigate();
    const { user: currentUser } = useAuthStore();
    const [myPets, setMyPets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [typeFilter,   setTypeFilter]   = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');

    // Adopt dialog state
    const [adoptDialog, setAdoptDialog]         = useState(null);
    const [adopterSearch, setAdopterSearch]     = useState('');
    const [adopterResults, setAdopterResults]   = useState([]);
    const [selectedAdopter, setSelectedAdopter] = useState(null);
    const [adopterLoading, setAdopterLoading]   = useState(false);
    const [adoptConfirming, setAdoptConfirming] = useState(false);

    // Found dialog state
    const [foundDialog, setFoundDialog]     = useState(null);
    const [foundConfirming, setFoundConfirming] = useState(false);

    // Undo-adoption confirm dialog: { id, name }
    const [undoDialog,   setUndoDialog]   = useState(null);
    const [undoingDialog, setUndoingDialog] = useState(false);

    // Delete listing confirm dialog: { id, name }
    const [deleteDialog,   setDeleteDialog]   = useState(null);
    const [deletingDialog, setDeletingDialog] = useState(false);

    // Undo adoption
    const [undoingId, setUndoingId] = useState(null);

    useEffect(() => {
        if (!currentUser?._id) { setIsLoading(false); return; }
        axios.get(`${API}/users/${currentUser._id}/pets`, { withCredentials: true })
            .then(r => setMyPets(r.data.pets || []))
            .catch(() => setMyPets([]))
            .finally(() => setIsLoading(false));
    }, [currentUser?._id]);

    // Debounced search for adopter
    useEffect(() => {
        if (!adopterSearch.trim() || adopterSearch.length < 2) {
            setAdopterResults([]);
            return;
        }
        setAdopterLoading(true);
        const t = setTimeout(() => {
            axios.get(`${API}/users/search?q=${encodeURIComponent(adopterSearch)}`, { withCredentials: true })
                .then(r => setAdopterResults(r.data.users || []))
                .catch(() => setAdopterResults([]))
                .finally(() => setAdopterLoading(false));
        }, 300);
        return () => clearTimeout(t);
    }, [adopterSearch]);

    const filteredPets = useMemo(() => {
        return myPets.filter(pet => {
            if (typeFilter !== 'All') {
                const petType = (pet.type || '').toLowerCase();
                if (petType !== typeFilter.toLowerCase()) return false;
            }
            if (statusFilter !== 'All') {
                if (getStatusKey(pet) !== statusFilter) return false;
            }
            return true;
        });
    }, [myPets, typeFilter, statusFilter]);

    const openAdoptDialog = (pet) => {
        setAdoptDialog(pet);
        setAdopterSearch('');
        setAdopterResults([]);
        setSelectedAdopter(null);
    };

    const closeAdoptDialog = () => {
        if (adoptConfirming) return;
        setAdoptDialog(null);
        setAdopterSearch('');
        setAdopterResults([]);
        setSelectedAdopter(null);
    };

    const confirmMarkAdopted = async (adoptedById) => {
        if (!adoptDialog) return;
        setAdoptConfirming(true);
        try {
            await axios.patch(
                `${API}/pets/${adoptDialog.id}/adopt`,
                { adoptedById: adoptedById || null },
                { withCredentials: true }
            );
            toast.success('Marked as adopted!');
            setMyPets(prev => prev.map(p =>
                p.id === adoptDialog.id ? { ...p, is_adopted: true, adoption_status: 'adopted' } : p
            ));
            closeAdoptDialog();
        } catch {
            toast.error('Failed to update.');
        } finally {
            setAdoptConfirming(false);
        }
    };

    const confirmMarkFound = async () => {
        if (!foundDialog) return;
        setFoundConfirming(true);
        try {
            await axios.patch(`${API}/pets/${foundDialog.id}/found`, {}, { withCredentials: true });
            toast.success('Marked as returned home!');
            setMyPets(prev => prev.map(p =>
                p.id === foundDialog.id ? { ...p, is_available: false, adoption_status: 'unavailable' } : p
            ));
            setFoundDialog(null);
        } catch {
            toast.error('Failed to update.');
        } finally {
            setFoundConfirming(false);
        }
    };

    const handleUnadopt = (pet) => setUndoDialog({ id: pet.id || pet, name: pet.name || '' });

    const confirmUnadopt = async () => {
        if (!undoDialog) return;
        setUndoingDialog(true);
        setUndoingId(undoDialog.id);
        try {
            await axios.patch(`${API}/pets/${undoDialog.id}/unadopt`, {}, { withCredentials: true });
            toast.success('Adoption mark removed.');
            setMyPets(prev => prev.map(p =>
                p.id === undoDialog.id ? { ...p, is_adopted: false, adoption_status: 'available' } : p
            ));
            setUndoDialog(null);
        } catch {
            toast.error('Failed to undo adoption.');
        } finally {
            setUndoingDialog(false);
            setUndoingId(null);
        }
    };

    const handleDelete = (pet) => setDeleteDialog({ id: pet.id || pet, name: pet.name || '' });

    const confirmDelete = async () => {
        if (!deleteDialog) return;
        setDeletingDialog(true);
        try {
            await axios.delete(`${API}/pets/${deleteDialog.id}`, { withCredentials: true });
            toast.success('Listing deleted.');
            setMyPets(prev => prev.filter(p => p.id !== deleteDialog.id));
            setDeleteDialog(null);
        } catch {
            toast.error('Failed to delete.');
        } finally {
            setDeletingDialog(false);
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', backgroundColor: C.cream, overflowY: 'auto' }}>
            <Navbar />
            <div style={{ padding: '20px 48px 16px', borderBottom: '3px double rgba(45,31,20,0.15)' }}>
                <div style={{ fontFamily: serif, fontSize: '32px', fontWeight: 700, color: C.espresso, lineHeight: 1, marginBottom: '5px' }}>My Animals</div>
                <div style={{ fontFamily: serif, fontSize: '13px', fontStyle: 'italic', color: C.muted }}>
                    {isLoading ? 'Loading…' : `${myPets.length} listing${myPets.length !== 1 ? 's' : ''} uploaded by you`}
                </div>
            </div>

            {/* ── Filters ── */}
            {!isLoading && myPets.length > 0 && (
                <div style={{ padding: '14px 48px', borderBottom: `1px solid ${C.border}`, display: 'flex', gap: '32px', alignItems: 'center', backgroundColor: C.cream }}>
                    <FilterGroup label="Type" options={TYPE_OPTIONS} value={typeFilter} onChange={setTypeFilter} />
                    <FilterGroup label="Status" options={STATUS_OPTIONS} value={statusFilter} onChange={setStatusFilter} />
                </div>
            )}

            <div style={{ padding: '24px 48px 48px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                {isLoading ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '48px 0', fontFamily: serif, fontSize: '18px', fontStyle: 'italic', color: C.light }}>Loading…</div>
                ) : !currentUser ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '48px 0', fontFamily: serif, fontSize: '18px', fontStyle: 'italic', color: C.light }}>
                        Please <span style={{ color: C.brown, cursor: 'pointer' }} onClick={() => navigate('/login')}>log in</span>.
                    </div>
                ) : myPets.length === 0 ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '48px 0' }}>
                        <div style={{ fontFamily: serif, fontSize: '22px', fontStyle: 'italic', color: C.light, marginBottom: '16px' }}>You haven't uploaded any animals yet.</div>
                        <button onClick={() => navigate('/add-animal')} style={{ backgroundColor: C.espresso, color: C.cream, border: 'none', borderRadius: '3px', padding: '10px 22px', fontFamily: sans, fontSize: '13px', cursor: 'pointer' }}>
                            + Upload an animal
                        </button>
                    </div>
                ) : filteredPets.length === 0 ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '48px 0', fontFamily: serif, fontSize: '18px', fontStyle: 'italic', color: C.light }}>
                        No listings match these filters.
                    </div>
                ) : (
                    filteredPets.map(pet => (
                        <PetCard
                            key={pet.id}
                            pet={pet}
                            onMarkAdopted={openAdoptDialog}
                            onMarkFound={setFoundDialog}
                            onUnadopt={handleUnadopt}
                            undoingId={undoingId}
                            onDelete={handleDelete}
                            onNavigate={(id) => navigate(`/pet/${id}`)}
                            onEdit={(id) => navigate(`/pet/${id}/edit`)}
                        />
                    ))
                )}
            </div>

            {/* ── Adopter selection dialog ── */}
            {adoptDialog && (
                <div
                    style={{ position: 'fixed', inset: 0, background: 'rgba(45,31,20,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
                    onClick={closeAdoptDialog}
                >
                    <div
                        style={{ background: C.cream, borderRadius: '6px', padding: '32px', maxWidth: '480px', width: '100%', position: 'relative' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ fontFamily: serif, fontSize: '22px', fontWeight: 700, color: C.espresso, marginBottom: '6px' }}>
                            Who adopted {adoptDialog.name}?
                        </div>
                        <div style={{ fontFamily: sans, fontSize: '13px', color: C.muted, marginBottom: '20px', lineHeight: 1.5 }}>
                            Search for the person who adopted this animal on Paws, or skip if they're not on the platform.
                        </div>

                        <input
                            type="text"
                            placeholder="Search by name or email…"
                            value={adopterSearch}
                            autoFocus
                            onChange={e => { setAdopterSearch(e.target.value); setSelectedAdopter(null); }}
                            style={{ width: '100%', boxSizing: 'border-box', fontFamily: sans, fontSize: '13px', padding: '10px 12px', border: '1px solid rgba(45,31,20,0.2)', borderRadius: '3px', outline: 'none', background: '#fff', color: C.espresso }}
                        />

                        {adopterLoading && (
                            <div style={{ fontFamily: sans, fontSize: '12px', color: C.light, padding: '8px 0' }}>Searching…</div>
                        )}

                        {adopterResults.length > 0 && !selectedAdopter && (
                            <div style={{ marginTop: '6px', border: '1px solid rgba(45,31,20,0.15)', borderRadius: '3px', overflow: 'hidden' }}>
                                {adopterResults.map(u => (
                                    <button
                                        key={u._id}
                                        onClick={() => { setSelectedAdopter(u); setAdopterSearch(u.name); setAdopterResults([]); }}
                                        style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 12px', background: '#fff', border: 'none', borderBottom: '1px solid rgba(45,31,20,0.08)', cursor: 'pointer', textAlign: 'left' }}
                                        onMouseEnter={e => { e.currentTarget.style.background = '#F5EFE8'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
                                    >
                                        {u.avatar && (
                                            <img src={u.avatar.startsWith('http') ? u.avatar : `http://localhost:5000${u.avatar}`} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} onError={e => { e.target.style.display = 'none'; }} />
                                        )}
                                        <div>
                                            <div style={{ fontFamily: sans, fontSize: '13px', fontWeight: 500, color: C.espresso }}>{u.name}</div>
                                            <div style={{ fontFamily: sans, fontSize: '11px', color: '#9A7A60' }}>{u.email}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {selectedAdopter && (
                            <div style={{ marginTop: '8px', padding: '10px 12px', background: 'rgba(15,110,86,0.07)', border: '1px solid rgba(15,110,86,0.2)', borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontFamily: sans, fontSize: '13px', color: '#0F6E56' }}>✓ {selectedAdopter.name}</span>
                                <button onClick={() => { setSelectedAdopter(null); setAdopterSearch(''); }} style={{ fontFamily: sans, fontSize: '11px', color: '#993C1D', background: 'none', border: 'none', cursor: 'pointer' }}>Change</button>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
                            <button onClick={() => confirmMarkAdopted(null)} disabled={adoptConfirming}
                                style={{ flex: 1, fontFamily: sans, fontSize: '12px', padding: '10px 8px', border: '1px solid rgba(45,31,20,0.2)', borderRadius: '3px', background: 'transparent', color: C.muted, cursor: adoptConfirming ? 'default' : 'pointer', opacity: adoptConfirming ? 0.5 : 1 }}>
                                Skip — not on Paws
                            </button>
                            <button onClick={() => confirmMarkAdopted(selectedAdopter?._id || null)} disabled={adoptConfirming}
                                style={{ flex: 1, fontFamily: sans, fontSize: '12px', padding: '10px 8px', border: 'none', borderRadius: '3px', background: '#0F6E56', color: '#fff', cursor: adoptConfirming ? 'default' : 'pointer', opacity: adoptConfirming ? 0.6 : 1 }}>
                                {adoptConfirming ? 'Saving…' : selectedAdopter ? `Confirm — ${selectedAdopter.name}` : 'Confirm'}
                            </button>
                            <button onClick={closeAdoptDialog} disabled={adoptConfirming}
                                style={{ fontFamily: sans, fontSize: '12px', padding: '10px 14px', border: '1px solid rgba(153,60,29,0.3)', borderRadius: '3px', background: 'transparent', color: '#993C1D', cursor: adoptConfirming ? 'default' : 'pointer' }}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Undo adoption confirm dialog ── */}
            {undoDialog && (
                <div
                    style={{ position: 'fixed', inset: 0, background: 'rgba(45,31,20,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
                    onClick={() => { if (!undoingDialog) setUndoDialog(null); }}
                >
                    <div
                        style={{ background: C.cream, borderRadius: '6px', padding: '32px', maxWidth: '420px', width: '100%' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ fontFamily: serif, fontSize: '22px', fontWeight: 700, color: C.espresso, marginBottom: '8px' }}>
                            Undo adoption for {undoDialog.name}?
                        </div>
                        <div style={{ fontFamily: sans, fontSize: '13px', color: C.muted, marginBottom: '24px', lineHeight: 1.6 }}>
                            This will remove the adopted mark and make the listing active again on the platform.
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={() => setUndoDialog(null)} disabled={undoingDialog}
                                style={{ flex: 1, fontFamily: sans, fontSize: '12px', padding: '10px', border: '1px solid rgba(45,31,20,0.2)', borderRadius: '3px', background: 'transparent', color: C.muted, cursor: undoingDialog ? 'default' : 'pointer' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmUnadopt} disabled={undoingDialog}
                                style={{ flex: 2, fontFamily: sans, fontSize: '12px', padding: '10px', border: 'none', borderRadius: '3px', background: C.brown, color: '#fff', cursor: undoingDialog ? 'default' : 'pointer', opacity: undoingDialog ? 0.6 : 1 }}
                            >
                                {undoingDialog ? 'Removing…' : 'Yes, undo adoption'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete listing confirm dialog ── */}
            {deleteDialog && (
                <div
                    style={{ position: 'fixed', inset: 0, background: 'rgba(45,31,20,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
                    onClick={() => { if (!deletingDialog) setDeleteDialog(null); }}
                >
                    <div
                        style={{ background: C.cream, borderRadius: '6px', padding: '32px', maxWidth: '420px', width: '100%' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ fontFamily: serif, fontSize: '22px', fontWeight: 700, color: C.espresso, marginBottom: '8px' }}>
                            Delete {deleteDialog.name}?
                        </div>
                        <div style={{ fontFamily: sans, fontSize: '13px', color: C.muted, marginBottom: '24px', lineHeight: 1.6 }}>
                            This will permanently remove the listing and all its photos. This action cannot be undone.
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={() => setDeleteDialog(null)} disabled={deletingDialog}
                                style={{ flex: 1, fontFamily: sans, fontSize: '12px', padding: '10px', border: '1px solid rgba(45,31,20,0.2)', borderRadius: '3px', background: 'transparent', color: C.muted, cursor: deletingDialog ? 'default' : 'pointer' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete} disabled={deletingDialog}
                                style={{ flex: 2, fontFamily: sans, fontSize: '12px', padding: '10px', border: 'none', borderRadius: '3px', background: '#993C1D', color: '#fff', cursor: deletingDialog ? 'default' : 'pointer', opacity: deletingDialog ? 0.6 : 1 }}
                            >
                                {deletingDialog ? 'Deleting…' : 'Yes, delete listing'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Mark as Found dialog ── */}
            {foundDialog && (
                <div
                    style={{ position: 'fixed', inset: 0, background: 'rgba(45,31,20,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
                    onClick={() => { if (!foundConfirming) setFoundDialog(null); }}
                >
                    <div
                        style={{ background: C.cream, borderRadius: '6px', padding: '32px', maxWidth: '420px', width: '100%' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ fontFamily: serif, fontSize: '22px', fontWeight: 700, color: C.espresso, marginBottom: '8px' }}>
                            Did {foundDialog.name} come home?
                        </div>
                        <div style={{ fontFamily: sans, fontSize: '13px', color: C.muted, marginBottom: '24px', lineHeight: 1.6 }}>
                            This will close the listing and mark the animal as returned to their owner. It won't appear in the Community adoption stories — those are reserved for animals that found a new home.
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => { if (!foundConfirming) setFoundDialog(null); }}
                                style={{ flex: 1, fontFamily: sans, fontSize: '12px', padding: '10px', border: '1px solid rgba(45,31,20,0.2)', borderRadius: '3px', background: 'transparent', color: C.muted, cursor: foundConfirming ? 'default' : 'pointer' }}>
                                Cancel
                            </button>
                            <button onClick={confirmMarkFound} disabled={foundConfirming}
                                style={{ flex: 2, fontFamily: sans, fontSize: '12px', padding: '10px', border: 'none', borderRadius: '3px', background: '#5A3CC8', color: '#fff', cursor: foundConfirming ? 'default' : 'pointer', opacity: foundConfirming ? 0.6 : 1 }}>
                                {foundConfirming ? 'Saving…' : 'Yes, they\'re home'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function FilterGroup({ label, options, value, onChange }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontFamily: sans, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: C.light, flexShrink: 0 }}>{label}</span>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {options.map(opt => (
                    <button
                        key={opt}
                        onClick={() => onChange(opt)}
                        style={{
                            fontFamily: sans,
                            fontSize: '11px',
                            padding: '4px 10px',
                            borderRadius: '100px',
                            border: value === opt ? '1px solid rgba(45,31,20,0.5)' : '1px solid rgba(45,31,20,0.15)',
                            background: value === opt ? C.espresso : 'transparent',
                            color: value === opt ? C.cream : C.muted,
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                        }}
                    >
                        {opt}
                    </button>
                ))}
            </div>
        </div>
    );
}

function PetCard({ pet, onMarkAdopted, onMarkFound, onUnadopt, undoingId, onDelete, onNavigate, onEdit }) {
    const photoUrl   = getPrimaryPhotoUrl(pet);
    const badge      = getBadge(pet);
    const isMissing  = (pet.situation || '').toLowerCase() === 'went_missing';
    const isAdopted  = pet.is_adopted || (pet.adoption_status || '').toLowerCase() === 'adopted';
    // Returned to owner: missing pet marked as found (unavailable but NOT adopted)
    const isReturned = isMissing && (pet.adoption_status || '').toLowerCase() === 'unavailable' && !isAdopted;

    return (
        <div style={{ backgroundColor: '#fff', border: '1px solid rgba(45,31,20,0.1)', borderRadius: '3px', display: 'flex', flexDirection: 'column' }}>
            {/* Photo */}
            <div
                onClick={() => onNavigate(pet.id)}
                style={{ height: '180px', overflow: 'hidden', backgroundColor: '#F0E8E0', cursor: 'pointer', position: 'relative', flexShrink: 0 }}
            >
                {photoUrl
                    ? <img src={photoUrl} alt={pet.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%', display: 'block' }} onError={e => { e.target.style.display = 'none'; }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: '32px', opacity: 0.3 }}>🐾</span></div>
                }
            </div>

            {/* Info */}
            <div style={{ padding: '10px 12px 6px', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontFamily: sans, fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '2px 7px', borderRadius: '2px', fontWeight: 600, background: badge.bg, color: badge.color, border: badge.border }}>
                        {badge.label}
                    </span>
                    <span style={{ fontFamily: sans, fontSize: '9px', color: C.light }}>{timeAgo(pet.created_at)}</span>
                </div>
                <div style={{ fontFamily: serif, fontSize: '15px', fontWeight: 700, color: C.espresso, lineHeight: 1.25, marginBottom: '4px' }}>
                    {pet.name || 'Unknown animal'}
                </div>
                <div style={{ fontFamily: sans, fontSize: '10px', color: '#9A7A60', marginBottom: '10px' }}>
                    {pet.location_city}{pet.location_city && pet.age_category ? ' · ' : ''}{pet.age_category}
                </div>
            </div>

            {/* Actions */}
            <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {isAdopted && (
                    <button
                        onClick={() => onUnadopt(pet)}
                        disabled={undoingId === pet.id}
                        style={{ width: '100%', fontFamily: sans, fontSize: '11px', fontWeight: 500, padding: '7px 0', borderRadius: '2px', cursor: undoingId === pet.id ? 'default' : 'pointer', border: '1px solid rgba(45,31,20,0.2)', background: 'transparent', color: C.muted, opacity: undoingId === pet.id ? 0.5 : 1 }}
                    >
                        {undoingId === pet.id ? 'Removing…' : 'Undo adoption'}
                    </button>
                )}
                {!isAdopted && !isReturned && isMissing && (
                    <button
                        onClick={() => onMarkFound(pet)}
                        style={{ width: '100%', fontFamily: sans, fontSize: '11px', fontWeight: 500, padding: '7px 0', borderRadius: '2px', cursor: 'pointer', border: '1px solid rgba(90,60,200,0.3)', background: 'transparent', color: '#5A3CC8' }}
                    >
                        Mark as found
                    </button>
                )}
                {!isAdopted && !isReturned && !isMissing && (
                    <button
                        onClick={() => onMarkAdopted(pet)}
                        style={{ width: '100%', fontFamily: sans, fontSize: '11px', fontWeight: 500, padding: '7px 0', borderRadius: '2px', cursor: 'pointer', border: '1px solid rgba(15,110,86,0.25)', background: 'transparent', color: '#0F6E56' }}
                    >
                        Mark as adopted
                    </button>
                )}
                <button
                    onClick={() => onEdit(pet.id)}
                    style={{ width: '100%', fontFamily: sans, fontSize: '11px', fontWeight: 500, padding: '7px 0', borderRadius: '2px', cursor: 'pointer', border: '1px solid rgba(45,31,20,0.2)', background: 'transparent', color: C.espresso }}
                >
                    Edit listing →
                </button>
                <button
                    onClick={() => onDelete(pet)}
                    style={{ width: '100%', fontFamily: sans, fontSize: '10px', fontWeight: 500, padding: '6px 0', borderRadius: '2px', cursor: 'pointer', border: '1px solid rgba(153,60,29,0.3)', background: 'transparent', color: '#993C1D' }}
                >
                    Delete listing
                </button>
            </div>
        </div>
    );
}
