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

    useEffect(() => {
        if (!currentUser?._id) { setIsLoading(false); return; }
        axios.get(`${API}/users/${currentUser._id}/pets`, { withCredentials: true })
            .then(r => setMyPets(r.data.pets || []))
            .catch(() => setMyPets([]))
            .finally(() => setIsLoading(false));
    }, [currentUser?._id]);

    const handleMarkAdopted = async (petId) => {
        try {
            await axios.patch(`${API}/pets/${petId}/adopt`, {}, { withCredentials: true });
            toast.success('Marked as adopted!');
            setMyPets(prev => prev.map(p => p.id === petId ? { ...p, is_adopted: true, adoption_status: 'adopted' } : p));
        } catch {
            toast.error('Failed to update.');
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
                            onMarkAdopted={handleMarkAdopted}
                            onDelete={handleDelete}
                            onNavigate={(id) => navigate(`/pet/${id}`)}
                            onEdit={(id) => navigate(`/pet/${id}/edit`)}
                        />
                    ))
                )}
            </div>
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
            overflow: 'hidden',
        }}>
            {/* Photo */}
            <div
                onClick={() => onNavigate(pet.id)}
                style={{ height: '180px', overflow: 'hidden', backgroundColor: '#F0E8E0', cursor: 'pointer', position: 'relative' }}
            >
                {photoUrl
                    ? <img src={photoUrl} alt={pet.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%', display: 'block' }} onError={e => { e.target.style.display = 'none'; }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: '32px', opacity: 0.3 }}>🐾</span></div>
                }
            </div>

            {/* Info */}
            <div style={{ padding: '10px 12px 6px' }}>
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

            {/* Actions — always visible, no hover needed */}
            <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {!pet.is_adopted && (
                    <button
                        onClick={() => onMarkAdopted(pet.id)}
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