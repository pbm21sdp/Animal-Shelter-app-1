import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import { useAuthStore } from '../store/authStore';

// ── Constants ──────────────────────────────────────────────────────────────────
const API      = 'http://localhost:5000/api';
const BASE_URL = 'http://localhost:5000';
const serif    = "'Cormorant Garamond', serif";
const sans     = "'DM Sans', sans-serif";

// ── Helpers ────────────────────────────────────────────────────────────────────

function photoUrl(id) {
    if (!id) return null;
    return `${BASE_URL}/api/pets/photos/${id}`;
}

function resolveAvatar(avatar) {
    if (!avatar) return null;
    return avatar.startsWith('http') ? avatar : `${BASE_URL}${avatar.startsWith('/') ? avatar : `/${avatar}`}`;
}

function fmtMemberSince(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function fmtShortDate(d) {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtMemberFor(d) {
    if (!d) return '—';
    const months = Math.max(0, Math.round((Date.now() - new Date(d)) / (1000 * 60 * 60 * 24 * 30.44)));
    if (months < 1)  return '< 1 mo';
    if (months < 12) return `${months} mo`;
    const y = Math.floor(months / 12), m = months % 12;
    return m > 0 ? `${y}y ${m}m` : `${y}y`;
}

function getInitial(name) {
    return name?.trim().charAt(0).toUpperCase() || '?';
}

const PHOTO_H = 180;

// ── Small reusable pieces ──────────────────────────────────────────────────────

function Dot() {
    return (
        <span style={{
            width: 4, height: 4, borderRadius: '50%',
            backgroundColor: '#C07A4A', display: 'inline-block', flexShrink: 0,
        }} />
    );
}

function TabBadge({ n }) {
    if (!n) return null;
    return (
        <span style={{
            fontFamily: sans, fontSize: 9,
            background: 'rgba(192,122,74,0.12)', color: '#8B4E28',
            borderRadius: 100, padding: '1px 5px', marginLeft: 4, fontWeight: 500,
        }}>
            {n}
        </span>
    );
}

function SectionLabel({ children }) {
    return (
        <div style={{
            fontFamily: sans, fontSize: 9, textTransform: 'uppercase',
            letterSpacing: '0.14em', color: '#C07A4A', fontWeight: 500,
            marginBottom: 14,
        }}>
            {children}
        </div>
    );
}

function EmptyState({ text, note }) {
    return (
        <div style={{ padding: '48px 0', textAlign: 'center' }}>
            <div style={{ fontFamily: serif, fontSize: 16, fontStyle: 'italic', color: '#B09880' }}>
                {text}
            </div>
            {note && (
                <div style={{ fontFamily: sans, fontSize: 11, color: '#B09880', marginTop: 8 }}>
                    {note}
                </div>
            )}
        </div>
    );
}

// ── Status badge for upload cards ─────────────────────────────────────────────

function StatusBadge({ pet }) {
    if (pet.is_adopted) {
        return (
            <span style={{
                fontFamily: sans, fontSize: 8, textTransform: 'uppercase',
                letterSpacing: '0.08em', padding: '2px 6px', borderRadius: 2,
                fontWeight: 600, background: 'rgba(29,158,117,0.12)', color: '#0F6E56',
                border: '1px solid rgba(29,158,117,0.2)',
            }}>
                Found Home
            </span>
        );
    }
    if (pet.adoption_status === 'pending') {
        return (
            <span style={{
                fontFamily: sans, fontSize: 8, textTransform: 'uppercase',
                letterSpacing: '0.08em', padding: '2px 6px', borderRadius: 2,
                fontWeight: 600, background: '#FAF3E8', color: '#8B4E28',
                border: '1px solid rgba(192,122,74,0.25)',
            }}>
                Pending
            </span>
        );
    }
    return (
        <span style={{
            fontFamily: sans, fontSize: 8, textTransform: 'uppercase',
            letterSpacing: '0.08em', padding: '2px 6px', borderRadius: 2,
            fontWeight: 600, background: '#2D1F14', color: '#FAF7F4',
        }}>
            Listed
        </span>
    );
}

// ── Upload card ────────────────────────────────────────────────────────────────

function UploadCard({ pet, isOwnProfile, onMarkAdopted, onEdit }) {
    const navigate = useNavigate();
    const [hovered, setHovered] = useState(false);
    const photo = photoUrl(pet.primary_photo_id);

    return (
        <div
            onClick={() => navigate(`/pet/${pet.id}`)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: '#fff', border: '1px solid rgba(45,31,20,0.1)',
                borderRadius: 3, cursor: 'pointer',
                transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
                transition: 'transform 0.2s ease',
                display: 'flex', flexDirection: 'column',
            }}
        >
            {/* Image */}
            <div style={{ position: 'relative', height: PHOTO_H, background: '#F0EAE3', overflow: 'hidden', borderRadius: '3px 3px 0 0', flexShrink: 0 }}>
                {photo ? (
                    <img
                        src={photo} alt={pet.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%', display: 'block' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                ) : (
                    <div style={{
                        width: '100%', height: '100%', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        fontFamily: sans, fontSize: 11, color: '#B09880',
                    }}>
                        No photo
                    </div>
                )}
                {pet.is_adopted && (
                    <div style={{
                        position: 'absolute', top: 8, right: 8,
                        background: 'rgba(29,158,117,0.9)', color: '#fff',
                        fontFamily: sans, fontSize: 8, fontWeight: 600,
                        textTransform: 'uppercase', letterSpacing: '0.08em',
                        padding: '3px 7px', borderRadius: 2,
                    }}>
                        Found home
                    </div>
                )}
            </div>

            {/* Body */}
            <div style={{ padding: '8px 10px 6px', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <StatusBadge pet={pet} />
                    <span style={{ fontFamily: sans, fontSize: 9, color: '#B09880' }}>
                        {fmtShortDate(pet.created_at)}
                    </span>
                </div>

                <div style={{
                    fontFamily: serif, fontSize: 14, fontWeight: 700,
                    color: '#2D1F14', lineHeight: 1.2, marginBottom: 4,
                }}>
                    {pet.name}{pet.breed ? ` · ${pet.breed}` : ''}
                </div>

                {pet.location_city && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: sans, fontSize: 10, color: '#9A7A60' }}>
                        <Dot />
                        {pet.location_city}
                    </div>
                )}
            </div>

            {/* Actions — space always reserved, shown on hover via opacity */}
            {isOwnProfile && (
                <div style={{ padding: '0 10px 10px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {!pet.is_adopted && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onMarkAdopted(pet); }}
                            style={{
                                width: '100%', fontFamily: sans, fontSize: 10,
                                fontWeight: 500, padding: '5px 0', borderRadius: 2,
                                border: '1px solid rgba(29,158,117,0.4)',
                                color: '#0F6E56', background: 'rgba(29,158,117,0.06)',
                                cursor: 'pointer',
                                opacity: hovered ? 1 : 0,
                                transition: 'opacity 0.15s',
                                pointerEvents: hovered ? 'auto' : 'none',
                            }}
                        >
                            Mark as adopted
                        </button>
                    )}
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(pet.id); }}
                        style={{
                            width: '100%', fontFamily: sans, fontSize: 10,
                            fontWeight: 500, padding: '5px 0', borderRadius: 2,
                            border: '1px solid rgba(192,122,74,0.3)',
                            color: '#C07A4A', background: 'transparent',
                            cursor: 'pointer',
                            opacity: hovered ? 1 : 0,
                            transition: 'opacity 0.15s',
                            pointerEvents: hovered ? 'auto' : 'none',
                        }}
                    >
                        Edit listing →
                    </button>
                </div>
            )}
        </div>
    );
}

