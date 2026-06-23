import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import LocationPicker from '../components/LocationPicker';
import { usePetStore } from '../store/petStore';
import { useAuthStore } from '../store/authStore';

const API   = 'http://localhost:5000/api';
const serif = "'Cormorant Garamond', serif";
const sans  = "'DM Sans', sans-serif";

const sentenceCase = str => str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';

const COAT_COLOR_OPTIONS  = ['Black', 'White', 'Brown', 'Tan / Fawn', 'Gray', 'Golden', 'Cream', 'Black & white', 'Brindle', 'Tricolor', 'Other'];
const COAT_TYPE_OPTIONS   = ['Short', 'Medium', 'Long', 'Curly', 'Wire-haired', 'Hairless', 'Unknown'];
const TRAITS              = ['Friendly', 'Playful', 'Calm', 'Affectionate', 'Gentle', 'Energetic', 'Curious', 'Loyal', 'Sociable', 'Independent', 'Shy', 'Good with kids', 'Good with dogs', 'Good with cats', 'House-trained'];
const AGE_OPTIONS         = ['Under 3 months', '3–12 months', '1–3 years', '3–7 years', 'Over 7 years', 'Unknown'];
const SIZE_OPTIONS        = ['Very small (under 5kg)', 'Small (5–10kg)', 'Medium (10–25kg)', 'Large (over 25kg)', 'Unknown'];
const FOUND_HOW_OPTIONS   = ['Found on the street', 'Appears to be lost', 'Went missing', 'Owner surrendered it', 'Rescued from danger', 'Other'];
const ANIMAL_STATUS_OPTIONS = ['Found / Stray', 'Needs urgent care', 'Vaccinated & healthy', 'Unknown'];
const ANIMAL_TYPE_OPTIONS = ['Dog', 'Cat', 'Rabbit', 'Bird', 'Fish', 'Hamster', 'Guinea pig', 'Reptile', 'Other'];

// ── Shared UI primitives ─────────────────────────────────────────────────────
function PillToggle({ options, value, onChange, large }) {
    return (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {options.map((opt) => {
                const active = value === opt;
                return (
                    <button key={opt} type="button" onClick={() => onChange(active ? '' : opt)}
                        style={{
                            fontFamily: sans, fontSize: large ? '12px' : '10px',
                            padding: large ? '6px 16px' : '4px 10px', borderRadius: '100px',
                            cursor: 'pointer',
                            border: `1px solid ${active ? '#2D1F14' : 'rgba(45,31,20,0.15)'}`,
                            background: active ? '#2D1F14' : 'transparent',
                            color: active ? '#FAF7F4' : '#7A5C44', transition: 'all 0.15s',
                        }}
                    >{opt}</button>
                );
            })}
        </div>
    );
}

