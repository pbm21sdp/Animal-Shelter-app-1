// pages/PetDetailPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import Navbar from '../components/Navbar';
import { usePetStore } from '../store/petStore';
import { useAuthStore } from '../store/authStore';
import UserAdoptionForm from '../components/UserAdoptionForm';
import NotFoundPage from './NotFoundPage';

const API   = 'http://localhost:5000/api';
const BASE  = 'http://localhost:5000';
const serif = "'Cormorant Garamond', serif";
const sans  = "'DM Sans', sans-serif";

// ── Helpers ────────────────────────────────────────────────────────────────────
function photoUrl(photo) {
    if (!photo) return null;
    if (photo.id)        return `${API}/pets/photos/${photo.id}`;
    if (photo.photo_url) return photo.photo_url;
    return null;
}

function resolveAvatar(avatar) {
    if (!avatar) return null;
    if (avatar.startsWith('http')) return avatar;
    return `${BASE}${avatar.startsWith('/') ? avatar : `/${avatar}`}`;
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

function fmtMemberSince(d) {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function cap(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatTrait(trait) {
    return trait.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ── Location formatter: removes duplicate "City, City" ────────────────────────
function fmtLocation(address, city) {
    const addr = (address || '').trim();
    const cit  = (city || '').trim();
    if (!addr) return cit;
    if (addr.toLowerCase() === cit.toLowerCase()) return cit;
    return [addr, cit].filter(Boolean).join(', ');
}

// ── Structured status tags from new DB columns ─────────────────────────────────
const SITUATION_LABELS = {
    found_on_street: 'Stray', appears_lost: 'Lost', went_missing: 'Missing',
    owner_surrendered: 'Surrendered', rescued_from_danger: 'Rescued', other: 'Other',
};
const VACCINATION_LABELS = { fully: 'Vaccinated', partially: 'Partial vax', no: 'Unvaccinated', unknown: 'Vax?' };

function buildPetTags(pet) {
    const tags = [];
    if (pet.current_status === 'needs_urgent_care') {
        tags.push({ label: 'Urgent', urgent: true });
    }
    if (pet.situation) {
        tags.push({ label: SITUATION_LABELS[pet.situation] || 'Other', urgent: false });
    }
    if (pet.microchip_status && pet.microchip_status !== 'unknown') {
        const labels = { yes: 'Microchipped', no: 'No chip' };
        tags.push({ label: labels[pet.microchip_status], urgent: false });
    }
    if (pet.neutered_spayed_status && pet.neutered_spayed_status !== 'unknown') {
        const g = (pet.gender || '').toLowerCase();
        const labels = {
            yes: g === 'male' ? 'Neutered'     : g === 'female' ? 'Spayed'     : 'Fixed',
            no:  g === 'male' ? 'Not neutered' : g === 'female' ? 'Not spayed' : 'Not fixed',
        };
        tags.push({ label: labels[pet.neutered_spayed_status], urgent: false });
    }
    if (pet.vaccination_status && pet.vaccination_status !== 'unknown') {
        tags.push({ label: VACCINATION_LABELS[pet.vaccination_status], urgent: false });
    }
    return tags;
}

function PetTags({ pet, dark }) {
    const tags = buildPetTags(pet);
    if (tags.length === 0) return null;
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {tags.map((t, i) => (
                <span key={i} style={{
                    fontFamily: sans, fontSize: '8px', textTransform: 'uppercase',
                    letterSpacing: '0.08em', padding: '3px 9px', borderRadius: '2px',
                    fontWeight: 600,
                    background: t.urgent
                        ? '#993C1D'
                        : dark ? 'rgba(250,247,244,0.12)' : 'rgba(45,31,20,0.08)',
                    color: t.urgent
                        ? '#FAF7F4'
                        : dark ? '#FAF7F4' : '#7A5C44',
                    border: t.urgent ? 'none' : dark
                        ? '1px solid rgba(250,247,244,0.15)'
                        : '1px solid rgba(45,31,20,0.12)',
                }}>
                    {t.label}
                </span>
            ))}
        </div>
    );
}

// ── Status badge (legacy — kept for backward compat display) ───────────────────
function StatusBadge({ status }) {
    const styles = {
        Found:      { background: '#2D1F14',                        color: '#FAF7F4', border: 'none' },
        Urgent:     { background: '#993C1D',                        color: '#FAF7F4', border: 'none' },
        Vaccinated: { background: 'rgba(29,158,117,0.12)',          color: '#0F6E56', border: '1px solid rgba(29,158,117,0.2)' },
    };
    if (!status) return null;
    const s = styles[status] || { background: 'rgba(45,31,20,0.08)', color: '#7A5C44', border: '1px solid rgba(45,31,20,0.12)' };
    return (
        <span style={{ fontFamily: sans, fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '3px 9px', borderRadius: '2px', fontWeight: 600, ...s }}>
            {status}
        </span>
    );
}

// ── Dot separator ─────────────────────────────────────────────────────────────
function Dot() {
    return <span style={{ width: '3px', height: '3px', borderRadius: '50%', backgroundColor: '#C07A4A', display: 'inline-block', flexShrink: 0 }} />;
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function PetDetailPage() {
    const { id }      = useParams();
    const navigate    = useNavigate();
    const { user: currentUser } = useAuthStore();
    const {
        selectedPet: pet,
        similarPets,
        isLoading,
        error,
        notFound,
        getPetById,
        getSimilarPets,
        clearSelectedPet,
        resetNotFound,
    } = usePetStore();

    // ── Local state ────────────────────────────────────────────────────────────
    const [activePhoto,    setActivePhoto]    = useState(0);
    const [uploader,       setUploader]       = useState(null);
    const [askOpen,        setAskOpen]        = useState(false);
    const [askMsg,         setAskMsg]         = useState('');
    const [askSent,        setAskSent]        = useState(false);
    const [askSending,     setAskSending]     = useState(false);
    const [adoptSending,   setAdoptSending]   = useState(false);
    const [showAdoptForm,  setShowAdoptForm]  = useState(false);
    const [adoptSuccess,   setAdoptSuccess]   = useState(false);
    const [isSaved,        setIsSaved]        = useState(false);
    const [saveLoading,    setSaveLoading]    = useState(false);
    const askRef = useRef(null);

    // ── Load pet ───────────────────────────────────────────────────────────────
    useEffect(() => {
        resetNotFound();
        const load = async () => {
            const result = await getPetById(id);
            if (result?.success) getSimilarPets(id);
        };
        load();
        return () => clearSelectedPet();
    }, [id]);

    // Reset photo index on pet change
    useEffect(() => { setActivePhoto(0); }, [pet?.id]);

    // ── Fetch uploader public profile ──────────────────────────────────────────
    useEffect(() => {
        if (!pet?.uploader_id) return;
        axios.get(`${API}/users/${pet.uploader_id}/profile`)
            .then(r => setUploader(r.data.profile || null))
            .catch(() => setUploader(null));
    }, [pet?.uploader_id]);

    // ── Check saved state ──────────────────────────────────────────────────────
    useEffect(() => {
        if (!currentUser || !pet?.id || pet.uploader_id === currentUser._id) return;
        axios.get(`${API}/users/${currentUser._id}/saved`, { withCredentials: true })
            .then(r => {
                const savedList = r.data.pets || [];
                setIsSaved(savedList.some(p => p.id === pet.id));
            })
            .catch(() => {});
    }, [pet?.id, currentUser]);

    // ── Save / Unsave ──────────────────────────────────────────────────────────
    const handleSaveToggle = async () => {
        if (!currentUser || saveLoading) return;
        setSaveLoading(true);
        try {
            if (isSaved) {
                await axios.delete(`${API}/users/me/saved/${pet.id}`, { withCredentials: true });
                setIsSaved(false);
            } else {
                await axios.post(`${API}/users/me/saved/${pet.id}`, {}, { withCredentials: true });
                setIsSaved(true);
            }
        } catch {
            // ignore
        } finally {
            setSaveLoading(false);
        }
    };

    // ── Ask/message send ───────────────────────────────────────────────────────
    const handleAskSend = async () => {
        if (!askMsg.trim()) return;
        setAskSending(true);
        try {
            await axios.post(`${API}/conversations`, {
                pet_id:       pet.id,
                recipient_id: pet.uploader_id,
                message:      askMsg.trim(),
            }, { withCredentials: true });
            setAskSent(true);
            setAskMsg('');
        } catch {
            // fail silently — user sees no change, can retry
        } finally {
            setAskSending(false);
        }
    };

    // ── Adopt ──────────────────────────────────────────────────────────────────
    const handleAdopt = async () => {
        if (adoptSending) return;
        setAdoptSending(true);
        try {
            const res = await axios.post(`${API}/conversations`, {
                pet_id:             pet.id,
                recipient_id:       pet.uploader_id,
                message:            `Hi! I'm interested in adopting ${pet.name}. I'd love to discuss more about the process.`,
                is_adoption_request: true,
            }, { withCredentials: true });
            if (res.data.success) {
                navigate(`/messages?conv=${res.data.conversation_id}`);
            }
        } catch {
            // fail silently
        } finally {
            setAdoptSending(false);
        }
    };

    // ── Guards ─────────────────────────────────────────────────────────────────
    if (notFound) return <NotFoundPage />;

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

    if (error || !pet) {
        return (
            <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', backgroundColor: '#FAF7F4' }}>
                <Navbar />
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: sans, fontSize: '14px', color: '#993C1D' }}>
                    {error || 'Pet not found'}
                </div>
            </div>
        );
    }

    const photos     = (pet.photos || []).sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0));
    const curSrc     = photoUrl(photos[activePhoto]);
    const isAdopted  = pet.is_adopted || pet.adoption_status === 'adopted';

    // Fact pills — only non-empty values
    const factPills = [
        { label: 'Type',   value: cap(pet.type) },
        { label: 'Breed',  value: pet.breed },
        { label: 'Size',   value: cap(pet.size) },
        { label: 'Age',    value: pet.age_category },
        { label: 'Gender', value: cap(pet.gender) },
        { label: 'Color',  value: pet.color },
        { label: 'Weight', value: pet.weight ? `${pet.weight} kg` : null },
    ].filter(p => p.value);

    const traitList = (pet.traits || []).filter(Boolean);

    // Mini-table rows for right card — only show if value exists
    const cardRows = [
        { label: 'Type',     value: cap(pet.type) },
        { label: 'Location', value: fmtLocation(pet.location_address, pet.location_city) || null },
        { label: 'Posted',   value: timeAgo(pet.created_at) },
        { label: 'Uploader', value: uploader?.name },
    ].filter(r => r.value);

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', backgroundColor: '#FAF7F4', overflowY: 'auto' }}>
            <Navbar />

            <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 48px 64px', width: '100%', boxSizing: 'border-box' }}>

                {/* ── BACK LINK ─────────────────────────────────────── */}
                <button
                    onClick={() => navigate(-1)}
                    style={{ fontFamily: sans, fontSize: '11px', color: '#9A7A60', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: '24px', display: 'inline-flex', alignItems: 'center', gap: '4px', transition: 'color 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#C07A4A'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#9A7A60'; }}
                >
                    ← Back to Animals
                </button>

                {/* ── MASTHEAD ──────────────────────────────────────── */}
                <div style={{ textAlign: 'center', paddingBottom: '24px', borderBottom: '3px double rgba(45,31,20,0.15)', marginBottom: '40px' }}>

                    {/* Eyebrow */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: sans, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#C07A4A' }}>
                            The Paws Daily · Pet profile
                        </span>
                        <PetTags pet={pet} dark={false} />
                        {buildPetTags(pet).length === 0 && <StatusBadge status={pet.health_status} />}
                    </div>

                    {/* H1 — use greeting only for single-word names */}
                    <h1 style={{ fontFamily: serif, fontSize: '52px', fontWeight: 700, color: '#2D1F14', lineHeight: 1.05, letterSpacing: '-1px', margin: '0 0 14px' }}>
                        {pet.name?.includes(' ') ? pet.name : `Hi, I'm ${pet.name}`}
                    </h1>

                    {/* Byline */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', flexWrap: 'wrap', fontFamily: sans, fontSize: '12px', color: '#9A7A60' }}>
                        {pet.breed        && <><span style={{ fontStyle: 'italic' }}>{pet.breed}</span><Dot /></>}
                        {pet.type         && <><span>{cap(pet.type)}</span><Dot /></>}
                        {(pet.location_address || pet.location_city) && <><span>◎ {fmtLocation(pet.location_address, pet.location_city)}</span><Dot /></>}
                        {pet.age_category && <><span>{pet.age_category}</span><Dot /></>}
                        {pet.gender       && <><span>{cap(pet.gender)}</span><Dot /></>}
                        {pet.created_at   && <span>{timeAgo(pet.created_at)}</span>}
                    </div>
                </div>

                {/* ── MAIN GRID ─────────────────────────────────────── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '48px', alignItems: 'start' }}>

                    {/* ════════════════════════════════════════════════
                        LEFT COLUMN
                    ════════════════════════════════════════════════ */}
                    <div>

                        {/* ── PHOTO GALLERY ─────────────────────── */}
                        <div style={{ marginBottom: '20px' }}>
                            {photos.length > 0 ? (
                                <>
                                    {/* Main image */}
                                    <div style={{ position: 'relative', borderRadius: '3px', overflow: 'hidden', backgroundColor: '#F0E8E0' }}>
                                        {curSrc ? (
                                            <img
                                                src={curSrc}
                                                alt={pet.name}
                                                style={{ width: '100%', height: '420px', objectFit: 'cover', display: 'block' }}
                                                onError={e => {
                                                    e.target.style.display = 'none';
                                                    if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        {/* Fallback shown when no src or img errors */}
                                        <div style={{ width: '100%', height: '420px', display: curSrc ? 'none' : 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                                            <span style={{ fontSize: '48px', color: '#C07A4A', opacity: 0.2 }}>🐾</span>
                                            <span style={{ fontFamily: serif, fontSize: '16px', fontStyle: 'italic', color: '#B09880' }}>No photos yet</span>
                                        </div>

                                        {/* Navigation arrows */}
                                        {photos.length > 1 && (
                                            <>
                                                <button
                                                    onClick={() => setActivePhoto((activePhoto - 1 + photos.length) % photos.length)}
                                                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(250,247,244,0.9)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(45,31,20,0.12)' }}
                                                >
                                                    <ChevronLeft style={{ width: '18px', height: '18px', color: '#2D1F14' }} />
                                                </button>
                                                <button
                                                    onClick={() => setActivePhoto((activePhoto + 1) % photos.length)}
                                                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(250,247,244,0.9)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(45,31,20,0.12)' }}
                                                >
                                                    <ChevronRight style={{ width: '18px', height: '18px', color: '#2D1F14' }} />
                                                </button>
                                            </>
                                        )}
                                    </div>

                                    {/* Caption / story */}
                                    {pet.story && (
                                        <p style={{ fontFamily: serif, fontStyle: 'italic', fontSize: '13px', color: '#9A7A60', margin: '10px 0 0', textAlign: 'center', lineHeight: 1.6 }}>
                                            {pet.story}
                                        </p>
                                    )}

                                    {/* Thumbnails */}
                                    {photos.length > 1 && (
                                        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                                            {photos.map((ph, i) => {
                                                const src = photoUrl(ph);
                                                const active = i === activePhoto;
                                                return (
                                                    <div
                                                        key={ph.id || i}
                                                        onClick={() => setActivePhoto(i)}
                                                        style={{ width: '72px', height: '72px', flexShrink: 0, borderRadius: '2px', overflow: 'hidden', cursor: 'pointer', border: `2px solid ${active ? '#C07A4A' : 'transparent'}`, opacity: active ? 1 : 0.55, transition: 'opacity 0.15s, border-color 0.15s', backgroundColor: '#F0E8E0' }}
                                                    >
                                                        {src && <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%', display: 'block' }} onError={e => { e.target.style.display = 'none'; }} />}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </>
                            ) : (
                                /* No photos at all */
                                <div style={{ height: '420px', backgroundColor: '#F0E8E0', borderRadius: '3px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                                    <span style={{ fontSize: '48px', color: '#C07A4A', opacity: 0.2 }}>🐾</span>
                                    <span style={{ fontFamily: serif, fontSize: '16px', fontStyle: 'italic', color: '#B09880' }}>No photos yet</span>
                                </div>
                            )}
                        </div>

                        {/* ── UPLOADER ROW ──────────────────────── */}
                        {pet.uploader_id && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 0', borderTop: '1px solid rgba(45,31,20,0.08)', borderBottom: '1px solid rgba(45,31,20,0.08)', marginBottom: '24px' }}>
                                {/* Avatar */}
                                <div style={{ width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0, overflow: 'hidden', backgroundColor: '#E8C5A0', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundImage: 'linear-gradient(135deg, #E8C5A0, #C07A4A)' }}>
                                    {resolveAvatar(uploader?.avatar) ? (
                                        <img src={resolveAvatar(uploader.avatar)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
                                    ) : (
                                        <span style={{ fontFamily: serif, fontSize: '16px', fontWeight: 700, color: '#fff', lineHeight: 1 }}>
                                            {(uploader?.name || '?').charAt(0).toUpperCase()}
                                        </span>
                                    )}
                                </div>

                                {/* Info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontFamily: sans, fontSize: '13px', fontWeight: 500, color: '#2D1F14', marginBottom: '2px' }}>
                                        {uploader?.name || 'Community member'}
                                    </div>
                                    <div style={{ fontFamily: sans, fontSize: '11px', color: '#9A7A60' }}>
                                        Found this animal{uploader?.createdAt ? ` · Member since ${fmtMemberSince(uploader.createdAt)}` : ''}
                                    </div>
                                </div>

                                {/* Profile link */}
                                <Link
                                    to={`/profile/${pet.uploader_id}`}
                                    style={{ fontFamily: sans, fontSize: '10px', color: '#C07A4A', textDecoration: 'none', flexShrink: 0, transition: 'opacity 0.15s' }}
                                    onMouseEnter={e => { e.currentTarget.style.opacity = '0.7'; }}
                                    onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                                >
                                    View profile →
                                </Link>
                            </div>
                        )}

                        {/* ── DESCRIPTION ───────────────────────── */}
                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ fontFamily: sans, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#C07A4A', fontWeight: 500, marginBottom: '10px' }}>
                                About {pet.name}
                            </div>
                            <p style={{ fontFamily: serif, fontSize: '18px', lineHeight: 1.75, color: '#3D2A1C', margin: 0 }}>
                                {pet.description || 'No description provided.'}
                            </p>
                        </div>

                        {/* ── FACT PILLS ────────────────────────── */}
                        {(factPills.length > 0 || traitList.length > 0) && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
                                {factPills.map(({ label, value }) => (
                                    <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(192,122,74,0.07)', border: '1px solid rgba(192,122,74,0.18)', borderRadius: '100px', padding: '5px 12px' }}>
                                        <span style={{ fontFamily: sans, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#B09880' }}>{label}</span>
                                        <span style={{ fontFamily: sans, fontSize: '12px', color: '#2D1F14', fontWeight: 500 }}>{value}</span>
                                    </span>
                                ))}
                                {traitList.map((t, i) => (
                                    <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(45,31,20,0.05)', border: '1px solid rgba(45,31,20,0.1)', borderRadius: '100px', padding: '5px 12px', fontFamily: sans, fontSize: '12px', color: '#5C4030' }}>
                                        {formatTrait(t)}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* ── ASK FORM ──────────────────────────── */}
                        <div ref={askRef} style={{ marginBottom: '32px' }}>
                            {!askSent ? (
                                <>
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                                        {currentUser && pet.uploader_id === currentUser._id ? (
                                            <button
                                                onClick={() => navigate(`/pet/${pet.id}/edit`)}
                                                style={{ fontFamily: sans, fontSize: '13px', color: '#2D1F14', background: 'transparent', border: '1.5px solid rgba(45,31,20,0.2)', borderRadius: '100px', padding: '10px 20px', cursor: 'pointer', transition: 'border-color 0.15s' }}
                                                onMouseEnter={e => { e.currentTarget.style.borderColor = '#C07A4A'; }}
                                                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(45,31,20,0.2)'; }}
                                            >
                                                Edit listing →
                                            </button>
                                        ) : !isAdopted && (
                                        <button
                                            onClick={() => setAskOpen(o => !o)}
                                            style={{ fontFamily: sans, fontSize: '13px', color: '#2D1F14', background: 'transparent', border: '1.5px solid rgba(45,31,20,0.2)', borderRadius: '100px', padding: '10px 20px', cursor: 'pointer', transition: 'border-color 0.15s' }}
                                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#C07A4A'; }}
                                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(45,31,20,0.2)'; }}
                                        >
                                            💬 Ask about {pet.name}
                                        </button>
                                        )}
                                        {currentUser && pet.uploader_id !== currentUser._id && !isAdopted && (
                                            <button
                                                onClick={handleAdopt}
                                                disabled={adoptSending}
                                                style={{
                                                    fontFamily: sans, fontSize: '13px',
                                                    color: '#fff',
                                                    background: '#2D1F14',
                                                    border: '1.5px solid #2D1F14',
                                                    borderRadius: '100px', padding: '10px 20px',
                                                    cursor: adoptSending ? 'default' : 'pointer',
                                                    opacity: adoptSending ? 0.6 : 1,
                                                    transition: 'background 0.15s',
                                                }}
                                                onMouseEnter={e => { if (!adoptSending) e.currentTarget.style.background = '#C07A4A'; e.currentTarget.style.borderColor = '#C07A4A'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = '#2D1F14'; e.currentTarget.style.borderColor = '#2D1F14'; }}
                                            >
                                                {adoptSending ? 'Starting…' : '🐾 Adopt'}
                                            </button>
                                        )}
                                        {currentUser && pet.uploader_id !== currentUser._id && !isAdopted && (
                                            <button
                                                onClick={handleSaveToggle}
                                                disabled={saveLoading}
                                                title={isSaved ? 'Remove from saved' : 'Save for later'}
                                                style={{
                                                    fontFamily: sans, fontSize: '13px',
                                                    color: isSaved ? '#C07A4A' : '#7A5C44',
                                                    background: 'transparent',
                                                    border: `1.5px solid ${isSaved ? '#C07A4A' : 'rgba(45,31,20,0.2)'}`,
                                                    borderRadius: '100px', padding: '10px 20px',
                                                    cursor: saveLoading ? 'default' : 'pointer',
                                                    opacity: saveLoading ? 0.6 : 1,
                                                    transition: 'border-color 0.15s, color 0.15s',
                                                }}
                                            >
                                                {isSaved ? '🔖 Saved' : '🔖 Save'}
                                            </button>
                                        )}
                                    </div>

                                    {askOpen && (
                                        <div style={{ marginTop: '10px', background: '#fff', border: '1px solid rgba(45,31,20,0.12)', borderRadius: '4px', padding: '14px' }}>
                                            <textarea
                                                rows={3}
                                                placeholder="What would you like to know about this animal?"
                                                value={askMsg}
                                                onChange={e => setAskMsg(e.target.value)}
                                                style={{ fontFamily: serif, fontSize: '15px', color: '#2D1F14', border: 'none', borderBottom: '1px solid rgba(45,31,20,0.15)', width: '100%', boxSizing: 'border-box', resize: 'none', outline: 'none', padding: '4px 0', background: 'none', lineHeight: 1.5 }}
                                            />
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                                                <button
                                                    onClick={handleAskSend}
                                                    disabled={askSending || !askMsg.trim()}
                                                    style={{ fontFamily: sans, fontSize: '12px', background: '#C07A4A', color: '#fff', border: 'none', borderRadius: '100px', padding: '8px 20px', cursor: askSending ? 'default' : 'pointer', opacity: (askSending || !askMsg.trim()) ? 0.6 : 1 }}
                                                >
                                                    {askSending ? 'Sending…' : 'Send'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div style={{ fontFamily: sans, fontSize: '13px', color: '#0F6E56' }}>
                                    ✓ Message sent!{' '}
                                    <Link to="/messages" style={{ color: '#C07A4A', textDecoration: 'underline' }}>View in Messages</Link>
                                </div>
                            )}
                        </div>

                        {/* ── SIMILAR ANIMALS ───────────────────── */}
                        {similarPets && similarPets.length > 0 && (
                            <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid rgba(45,31,20,0.1)' }}>
                                <div style={{ fontFamily: sans, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#C07A4A', fontWeight: 500, marginBottom: '14px' }}>
                                    Similar animals nearby
                                </div>
                                <div style={{ display: 'flex', gap: '14px', overflowX: 'auto', paddingBottom: '8px' }}>
                                    {similarPets.slice(0, 4).map(sp => {
                                        const spSrc = photoUrl((sp.photos || []).find(p => p.is_primary) || sp.photos?.[0]);
                                        return (
                                            <div
                                                key={sp.id}
                                                onClick={() => navigate(`/pet/${sp.id}`)}
                                                style={{ flexShrink: 0, width: '160px', cursor: 'pointer' }}
                                            >
                                                <div style={{ width: '160px', height: '120px', borderRadius: '3px', overflow: 'hidden', backgroundColor: '#F0E8E0', marginBottom: '7px' }}>
                                                    {spSrc && <img src={spSrc} alt={sp.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%', display: 'block' }} onError={e => { e.target.style.display = 'none'; }} />}
                                                </div>
                                                <div style={{ fontFamily: serif, fontSize: '13px', fontWeight: 700, color: '#2D1F14', lineHeight: 1.2, marginBottom: '3px' }}>{sp.name}</div>
                                                <div style={{ fontFamily: sans, fontSize: '10px', color: '#9A7A60' }}>{sp.location_city}{sp.created_at ? ` · ${timeAgo(sp.created_at)}` : ''}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ════════════════════════════════════════════════
                        RIGHT COLUMN — sticky contact card
                    ════════════════════════════════════════════════ */}
                    <div style={{ position: 'sticky', top: '80px' }}>
                        <div style={{ background: '#2D1F14', borderRadius: '4px', padding: '28px 24px' }}>

                            {/* Eyebrow */}
                            <div style={{ fontFamily: sans, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(250,247,244,0.4)', marginBottom: '20px' }}>
                                Interested in {pet.name}?
                            </div>

                            {isAdopted ? (
                                <div style={{ fontFamily: serif, fontSize: '16px', fontStyle: 'italic', color: 'rgba(250,247,244,0.7)', textAlign: 'center', padding: '16px 0' }}>
                                    This animal has found a home 🎉
                                </div>
                            ) : currentUser && pet.uploader_id === currentUser._id ? (
                                <button
                                    onClick={() => navigate(`/pet/${pet.id}/edit`)}
                                    style={{ width: '100%', fontFamily: serif, fontSize: '15px', fontStyle: 'italic', background: 'rgba(250,247,244,0.08)', color: '#FAF7F4', border: '1px solid rgba(250,247,244,0.15)', borderRadius: '100px', padding: '14px', cursor: 'pointer', transition: 'background 0.15s' }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(250,247,244,0.15)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(250,247,244,0.08)'; }}
                                >
                                    Edit listing →
                                </button>
                            ) : (
                                <>
                                    {/* Primary CTA */}
                                    <button
                                        onClick={() => {
                                            setAskOpen(true);
                                            askRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        }}
                                        style={{ width: '100%', fontFamily: serif, fontSize: '15px', fontStyle: 'italic', background: '#C07A4A', color: '#fff', border: 'none', borderRadius: '100px', padding: '14px', cursor: 'pointer', marginBottom: '10px', transition: 'background 0.15s' }}
                                        onMouseEnter={e => { e.currentTarget.style.background = '#A86840'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = '#C07A4A'; }}
                                    >
                                        Contact uploader →
                                    </button>
                                </>
                            )}

                            {/* Divider */}
                            <div style={{ height: '1px', background: 'rgba(250,247,244,0.08)', margin: '16px 0' }} />

                            {/* Structured status tags */}
                            {buildPetTags(pet).length > 0 && (
                                <div style={{ marginBottom: '16px' }}>
                                    <PetTags pet={pet} dark={true} />
                                </div>
                            )}

                            {/* Location / contact details */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                                {(pet.location_address || pet.location_city) && (
                                    <div style={{ fontFamily: sans, fontSize: '12px', color: '#FAF7F4', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                                        <span style={{ opacity: 0.5, flexShrink: 0 }}>◎</span>
                                        <span>{fmtLocation(pet.location_address, pet.location_city)}</span>
                                    </div>
                                )}
                                {pet.shelter_contact_email && (
                                    <div style={{ fontFamily: sans, fontSize: '12px', color: '#FAF7F4', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <span style={{ opacity: 0.5 }}>✉</span>
                                        <span>{pet.shelter_contact_email}</span>
                                    </div>
                                )}
                                {pet.shelter_contact_phone && (
                                    <div style={{ fontFamily: sans, fontSize: '12px', color: '#FAF7F4', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <span style={{ opacity: 0.5 }}>☎</span>
                                        <span>{pet.shelter_contact_phone}</span>
                                    </div>
                                )}
                            </div>

                            {/* Divider */}
                            <div style={{ height: '1px', background: 'rgba(250,247,244,0.08)', margin: '0 0 16px' }} />

                            {/* Facts mini-table */}
                            {cardRows.length > 0 && (
                                <div style={{ border: '1px solid rgba(250,247,244,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                    {cardRows.map(({ label, value }, i) => (
                                        <div key={label} style={{ display: 'grid', gridTemplateColumns: '90px 1fr', borderBottom: i < cardRows.length - 1 ? '1px solid rgba(250,247,244,0.08)' : 'none' }}>
                                            <div style={{ fontFamily: sans, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(250,247,244,0.4)', borderRight: '1px solid rgba(250,247,244,0.08)', padding: '10px 14px' }}>
                                                {label}
                                            </div>
                                            <div style={{ fontFamily: sans, fontSize: '12px', color: '#FAF7F4', fontWeight: 500, padding: '10px 14px' }}>
                                                {value}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                </div>{/* end main grid */}
            </div>{/* end inner */}

            {/* ── ADOPTION FORM MODAL ───────────────────────── */}
            {showAdoptForm && (
                <UserAdoptionForm
                    pet={pet}
                    onClose={() => setShowAdoptForm(false)}
                    onSuccess={() => {
                        setShowAdoptForm(false);
                        setAdoptSuccess(true);
                        setTimeout(() => setAdoptSuccess(false), 3500);
                    }}
                />
            )}

            {/* ── SUCCESS TOAST ─────────────────────────────── */}
            {adoptSuccess && (
                <div style={{ position: 'fixed', bottom: '32px', left: '50%', transform: 'translateX(-50%)', zIndex: 200, background: '#2D1F14', color: '#FAF7F4', fontFamily: sans, fontSize: '13px', padding: '12px 24px', borderRadius: '100px', boxShadow: '0 4px 20px rgba(45,31,20,0.2)', whiteSpace: 'nowrap' }}>
                    ✓ Application submitted successfully!
                </div>
            )}
        </div>
    );
}
