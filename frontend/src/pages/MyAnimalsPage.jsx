import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import { useAuthStore } from '../store/authStore';

const API   = 'http://localhost:5000/api';
const serif = "'Cormorant Garamond', serif";
const sans  = "'DM Sans', sans-serif";

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
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

function getBadge(pet) {
    const hs = (pet.health_status || '').toLowerCase();
    const as = (pet.adoption_status || '').toLowerCase();
    if (pet.status === 'rejected') return { label: 'Rejected', bg: 'rgba(153,60,29,0.1)', color: '#993C1D', border: '1px solid rgba(153,60,29,0.25)' };
    if (pet.status === 'pending') return { label: 'Pending review', bg: '#FAF3E8', color: '#8B4E28', border: '1px solid rgba(192,122,74,0.25)' };
    if (pet.is_adopted || as === 'adopted') return { label: 'Adopted', bg: 'rgba(15,110,86,0.12)', color: '#0F6E56', border: '1px solid rgba(15,110,86,0.2)' };
    if (hs.includes('urgent')) return { label: 'Urgent', bg: '#993C1D', color: '#FAF7F4', border: 'none' };
    if (hs.includes('vacc')) return { label: 'Vaccinated', bg: 'rgba(29,158,117,0.12)', color: '#0F6E56', border: '1px solid rgba(29,158,117,0.2)' };
    return { label: 'Listed', bg: 'rgba(45,31,20,0.08)', color: '#7A5C44', border: '1px solid rgba(45,31,20,0.12)' };
}

