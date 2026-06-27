import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';

const API   = 'http://localhost:5000/api';
const serif = "'Cormorant Garamond', serif";
const sans  = "'DM Sans', sans-serif";

const C = {
    cream:   '#FAF7F4',
    espresso:'#2D1F14',
    brown:   '#C07A4A',
    muted:   '#7A5C44',
    border:  'rgba(45,31,20,0.1)',
};

function formatDate(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d)) return null;
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export default function CommunityStoriesPage() {
    const [pets, setPets]     = useState([]);
    const [stats, setStats]   = useState({ found_home: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get(`${API}/animals/stats`)
            .then(r => { if (r.data.success) setStats(r.data.stats); })
            .catch(() => {});

        axios.get(`${API}/pets`, { params: { adopted: 'true' }, withCredentials: true })
            .then(r => {
                const list = r.data.pets || r.data.data || [];
                setPets(list);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', backgroundColor: C.cream, overflowY: 'auto' }}>
            <Navbar />

            <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 32px 80px', width: '100%', boxSizing: 'border-box' }}>

                {/* Header */}
                <div style={{ borderBottom: `3px double ${C.border}`, paddingBottom: '28px', marginBottom: '40px', textAlign: 'center' }}>
                    <div style={{ fontFamily: sans, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.16em', color: C.brown, fontWeight: 500, marginBottom: '12px' }}>
                        The Paws Daily · Community
                    </div>
                    <h1 style={{ fontFamily: serif, fontSize: '52px', fontWeight: 700, color: C.espresso, margin: '0 0 14px', lineHeight: 1.1 }}>
                        {stats.found_home > 0 ? stats.found_home : '—'} animals found their forever home
                    </h1>
                    <p style={{ fontFamily: serif, fontSize: '18px', fontStyle: 'italic', color: C.muted, margin: '0 auto', maxWidth: '600px', lineHeight: 1.7 }}>
                        Every animal here found a home through our community.
                    </p>
                </div>

                {/* Grid */}
                {loading ? (
                    <div style={{ textAlign: 'center', fontFamily: sans, fontSize: '13px', color: C.muted, padding: '60px 0' }}>
                        Loading stories…
                    </div>
                ) : pets.length === 0 ? (
                    <div style={{ textAlign: 'center', fontFamily: serif, fontSize: '22px', fontStyle: 'italic', color: C.muted, padding: '80px 0' }}>
                        No adoption stories yet — check back soon.
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: '32px',
                    }}>
                        {pets.map(pet => (
                            <PetCard key={pet.id} pet={pet} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function PetCard({ pet }) {
    const [hovered, setHovered] = useState(false);
    const photoSrc = pet.primary_photo_id
        ? `${API}/pets/photos/${pet.primary_photo_id}`
        : null;
    const adopted = formatDate(pet.adopted_at);

    return (
        <Link
            to={`/pet/${pet.id}`}
            style={{ textDecoration: 'none', display: 'block' }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <div style={{
                border: `1px solid ${C.border}`,
                borderRadius: '4px',
                overflow: 'hidden',
                backgroundColor: '#fff',
                transition: 'box-shadow 0.2s, transform 0.2s',
                boxShadow: hovered ? '0 8px 24px rgba(45,31,20,0.12)' : '0 2px 8px rgba(45,31,20,0.06)',
                transform: hovered ? 'translateY(-3px)' : 'none',
            }}>
                {/* Photo */}
                <div style={{ height: '200px', background: 'rgba(45,31,20,0.06)', overflow: 'hidden', position: 'relative' }}>
                    {photoSrc ? (
                        <img
                            src={photoSrc}
                            alt={pet.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%' }}
                        />
                    ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontFamily: serif, fontSize: '48px', opacity: 0.15 }}>🐾</span>
                        </div>
                    )}
                    {/* Adopted badge */}
                    <div style={{
                        position: 'absolute', top: '10px', left: '10px',
                        fontFamily: sans, fontSize: '9px', fontWeight: 600,
                        textTransform: 'uppercase', letterSpacing: '0.1em',
                        background: C.espresso, color: C.cream,
                        padding: '4px 10px', borderRadius: '100px',
                    }}>
                        Adopted
                    </div>
                </div>

                {/* Info */}
                <div style={{ padding: '16px 18px 18px' }}>
                    <div style={{ fontFamily: serif, fontSize: '20px', fontWeight: 700, color: C.espresso, marginBottom: '4px', lineHeight: 1.2 }}>
                        {pet.name}
                    </div>
                    {pet.type && (
                        <div style={{ fontFamily: sans, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: C.brown, marginBottom: '8px' }}>
                            {pet.type.charAt(0).toUpperCase() + pet.type.slice(1)}
                            {pet.location_city ? ` · ${pet.location_city}` : ''}
                        </div>
                    )}
                    <div style={{ fontFamily: sans, fontSize: '12px', color: C.muted }}>
                        {adopted ? `Adopted in ${adopted}` : 'Found a loving home through Paws'}
                    </div>
                </div>
            </div>
        </Link>
    );
}
