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

function fmtAvgResponse(avgMinutes) {
    if (avgMinutes === null || avgMinutes === undefined) return '—';
    if (avgMinutes < 60) return '< 1h';
    const h = Math.ceil(avgMinutes / 60);
    if (h < 24) return `< ${h}h`;
    return `${Math.round(avgMinutes / (24 * 60))} days`;
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
    if (pet.status === 'rejected') {
        return (
            <span style={{
                fontFamily: sans, fontSize: 8, textTransform: 'uppercase',
                letterSpacing: '0.08em', padding: '2px 6px', borderRadius: 2,
                fontWeight: 600, background: 'rgba(153,60,29,0.1)', color: '#993C1D',
                border: '1px solid rgba(153,60,29,0.25)',
            }}>
                Rejected
            </span>
        );
    }
    if (pet.status === 'pending') {
        return (
            <span style={{
                fontFamily: sans, fontSize: 8, textTransform: 'uppercase',
                letterSpacing: '0.08em', padding: '2px 6px', borderRadius: 2,
                fontWeight: 600, background: '#FAF3E8', color: '#8B4E28',
                border: '1px solid rgba(192,122,74,0.25)',
            }}>
                Pending review
            </span>
        );
    }
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

function UploadCard({ pet, isOwnProfile, onMarkAdopted, onUnadopt, onEdit }) {
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

            {/* Actions — shown on hover */}
            {isOwnProfile && (
                <div style={{ padding: '0 10px 10px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {pet.is_adopted ? (
                        <button
                            onClick={(e) => { e.stopPropagation(); onUnadopt(pet.id); }}
                            style={{
                                width: '100%', fontFamily: sans, fontSize: 10,
                                fontWeight: 500, padding: '5px 0', borderRadius: 2,
                                border: '1px solid rgba(192,122,74,0.35)',
                                color: '#8B4E28', background: 'rgba(192,122,74,0.06)',
                                cursor: 'pointer',
                                opacity: hovered ? 1 : 0,
                                transition: 'opacity 0.15s',
                                pointerEvents: hovered ? 'auto' : 'none',
                            }}
                        >
                            Undo adoption
                        </button>
                    ) : (
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

// ── Private section placeholder ───────────────────────────────────────────────

function PrivateSection() {
    return (
        <div style={{ padding: '56px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 10, opacity: 0.35 }}>🔒</div>
            <div style={{ fontFamily: serif, fontSize: 16, fontStyle: 'italic', color: '#B09880' }}>
                This user's activity is hidden.
            </div>
        </div>
    );
}

// ── Privacy toggle switch ──────────────────────────────────────────────────────

function PrivacyToggle({ label, description, checked, onChange }) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 0', borderBottom: '1px solid rgba(45,31,20,0.08)',
        }}>
            <div>
                <div style={{ fontFamily: sans, fontSize: 13, color: '#2D1F14' }}>{label}</div>
                {description && (
                    <div style={{ fontFamily: sans, fontSize: 11, color: '#9A7A60', marginTop: 2 }}>
                        {description}
                    </div>
                )}
            </div>
            <button
                onClick={() => onChange(!checked)}
                style={{
                    width: 40, height: 22, borderRadius: 11, padding: 2,
                    background: checked ? '#C07A4A' : 'rgba(45,31,20,0.15)',
                    border: 'none', cursor: 'pointer', position: 'relative',
                    transition: 'background 0.2s', flexShrink: 0, marginLeft: 16,
                }}
            >
                <div style={{
                    width: 18, height: 18, borderRadius: '50%', background: '#fff',
                    position: 'absolute', top: 2,
                    left: checked ? 20 : 2,
                    transition: 'left 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
            </button>
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

    // avg response time
    const [avgResponse, setAvgResponse] = useState(null);

    // privacy: editable settings (own profile) + visitor-facing settings
    const DEFAULT_PRIVACY = { showAvgResponse: true, showFoundHomes: true, showSuccessRate: true, showMessagesReceived: true, showUploads: true, showFoundAHome: true, showAdoptedByMe: true, showSaved: true };
    const [privacySettings, setPrivacySettings] = useState(DEFAULT_PRIVACY);
    const [privacyLoaded,   setPrivacyLoaded]   = useState(false);
    const [visitorPrivacy,  setVisitorPrivacy]  = useState(DEFAULT_PRIVACY);

    // fetch-once guards
    const [adoptedFetched, setAdoptedFetched] = useState(false);
    const [savedFetched,   setSavedFetched]   = useState(false);

    // isPrivate flags for activity stats and tab content
    const [adoptedIsPrivate,     setAdoptedIsPrivate]     = useState(false);
    const [savedIsPrivate,       setSavedIsPrivate]       = useState(false);
    const [petsUploadsPrivate,   setPetsUploadsPrivate]   = useState(false);
    const [petsFoundHomePrivate, setPetsFoundHomePrivate] = useState(false);
    const [isEditingBio,  setIsEditingBio]  = useState(false);
    const [bioValue,      setBioValue]      = useState('');
    const [isEditingInfo, setIsEditingInfo] = useState(false);
    const [nameValue,     setNameValue]     = useState('');
    const [cityValue,     setCityValue]     = useState('');
    const [infoSaving,    setInfoSaving]    = useState(false);
    const [isLoading,      setIsLoading]      = useState(true);
    const [bioSaving,      setBioSaving]      = useState(false);
    const [isEditingAvail, setIsEditingAvail] = useState(false);
    const [availDays,      setAvailDays]      = useState([]);
    const [availFrom,      setAvailFrom]      = useState('');
    const [availTo,        setAvailTo]        = useState('');
    const [availSaving,    setAvailSaving]    = useState(false);
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
            if (!isOwnProfile && res.data.profile?.privacySettings) {
                const ps = res.data.profile.privacySettings;
                setVisitorPrivacy({
                    showAvgResponse:      ps.showAvgResponse      ?? true,
                    showFoundHomes:       ps.showFoundHomes       ?? true,
                    showSuccessRate:      ps.showSuccessRate      ?? true,
                    showMessagesReceived: ps.showMessagesReceived ?? true,
                    showUploads:          ps.showUploads          ?? true,
                    showFoundAHome:       ps.showFoundAHome       ?? true,
                    showAdoptedByMe:      ps.showAdoptedByMe      ?? true,
                    showSaved:            ps.showSaved            ?? true,
                });
            }
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
            if (res.data.isPrivate) {
                setPetsUploadsPrivate(true);
                setPetsFoundHomePrivate(true);
                setPets([]);
            } else {
                setPetsUploadsPrivate(res.data.isUploadsPrivate || false);
                setPetsFoundHomePrivate(res.data.isFoundHomePrivate || false);
                setPets(res.data.pets || []);
            }
        } catch (err) {
            setPets([]);
        }
    }, [profileId]);

    const fetchAdopted = useCallback(async () => {
        if (!profileId || adoptedFetched) return;
        setAdoptedFetched(true);
        try {
            const res = await axios.get(`${API}/users/${profileId}/adoptions`, { withCredentials: true });
            if (res.data.isPrivate) {
                setAdoptedIsPrivate(true);
                setAdoptedPets([]);
            } else {
                setAdoptedIsPrivate(false);
                setAdoptedPets(res.data.pets || []);
            }
        } catch (err) {
            setAdoptedPets([]);
        }
    }, [profileId, adoptedFetched]);

    const fetchSaved = useCallback(async () => {
        if (!profileId || savedFetched) return;
        setSavedFetched(true);
        try {
            const res = await axios.get(`${API}/users/${profileId}/saved`, { withCredentials: true });
            if (res.data.isPrivate) {
                setSavedIsPrivate(true);
                setSavedPets([]);
            } else {
                setSavedIsPrivate(false);
                setSavedPets(res.data.pets || []);
            }
        } catch {
            setSavedPets([]);
        }
    }, [profileId, savedFetched]);

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
        if (activeTab !== 'activity' || receivedMsgCount !== null || !profileId) return;
        axios.get(`${API}/users/${profileId}/received-count`, { withCredentials: true })
            .then(res => {
                if (res.data.isPrivate) setReceivedMsgCount('private');
                else setReceivedMsgCount(res.data.count ?? 0);
            })
            .catch(() => setReceivedMsgCount(0));
    }, [activeTab, receivedMsgCount, profileId]);

    // Fetch avg response time
    useEffect(() => {
        if (!profileId) return;
        axios.get(`${API}/users/${profileId}/avg-response-time`, { withCredentials: true })
            .then(res => {
                if (res.data.isPrivate || !res.data.hasEnoughData) setAvgResponse(null);
                else setAvgResponse(res.data.avgMinutes ?? null);
            })
            .catch(() => setAvgResponse(null));
    }, [profileId]);

    // Fetch own privacy settings for editing
    useEffect(() => {
        if (!isOwnProfile || privacyLoaded) return;
        axios.get(`${API}/users/me/privacy-settings`, { withCredentials: true })
            .then(res => { if (res.data.settings) setPrivacySettings(res.data.settings); })
            .catch(() => {})
            .finally(() => setPrivacyLoaded(true));
    }, [isOwnProfile, privacyLoaded]);


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

    // ── Contact availability ──────────────────────────────────────────────────

    const openAvailEdit = () => {
        const a = profileData?.contactAvailability ?? currentUser?.contactAvailability;
        setAvailDays(a?.days?.length ? [...a.days] : []);
        setAvailFrom(a?.from || '');
        setAvailTo(a?.to   || '');
        setIsEditingAvail(true);
    };

    const cancelAvailEdit = () => setIsEditingAvail(false);

    const saveAvailability = async () => {
        setAvailSaving(true);
        try {
            await axios.patch(
                `${API}/users/me`,
                { contactAvailability: { days: availDays, from: availFrom, to: availTo } },
                { withCredentials: true }
            );
            setProfileData(prev => ({ ...prev, contactAvailability: { days: availDays, from: availFrom, to: availTo } }));
            setIsEditingAvail(false);
            toast.success('Availability updated!');
        } catch {
            toast.error('Failed to save availability.');
        } finally {
            setAvailSaving(false);
        }
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

    const handleUnadopt = async (petId) => {
        try {
            await axios.patch(`${API}/pets/${petId}/unadopt`, {}, { withCredentials: true });
            toast.success('Adoption mark removed.');
            setPets(prev => prev.map(p => p.id === petId
                ? { ...p, is_adopted: false, adoption_status: 'available' }
                : p
            ));
        } catch {
            toast.error('Failed to undo adoption.');
        }
    };

    // ── Privacy settings change ───────────────────────────────────────────────

    const handlePrivacyChange = async (key, value) => {
        setPrivacySettings(prev => ({ ...prev, [key]: value }));
        try {
            await axios.put(`${API}/users/me/privacy-settings`, { [key]: value }, { withCredentials: true });
            toast.success('Privacy settings updated.');
        } catch {
            setPrivacySettings(prev => ({ ...prev, [key]: !value }));
            toast.error('Failed to save setting.');
        }
    };

    // ── Derived display values ────────────────────────────────────────────────

    // For own profile: prefer live currentUser for avatar/name (stays in sync with uploads)
    const displayName   = isOwnProfile ? (currentUser?.name   || profileData?.name   || '…') : (profileData?.name   || '…');
    const displayAvatar = isOwnProfile ? (currentUser?.avatar || profileData?.avatar)         : profileData?.avatar;
    const displayBio    = profileData?.bio  ?? (isOwnProfile ? currentUser?.bio  : null);
    const displayCity   = profileData?.city ?? (isOwnProfile ? currentUser?.city : null);
    const displayAvail  = profileData?.contactAvailability ?? (isOwnProfile ? currentUser?.contactAvailability : null);
    const createdAt     = isOwnProfile ? (currentUser?.createdAt || profileData?.createdAt) : profileData?.createdAt;

    // For own profile use live pets array; for visitors use profileData (always public, no privacy filter)
    const uploadsCount  = isOwnProfile ? pets.length : (profileData?.uploads_count ?? pets.length);
    const foundCount    = isOwnProfile ? pets.filter(p => p.is_adopted).length : (profileData?.adopted_count ?? pets.filter(p => p.is_adopted).length);
    const successRate   = isOwnProfile
        ? (pets.length > 0 ? Math.round((pets.filter(p => p.is_adopted).length / pets.length) * 100) : 0)
        : (profileData?.success_rate ?? 0);

    const activeUploads   = pets.filter(p => !p.is_adopted);
    const foundHomePets   = pets.filter(p => p.is_adopted);

    // Activity feed — generated client-side from pets
    const activityEvents = [
        ...pets.map(p => ({ date: p.created_at, text: 'Uploaded ', name: p.name })),
        ...pets.filter(p => p.is_adopted && p.adopted_at)
               .map(p => ({ date: p.adopted_at, text: '', name: p.name, suffix: ' marked as adopted' })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);

    // Tab config — always show all tabs; private ones show 🔒 indicator
    const tabs = [
        { key: 'uploads',    label: 'My uploads',    count: petsUploadsPrivate   ? 0 : activeUploads.length, privacyKey: 'showUploads' },
        { key: 'found_home', label: 'Found a home',  count: petsFoundHomePrivate ? 0 : foundHomePets.length,  privacyKey: 'showFoundAHome' },
        { key: 'activity',   label: 'Activity',      count: 0,                                                privacyKey: null },
        { key: 'adopted',    label: 'Adopted by me', count: adoptedIsPrivate     ? 0 : adoptedPets.length,   privacyKey: 'showAdoptedByMe' },
        { key: 'saved',      label: 'Saved',          count: savedIsPrivate      ? 0 : savedPets.length,     privacyKey: 'showSaved' },
        ...(isOwnProfile ? [{ key: 'settings', label: 'Settings', count: 0, privacyKey: null }] : []),
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

                                    {/* ── Contact availability ─────────────────── */}
                                    {isEditingAvail ? (
                                        <div style={{ marginTop: 12 }}>
                                            <div style={{ fontFamily: sans, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#C07A4A', marginBottom: 8 }}>
                                                Available days
                                            </div>
                                            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
                                                {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => {
                                                    const on = availDays.includes(d);
                                                    return (
                                                        <button
                                                            key={d}
                                                            onClick={() => setAvailDays(prev => on ? prev.filter(x => x !== d) : [...prev, d])}
                                                            style={{
                                                                fontFamily: sans, fontSize: 10, fontWeight: 500,
                                                                padding: '4px 10px', borderRadius: 2, cursor: 'pointer',
                                                                border: '1px solid rgba(192,122,74,0.45)',
                                                                background: on ? '#C07A4A' : 'transparent',
                                                                color: on ? '#FAF7F4' : '#7A5C44',
                                                                transition: 'background 0.12s, color 0.12s',
                                                            }}
                                                        >
                                                            {d}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            <div style={{ fontFamily: sans, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#C07A4A', marginBottom: 8 }}>
                                                Hours
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                                <input
                                                    type="time"
                                                    value={availFrom}
                                                    onChange={e => setAvailFrom(e.target.value)}
                                                    style={{ fontFamily: sans, fontSize: 12, padding: '4px 8px', border: '1px solid rgba(45,31,20,0.2)', borderRadius: 2, background: '#fff', color: '#2D1F14', outline: 'none' }}
                                                />
                                                <span style={{ fontFamily: sans, fontSize: 12, color: '#7A5C44' }}>–</span>
                                                <input
                                                    type="time"
                                                    value={availTo}
                                                    onChange={e => setAvailTo(e.target.value)}
                                                    style={{ fontFamily: sans, fontSize: 12, padding: '4px 8px', border: '1px solid rgba(45,31,20,0.2)', borderRadius: 2, background: '#fff', color: '#2D1F14', outline: 'none' }}
                                                />
                                            </div>
                                            <div style={{ display: 'flex', gap: 10 }}>
                                                <button
                                                    onClick={saveAvailability}
                                                    disabled={availSaving}
                                                    style={{ fontFamily: sans, fontSize: 10, fontWeight: 500, padding: '4px 12px', borderRadius: 2, background: '#C07A4A', color: '#FAF7F4', border: 'none', cursor: 'pointer' }}
                                                >
                                                    {availSaving ? 'Saving…' : 'Save'}
                                                </button>
                                                <button
                                                    onClick={cancelAvailEdit}
                                                    style={{ fontFamily: sans, fontSize: 10, padding: '4px 12px', borderRadius: 2, background: 'transparent', color: '#7A5C44', border: '1px solid rgba(45,31,20,0.2)', cursor: 'pointer' }}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        displayAvail?.days?.length > 0 && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                                                <span style={{ fontFamily: sans, fontSize: 10, color: '#9A7A60' }}>✦</span>
                                                <span style={{ fontFamily: sans, fontSize: 11, color: '#5C4030' }}>
                                                    {displayAvail.days.join(', ')}
                                                    {(displayAvail.from || displayAvail.to) && (
                                                        <span style={{ color: '#9A7A60' }}>
                                                            {' · '}{displayAvail.from || '?'} – {displayAvail.to || '?'}
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                        )
                                    )}

                                    {isOwnProfile && !isEditingAvail && (
                                        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 8 }}>
                                            {!isEditingInfo && (
                                                <button
                                                    onClick={() => { setBioValue(displayBio || ''); setIsEditingBio(true); }}
                                                    style={{ fontFamily: sans, fontSize: 10, color: '#C07A4A', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                                >
                                                    Edit bio →
                                                </button>
                                            )}
                                            {!isEditingInfo && (
                                                <button
                                                    onClick={() => { setNameValue(displayName); setCityValue(displayCity || ''); setIsEditingInfo(true); }}
                                                    style={{ fontFamily: sans, fontSize: 10, color: '#C07A4A', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                                >
                                                    Edit name & city →
                                                </button>
                                            )}
                                            {!isEditingInfo && (
                                                <button
                                                    onClick={openAvailEdit}
                                                    style={{ fontFamily: sans, fontSize: 10, color: '#C07A4A', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                                >
                                                    Edit availability →
                                                </button>
                                            )}
                                            {isEditingInfo && (
                                                <div style={{ display: 'flex', gap: 10 }}>
                                                    <button
                                                        onClick={saveInfo}
                                                        disabled={infoSaving}
                                                        style={{ fontFamily: sans, fontSize: 10, fontWeight: 500, padding: '4px 12px', borderRadius: 2, background: '#C07A4A', color: '#FAF7F4', border: 'none', cursor: 'pointer' }}
                                                    >
                                                        {infoSaving ? 'Saving…' : 'Save'}
                                                    </button>
                                                    <button
                                                        onClick={cancelInfo}
                                                        style={{ fontFamily: sans, fontSize: 10, padding: '4px 12px', borderRadius: 2, background: 'transparent', color: '#7A5C44', border: '1px solid rgba(45,31,20,0.2)', cursor: 'pointer' }}
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
                    {(() => {
                        const visitorHidesFoundHomes  = !isOwnProfile && visitorPrivacy.showFoundHomes  === false;
                        const visitorHidesSuccessRate = !isOwnProfile && visitorPrivacy.showSuccessRate === false;
                        const visitorHidesAvgResponse = !isOwnProfile && visitorPrivacy.showAvgResponse === false;
                        const trustStats = [
                            { label: 'Uploads',      value: uploadsCount,                                                                            color: '#FAF7F4', privacyKey: null },
                            { label: 'Found homes',  value: visitorHidesFoundHomes  ? null : foundCount,                                             color: '#5DCAA5', privacyKey: 'showFoundHomes' },
                            { label: 'Success rate', value: visitorHidesSuccessRate ? null : `${successRate}%`,                                      color: '#5DCAA5', privacyKey: 'showSuccessRate' },
                            { label: 'Avg response', value: visitorHidesAvgResponse ? null : fmtAvgResponse(avgResponse),                           color: '#FAF7F4', privacyKey: 'showAvgResponse' },
                        ];
                        return (
                            <div style={{ background: '#2D1F14', borderRadius: 4, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
                                {trustStats.map(({ label, value, color, privacyKey }, i, arr) => {
                                    const ownerHidden = isOwnProfile && privacyKey && privacySettings[privacyKey] === false;
                                    const isHidden    = value === null;
                                    return (
                                        <div key={label} style={{ padding: '14px 20px', borderRight: i < arr.length - 1 ? '1px solid rgba(250,247,244,0.08)' : 'none' }}>
                                            <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 700, color: isHidden ? 'rgba(250,247,244,0.25)' : color, lineHeight: 1.1, marginBottom: 3 }}>
                                                {isHidden ? '—' : value}
                                            </div>
                                            <div style={{ fontFamily: sans, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(250,247,244,0.5)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                {label}
                                                {ownerHidden && <span title="Hidden from visitors" style={{ fontSize: 8, opacity: 0.55 }}>🔒</span>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })()}
                </div>

                {/* ── TABS ─────────────────────────────────────────────────── */}
                <div style={{
                    display: 'flex', borderBottom: '1px solid rgba(45,31,20,0.12)',
                    marginBottom: 28,
                }}>
                    {tabs.map(({ key, label, count, privacyKey }) => {
                        const active = activeTab === key;
                        const isPrivateTab = privacyKey && (isOwnProfile
                            ? privacySettings[privacyKey] === false
                            : visitorPrivacy[privacyKey] === false
                        );
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
                                    display: 'flex', alignItems: 'center', gap: 4,
                                    transition: 'color 0.15s',
                                }}
                            >
                                {label}
                                {isPrivateTab && (
                                    <span title={isOwnProfile ? 'Hidden from visitors' : 'Private'} style={{ fontSize: 10, opacity: isOwnProfile ? 0.45 : 0.6, lineHeight: 1 }}>
                                        🔒
                                    </span>
                                )}
                                {count > 0 && !isPrivateTab && <TabBadge n={count} />}
                            </button>
                        );
                    })}
                </div>

                {/* ── TAB 1: MY UPLOADS ──────────────────────────────────── */}
                {activeTab === 'uploads' && (
                    <div>
                        <SectionLabel>Animals I uploaded</SectionLabel>
                        {petsUploadsPrivate ? <PrivateSection /> : isLoading ? (
                            <div style={{ fontFamily: serif, fontSize: 15, fontStyle: 'italic', color: '#B09880', padding: '32px 0' }}>
                                Loading…
                            </div>
                        ) : activeUploads.length === 0 ? (
                            <EmptyState text="No active listings." note={foundCount > 0 ? `${foundCount} animal${foundCount !== 1 ? 's' : ''} found a home — see the Found a home tab.` : undefined} />
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                                {activeUploads.map((pet) => (
                                    <UploadCard
                                        key={pet.id}
                                        pet={pet}
                                        isOwnProfile={isOwnProfile}
                                        onMarkAdopted={handleMarkAdopted}
                                        onUnadopt={handleUnadopt}
                                        onEdit={(id) => navigate(`/pet/${id}/edit`)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── TAB 2: FOUND A HOME ────────────────────────────────── */}
                {activeTab === 'found_home' && (
                    <div>
                        <SectionLabel>Animals that found a home</SectionLabel>
                        {petsFoundHomePrivate ? <PrivateSection /> : foundHomePets.length === 0 ? (
                            <EmptyState text="No animals marked as adopted yet." />
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                                {foundHomePets.map((pet) => (
                                    <UploadCard
                                        key={pet.id}
                                        pet={pet}
                                        isOwnProfile={isOwnProfile}
                                        onMarkAdopted={handleMarkAdopted}
                                        onUnadopt={handleUnadopt}
                                        onEdit={(id) => navigate(`/pet/${id}/edit`)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── TAB 3: ACTIVITY ────────────────────────────────────── */}
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
                            <StatCell value={receivedMsgCount === 'private' ? '—' : (receivedMsgCount ?? '—')} label="Messages received" />
                            <StatCell value={adoptedIsPrivate ? '—' : adoptedPets.length} label="Adopted personally" />
                            <StatCell value={savedIsPrivate   ? '—' : savedPets.length}   label="Saved for later" />
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

                {/* ── TAB 4: ADOPTED BY ME ───────────────────────────────── */}
                {activeTab === 'adopted' && (
                    <div>
                        <SectionLabel>Animals I adopted through Paws</SectionLabel>
                        {!isOwnProfile && adoptedIsPrivate ? <PrivateSection /> : adoptedPets.length === 0 ? (
                            <EmptyState text="No adoptions yet." />
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {adoptedPets.map(pet => <AdoptedCard key={pet.id} pet={pet} />)}
                            </div>
                        )}
                    </div>
                )}

                {/* ── TAB 5: SAVED ───────────────────────────────────────── */}
                {activeTab === 'saved' && (
                    <div>
                        <SectionLabel>Saved for later</SectionLabel>
                        {!isOwnProfile && savedIsPrivate ? <PrivateSection /> : savedPets.length === 0 ? (
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

                {/* ── TAB 6: SETTINGS (own profile only) ────────────────────── */}
                {activeTab === 'settings' && isOwnProfile && (
                    <div>
                        <SectionLabel>Privacy settings</SectionLabel>
                        <div style={{ fontFamily: sans, fontSize: 11, color: '#7A5C44', marginBottom: 28, maxWidth: 520 }}>
                            Control what visitors see when they browse your profile. These settings never affect your own view.
                        </div>

                        {/* ── Trust Bar ── */}
                        <div style={{ maxWidth: 520, marginBottom: 28 }}>
                            <div style={{ fontFamily: sans, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#C07A4A', fontWeight: 600, marginBottom: 4 }}>
                                Trust Bar stats
                            </div>
                            <div style={{ fontFamily: sans, fontSize: 11, color: '#9A7A60', marginBottom: 12 }}>
                                Visible at the bottom of your profile header.
                            </div>
                            <PrivacyToggle
                                label="Found homes"
                                description="How many animals you've helped find a home"
                                checked={privacySettings.showFoundHomes}
                                onChange={(val) => handlePrivacyChange('showFoundHomes', val)}
                            />
                            <PrivacyToggle
                                label="Success rate"
                                description="Percentage of your listings that found a home"
                                checked={privacySettings.showSuccessRate}
                                onChange={(val) => handlePrivacyChange('showSuccessRate', val)}
                            />
                            <PrivacyToggle
                                label="Avg response time"
                                description="How quickly you reply to messages"
                                checked={privacySettings.showAvgResponse}
                                onChange={(val) => handlePrivacyChange('showAvgResponse', val)}
                            />
                        </div>

                        {/* ── Tabs & content ── */}
                        <div style={{ maxWidth: 520, marginBottom: 28 }}>
                            <div style={{ fontFamily: sans, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#C07A4A', fontWeight: 600, marginBottom: 4 }}>
                                Tabs &amp; content
                            </div>
                            <div style={{ fontFamily: sans, fontSize: 11, color: '#9A7A60', marginBottom: 12 }}>
                                Control which tabs visitors can browse.
                            </div>
                            <PrivacyToggle
                                label="My uploads"
                                description="Active listings you've posted on Paws"
                                checked={privacySettings.showUploads}
                                onChange={(val) => handlePrivacyChange('showUploads', val)}
                            />
                            <PrivacyToggle
                                label="Found a home"
                                description="Animals you've uploaded that found their owner"
                                checked={privacySettings.showFoundAHome}
                                onChange={(val) => handlePrivacyChange('showFoundAHome', val)}
                            />
                            <PrivacyToggle
                                label="Adopted by me"
                                description="Animals you've adopted through Paws"
                                checked={privacySettings.showAdoptedByMe}
                                onChange={(val) => handlePrivacyChange('showAdoptedByMe', val)}
                            />
                            <PrivacyToggle
                                label="Saved animals"
                                description="Your bookmarked animal listings"
                                checked={privacySettings.showSaved}
                                onChange={(val) => handlePrivacyChange('showSaved', val)}
                            />
                        </div>

                        {/* ── Activity stats ── */}
                        <div style={{ maxWidth: 520 }}>
                            <div style={{ fontFamily: sans, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#C07A4A', fontWeight: 600, marginBottom: 4 }}>
                                Activity stats
                            </div>
                            <div style={{ fontFamily: sans, fontSize: 11, color: '#9A7A60', marginBottom: 12 }}>
                                Numbers shown in the Activity tab.
                            </div>
                            <PrivacyToggle
                                label="Messages received"
                                description="Total messages sent to you by other users"
                                checked={privacySettings.showMessagesReceived}
                                onChange={(val) => handlePrivacyChange('showMessagesReceived', val)}
                            />
                        </div>
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