export default function MyAnimalsPage() {
    const navigate = useNavigate();
    const { user: currentUser } = useAuthStore();
    const [myPets, setMyPets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Adopt dialog state
    const [adoptDialog, setAdoptDialog]         = useState(null); // pet object or null
    const [adopterSearch, setAdopterSearch]     = useState('');
    const [adopterResults, setAdopterResults]   = useState([]);
    const [selectedAdopter, setSelectedAdopter] = useState(null);
    const [adopterLoading, setAdopterLoading]   = useState(false);
    const [adoptConfirming, setAdoptConfirming] = useState(false);

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

    const handleDelete = async (petId) => {
        if (!window.confirm('Delete this listing permanently? This cannot be undone.')) return;
        try {
            await axios.delete(`${API}/pets/${petId}`, { withCredentials: true });
            toast.success('Listing deleted.');
            setMyPets(prev => prev.filter(p => p.id !== petId));
        } catch {
            toast.error('Failed to delete.');
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', backgroundColor: '#FAF7F4', overflowY: 'auto' }}>
            <Navbar />
            <div style={{ padding: '20px 48px 16px', borderBottom: '3px double rgba(45,31,20,0.15)' }}>
                <div style={{ fontFamily: serif, fontSize: '32px', fontWeight: 700, color: '#2D1F14', lineHeight: 1, marginBottom: '5px' }}>My Animals</div>
                <div style={{ fontFamily: serif, fontSize: '13px', fontStyle: 'italic', color: '#7A5C44' }}>
                    {isLoading ? 'Loading…' : `${myPets.length} listing${myPets.length !== 1 ? 's' : ''} uploaded by you`}
                </div>
            </div>

            <div style={{ padding: '24px 48px 48px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                {isLoading ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '48px 0', fontFamily: serif, fontSize: '18px', fontStyle: 'italic', color: '#B09880' }}>Loading…</div>
                ) : !currentUser ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '48px 0', fontFamily: serif, fontSize: '18px', fontStyle: 'italic', color: '#B09880' }}>
                        Please <span style={{ color: '#C07A4A', cursor: 'pointer' }} onClick={() => navigate('/login')}>log in</span>.
                    </div>
                ) : myPets.length === 0 ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '48px 0' }}>
                        <div style={{ fontFamily: serif, fontSize: '22px', fontStyle: 'italic', color: '#B09880', marginBottom: '16px' }}>You haven't uploaded any animals yet.</div>
                        <button onClick={() => navigate('/add-animal')} style={{ backgroundColor: '#2D1F14', color: '#FAF7F4', border: 'none', borderRadius: '3px', padding: '10px 22px', fontFamily: sans, fontSize: '13px', cursor: 'pointer' }}>
                            + Upload an animal
                        </button>
                    </div>
                ) : (
                    myPets.map(pet => (
                        <PetCard
                            key={pet.id}
                            pet={pet}
                            onMarkAdopted={openAdoptDialog}
                            onDelete={handleDelete}
                            onNavigate={(id) => navigate(`/pet/${id}`)}
                            onEdit={(id) => navigate(`/pet/${id}/edit`)}
                        />
                    ))
                )}
            </div>

            {/* ── Adopter selection dialog ────────────────────────────────────── */}
            {adoptDialog && (
                <div
                    style={{ position: 'fixed', inset: 0, background: 'rgba(45,31,20,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
                    onClick={closeAdoptDialog}
                >
                    <div
                        style={{ background: '#FAF7F4', borderRadius: '6px', padding: '32px', maxWidth: '480px', width: '100%', position: 'relative' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ fontFamily: serif, fontSize: '22px', fontWeight: 700, color: '#2D1F14', marginBottom: '6px' }}>
                            Who adopted {adoptDialog.name}?
                        </div>
                        <div style={{ fontFamily: sans, fontSize: '13px', color: '#7A5C44', marginBottom: '20px', lineHeight: 1.5 }}>
                            Search for the person who adopted this animal on Paws, or skip if they're not on the platform.
                        </div>

                        <input
                            type="text"
                            placeholder="Search by name or email…"
                            value={adopterSearch}
                            autoFocus
                            onChange={e => { setAdopterSearch(e.target.value); setSelectedAdopter(null); }}
                            style={{ width: '100%', boxSizing: 'border-box', fontFamily: sans, fontSize: '13px', padding: '10px 12px', border: '1px solid rgba(45,31,20,0.2)', borderRadius: '3px', outline: 'none', background: '#fff', color: '#2D1F14' }}
                        />

                        {adopterLoading && (
                            <div style={{ fontFamily: sans, fontSize: '12px', color: '#B09880', padding: '8px 0' }}>Searching…</div>
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
                                            <div style={{ fontFamily: sans, fontSize: '13px', fontWeight: 500, color: '#2D1F14' }}>{u.name}</div>
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
                            <button
                                onClick={() => confirmMarkAdopted(null)}
                                disabled={adoptConfirming}
                                style={{ flex: 1, fontFamily: sans, fontSize: '12px', padding: '10px 8px', border: '1px solid rgba(45,31,20,0.2)', borderRadius: '3px', background: 'transparent', color: '#7A5C44', cursor: adoptConfirming ? 'default' : 'pointer', opacity: adoptConfirming ? 0.5 : 1 }}
                            >
                                Skip — not on Paws
                            </button>
                            <button
                                onClick={() => confirmMarkAdopted(selectedAdopter?._id || null)}
                                disabled={adoptConfirming}
                                style={{ flex: 1, fontFamily: sans, fontSize: '12px', padding: '10px 8px', border: 'none', borderRadius: '3px', background: '#0F6E56', color: '#fff', cursor: adoptConfirming ? 'default' : 'pointer', opacity: adoptConfirming ? 0.6 : 1 }}
                            >
                                {adoptConfirming ? 'Saving…' : selectedAdopter ? `Confirm — ${selectedAdopter.name}` : 'Confirm'}
                            </button>
                            <button
                                onClick={closeAdoptDialog}
                                disabled={adoptConfirming}
                                style={{ fontFamily: sans, fontSize: '12px', padding: '10px 14px', border: '1px solid rgba(153,60,29,0.3)', borderRadius: '3px', background: 'transparent', color: '#993C1D', cursor: adoptConfirming ? 'default' : 'pointer' }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function PetCard({ pet, onMarkAdopted, onDelete, onNavigate, onEdit }) {
    const photoUrl = getPrimaryPhotoUrl(pet);
    const badge = getBadge(pet);

    return (
        <div style={{
            backgroundColor: '#fff',
            border: '1px solid rgba(45,31,20,0.1)',
            borderRadius: '3px',
            display: 'flex',
            flexDirection: 'column',
        }}>
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
                    <span style={{ fontFamily: sans, fontSize: '9px', color: '#B09880' }}>{timeAgo(pet.created_at)}</span>
                </div>
                <div style={{ fontFamily: serif, fontSize: '15px', fontWeight: 700, color: '#2D1F14', lineHeight: 1.25, marginBottom: '4px' }}>
                    {pet.name || 'Unknown animal'}
                </div>
                <div style={{ fontFamily: sans, fontSize: '10px', color: '#9A7A60', marginBottom: '10px' }}>
                    {pet.location_city}{pet.location_city && pet.age_category ? ' · ' : ''}{pet.age_category}
                </div>
            </div>

            {/* Actions */}
            <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {!pet.is_adopted && (
                    <button
                        onClick={() => onMarkAdopted(pet)}
                        style={{ width: '100%', fontFamily: sans, fontSize: '11px', fontWeight: 500, padding: '7px 0', borderRadius: '2px', cursor: 'pointer', border: '1px solid rgba(15,110,86,0.25)', background: 'transparent', color: '#0F6E56' }}
                    >
                        Mark as adopted
                    </button>
                )}
                <button
                    onClick={() => onEdit(pet.id)}
                    style={{ width: '100%', fontFamily: sans, fontSize: '11px', fontWeight: 500, padding: '7px 0', borderRadius: '2px', cursor: 'pointer', border: '1px solid rgba(45,31,20,0.2)', background: 'transparent', color: '#2D1F14' }}
                >
                    Edit listing →
                </button>
                <button
                    onClick={() => onDelete(pet.id)}
                    style={{ width: '100%', fontFamily: sans, fontSize: '10px', fontWeight: 500, padding: '6px 0', borderRadius: '2px', cursor: 'pointer', border: '1px solid rgba(153,60,29,0.3)', background: 'transparent', color: '#993C1D' }}
                >
                    Delete listing
                </button>
            </div>
        </div>
    );
}