// ── Adopted card (vertical list) ──────────────────────────────────────────────

function AdoptedCard({ pet }) {
    const photo = photoUrl(pet.primary_photo_id);
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: 12, background: '#fff',
            border: '1px solid rgba(45,31,20,0.08)', borderRadius: 3,
        }}>
            <div style={{
                width: 60, height: 60, borderRadius: 2, overflow: 'hidden',
                flexShrink: 0, background: '#F0EAE3',
            }}>
                {photo ? (
                    <img src={photo} alt={pet.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%' }}
                        onError={(e) => { e.target.style.display = 'none'; }} />
                ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: serif, fontSize: 18, color: '#C4A882' }}>
                        {pet.type?.charAt(0).toUpperCase() || '?'}
                    </div>
                )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: serif, fontSize: 15, fontWeight: 700, color: '#2D1F14', marginBottom: 3 }}>
                    {pet.name}
                </div>
                <div style={{ fontFamily: sans, fontSize: 10, color: '#7A5C44' }}>
                    {pet.adopted_at ? `Adopted ${fmtShortDate(pet.adopted_at)}` : 'Adoption date unknown'}
                    {pet.location_city ? ` · ${pet.location_city}` : ''}
                </div>
            </div>
            <span style={{
                fontFamily: sans, fontSize: 8, textTransform: 'uppercase',
                letterSpacing: '0.08em', fontWeight: 600, flexShrink: 0,
                padding: '3px 8px', borderRadius: 2,
                background: 'rgba(29,158,117,0.1)', color: '#0F6E56',
                border: '1px solid rgba(29,158,117,0.2)',
            }}>
                Adopted
            </span>
        </div>
    );
}

