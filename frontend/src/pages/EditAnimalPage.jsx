import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import { usePetStore } from '../store/petStore';
import { useAuthStore } from '../store/authStore';

const API   = 'http://localhost:5000/api';
const serif = "'Cormorant Garamond', serif";
const sans  = "'DM Sans', sans-serif";

function PillToggle({ options, value, onChange }) {
    return (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {options.map((opt) => {
                const active = value === opt;
                return (
                    <button
                        key={opt}
                        type="button"
                        onClick={() => onChange(active ? '' : opt)}
                        style={{
                            fontFamily: sans, fontSize: '12px',
                            padding: '6px 16px', borderRadius: '100px',
                            cursor: 'pointer',
                            border: `1px solid ${active ? '#2D1F14' : 'rgba(45,31,20,0.15)'}`,
                            background: active ? '#2D1F14' : 'transparent',
                            color: active ? '#FAF7F4' : '#7A5C44',
                            transition: 'all 0.15s',
                        }}
                    >
                        {opt}
                    </button>
                );
            })}
        </div>
    );
}

export default function EditAnimalPage() {
    const { id }       = useParams();
    const navigate     = useNavigate();
    const { user }     = useAuthStore();
    const { getPetById, clearSelectedPet } = usePetStore();

    const [pet,         setPet]         = useState(null);
    const [isLoading,   setIsLoading]   = useState(true);
    const [saving,      setSaving]      = useState(false);

    // Form fields
    const [name,        setName]        = useState('');
    const [description, setDescription] = useState('');
    const [healthStatus, setHealthStatus] = useState('');
    const [locationCity, setLocationCity] = useState('');
    const [photos,      setPhotos]      = useState([]);

    const fileInputRef = useRef(null);

    // ── Load pet ──────────────────────────────────────────────────────────────
    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            const result = await getPetById(id);
            if (!result?.success) {
                navigate('/');
                return;
            }
            // result.pet is available via store's selectedPet, but also returned
            const p = result.pet;

            // Auth check
            if (p.uploader_id && p.uploader_id !== user?._id && !user?.isAdmin) {
                toast.error('Not authorized');
                navigate('/');
                return;
            }

            setPet(p);
            setName(p.name || '');
            setDescription(p.description || '');
            setHealthStatus(p.health_status || '');
            setLocationCity(p.location_city || '');
            setPhotos(p.photos || []);
            setIsLoading(false);
        };
        load();
        return () => clearSelectedPet();
    }, [id]);

    // ── Delete photo ──────────────────────────────────────────────────────────
    const handleDeletePhoto = async (photoId) => {
        try {
            await axios.delete(`${API}/pets/${id}/photos/${photoId}`, { withCredentials: true });
            setPhotos(prev => prev.filter(p => p.id !== photoId));
        } catch (err) {
            toast.error('Failed to delete photo');
        }
    };

    // ── Upload new photos ─────────────────────────────────────────────────────
    const handleAddPhotos = async (files) => {
        for (const file of Array.from(files)) {
            const form = new FormData();
            form.append('photo', file);
            try {
                const res = await axios.post(`${API}/pets/${id}/photos`, form, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    withCredentials: true,
                });
                setPhotos(prev => [...prev, res.data.photo]);
            } catch (err) {
                toast.error('Failed to upload photo');
            }
        }
    };

    // ── Save ──────────────────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await axios.patch(`${API}/pets/${id}`, {
                name:          name.trim(),
                description:   description.trim(),
                health_status: healthStatus,
                location_city: locationCity.trim(),
            }, { withCredentials: true });
            toast.success('Listing updated!');
            navigate(`/pet/${id}`);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update listing');
        } finally {
            setSaving(false);
        }
    };

    // ── Guards ────────────────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', backgroundColor: '#FAF7F4' }}>
                <Navbar />
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: serif, fontSize: '20px', fontStyle: 'italic', color: '#B09880' }}>
                    Loading…
                </div>
            </div>
        );
    }

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', backgroundColor: '#FAF7F4', overflowY: 'auto' }}>
            <Navbar />

            <form onSubmit={handleSubmit} style={{ maxWidth: '680px', margin: '0 auto', padding: '36px 48px 80px', width: '100%', boxSizing: 'border-box' }}>

                {/* Back */}
                <button
                    type="button"
                    onClick={() => navigate(`/pet/${id}`)}
                    style={{ fontFamily: sans, fontSize: '11px', color: '#9A7A60', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: '24px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#C07A4A'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#9A7A60'; }}
                >
                    ← Back to listing
                </button>

                {/* Masthead */}
                <div style={{ textAlign: 'center', paddingBottom: '24px', borderBottom: '3px double rgba(45,31,20,0.15)', marginBottom: '32px' }}>
                    <div style={{ fontFamily: sans, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#C07A4A', fontWeight: 500, marginBottom: '10px' }}>
                        The Paws Daily · Edit listing
                    </div>
                    <h1 style={{ fontFamily: serif, fontSize: '36px', fontWeight: 700, color: '#2D1F14', margin: 0, lineHeight: 1.1 }}>
                        Edit {pet?.name || 'listing'}
                    </h1>
                </div>

                {/* Name */}
                <div style={{ marginBottom: '24px' }}>
                    <div style={{ fontFamily: sans, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#C07A4A', fontWeight: 500, marginBottom: '8px' }}>
                        Name / Headline
                    </div>
                    <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        style={{
                            fontFamily: serif, fontSize: '28px', fontWeight: 700,
                            color: '#2D1F14', border: 'none',
                            borderBottom: '2px solid rgba(45,31,20,0.12)',
                            background: 'none', outline: 'none',
                            width: '100%', boxSizing: 'border-box', padding: '4px 0',
                        }}
                    />
                </div>

                {/* Description */}
                <div style={{ marginBottom: '24px' }}>
                    <div style={{ fontFamily: sans, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#C07A4A', fontWeight: 500, marginBottom: '8px' }}>
                        Description
                    </div>
                    <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        rows={6}
                        style={{
                            fontFamily: serif, fontSize: '16px', lineHeight: 1.75,
                            color: '#2D1F14', border: '1px solid rgba(45,31,20,0.12)',
                            borderRadius: '3px', background: '#fff',
                            outline: 'none', width: '100%', boxSizing: 'border-box',
                            padding: '12px', resize: 'vertical',
                        }}
                    />
                </div>

                {/* Status */}
                <div style={{ marginBottom: '24px' }}>
                    <div style={{ fontFamily: sans, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#C07A4A', fontWeight: 500, marginBottom: '8px' }}>
                        Status
                    </div>
                    <PillToggle
                        options={['Found', 'Urgent', 'Vaccinated']}
                        value={healthStatus}
                        onChange={setHealthStatus}
                    />
                </div>

                {/* Location */}
                <div style={{ marginBottom: '32px' }}>
                    <div style={{ fontFamily: sans, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#C07A4A', fontWeight: 500, marginBottom: '8px' }}>
                        Location
                    </div>
                    <input
                        type="text"
                        value={locationCity}
                        onChange={e => setLocationCity(e.target.value)}
                        placeholder="City or area"
                        style={{
                            fontFamily: sans, fontSize: '14px', color: '#2D1F14',
                            border: 'none', borderBottom: '1px solid rgba(45,31,20,0.15)',
                            background: 'none', outline: 'none',
                            width: '100%', boxSizing: 'border-box', padding: '6px 0',
                        }}
                    />
                </div>

                {/* Photos */}
                <div style={{ marginBottom: '32px' }}>
                    <div style={{ fontFamily: sans, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#C07A4A', fontWeight: 500, marginBottom: '12px' }}>
                        Photos
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'flex-start' }}>
                        {photos.map(photo => (
                            <div key={photo.id} style={{ position: 'relative', flexShrink: 0 }}>
                                <img
                                    src={photo.id ? `${API}/pets/photos/${photo.id}` : photo.photo_url}
                                    alt=""
                                    style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '3px', border: '1px solid rgba(45,31,20,0.1)', display: 'block' }}
                                    onError={e => { e.target.style.display = 'none'; }}
                                />
                                <button
                                    type="button"
                                    onClick={() => handleDeletePhoto(photo.id)}
                                    title="Remove photo"
                                    style={{
                                        position: 'absolute', top: '-6px', right: '-6px',
                                        width: '16px', height: '16px', borderRadius: '50%',
                                        background: '#2D1F14', color: '#FAF7F4',
                                        border: 'none', cursor: 'pointer', fontSize: '10px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        lineHeight: 1,
                                    }}
                                >
                                    ×
                                </button>
                            </div>
                        ))}

                        {/* Add photo button */}
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                                width: '80px', height: '80px', flexShrink: 0,
                                border: '1px dashed rgba(45,31,20,0.2)', borderRadius: '3px',
                                background: 'none', cursor: 'pointer',
                                fontFamily: sans, fontSize: '10px', color: '#B09880',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px',
                            }}
                        >
                            <span style={{ fontSize: '18px', lineHeight: 1 }}>+</span>
                            <span>Add photo</span>
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            style={{ display: 'none' }}
                            onChange={e => handleAddPhotos(e.target.files)}
                        />
                    </div>
                </div>

                {/* Save button */}
                <button
                    type="submit"
                    disabled={saving}
                    style={{
                        width: '100%', backgroundColor: saving ? '#7A5C44' : '#2D1F14',
                        color: '#FAF7F4', padding: '14px', fontSize: '15px',
                        fontFamily: serif, fontStyle: 'italic',
                        border: 'none', borderRadius: '2px',
                        cursor: saving ? 'default' : 'pointer',
                        opacity: saving ? 0.7 : 1, transition: 'background-color 0.15s',
                    }}
                    onMouseEnter={e => { if (!saving) e.currentTarget.style.backgroundColor = '#3D2B1A'; }}
                    onMouseLeave={e => { if (!saving) e.currentTarget.style.backgroundColor = '#2D1F14'; }}
                >
                    {saving ? 'Saving…' : 'Save changes →'}
                </button>

            </form>
        </div>
    );
}
