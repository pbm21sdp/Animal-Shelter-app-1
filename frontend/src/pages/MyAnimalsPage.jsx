import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import { useAuthStore } from '../store/authStore';

const API   = 'http://localhost:5000/api';
const serif = "'Cormorant Garamond', serif";
const sans  = "'DM Sans', sans-serif";

// ── Helpers ───────────────────────────────────────────────────────────────────
function getPrimaryPhotoUrl(photos) {
    if (!photos || photos.length === 0) return null;
    const primary = photos.find((p) => p.is_primary) || photos[0];
    if (!primary) return null;
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

function getBadgeType(pet) {
    const hs = (pet.health_status || '').toLowerCase();
    const as = (pet.adoption_status || '').toLowerCase();
    if (hs.includes('urgent')) return 'Urgent';
    if (hs.includes('vacc')) return 'Vaccinated';
    if (as === 'adopted' || pet.is_adopted) return 'Adopted';
    return 'Found';
}

function Badge({ type }) {
    const styles = {
        Found:      { background: '#2D1F14', color: '#FAF7F4', border: 'none' },
        Urgent:     { background: '#993C1D', color: '#FAF7F4', border: 'none' },
        Vaccinated: { background: 'rgba(29,158,117,0.12)', color: '#0F6E56', border: '1px solid rgba(29,158,117,0.2)' },
        Adopted:    { background: 'rgba(15,110,86,0.12)', color: '#0F6E56', border: '1px solid rgba(15,110,86,0.2)' },
    };
    const s = styles[type] || { background: 'rgba(45,31,20,0.08)', color: '#7A5C44', border: '1px solid rgba(45,31,20,0.12)' };
    return (
        <span style={{ fontFamily: sans, fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '2px 7px', borderRadius: '2px', fontWeight: 600, ...s }}>
            {type || 'Listed'}
        </span>
    );
}

// ── My animal card ────────────────────────────────────────────────────────────
function MyAnimalCard({ pet, onDelete, onMarkAdopted }) {
    const navigate = useNavigate();
    const [hovered, setHovered] = useState(false);
    const photoUrl = getPrimaryPhotoUrl(pet.photos);

    const location = pet.location_city || pet.location_address || '';
    const age      = pet.age_category  || '';
    const badge    = getBadgeType(pet);
    const title    = pet.name || 'Unknown animal';

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                backgroundColor: '#fff',
                border: '1px solid rgba(45,31,20,0.1)',
                borderRadius: '3px',
                overflow: 'hidden',
                transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
                transition: 'transform 0.2s ease',
                willChange: 'transform',
                cursor: 'default',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            {/* Photo */}
            <div
                onClick={() => navigate(`/pet/${pet.id}`)}
                style={{ position: 'relative', height: '180px', overflow: 'hidden', backgroundColor: '#F0E8E0', cursor: 'pointer', flexShrink: 0 }}
            >
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
            </div>

            {/* Info */}
            <div style={{ padding: '10px 12px 8px', flex: 1 }}>
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

            {/* Action buttons — always rendered, opacity-controlled to prevent height change */}
            <div style={{
                padding: '8px 12px 10px',
                borderTop: '1px solid rgba(45,31,20,0.06)',
                minHeight: '90px',
            }}>
                <div style={{
                    opacity: hovered ? 1 : 0,
                    pointerEvents: hovered ? 'auto' : 'none',
                    transition: 'opacity 0.15s ease',
                }}>
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                        <button
                            onClick={() => navigate(`/pet/${pet.id}/edit`)}
                            style={{
                                flex: 1, fontFamily: sans, fontSize: '11px', fontWeight: 500,
                                padding: '6px 0', borderRadius: '2px', cursor: 'pointer',
                                border: '1px solid rgba(45,31,20,0.2)', background: 'transparent', color: '#2D1F14',
                                transition: 'background 0.15s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(45,31,20,0.05)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                        >
                            Edit →
                        </button>
                        <button
                            onClick={() => onMarkAdopted(pet.id)}
                            style={{
                                flex: 1, fontFamily: sans, fontSize: '11px', fontWeight: 500,
                                padding: '6px 0', borderRadius: '2px', cursor: 'pointer',
                                border: '1px solid rgba(15,110,86,0.25)', background: 'transparent', color: '#0F6E56',
                                transition: 'background 0.15s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(15,110,86,0.06)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                        >
                            Mark adopted
                        </button>
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!window.confirm('Delete this listing permanently?')) return;
                            axios.delete(`${API}/pets/${pet.id}`, { withCredentials: true })
                                .then(() => {
                                    toast.success('Listing deleted.');
                                    onDelete(pet.id);
                                })
                                .catch(() => toast.error('Failed to delete.'));
                        }}
                        style={{
                            marginTop: '6px',
                            width: '100%',
                            fontFamily: sans,
                            fontSize: '10px',
                            fontWeight: 500,
                            padding: '5px 0',
                            borderRadius: '2px',
                            border: '1px solid rgba(153,60,29,0.3)',
                            color: '#993C1D',
                            background: 'transparent',
                            cursor: 'pointer',
                        }}
                    >
                        Delete listing
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function MyAnimalsPage() {
    const navigate = useNavigate();
    const { user: currentUser } = useAuthStore();
    const [myPets, setMyPets]     = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!currentUser?._id) { setIsLoading(false); return; }
        axios.get(`${API}/users/${currentUser._id}/pets`, { withCredentials: true })
            .then(r => { setMyPets(r.data.pets || []); })
            .catch(() => { setMyPets([]); })
            .finally(() => setIsLoading(false));
    }, [currentUser?._id]);

    const handleDelete = async (petId) => {
        if (!window.confirm('Permanently delete this listing? This cannot be undone.')) return;
        try {
            await axios.delete(`${API}/pets/${petId}`, { withCredentials: true });
            toast.success('Listing deleted.');
            setMyPets(prev => prev.filter(p => p.id !== petId));
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete.');
        }
    };

    const handleMarkAdopted = async (petId) => {
        try {
            await axios.patch(`${API}/pets/${petId}/adopt`, {}, { withCredentials: true });
            toast.success('Marked as adopted!');
            setMyPets(prev => prev.map(p => p.id === petId ? { ...p, adoption_status: 'adopted', is_adopted: true } : p));
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update.');
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', backgroundColor: '#FAF7F4', overflowY: 'auto' }}>
            <Navbar />

            {/* ── PAGE HEADER ──────────────────────────────────────────── */}
            <div style={{ padding: '20px 48px 16px', borderBottom: '3px double rgba(45,31,20,0.15)' }}>
                <div style={{ fontFamily: serif, fontSize: '32px', fontWeight: 700, color: '#2D1F14', lineHeight: 1, marginBottom: '5px' }}>
                    My Animals
                </div>
                <div style={{ fontFamily: serif, fontSize: '13px', fontStyle: 'italic', color: '#7A5C44' }}>
                    {isLoading
                        ? 'Loading…'
                        : `${myPets.length} listing${myPets.length !== 1 ? 's' : ''} uploaded by you`
                    }
                </div>
            </div>

            {/* ── GRID ─────────────────────────────────────────────────── */}
            <div style={{ padding: '20px 48px 40px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', alignItems: 'stretch' }}>
                {isLoading ? (
                    <div style={{ gridColumn: '1 / -1', padding: '48px 0', textAlign: 'center', fontFamily: serif, fontSize: '18px', fontStyle: 'italic', color: '#B09880' }}>
                        Loading your animals…
                    </div>
                ) : !currentUser ? (
                    <div style={{ gridColumn: '1 / -1', padding: '48px 0', textAlign: 'center', fontFamily: serif, fontSize: '18px', fontStyle: 'italic', color: '#B09880' }}>
                        Please <span style={{ color: '#C07A4A', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate('/login')}>log in</span> to see your animals.
                    </div>
                ) : myPets.length > 0 ? (
                    myPets.map((pet, idx) => (
                        <MyAnimalCard
                            key={pet.id}
                            pet={pet}
                            onDelete={(id) => setMyPets(prev => prev.filter(p => p.id !== id))}
                            onMarkAdopted={handleMarkAdopted}
                        />
                    ))
                ) : (
                    <div style={{ gridColumn: '1 / -1', padding: '48px 0', textAlign: 'center' }}>
                        <div style={{ fontFamily: serif, fontSize: '22px', fontStyle: 'italic', color: '#B09880', marginBottom: '14px' }}>
                            You haven't uploaded any animals yet.
                        </div>
                        <button
                            onClick={() => navigate('/add-animal')}
                            style={{
                                backgroundColor: '#2D1F14', color: '#FAF7F4',
                                border: 'none', borderRadius: '3px',
                                padding: '10px 22px', fontFamily: sans,
                                fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                                transition: 'opacity 0.15s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.opacity = '0.82'; }}
                            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                        >
                            + Upload an animal
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