// ── Activity stat cell ─────────────────────────────────────────────────────────

function StatCell({ value, label, trend }) {
    return (
        <div style={{
            padding: '18px 16px',
            borderBottom: '1px solid rgba(45,31,20,0.08)',
            borderRight: '1px solid rgba(45,31,20,0.08)',
            background: '#FAF7F4',
        }}>
            <div style={{ fontFamily: serif, fontSize: 30, fontWeight: 700, color: '#2D1F14', lineHeight: 1.1 }}>
                {value ?? '—'}
            </div>
            <div style={{ fontFamily: sans, fontSize: 10, color: '#7A5C44', marginTop: 3 }}>
                {label}
            </div>
            {trend && (
                <div style={{ fontFamily: sans, fontSize: 9, color: '#1A7A5E', marginTop: 4 }}>
                    {trend}
                </div>
            )}
        </div>
    );
}

// ── ProfilePage ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
    const { userId }  = useParams();
    const navigate    = useNavigate();
    const { user: currentUser, updateProfile, uploadAvatar, syncProfile } = useAuthStore();

    const isOwnProfile = !userId || userId === currentUser?._id;
    const profileId    = userId   || currentUser?._id;

    // ── State ────────────────────────────────────────────────────────────────
    const [profileData,   setProfileData]   = useState(null);
    const [pets,          setPets]          = useState([]);
    const [adoptedPets,      setAdoptedPets]      = useState([]);
    const [savedPets,        setSavedPets]        = useState([]);
    const [receivedMsgCount, setReceivedMsgCount] = useState(null);
    const [activeTab,     setActiveTab]     = useState('uploads');
    const [isEditingBio,  setIsEditingBio]  = useState(false);
    const [bioValue,      setBioValue]      = useState('');
    const [isEditingInfo, setIsEditingInfo] = useState(false);
    const [nameValue,     setNameValue]     = useState('');
    const [cityValue,     setCityValue]     = useState('');
    const [infoSaving,    setInfoSaving]    = useState(false);
    const [isLoading,     setIsLoading]     = useState(true);
    const [bioSaving,     setBioSaving]     = useState(false);
    const [avatarKey,     setAvatarKey]     = useState(Date.now());
    const fileInputRef = useRef(null);

    // Adopt dialog state
    const [adoptDialog, setAdoptDialog]         = useState(null);
    const [adopterSearch, setAdopterSearch]     = useState('');
    const [adopterResults, setAdopterResults]   = useState([]);
    const [selectedAdopter, setSelectedAdopter] = useState(null);
    const [adopterLoading, setAdopterLoading]   = useState(false);
    const [adoptConfirming, setAdoptConfirming] = useState(false);

    // ── Fetchers ─────────────────────────────────────────────────────────────

    const fetchProfile = useCallback(async () => {
        if (!profileId) return;
        try {
            const res = await axios.get(`${API}/users/${profileId}/profile`, { withCredentials: true });
            setProfileData(res.data.profile);
            setBioValue(res.data.profile?.bio || '');
        } catch (err) {
            // fallback to currentUser for own profile
            if (isOwnProfile && currentUser) {
                setProfileData(currentUser);
                setBioValue(currentUser.bio || '');
            }
        }
    }, [profileId, isOwnProfile, currentUser]);

    const fetchPets = useCallback(async () => {
        if (!profileId) return;
        try {
            const res = await axios.get(`${API}/users/${profileId}/pets`, { withCredentials: true });
            setPets(res.data.pets || []);
        } catch (err) {
            setPets([]);
        }
    }, [profileId]);

    const fetchAdopted = useCallback(async () => {
        if (!profileId || adoptedPets.length > 0) return;
        try {
            const res = await axios.get(`${API}/users/${profileId}/adoptions`, { withCredentials: true });
            setAdoptedPets(res.data.pets || []);
        } catch (err) {
            setAdoptedPets([]);
        }
    }, [profileId, adoptedPets.length]);

    const fetchSaved = useCallback(async () => {
        if (!profileId) return;
        try {
            const res = await axios.get(`${API}/users/${profileId}/saved`, { withCredentials: true });
            setSavedPets(res.data.pets || []);
        } catch {
            setSavedPets([]);
        }
    }, [profileId]);

    // ── Effects ──────────────────────────────────────────────────────────────

    useEffect(() => {
        setIsLoading(true);
        Promise.all([fetchProfile(), fetchPets()]).finally(() => setIsLoading(false));
    }, [fetchProfile, fetchPets]);

    useEffect(() => {
        if (activeTab === 'adopted' || activeTab === 'activity') fetchAdopted();
    }, [activeTab, fetchAdopted]);

    useEffect(() => {
        if (activeTab === 'saved' || activeTab === 'activity') fetchSaved();
    }, [activeTab, fetchSaved]);

    useEffect(() => {
        if (activeTab !== 'activity' || receivedMsgCount !== null) return;
        axios.get('http://localhost:5000/api/conversations/received-count', { withCredentials: true })
            .then(res => setReceivedMsgCount(res.data.count ?? 0))
            .catch(() => setReceivedMsgCount(0));
    }, [activeTab, receivedMsgCount]);

    // ── Bio save ─────────────────────────────────────────────────────────────

    const saveBio = async () => {
        setBioSaving(true);
        try {
            await axios.patch(`${API}/users/me`, { bio: bioValue }, { withCredentials: true });
            setProfileData(prev => ({ ...prev, bio: bioValue }));
            setIsEditingBio(false);
        } catch (err) {
            console.error('Bio save failed:', err);
        } finally {
            setBioSaving(false);
        }
    };

    const cancelBio = () => {
        setBioValue(profileData?.bio || currentUser?.bio || '');
        setIsEditingBio(false);
    };

    // ── Info (name + city) save ───────────────────────────────────────────────

    const saveInfo = async () => {
        const trimmedName = nameValue.trim();
        const trimmedCity = cityValue.trim() || null;
        if (!trimmedName) { toast.error('Name cannot be empty.'); return; }
        setInfoSaving(true);
        try {
            await axios.patch(`${API}/users/me`, { name: trimmedName, city: trimmedCity }, { withCredentials: true });
            setProfileData(prev => ({ ...prev, name: trimmedName, city: trimmedCity }));
            syncProfile({ name: trimmedName, city: trimmedCity });
            setIsEditingInfo(false);
            toast.success('Profile updated!');
        } catch {
            toast.error('Failed to update profile.');
        } finally {
            setInfoSaving(false);
        }
    };

    const cancelInfo = () => {
        setNameValue(displayName);
        setCityValue(displayCity || '');
        setIsEditingInfo(false);
    };

    // ── Avatar upload ────────────────────────────────────────────────────────

    const handleAvatarChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            console.log('Uploading avatar:', file.name, file.size, file.type);
            const result = await uploadAvatar(file);
            console.log('Avatar upload result:', result);
            setAvatarKey(Date.now());
            toast.success('Avatar updated!');
        } catch (err) {
            console.error('Avatar upload failed:', err.response?.status, err.response?.data, err.message);
            toast.error('Failed to upload avatar: ' + (err.response?.data?.message || err.message));
        }
        e.target.value = '';
    };

    // ── Mark as adopted (dialog) ─────────────────────────────────────────────

    useEffect(() => {
        if (!adopterSearch.trim() || adopterSearch.length < 2) { setAdopterResults([]); return; }
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
            setPets(prev => prev.map(p => p.id === adoptDialog.id ? { ...p, is_adopted: true } : p));
            closeAdoptDialog();
        } catch (err) {
            console.error('Mark adopted failed:', err);
            toast.error('Failed to update.');
        } finally {
            setAdoptConfirming(false);
        }
    };

    const handleMarkAdopted = openAdoptDialog;

    // ── Derived display values ────────────────────────────────────────────────

    // For own profile: prefer live currentUser for avatar/name (stays in sync with uploads)
    const displayName   = isOwnProfile ? (currentUser?.name   || profileData?.name   || '…') : (profileData?.name   || '…');
    const displayAvatar = isOwnProfile ? (currentUser?.avatar || profileData?.avatar)         : profileData?.avatar;
    const displayBio    = profileData?.bio ?? (isOwnProfile ? currentUser?.bio : null);
    const displayCity   = profileData?.city ?? (isOwnProfile ? currentUser?.city : null);
    const createdAt     = isOwnProfile ? (currentUser?.createdAt || profileData?.createdAt) : profileData?.createdAt;

    const uploadsCount    = pets.length;
    const foundCount      = pets.filter(p => p.is_adopted).length;
    const successRate     = uploadsCount > 0 ? Math.round((foundCount / uploadsCount) * 100) : 0;

    // Activity feed — generated client-side from pets
    const activityEvents = [
        ...pets.map(p => ({ date: p.created_at, text: 'Uploaded ', name: p.name })),
        ...pets.filter(p => p.is_adopted && p.adopted_at)
               .map(p => ({ date: p.adopted_at, text: '', name: p.name, suffix: ' marked as adopted' })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);

    // Tab config
    const tabs = [
        { key: 'uploads',  label: 'My uploads',    count: uploadsCount },
        { key: 'activity', label: 'Activity',       count: 0 },
        { key: 'adopted',  label: 'Adopted by me',  count: adoptedPets.length },
        { key: 'saved',    label: 'Saved',           count: savedPets.length },
    ];

    if (!currentUser) return null;

    // ── Render ────────────────────────────────────────────────────────────────

    console.log('AVATAR DEBUG:', {
        displayAvatar,
        resolved: resolveAvatar(displayAvatar),
        currentUserAvatar: currentUser?.avatar,
        avatarKey
    });

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 10,
            display: 'flex', flexDirection: 'column',
            background: '#FAF7F4', overflowY: 'auto',
        }}>
            <Navbar />

            <div style={{
                maxWidth: 900, margin: '0 auto', padding: '0 48px 64px',
                width: '100%', boxSizing: 'border-box',
            }}>

                {/* ── MASTHEAD ─────────────────────────────────────────────── */}
                <div style={{ paddingTop: 32, marginBottom: 0 }}>
                    <div style={{
                        fontFamily: sans, fontSize: 10, textTransform: 'uppercase',
                        letterSpacing: '0.14em', color: '#C07A4A', fontWeight: 500,
                        marginBottom: 16,
                    }}>
                        The Paws Daily · Member profile
                    </div>
                    <div style={{ borderBottom: '3px double rgba(45,31,20,0.15)' }} />
                </div>

                {/* ── PROFILE HEADER ───────────────────────────────────────── */}
                <div style={{
                    padding: '24px 0 28px',
                    borderBottom: '1px solid rgba(45,31,20,0.12)',
                }}>

                    {/* Top row: Avatar + Name/meta/bio */}
                    <div style={{
                        display: 'grid', gridTemplateColumns: 'auto 1fr',
                        gap: 28, alignItems: 'start',
                        marginBottom: 20,
                    }}>

                        {/* LEFT — Avatar */}
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                            <div style={{
                                width: 88, height: 88, borderRadius: '50%',
                                background: 'linear-gradient(135deg, #E8C5A0, #C07A4A)',
                                overflow: 'hidden', display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                            }}>
                                {resolveAvatar(displayAvatar) ? (
                                    <img
                                        key={avatarKey}
                                        src={resolveAvatar(displayAvatar) + '?t=' + avatarKey}
                                        alt={displayName}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                ) : (
                                    <span style={{
                                        fontFamily: serif, fontSize: 32, fontWeight: 700,
                                        color: '#fff', lineHeight: 1,
                                    }}>
                                        {getInitial(displayName)}
                                    </span>
                                )}
                            </div>

                            {/* Pencil edit button — own profile only */}
                            {isOwnProfile && (
                                <>
                                    <button
                                        title="Change photo"
                                        onClick={() => fileInputRef.current?.click()}
                                        style={{
                                            position: 'absolute', bottom: 2, right: 2,
                                            width: 22, height: 22, borderRadius: '50%',
                                            background: '#2D1F14',
                                            border: '2px solid #FAF7F4',
                                            cursor: 'pointer', color: '#FAF7F4',
                                            display: 'flex', alignItems: 'center',
                                            justifyContent: 'center', fontSize: 11, lineHeight: 1,
                                            padding: 0,
                                        }}
                                    >
                                        ✎
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        onChange={handleAvatarChange}
                                    />
                                </>
                            )}
                        </div>

                        {/* CENTER — Name, meta, bio */}
                        <div style={{ minWidth: 0 }}>
                            {/* Name */}
                            {isEditingInfo ? (
                                <input
                                    value={nameValue}
                                    onChange={(e) => setNameValue(e.target.value)}
                                    autoFocus
                                    onKeyDown={(e) => { if (e.key === 'Escape') cancelInfo(); }}
                                    style={{
                                        fontFamily: serif, fontSize: 32, fontWeight: 700,
                                        color: '#2D1F14', lineHeight: 1, marginBottom: 8,
                                        background: 'transparent', border: 'none',
                                        borderBottom: '2px solid rgba(45,31,20,0.25)',
                                        outline: 'none', width: '100%', padding: '0 0 2px',
                                        display: 'block',
                                    }}
                                />
                            ) : (
                                <div style={{
                                    fontFamily: serif, fontSize: 32, fontWeight: 700,
                                    color: '#2D1F14', lineHeight: 1, marginBottom: 8,
                                }}>
                                    {isLoading ? '…' : displayName}
                                </div>
                            )}

                            {/* Meta row */}
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                flexWrap: 'wrap', marginBottom: 10,
                                fontFamily: sans, fontSize: 11, color: '#7A5C44',
                            }}>
                                {isEditingInfo ? (
                                    <input
                                        value={cityValue}
                                        onChange={(e) => setCityValue(e.target.value)}
                                        placeholder="City (optional)"
                                        onKeyDown={(e) => { if (e.key === 'Escape') cancelInfo(); }}
                                        style={{
                                            fontFamily: sans, fontSize: 11, color: '#7A5C44',
                                            background: 'transparent', border: 'none',
                                            borderBottom: '1px solid rgba(45,31,20,0.2)',
                                            outline: 'none', padding: '1px 0', width: 130,
                                        }}
                                    />
                                ) : (
                                    displayCity && <><Dot /><span>{displayCity}</span></>
                                )}
                                <Dot />
                                <span>Member since {fmtMemberSince(createdAt)}</span>
                                <Dot />
                                <span>{uploadsCount} upload{uploadsCount !== 1 ? 's' : ''}</span>
                            </div>

                            {/* Bio */}
                            {isEditingBio ? (
                                <div>
                                    <textarea
                                        value={bioValue}
                                        onChange={(e) => setBioValue(e.target.value)}
                                        rows={3}
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Escape') cancelBio();
                                        }}
                                        style={{
                                            fontFamily: serif, fontSize: 13, fontStyle: 'italic',
                                            color: '#5C4030', lineHeight: 1.7,
                                            width: '100%', maxWidth: 480, background: 'transparent',
                                            border: 'none',
                                            borderBottom: '1px solid rgba(45,31,20,0.2)',
                                            outline: 'none', resize: 'none', padding: '2px 0',
                                            display: 'block',
                                        }}
                                    />
                                    <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                                        <button
                                            onClick={saveBio}
                                            disabled={bioSaving}
                                            style={{
                                                fontFamily: sans, fontSize: 10, fontWeight: 500,
                                                padding: '4px 12px', borderRadius: 2,
                                                background: '#C07A4A', color: '#FAF7F4',
                                                border: 'none', cursor: 'pointer',
                                            }}
                                        >
                                            {bioSaving ? 'Saving…' : 'Save'}
                                        </button>
                                        <button
                                            onClick={cancelBio}
                                            style={{
                                                fontFamily: sans, fontSize: 10,
                                                padding: '4px 12px', borderRadius: 2,
                                                background: 'transparent', color: '#7A5C44',
                                                border: '1px solid rgba(45,31,20,0.2)', cursor: 'pointer',
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div style={{
                                        fontFamily: serif, fontSize: 13, fontStyle: 'italic',
                                        color: displayBio ? '#5C4030' : '#B09880',
                                        maxWidth: 480, lineHeight: 1.7,
                                    }}>
                                        {displayBio || 'No bio yet.'}
                                    </div>
                                    {isOwnProfile && (
                                        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 6 }}>
                                            {!isEditingInfo && (
                                                <button
                                                    onClick={() => { setBioValue(displayBio || ''); setIsEditingBio(true); }}
                                                    style={{
                                                        fontFamily: sans, fontSize: 10,
                                                        color: '#C07A4A', background: 'none',
                                                        border: 'none', cursor: 'pointer', padding: 0,
                                                    }}
                                                >
                                                    Edit bio →
                                                </button>
                                            )}
                                            {!isEditingInfo && (
                                                <button
                                                    onClick={() => { setNameValue(displayName); setCityValue(displayCity || ''); setIsEditingInfo(true); }}
                                                    style={{
                                                        fontFamily: sans, fontSize: 10,
                                                        color: '#C07A4A', background: 'none',
                                                        border: 'none', cursor: 'pointer', padding: 0,
                                                    }}
                                                >
                                                    Edit name & city →
                                                </button>
                                            )}
                                            {isEditingInfo && (
                                                <div style={{ display: 'flex', gap: 10 }}>
                                                    <button
                                                        onClick={saveInfo}
                                                        disabled={infoSaving}
                                                        style={{
                                                            fontFamily: sans, fontSize: 10, fontWeight: 500,
                                                            padding: '4px 12px', borderRadius: 2,
                                                            background: '#C07A4A', color: '#FAF7F4',
                                                            border: 'none', cursor: 'pointer',
                                                        }}
                                                    >
                                                        {infoSaving ? 'Saving…' : 'Save'}
                                                    </button>
                                                    <button
                                                        onClick={cancelInfo}
                                                        style={{
                                                            fontFamily: sans, fontSize: 10,
                                                            padding: '4px 12px', borderRadius: 2,
                                                            background: 'transparent', color: '#7A5C44',
                                                            border: '1px solid rgba(45,31,20,0.2)', cursor: 'pointer',
                                                        }}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Bottom: Horizontal trust bar */}
                    <div style={{
                        background: '#2D1F14', borderRadius: 4,
                        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                    }}>
                        {[
                            { label: 'Uploads',      value: uploadsCount,        color: '#FAF7F4' },
                            { label: 'Found homes',  value: foundCount,          color: '#5DCAA5' },
                            { label: 'Success rate', value: `${successRate}%`,   color: '#5DCAA5' },
                            { label: 'Avg response', value: '< 2h',              color: '#FAF7F4' },
                        ].map(({ label, value, color }, i, arr) => (
                            <div key={label} style={{
                                padding: '14px 20px',
                                borderRight: i < arr.length - 1 ? '1px solid rgba(250,247,244,0.08)' : 'none',
                            }}>
                                <div style={{
                                    fontFamily: serif, fontSize: 22, fontWeight: 700,
                                    color, lineHeight: 1.1, marginBottom: 3,
                                }}>
                                    {value}
                                </div>
                                <div style={{
                                    fontFamily: sans, fontSize: 9, textTransform: 'uppercase',
                                    letterSpacing: '0.1em', color: 'rgba(250,247,244,0.5)',
                                }}>
                                    {label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── TABS ─────────────────────────────────────────────────── */}
                <div style={{
                    display: 'flex', borderBottom: '1px solid rgba(45,31,20,0.12)',
                    marginBottom: 28,
                }}>
                    {tabs.map(({ key, label, count }) => {
                        const active = activeTab === key;
                        return (
                            <button
                                key={key}
                                onClick={() => setActiveTab(key)}
                                style={{
                                    fontFamily: sans, fontSize: 12,
                                    padding: '12px 18px', background: 'none', border: 'none',
                                    borderBottom: active ? '2px solid #C07A4A' : '2px solid transparent',
                                    color: active ? '#2D1F14' : '#7A5C44',
                                    fontWeight: active ? 500 : 400,
                                    cursor: 'pointer', marginBottom: -1,
                                    display: 'flex', alignItems: 'center',
                                    transition: 'color 0.15s',
                                }}
                            >
                                {label}
                                {count > 0 && <TabBadge n={count} />}
                            </button>
                        );
                    })}
                </div>

                {/* ── TAB 1: MY UPLOADS ──────────────────────────────────── */}
                {activeTab === 'uploads' && (
                    <div>
                        <SectionLabel>Animals I uploaded</SectionLabel>
                        {isLoading ? (
                            <div style={{ fontFamily: serif, fontSize: 15, fontStyle: 'italic', color: '#B09880', padding: '32px 0' }}>
                                Loading…
                            </div>
                        ) : pets.length === 0 ? (
                            <EmptyState text="No uploads yet." />
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                                {pets.map((pet) => (
                                    <UploadCard
                                        key={pet.id}
                                        pet={pet}
                                        isOwnProfile={isOwnProfile}
                                        onMarkAdopted={handleMarkAdopted}
                                        onEdit={(id) => navigate(`/pet/${id}/edit`)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── TAB 2: ACTIVITY ────────────────────────────────────── */}
                {activeTab === 'activity' && (
                    <div>
                        {/* 3×2 stats grid */}
                        <div style={{
                            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                            border: '1px solid rgba(45,31,20,0.08)',
                            borderRight: 'none', borderBottom: 'none',
                            marginBottom: 28,
                        }}>
                            <StatCell value={uploadsCount}            label="Animals uploaded" />
                            <StatCell value={foundCount}              label="Found a home"       trend={foundCount > 0 ? `↑ ${foundCount} total` : null} />
                            <StatCell value={receivedMsgCount ?? '—'} label="Messages received" />
                            <StatCell value={adoptedPets.length} label="Adopted personally" />
                            <StatCell value={savedPets.length}   label="Saved for later" />
                            <StatCell value={fmtMemberFor(createdAt)} label="Member for" />
                        </div>

                        {/* Recent activity feed */}
                        <div style={{ borderTop: '1px solid rgba(45,31,20,0.12)', paddingTop: 20 }}>
                            <SectionLabel>Recent activity</SectionLabel>

                            {activityEvents.length === 0 ? (
                                <EmptyState text="No activity yet." />
                            ) : (
                                <div>
                                    {activityEvents.map((ev, i) => (
                                        <div key={i}>
                                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, padding: '8px 0' }}>
                                                <span style={{
                                                    fontFamily: sans, fontSize: 9, color: '#7A5C44',
                                                    width: 60, flexShrink: 0,
                                                }}>
                                                    {fmtShortDate(ev.date)}
                                                </span>
                                                <span style={{ fontFamily: sans, fontSize: 12, color: '#2D1F14' }}>
                                                    {ev.text}
                                                    <span style={{ fontFamily: serif, fontWeight: 700 }}>{ev.name}</span>
                                                    {ev.suffix || ''}
                                                </span>
                                            </div>
                                            {i < activityEvents.length - 1 && (
                                                <div style={{ borderBottom: '1px solid rgba(45,31,20,0.06)' }} />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── TAB 3: ADOPTED BY ME ───────────────────────────────── */}
                {activeTab === 'adopted' && (
                    <div>
                        <SectionLabel>Animals I adopted through Paws</SectionLabel>
                        {adoptedPets.length === 0 ? (
                            <EmptyState text="No adoptions yet." />
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {adoptedPets.map(pet => <AdoptedCard key={pet.id} pet={pet} />)}
                            </div>
                        )}
                    </div>
                )}

                {/* ── TAB 4: SAVED ───────────────────────────────────────── */}
                {activeTab === 'saved' && (
                    <div>
                        <SectionLabel>Saved for later</SectionLabel>
                        {savedPets.length === 0 ? (
                            <EmptyState text="No saved animals yet." note="Tap the bookmark on any animal listing to save it." />
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                                {savedPets.map((pet) => {
                                    const photo = photoUrl(pet.primary_photo_id);
                                    return (
                                        <div
                                            key={pet.id}
                                            onClick={() => navigate(`/pet/${pet.id}`)}
                                            style={{
                                                background: '#fff', border: '1px solid rgba(45,31,20,0.1)',
                                                borderRadius: 3, cursor: 'pointer',
                                                position: 'relative',
                                            }}
                                        >
                                            <div style={{ height: PHOTO_H, background: '#F0EAE3', overflow: 'hidden', borderRadius: '3px 3px 0 0' }}>
                                                {photo ? (
                                                    <img
                                                        src={photo} alt={pet.name}
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%', display: 'block' }}
                                                        onError={e => { e.target.style.display = 'none'; }}
                                                    />
                                                ) : (
                                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: serif, fontSize: 22, color: '#C4A882' }}>
                                                        {pet.type?.charAt(0).toUpperCase() || '?'}
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ padding: '10px 12px 8px' }}>
                                                <div style={{ fontFamily: serif, fontSize: 15, fontWeight: 700, color: '#2D1F14', marginBottom: 2 }}>{pet.name}</div>
                                                {pet.location_city && (
                                                    <div style={{ fontFamily: sans, fontSize: 11, color: '#9A7A60' }}>◎ {pet.location_city}</div>
                                                )}
                                            </div>
                                            {isOwnProfile && (
                                                <button
                                                    type="button"
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        try {
                                                            await axios.delete(`${API}/users/me/saved/${pet.id}`, { withCredentials: true });
                                                            setSavedPets(prev => prev.filter(p => p.id !== pet.id));
                                                        } catch {
                                                            // ignore
                                                        }
                                                    }}
                                                    style={{
                                                        position: 'absolute', top: 6, right: 6,
                                                        fontFamily: sans, fontSize: 9,
                                                        background: 'rgba(45,31,20,0.65)', color: '#FAF7F4',
                                                        border: 'none', borderRadius: 2,
                                                        padding: '3px 7px', cursor: 'pointer',
                                                    }}
                                                >
                                                    Unsave
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

            </div>

            {/* ── Adopter selection dialog ─────────────────────────────────────── */}
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