function SectionLabel({ children }) {
    return (
        <div style={{ fontFamily: sans, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#C07A4A', fontWeight: 500, marginBottom: '14px' }}>
            {children}
        </div>
    );
}

function FieldLabel({ children }) {
    return (
        <div style={{ fontFamily: sans, fontSize: '11px', fontWeight: 500, color: '#2D1F14', marginBottom: '7px' }}>
            {children}
        </div>
    );
}

function SectionDivider() {
    return <div style={{ height: '1px', background: 'rgba(45,31,20,0.1)', margin: '24px 0' }} />;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function EditAnimalPage() {
    const { id }       = useParams();
    const navigate     = useNavigate();
    const location     = useLocation();
    const returnTo     = location.state?.from || null;
    const { user }     = useAuthStore();
    const { getPetById, clearSelectedPet } = usePetStore();

    const fileInputRef    = useRef(null);
    const descTextareaRef = useRef(null);

    // Loading / saving
    const [isLoading,  setIsLoading]  = useState(true);
    const [saving,     setSaving]     = useState(false);
    const [saveError,  setSaveError]  = useState('');

    // Step-1 fields
    const [foundHow,         setFoundHow]         = useState('');
    const [foundHowOther,    setFoundHowOther]    = useState('');
    const [animalType,       setAnimalType]       = useState('');
    const [animalTypeOther,  setAnimalTypeOther]  = useState('');
    const [animalStatus,     setAnimalStatus]     = useState('');
    const [hasMicrochip,     setHasMicrochip]     = useState('');
    const [isVaccinated,     setIsVaccinated]     = useState('');
    const [isNeutered,       setIsNeutered]       = useState('');
    const [approxAge,        setApproxAge]        = useState('');
    const [exactAge,         setExactAge]         = useState('');
    const [approxSize,       setApproxSize]       = useState('');
    const [exactWeight,      setExactWeight]      = useState('');
    const [coatColors,       setCoatColors]       = useState([]);
    const [coatColorOther,   setCoatColorOther]   = useState('');
    const [coatType,         setCoatType]         = useState('');
    const [breed,            setBreed]            = useState('');
    const [gender,           setGender]           = useState('');

    // Step-2 fields
    const [headline,         setHeadline]         = useState('');
    const [status,           setStatus]           = useState('');  // health_status pill
    const [description,      setDescription]      = useState('');
    const [descVersion,      setDescVersion]      = useState(0);
    const [locValue,         setLocValue]         = useState({ county: '', city: '', address: '', latitude: null, longitude: null });
    const [selectedTraits,   setSelectedTraits]   = useState([]);

    // Admin moderation
    const [moderationStatus, setModerationStatus] = useState('pending');

    // Photos
    const [existingPhotos,      setExistingPhotos]      = useState([]);
    const [newPreviews,         setNewPreviews]          = useState([]);
    const [deletePhotoConfirm,  setDeletePhotoConfirm]  = useState(null);

    // AI
    const [aiLoading,  setAiLoading]  = useState(false);
    const [aiGenerated,setAiGenerated]= useState(false);
    const [aiError,    setAiError]    = useState('');

    // CLIP
    const [clipLoading, setClipLoading] = useState(false);
    const [clipResults, setClipResults] = useState(null);
    const [clipError,   setClipError]   = useState('');
    const [clipApplied, setClipApplied] = useState(false);
    const [clipSelected,setClipSelected]= useState({});

    // ── Derived ────────────────────────────────────────────────────────────────
    const effectiveColors = [
        ...coatColors.filter(c => c !== 'Other'),
        ...(coatColors.includes('Other') && coatColorOther ? [coatColorOther] : []),
    ];
    const totalPhotos = existingPhotos.length + newPreviews.length;

    // ── Load on mount ──────────────────────────────────────────────────────────
    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            const result = await getPetById(id);
            if (!result?.success) { navigate('/'); return; }
            const p = result.pet;

            if (p.uploader_id && p.uploader_id !== user?._id && !user?.isAdmin) {
                toast.error('Not authorized');
                navigate('/');
                return;
            }

            try {
                const photoRes = await axios.get(`${API}/pets/${id}/photos`, { withCredentials: true });
                setExistingPhotos(photoRes.data.photos || []);
            } catch {
                setExistingPhotos(p.photos || []);
            }

            populate(p);
            setIsLoading(false);
        };
        load();
        return () => clearSelectedPet();
    }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Populate all state from pet object ─────────────────────────────────────
    const populate = (p) => {
        // Headline
        setHeadline(p.name || '');

        // Type
        const typeMap = { dog: 'Dog', cat: 'Cat', rabbit: 'Rabbit', bird: 'Bird', fish: 'Fish', hamster: 'Hamster', 'guinea pig': 'Guinea pig', reptile: 'Reptile' };
        const mappedType = typeMap[(p.type || '').toLowerCase()] || 'Other';
        setAnimalType(mappedType);
        if (mappedType === 'Other') setAnimalTypeOther(p.type || '');

        // Found how
        const fh = p.found_how || '';
        if (FOUND_HOW_OPTIONS.includes(fh)) { setFoundHow(fh); }
        else if (fh) { setFoundHow('Other'); setFoundHowOther(fh); }

        // Health status → both status pill and animalStatus
        const hsRev = { Vaccinated: 'Vaccinated & healthy', Urgent: 'Needs urgent care', Found: 'Found / Stray' };
        setStatus(p.health_status || '');
        setAnimalStatus(hsRev[p.health_status] || '');
        setHasMicrochip('');
        setIsVaccinated('');
        setIsNeutered('');

        // Age
        const age = p.age_category || '';
        if (AGE_OPTIONS.includes(age)) { setApproxAge(age); setExactAge(''); }
        else { setExactAge(age); setApproxAge(''); }

        // Size
        const sz = p.size || '';
        if (sz.includes(' — ')) {
            const [sp, wp] = sz.split(' — ');
            setApproxSize(sp.trim()); setExactWeight(wp.trim());
        } else if (SIZE_OPTIONS.includes(sz)) { setApproxSize(sz); setExactWeight(''); }
        else { setExactWeight(sz); setApproxSize(''); }

        // Coat colors
        const colorStr = p.color || '';
        if (colorStr) {
            const parts  = colorStr.split(', ').map(c => c.trim());
            const known  = parts.filter(c => COAT_COLOR_OPTIONS.includes(c));
            const others = parts.filter(c => !COAT_COLOR_OPTIONS.includes(c));
            if (others.length) { known.push('Other'); setCoatColorOther(others.join(', ')); }
            setCoatColors(known);
        }

        // Coat type
        setCoatType(COAT_TYPE_OPTIONS.includes(p.coat) ? (p.coat || '') : '');

        // Breed
        setBreed(p.breed || '');

        // Gender
        const gMap = { male: 'Male', female: 'Female', unknown: 'Unknown' };
        setGender(gMap[(p.gender || '').toLowerCase()] || '');

        // Description
        setDescription(p.description || '');

        // Location
        setLocValue({
            county:    '',
            city:      p.location_city    || '',
            address:   p.location_address || '',
            latitude:  p.latitude  ? parseFloat(p.latitude)  : null,
            longitude: p.longitude ? parseFloat(p.longitude) : null,
        });

        // Traits
        const rawTraits = Array.isArray(p.traits) ? p.traits : (p.traits ? [p.traits] : []);
        setSelectedTraits(rawTraits.filter(t => TRAITS.includes(t)));

        // Moderation status (admin only)
        setModerationStatus(p.status || 'pending');
    };

    // ── Photo handlers ─────────────────────────────────────────────────────────
    const handleDeleteExistingPhoto = (photoId) => setDeletePhotoConfirm(photoId);

    const confirmDeletePhoto = async () => {
        if (!deletePhotoConfirm) return;
        try {
            await axios.delete(`${API}/pets/${id}/photos/${deletePhotoConfirm}`, { withCredentials: true });
            setExistingPhotos(prev => prev.filter(p => p.id !== deletePhotoConfirm));
        } catch {
            toast.error('Failed to delete photo');
        } finally {
            setDeletePhotoConfirm(null);
        }
    };

    const handleAddPhotos = (files) => {
        const canAdd = 5 - totalPhotos;
        if (canAdd <= 0) return;
        const chosen = Array.from(files).slice(0, canAdd);
        setNewPreviews(prev => [...prev, ...chosen.map(f => ({ url: URL.createObjectURL(f), file: f }))]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeNewPreview = (idx) => {
        setNewPreviews(prev => {
            URL.revokeObjectURL(prev[idx].url);
            if (idx === 0) { setClipResults(null); setClipError(''); setClipApplied(false); }
            return prev.filter((_, i) => i !== idx);
        });
    };

    // ── AI description ─────────────────────────────────────────────────────────
    const handleAiGenerate = async () => {
        const actualFoundHow = foundHow === 'Other' ? foundHowOther : foundHow;
        const actualType     = animalType === 'Other' ? animalTypeOther : animalType;
        setAiLoading(true); setAiError(''); setAiGenerated(false);
        try {
            const res = await axios.post(`${API}/ai/generate-description`, {
                type:       actualType || animalType,
                status:     animalStatus,
                age:        exactAge || approxAge,
                size:       exactWeight ? `${exactWeight}${approxSize ? ` (${approxSize})` : ''}` : approxSize,
                vaccinated: isVaccinated,
                neutered:   isNeutered,
                microchip:  hasMicrochip,
                foundHow:   actualFoundHow || foundHow,
                breed, color: effectiveColors.join(', '), coat: coatType,
                gender:     gender || '',
                city:       locValue.city || locValue.county || '',
                traits:     selectedTraits,
            }, { withCredentials: true });
            setDescription(res.data.description || '');
            setDescVersion(v => v + 1);
            if (descTextareaRef.current) descTextareaRef.current.value = res.data.description || '';
            setAiGenerated(true);
        } catch {
            setAiError('AI unavailable — please write manually');
        } finally {
            setAiLoading(false);
        }
    };

    // ── CLIP analysis ──────────────────────────────────────────────────────────
    const handleClipAnalyse = async () => {
        const photo = newPreviews[0];
        if (!photo) return;
        setClipLoading(true); setClipError(''); setClipApplied(false);
        try {
            const canvas = document.createElement('canvas');
            const img = new window.Image();
            img.src = photo.url;
            await new Promise(resolve => { img.onload = resolve; });
            canvas.width = img.width; canvas.height = img.height;
            canvas.getContext('2d').drawImage(img, 0, 0);
            const base64 = canvas.toDataURL('image/jpeg', 0.8);
            const res = await axios.post(`${API}/ai/analyse-image`, { image: base64 }, { withCredentials: true });
            if (res.data.success) {
                const summary = res.data.summary || {};
                setClipResults(summary);
                const sel = {};
                Object.entries(summary).forEach(([k, v]) => { if (v && k !== 'species_confidence') sel[k] = true; });
                setClipSelected(sel);
            }
        } catch {
            setClipError('Analysis unavailable — please fill in manually');
        } finally {
            setClipLoading(false);
        }
    };

    const applyClipResults = () => {
        if (!clipResults) return;
        if (clipSelected.type && clipResults.type) {
            const tm = { dog: 'Dog', cat: 'Cat', rabbit: 'Rabbit', bird: 'Bird', fish: 'Fish', hamster: 'Hamster', 'guinea pig': 'Guinea pig', reptile: 'Reptile', other: 'Other' };
            setAnimalType(tm[clipResults.type.toLowerCase()] || 'Other');
            if (!tm[clipResults.type.toLowerCase()]) setAnimalTypeOther(sentenceCase(clipResults.type));
        }
        if (clipSelected.size  && clipResults.size)  setApproxSize(clipResults.size);
        if (clipSelected.age   && clipResults.age)   setApproxAge(clipResults.age);
        if (clipSelected.breed && clipResults.breed) setBreed(sentenceCase(clipResults.breed));
        if (clipSelected.color && clipResults.color) setCoatColors([sentenceCase(clipResults.color)]);
        if (clipSelected.fur   && clipResults.fur)   setCoatType(sentenceCase(clipResults.fur));
        setClipApplied(true);
    };

    // ── Submit ─────────────────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!headline.trim()) { setSaveError('Please add a headline.'); return; }
        setSaveError(''); setSaving(true);
        try {
            const actualType     = animalType === 'Other' ? animalTypeOther : animalType;
            const actualFoundHow = foundHow   === 'Other' ? foundHowOther   : foundHow;

            const payload = {
                name:             headline.trim(),
                type:             actualType.toLowerCase(),
                breed:            breed || '',
                age_category:     exactAge || approxAge || '',
                size:             exactWeight ? `${approxSize ? `${approxSize} — ` : ''}${exactWeight}` : (approxSize || ''),
                color:            effectiveColors.join(', ') || '',
                coat:             coatType || '',
                gender:           gender.toLowerCase() || '',
                description:      description.trim(),
                traits:           selectedTraits,
                health_status:    status || '',
                location_address: locValue.address || '',
                location_city:    locValue.city || locValue.county || '',
                latitude:         locValue.latitude  ?? null,
                longitude:        locValue.longitude ?? null,
                found_how:        actualFoundHow || '',
            };

            if (user?.isAdmin) payload.status = moderationStatus;

            await axios.patch(`${API}/pets/${id}`, payload, { withCredentials: true });

            for (const preview of newPreviews) {
                const form = new FormData();
                form.append('photo', preview.file);
                await axios.post(`${API}/pets/${id}/photos`, form, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    withCredentials: true,
                });
            }

            toast.success('Listing updated!');
            navigate(returnTo || `/pet/${id}`);
        } catch (err) {
            setSaveError(err.response?.data?.message || 'Failed to save changes.');
        } finally {
            setSaving(false);
        }
    };

    // ── Guards ─────────────────────────────────────────────────────────────────
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

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <>
            {/* Delete photo confirmation modal */}
            {deletePhotoConfirm && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(45,31,20,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
                    <div style={{ background: '#FAF7F4', borderRadius: '6px', padding: '28px 32px', maxWidth: '360px', width: '100%', textAlign: 'center' }}>
                        <div style={{ fontFamily: serif, fontSize: '20px', fontWeight: 700, color: '#2D1F14', marginBottom: '10px' }}>Delete this photo?</div>
                        <div style={{ fontFamily: sans, fontSize: '13px', color: '#7A5C44', marginBottom: '24px' }}>This cannot be undone.</div>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button type="button" onClick={() => setDeletePhotoConfirm(null)}
                                style={{ fontFamily: sans, fontSize: '12px', padding: '8px 20px', borderRadius: '100px', border: '1px solid rgba(45,31,20,0.2)', background: 'transparent', color: '#7A5C44', cursor: 'pointer' }}>
                                Cancel
                            </button>
                            <button type="button" onClick={confirmDeletePhoto}
                                style={{ fontFamily: sans, fontSize: '12px', fontWeight: 500, padding: '8px 20px', borderRadius: '100px', border: 'none', background: '#993C1D', color: '#FAF7F4', cursor: 'pointer' }}>
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ position: 'fixed', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', backgroundColor: '#FAF7F4', overflowY: 'auto' }}>
                <Navbar />

                <form onSubmit={handleSubmit} style={{ maxWidth: '680px', margin: '0 auto', padding: '36px 48px 80px', width: '100%', boxSizing: 'border-box' }}>

                    {/* Cancel */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                        <button type="button" onClick={() => navigate(-1)}
                            style={{ fontFamily: sans, fontSize: '11px', color: '#9A7A60', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#C07A4A'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = '#9A7A60'; }}
                        >
                            ✕ Cancel
                        </button>
                    </div>

                    {/* Masthead */}
                    <div style={{ textAlign: 'center', paddingBottom: '24px', borderBottom: '3px double rgba(45,31,20,0.15)', marginBottom: '32px' }}>
                        <div style={{ fontFamily: sans, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#C07A4A', fontWeight: 500, marginBottom: '10px' }}>
                            The Paws Daily · Edit listing
                        </div>
                        <input
                            type="text"
                            value={headline}
                            onChange={e => setHeadline(e.target.value)}
                            style={{
                                fontFamily: serif, fontSize: '36px', fontWeight: 700,
                                color: '#2D1F14', border: 'none',
                                borderBottom: '2px solid rgba(45,31,20,0.12)',
                                background: 'none', outline: 'none',
                                width: '100%', boxSizing: 'border-box',
                                padding: '4px 0', textAlign: 'center',
                            }}
                        />
                    </div>

                    {/* ── WHEREABOUTS & SITUATION ─────────────────────────── */}
                    <SectionLabel>Whereabouts &amp; situation</SectionLabel>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>

                        <div>
                            <FieldLabel>What's this animal's situation?</FieldLabel>
                            <PillToggle large options={FOUND_HOW_OPTIONS} value={foundHow} onChange={setFoundHow} />
                            {foundHow === 'Other' && (
                                <input type="text" placeholder="Please describe…" value={foundHowOther} onChange={e => setFoundHowOther(e.target.value)} autoFocus
                                    style={{ width: '100%', marginTop: '10px', border: 'none', borderBottom: '1px solid rgba(45,31,20,0.2)', background: 'transparent', fontFamily: sans, fontSize: '13px', color: '#2D1F14', padding: '6px 0', outline: 'none', boxSizing: 'border-box' }} />
                            )}
                        </div>

                        <div>
                            <FieldLabel>Current status</FieldLabel>
                            <PillToggle large options={ANIMAL_STATUS_OPTIONS} value={animalStatus} onChange={setAnimalStatus} />
                        </div>

                    </div>

                    <SectionDivider />

                    {/* ── HEALTH ──────────────────────────────────────────── */}
                    <SectionLabel>Health</SectionLabel>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
                        <div>
                            <FieldLabel>Microchip</FieldLabel>
                            <PillToggle large options={['Yes', 'No', "Don't know"]} value={hasMicrochip} onChange={setHasMicrochip} />
                        </div>
                        <div>
                            <FieldLabel>Neutered / spayed</FieldLabel>
                            <PillToggle large options={['Yes', 'No', "Don't know"]} value={isNeutered} onChange={setIsNeutered} />
                        </div>
                        <div>
                            <FieldLabel>Vaccinated</FieldLabel>
                            <PillToggle large options={['Yes, fully', 'Partially', 'No', "Don't know"]} value={isVaccinated} onChange={setIsVaccinated} />
                        </div>
                    </div>

                    <SectionDivider />

                    {/* ── APPEARANCE ──────────────────────────────────────── */}
                    <SectionLabel>Appearance</SectionLabel>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>

                        <div>
                            <FieldLabel>Gender</FieldLabel>
                            <PillToggle large options={['Male', 'Female', 'Unknown']} value={gender} onChange={setGender} />
                        </div>

                        <div>
                            <FieldLabel>Age</FieldLabel>
                            <PillToggle large options={AGE_OPTIONS} value={approxAge}
                                onChange={v => { setApproxAge(v); if (v) setExactAge(''); }} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '12px 0 0' }}>
                                <div style={{ flex: 1, height: '1px', background: 'rgba(45,31,20,0.1)' }} />
                                <span style={{ fontFamily: sans, fontSize: '10px', color: '#B09880', whiteSpace: 'nowrap' }}>or enter exact age</span>
                                <div style={{ flex: 1, height: '1px', background: 'rgba(45,31,20,0.1)' }} />
                            </div>
                            <input type="text" placeholder="e.g. 2 years, 4 months" value={exactAge}
                                onChange={e => { setExactAge(e.target.value); if (e.target.value) setApproxAge(''); }}
                                style={{ width: '100%', marginTop: '8px', border: 'none', borderBottom: '1px solid rgba(45,31,20,0.2)', background: 'transparent', fontFamily: sans, fontSize: '13px', color: '#2D1F14', padding: '6px 0', outline: 'none', boxSizing: 'border-box' }} />
                        </div>

                        <div>
                            <FieldLabel>Size</FieldLabel>
                            <PillToggle large options={SIZE_OPTIONS} value={approxSize} onChange={setApproxSize} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '12px 0 0' }}>
                                <div style={{ flex: 1, height: '1px', background: 'rgba(45,31,20,0.1)' }} />
                                <span style={{ fontFamily: sans, fontSize: '10px', color: '#B09880', whiteSpace: 'nowrap' }}>or enter exact weight</span>
                                <div style={{ flex: 1, height: '1px', background: 'rgba(45,31,20,0.1)' }} />
                            </div>
                            <input type="text" placeholder="e.g. 14 kg" value={exactWeight} onChange={e => setExactWeight(e.target.value)}
                                style={{ width: '100%', marginTop: '8px', border: 'none', borderBottom: '1px solid rgba(45,31,20,0.2)', background: 'transparent', fontFamily: sans, fontSize: '13px', color: '#2D1F14', padding: '6px 0', outline: 'none', boxSizing: 'border-box' }} />
                        </div>

                        <div>
                            <FieldLabel>Coat color <span style={{ fontFamily: sans, fontSize: '10px', fontWeight: 400, color: '#B09880' }}>— select all that apply</span></FieldLabel>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {COAT_COLOR_OPTIONS.map(c => {
                                    const active = coatColors.includes(c);
                                    return (
                                        <button key={c} type="button"
                                            onClick={() => setCoatColors(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])}
                                            style={{ fontFamily: sans, fontSize: '12px', padding: '6px 16px', borderRadius: '100px', cursor: 'pointer', border: `1px solid ${active ? '#2D1F14' : 'rgba(45,31,20,0.15)'}`, background: active ? '#2D1F14' : 'transparent', color: active ? '#FAF7F4' : '#7A5C44', transition: 'all 0.15s' }}>
                                            {c}
                                        </button>
                                    );
                                })}
                            </div>
                            {coatColors.includes('Other') && (
                                <input type="text" placeholder="Describe the coat color…" value={coatColorOther} onChange={e => setCoatColorOther(e.target.value)}
                                    style={{ width: '100%', marginTop: '10px', border: 'none', borderBottom: '1px solid rgba(45,31,20,0.2)', background: 'transparent', fontFamily: sans, fontSize: '13px', color: '#2D1F14', padding: '6px 0', outline: 'none', boxSizing: 'border-box' }} />
                            )}
                        </div>

                        <div>
                            <FieldLabel>Coat type</FieldLabel>
                            <PillToggle large options={COAT_TYPE_OPTIONS} value={coatType} onChange={setCoatType} />
                        </div>

                        <div>
                            <FieldLabel>Breed (if known)</FieldLabel>
                            <input type="text" placeholder="e.g. Labrador mix, unknown" value={breed} onChange={e => setBreed(e.target.value)}
                                style={{ width: '100%', border: 'none', borderBottom: '1px solid rgba(45,31,20,0.2)', background: 'transparent', fontFamily: sans, fontSize: '13px', color: '#2D1F14', padding: '6px 0', outline: 'none', boxSizing: 'border-box' }} />
                        </div>

                    </div>

                    <SectionDivider />

                    {/* ── LOCATION ────────────────────────────────────────── */}
                    <SectionLabel>Location</SectionLabel>
                    <div style={{ marginBottom: '24px' }}>
                        <LocationPicker value={locValue} onChange={setLocValue} />
                    </div>

                    <SectionDivider />

                    {/* ── PHOTOS ──────────────────────────────────────────── */}
                    <div style={{ marginBottom: '32px' }}>
                        <SectionLabel>Photos</SectionLabel>

                        {/* Existing photos */}
                        {existingPhotos.length > 0 && (
                            <div style={{ marginBottom: '12px' }}>
                                <div style={{ fontFamily: sans, fontSize: '10px', color: '#B09880', marginBottom: '8px' }}>Current photos</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                    {existingPhotos.map((photo) => (
                                        <div key={photo.id} style={{ position: 'relative', flexShrink: 0 }}>
                                            <img
                                                src={`${API}/pets/photos/${photo.id}`}
                                                alt=""
                                                style={{
                                                    width: photo.is_primary ? '120px' : '80px',
                                                    height: photo.is_primary ? '90px' : '80px',
                                                    objectFit: 'cover', borderRadius: '3px',
                                                    border: photo.is_primary ? '2px solid #C07A4A' : '1px solid rgba(45,31,20,0.1)',
                                                    display: 'block',
                                                }}
                                                onError={e => { e.target.style.display = 'none'; }}
                                            />
                                            {photo.is_primary && (
                                                <div style={{ position: 'absolute', bottom: '4px', left: '4px', fontFamily: sans, fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#FAF7F4', background: '#C07A4A', padding: '2px 5px', borderRadius: '2px' }}>Lead</div>
                                            )}
                                            <button type="button" onClick={() => handleDeleteExistingPhoto(photo.id)}
                                                style={{ position: 'absolute', top: '-6px', right: '-6px', width: '18px', height: '18px', borderRadius: '50%', background: '#2D1F14', color: '#FAF7F4', border: 'none', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* New previews */}
                        {newPreviews.length > 0 && (
                            <div style={{ marginBottom: '10px' }}>
                                <div style={{ fontFamily: sans, fontSize: '10px', color: '#B09880', marginBottom: '8px' }}>New photos (not yet saved)</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'flex-start' }}>
                                    {newPreviews.map((p, i) => (
                                        <div key={i} style={{ position: 'relative', flexShrink: 0 }}>
                                            <img src={p.url} alt="" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '3px', border: '1px solid rgba(45,31,20,0.1)', display: 'block' }} />
                                            <button type="button" onClick={() => removeNewPreview(i)}
                                                style={{ position: 'absolute', top: '-6px', right: '-6px', width: '16px', height: '16px', borderRadius: '50%', background: '#993C1D', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* CLIP — only when there is a new lead preview */}
                                <button type="button" onClick={handleClipAnalyse} disabled={clipLoading}
                                    style={{ marginTop: '10px', fontFamily: sans, fontSize: '11px', fontWeight: 500, background: 'rgba(192,122,74,0.1)', border: '1px solid rgba(192,122,74,0.25)', color: '#8B4E28', borderRadius: '100px', padding: '5px 14px', cursor: clipLoading ? 'default' : 'pointer', opacity: clipLoading ? 0.7 : 1 }}>
                                    {clipLoading ? '🔍 Analysing...' : '🔍 Analyse with AI'}
                                </button>
                                {clipError && <div style={{ fontFamily: sans, fontSize: '11px', color: '#993C1D', marginTop: '6px' }}>{clipError}</div>}

                                {clipResults && (
                                    <div style={{ marginTop: '10px', background: 'rgba(192,122,74,0.05)', border: '1px solid rgba(192,122,74,0.15)', borderRadius: '6px', padding: '14px 16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                            <div style={{ fontFamily: sans, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#C07A4A', fontWeight: 500 }}>AI detected · tap to select</div>
                                            {clipApplied && <div style={{ fontFamily: sans, fontSize: '10px', color: '#0F6E56' }}>✓ Applied to your listing</div>}
                                        </div>
                                        <div style={{ fontFamily: sans, fontSize: '10px', color: '#9A7A60', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <span>⚠️</span> Results may not always be accurate — review before applying.
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                                            {[{ key: 'breed', label: 'Breed' }, { key: 'color', label: 'Color' }, { key: 'fur', label: 'Coat' }, { key: 'age', label: 'Age' }, { key: 'size', label: 'Size' }, { key: 'type', label: 'Type' }].map(({ key, label }) => {
                                                const val = clipResults[key];
                                                if (!val) return null;
                                                const active = !!clipSelected[key];
                                                return (
                                                    <button key={key} type="button"
                                                        onClick={() => { setClipSelected(prev => ({ ...prev, [key]: !prev[key] })); setClipApplied(false); }}
                                                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '3px', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', border: `1.5px solid ${active ? '#2D1F14' : 'rgba(45,31,20,0.15)'}`, background: active ? '#2D1F14' : '#fff', transition: 'all 0.15s', textAlign: 'left' }}>
                                                        <span style={{ fontFamily: sans, fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600, color: active ? 'rgba(250,247,244,0.55)' : '#C07A4A' }}>{label}</span>
                                                        <span style={{ fontFamily: sans, fontSize: '12px', fontWeight: 500, color: active ? '#FAF7F4' : '#2D1F14' }}>{sentenceCase(val)}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <button type="button" onClick={applyClipResults}
                                            style={{ fontFamily: sans, fontSize: '11px', fontWeight: 500, background: '#2D1F14', color: '#FAF7F4', border: 'none', borderRadius: '100px', padding: '6px 16px', cursor: 'pointer' }}>
                                            Apply selected →
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Add photo button */}
                        {totalPhotos < 5 && (
                            <button type="button" onClick={() => fileInputRef.current?.click()}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: sans, fontSize: '11px', color: '#7A5C44', background: 'none', border: '1px dashed rgba(45,31,20,0.2)', borderRadius: '3px', padding: '8px 16px', cursor: 'pointer', transition: 'border-color 0.15s' }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = '#C07A4A'; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(45,31,20,0.2)'; }}
                            >
                                <span style={{ fontSize: '16px', lineHeight: 1 }}>+</span> Add photo {totalPhotos > 0 ? `(${totalPhotos}/5)` : ''}
                            </button>
                        )}
                        {totalPhotos >= 5 && (
                            <div style={{ fontFamily: sans, fontSize: '11px', color: '#B09880' }}>Maximum 5 photos reached.</div>
                        )}
                        <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => handleAddPhotos(e.target.files)} />
                    </div>

                    {/* ── PERSONALITY TRAITS ──────────────────────────────── */}
                    <div style={{ marginBottom: '28px' }}>
                        <SectionLabel>Personality traits <span style={{ color: '#B09880', textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>— optional, used by AI</span></SectionLabel>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                            {TRAITS.map(t => {
                                const active = selectedTraits.includes(t);
                                return (
                                    <button key={t} type="button"
                                        onClick={() => setSelectedTraits(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])}
                                        style={{ fontFamily: sans, fontSize: '12px', fontWeight: active ? 500 : 400, padding: '5px 13px', borderRadius: '100px', border: `1.5px solid ${active ? '#C07A4A' : 'rgba(45,31,20,0.18)'}`, background: active ? '#C07A4A' : 'transparent', color: active ? '#FAF7F4' : '#7A5C44', cursor: 'pointer', transition: 'background 0.13s, border-color 0.13s, color 0.13s' }}>
                                        {t}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── DESCRIPTION ─────────────────────────────────────── */}
                    <div style={{ marginBottom: '28px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                            <SectionLabel style={{ marginBottom: 0 }}>Description</SectionLabel>
                            <button type="button" onClick={handleAiGenerate} disabled={aiLoading}
                                style={{ fontFamily: sans, fontSize: '11px', fontWeight: 500, background: 'rgba(192,122,74,0.1)', border: '1px solid rgba(192,122,74,0.25)', color: '#8B4E28', borderRadius: '100px', padding: '4px 12px', cursor: aiLoading ? 'default' : 'pointer', opacity: aiLoading ? 0.7 : 1, transition: 'opacity 0.15s' }}>
                                {aiLoading ? 'Generating...' : aiGenerated ? '✓ Regenerate' : '✨ Generate with AI'}
                            </button>
                            {aiGenerated && <span style={{ fontFamily: sans, fontSize: '10px', color: '#0F6E56' }}>✓ AI-generated — feel free to edit</span>}
                            {aiError && <span style={{ fontFamily: sans, fontSize: '10px', color: '#993C1D' }}>{aiError}</span>}
                        </div>
                        <textarea
                            key={descVersion}
                            ref={descTextareaRef}
                            value={description}
                            onChange={e => { setDescription(e.target.value); if (aiGenerated) setAiGenerated(false); }}
                            placeholder="Tell this animal's story…"
                            style={{ fontFamily: serif, fontSize: '16px', lineHeight: 1.8, color: '#2D1F14', border: 'none', background: 'none', outline: 'none', width: '100%', boxSizing: 'border-box', minHeight: '140px', resize: 'vertical' }}
                        />
                        <div style={{ height: '1px', backgroundColor: 'rgba(45,31,20,0.1)' }} />
                    </div>

                    {/* ── TYPE + HEALTH STATUS ─────────────────────────────── */}
                    <div style={{ marginTop: '20px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: sans, fontSize: '9px', color: '#B09880', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Type:</span>
                        <PillToggle options={ANIMAL_TYPE_OPTIONS} value={animalType} onChange={setAnimalType} />
                        <span style={{ color: '#D4C4B8', fontSize: '14px' }}>·</span>
                        <span style={{ fontFamily: sans, fontSize: '9px', color: '#B09880', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Status:</span>
                        <PillToggle options={['Found', 'Urgent', 'Vaccinated']} value={status} onChange={setStatus} />
                    </div>
                    {animalType === 'Other' && (
                        <input type="text" placeholder="Specify animal type…" value={animalTypeOther} onChange={e => setAnimalTypeOther(e.target.value)}
                            style={{ width: '100%', marginBottom: '12px', border: 'none', borderBottom: '1px solid rgba(45,31,20,0.2)', background: 'transparent', fontFamily: sans, fontSize: '13px', color: '#2D1F14', padding: '6px 0', outline: 'none', boxSizing: 'border-box' }} />
                    )}

                    <SectionDivider />

                    {/* ── MODERATION STATUS (admin only) ───────────────────── */}
                    {user?.isAdmin && (
                        <>
                            <SectionLabel>Moderation status <span style={{ color: '#B09880', textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>— admin only</span></SectionLabel>
                            <div style={{ marginBottom: '24px' }}>
                                <PillToggle large
                                    options={['pending', 'approved', 'rejected']}
                                    value={moderationStatus}
                                    onChange={v => { if (v) setModerationStatus(v); }}
                                />
                            </div>
                            <SectionDivider />
                        </>
                    )}

                    {/* ── SAVE ────────────────────────────────────────────── */}
                    {saveError && (
                        <div style={{ fontFamily: sans, fontSize: '13px', color: '#993C1D', background: 'rgba(153,60,29,0.08)', border: '1px solid rgba(153,60,29,0.2)', borderRadius: '4px', padding: '12px 16px', marginBottom: '16px', textAlign: 'center' }}>
                            {saveError}
                        </div>
                    )}
                    <button type="submit" disabled={saving}
                        style={{ width: '100%', backgroundColor: saving ? '#7A5C44' : '#2D1F14', color: '#FAF7F4', padding: '14px', fontSize: '15px', fontFamily: serif, fontStyle: 'italic', border: 'none', borderRadius: '2px', cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1, transition: 'background-color 0.15s' }}
                        onMouseEnter={e => { if (!saving) e.currentTarget.style.backgroundColor = '#3D2B1A'; }}
                        onMouseLeave={e => { if (!saving) e.currentTarget.style.backgroundColor = '#2D1F14'; }}
                    >
                        {saving ? 'Saving…' : 'Save changes →'}
                    </button>

                </form>
            </div>
        </>
    );
}
