import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';

const API   = 'http://localhost:5000/api';
const serif = "'Cormorant Garamond', serif";
const sans  = "'DM Sans', sans-serif";

const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

// ── Pill toggle (shared by both steps) ───────────────────────────────────────
function PillToggle({ options, value, onChange, large }) {
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
                            fontFamily: sans,
                            fontSize: large ? '12px' : '10px',
                            padding: large ? '6px 16px' : '4px 10px',
                            borderRadius: '100px',
                            cursor: 'pointer',
                            border: `1px solid ${active ? '#2D1F14' : 'rgba(45,31,20,0.15)'}`,
                            transition: 'all 0.15s',
                            background: active ? '#2D1F14' : 'transparent',
                            color: active ? '#FAF7F4' : '#7A5C44',
                        }}
                    >
                        {opt}
                    </button>
                );
            })}
        </div>
    );
}

// ── Step indicator ────────────────────────────────────────────────────────────
function StepIndicator({ step }) {
    const steps = [
        { n: 1, label: 'Quick questions' },
        { n: 2, label: 'Your listing' },
    ];
    return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '16px', padding: '16px 0',
            borderBottom: '1px solid rgba(45,31,20,0.08)',
        }}>
            {steps.map((s, i) => {
                const active = step === s.n;
                return (
                    <React.Fragment key={s.n}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                                width: '24px', height: '24px', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0,
                                background: active ? '#2D1F14' : 'transparent',
                                border: `1.5px solid ${active ? '#2D1F14' : 'rgba(45,31,20,0.2)'}`,
                                fontFamily: sans, fontSize: '11px', fontWeight: 600,
                                color: active ? '#FAF7F4' : 'rgba(45,31,20,0.35)',
                                transition: 'all 0.2s',
                            }}>
                                {s.n}
                            </div>
                            <span style={{
                                fontFamily: sans, fontSize: '11px',
                                fontWeight: active ? 600 : 400,
                                color: active ? '#2D1F14' : 'rgba(45,31,20,0.4)',
                            }}>
                                {s.label}
                            </span>
                        </div>
                        {i < steps.length - 1 && (
                            <div style={{ width: '40px', height: '1px', background: 'rgba(45,31,20,0.15)', flexShrink: 0 }} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}

// ── Question card ─────────────────────────────────────────────────────────────
function QuestionCard({ label, children }) {
    return (
        <div style={{
            background: '#fff',
            border: '1px solid rgba(45,31,20,0.1)',
            borderRadius: '4px',
            padding: '20px 24px',
            marginBottom: '14px',
        }}>
            <div style={{
                fontFamily: sans, fontSize: '13px', fontWeight: 500,
                color: '#2D1F14', marginBottom: '10px',
            }}>
                {label}
            </div>
            {children}
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AddAnimalPage() {
    const navigate = useNavigate();
    const fileInputRef    = useRef(null);
    const descTextareaRef = useRef(null);

    // ── Step state ────────────────────────────────────────────────────────────
    const [step, setStep] = useState(1);

    // ── Step 1 state ──────────────────────────────────────────────────────────
    const [foundHow,       setFoundHow]       = useState('');
    const [foundHowOther,  setFoundHowOther]  = useState('');
    const [animalType,     setAnimalType]     = useState('');
    const [animalTypeOther, setAnimalTypeOther] = useState('');
    const [animalStatus, setAnimalStatus] = useState('');
    const [hasMicrochip, setHasMicrochip] = useState('');
    const [isVaccinated, setIsVaccinated] = useState('');
    const [isNeutered,   setIsNeutered]   = useState('');
    const [approxAge,    setApproxAge]    = useState('');
    const [approxSize,   setApproxSize]   = useState('');

    // ── Step 2 state ──────────────────────────────────────────────────────────
    const [headline,    setHeadline]    = useState('');
    const [previews,    setPreviews]    = useState([]);   // { url, file }[]
    const [caption,     setCaption]     = useState('');
    const [status,      setStatus]      = useState('');
    const [description, setDescription] = useState('');
    const [descVersion, setDescVersion] = useState(0);
    const [location,    setLocation]    = useState('');
    const [contact,     setContact]     = useState('');
    const [agreed,      setAgreed]      = useState(false);
    const [errors,      setErrors]      = useState({});
    const [submitting,  setSubmitting]  = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [publishedId, setPublishedId] = useState(null);

    // ── AI generation state ───────────────────────────────────────────────────
    const [aiLoading,   setAiLoading]   = useState(false);
    const [aiGenerated, setAiGenerated] = useState(false);
    const [aiError,     setAiError]     = useState('');

    // ── CLIP analysis state ───────────────────────────────────────────────────
    const [clipLoading, setClipLoading] = useState(false);
    const [clipResults, setClipResults] = useState(null);
    const [clipError,   setClipError]   = useState('');

    // ── Map step 1 answers → step 2 defaults when advancing ──────────────────
    const handleContinue = () => {
        const actualFoundHow = foundHow === 'Other' ? foundHowOther : foundHow;
        const actualType     = animalType === 'Other' ? animalTypeOther : animalType;

        // Pre-populate status pill
        const statusMap = {
            'Vaccinated & healthy': 'Vaccinated',
            'Needs urgent care':    'Urgent',
            'Found / Stray':        'Found',
        };
        setStatus(statusMap[animalStatus] || '');

        // Pre-populate clean readable description
        const summaryParts = [];
        if (actualFoundHow) summaryParts.push(`Found ${actualFoundHow.toLowerCase()}.`);
        if (approxAge && approxAge !== 'Unknown') summaryParts.push(`Approximately ${approxAge.toLowerCase()} old.`);
        if (approxSize && approxSize !== 'Unknown') summaryParts.push(`Size: ${approxSize}.`);

        const healthParts = [];
        if (isVaccinated && isVaccinated !== "Don't know") healthParts.push(`Vaccinated: ${isVaccinated.toLowerCase()}`);
        if (isNeutered   && isNeutered   !== "Don't know") healthParts.push(`Neutered: ${isNeutered.toLowerCase()}`);
        if (hasMicrochip && hasMicrochip !== "Don't know") healthParts.push(`Microchip: ${hasMicrochip.toLowerCase()}`);
        if (healthParts.length > 0) summaryParts.push(healthParts.join(', ') + '.');

        summaryParts.push("Please add more details about the animal's temperament and appearance.");
        setDescription(summaryParts.join(' '));

        console.log('Continuing to step 2 with:', { animalType, status: statusMap[animalStatus] });

        setStep(2);
    };

    // ── AI description generation ─────────────────────────────────────────────
    const handleAiGenerate = async () => {
        const actualFoundHow = foundHow === 'Other' ? foundHowOther : foundHow;
        const actualType     = animalType === 'Other' ? animalTypeOther : animalType;
        setAiLoading(true);
        setAiError('');
        setAiGenerated(false);
        try {
            const res = await axios.post(`${API}/ai/generate-description`, {
                type:       actualType || animalType,
                status:     animalStatus,
                age:        approxAge,
                size:       approxSize,
                vaccinated: isVaccinated,
                neutered:   isNeutered,
                microchip:  hasMicrochip,
                foundHow:   actualFoundHow || foundHow,
            }, { withCredentials: true });
            setDescription(res.data.description || '');
            setDescVersion(v => v + 1);
            if (descTextareaRef.current) {
                descTextareaRef.current.value = res.data.description || '';
            }
            console.log('New description set:', res.data.description);
            setAiGenerated(true);
        } catch (err) {
            setAiError('AI unavailable — please write manually');
        } finally {
            setAiLoading(false);
        }
    };

    // ── CLIP image analysis ───────────────────────────────────────────────────
    const handleClipAnalyse = async () => {
        const photo = previews[0];
        if (!photo) return;
        setClipLoading(true);
        setClipError('');
        try {
            const canvas = document.createElement('canvas');
            const img = new window.Image();
            img.src = photo.url;
            await new Promise(resolve => { img.onload = resolve; });
            canvas.width = img.width;
            canvas.height = img.height;
            canvas.getContext('2d').drawImage(img, 0, 0);
            const base64 = canvas.toDataURL('image/jpeg', 0.8);

            const res = await axios.post(`${API}/ai/analyse-image`, { image: base64 }, { withCredentials: true });
            if (res.data.success) {
                setClipResults(res.data.summary);
            }
        } catch (err) {
            setClipError('Analysis unavailable — please fill in manually');
        } finally {
            setClipLoading(false);
        }
    };

    const applyClipResults = () => {
        if (!clipResults) return;
        if (clipResults.type) {
            const typeMap = { dog: 'Dog', cat: 'Cat', other: 'Other' };
            setAnimalType(typeMap[clipResults.type] || animalType);
        }
        if (clipResults.size) setApproxSize(clipResults.size);
        if (clipResults.age)  setApproxAge(clipResults.age);
        if (clipResults.breed || clipResults.color || clipResults.fur) {
            const extras = [];
            if (clipResults.breed) extras.push(`Appears to be ${clipResults.breed}.`);
            if (clipResults.color) extras.push(`Coat: ${clipResults.color}.`);
            if (clipResults.fur)   extras.push(`Fur length: ${clipResults.fur}.`);
            setDescription(prev => (prev ? prev + ' ' : '') + extras.join(' '));
            setDescVersion(v => v + 1);
        }
    };

    // ── File handling ─────────────────────────────────────────────────────────
    const handleFiles = (files) => {
        const chosen = Array.from(files).slice(0, 5 - previews.length);
        const next   = chosen.map((f) => ({ url: URL.createObjectURL(f), file: f }));
        setPreviews((prev) => [...prev, ...next].slice(0, 5));
    };

    const handleDrop = (e) => {
        e.preventDefault();
        handleFiles(e.dataTransfer.files);
    };

    const removePreview = (idx) => {
        setPreviews((prev) => {
            URL.revokeObjectURL(prev[idx].url);
            return prev.filter((_, i) => i !== idx);
        });
    };

    // ── Validation ────────────────────────────────────────────────────────────
    const validate = () => {
        const e = {};
        if (!headline.trim())    e.headline    = 'Please add a headline.';
        if (!animalType)         e.animalType  = 'Please select a type in step 1.';
        if (animalType === 'Other' && !animalTypeOther.trim()) e.animalType = 'Please specify the type of animal.';
        if (!description.trim()) e.description = 'Please describe the animal.';
        if (!agreed)             e.agreed      = 'Please agree to the terms.';
        return e;
    };

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) { setErrors(errs); return; }
        setErrors({});
        setSubmitError('');
        setSubmitting(true);

        try {
            const actualType = animalType === 'Other' ? animalTypeOther : animalType;
            const looksLikeEmail = contact.includes('@');
            const petPayload = {
                name:                  headline.trim(),
                type:                  actualType.toLowerCase(),
                breed:                 '',
                age_category:          approxAge || '',
                gender:                '',
                size:                  approxSize || '',
                color:                 '',
                coat:                  '',
                fee:                   0,
                description:           description.trim(),
                health_status:         status || '',
                story:                 caption.trim(),
                location_address:      location.trim(),
                location_city:         location.trim(),
                location_country:      '',
                shelter_contact_email: looksLikeEmail ? contact.trim() : '',
                shelter_contact_phone: !looksLikeEmail ? contact.trim() : '',
                zip_code:              '',
            };

            const response = await axios.post(`${API}/pets`, petPayload, { withCredentials: true });
            console.log('Created pet response:', response.data);
            const petId = response.data.pet?.id || response.data.id;

            for (const { file } of previews) {
                const form = new FormData();
                form.append('photo', file);
                await axios.post(`http://localhost:5000/api/pets/${petId}/photos`, form, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    withCredentials: true,
                });
            }

            setPublishedId(petId);
        } catch (err) {
            console.error('Submit error details:', err.response?.data, err.response?.status);
            setSubmitError(err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // ── Success screen ────────────────────────────────────────────────────────
    if (publishedId) {
        return (
            <div style={{ position: 'fixed', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', backgroundColor: '#FAF7F4' }}>
                <Navbar />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px' }}>
                    <div style={{ fontFamily: sans, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#C07A4A', marginBottom: '16px' }}>
                        The Paws Daily · Published
                    </div>
                    <div style={{ fontFamily: serif, fontSize: '28px', fontWeight: 700, color: '#2D1F14', marginBottom: '12px', textAlign: 'center' }}>
                        Your post is live.
                    </div>
                    <div style={{ fontFamily: sans, fontSize: '13px', color: '#7A5C44', lineHeight: 1.7, textAlign: 'center', maxWidth: '440px', marginBottom: '28px' }}>
                        Thank you for helping this animal find a home. Your listing is now visible to everyone on Paws.
                    </div>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <button
                            onClick={() => navigate(`/pet/${publishedId}`)}
                            style={{ fontFamily: sans, fontSize: '12px', color: '#FAF7F4', background: '#2D1F14', border: 'none', borderRadius: '100px', padding: '8px 20px', cursor: 'pointer', fontWeight: 500 }}
                        >
                            View listing →
                        </button>
                        <Link to="/profile" style={{ fontFamily: sans, fontSize: '12px', color: '#C07A4A', fontWeight: 500, textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                            My profile
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // ══════════════════════════════════════════════════════════════════════════
    // STEP 1 — QUICK QUESTIONS
    // ══════════════════════════════════════════════════════════════════════════
    if (step === 1) {
        return (
            <div style={{ position: 'fixed', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', backgroundColor: '#FAF7F4', overflowY: 'auto' }}>
                <Navbar />
                <StepIndicator step={1} />

                <div style={{ maxWidth: '600px', margin: '0 auto', padding: '36px 48px 80px', width: '100%', boxSizing: 'border-box' }}>

                    {/* Masthead */}
                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                        <div style={{ fontFamily: sans, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#C07A4A', fontWeight: 500, marginBottom: '12px' }}>
                            The Paws Daily · New submission
                        </div>
                        <h1 style={{ fontFamily: serif, fontSize: '36px', fontWeight: 700, color: '#2D1F14', margin: '0 0 10px', lineHeight: 1.1 }}>
                            Tell us about this animal
                        </h1>
                        <p style={{ fontFamily: serif, fontSize: '15px', fontStyle: 'italic', color: '#B09880', margin: 0 }}>
                            Answer a few questions to set up your listing.
                        </p>
                    </div>

                    {/* Q1 */}
                    <QuestionCard label="How did you find this animal?">
                        <PillToggle
                            large
                            options={['Found on the street', 'Owner surrendered it', 'Rescued from danger', 'Other']}
                            value={foundHow}
                            onChange={setFoundHow}
                        />
                        {foundHow === 'Other' && (
                            <input
                                type="text"
                                placeholder="Please describe how you found this animal..."
                                value={foundHowOther}
                                onChange={e => setFoundHowOther(e.target.value)}
                                autoFocus
                                style={{ width: '100%', marginTop: '10px', border: 'none', borderBottom: '1px solid rgba(45,31,20,0.2)', background: 'transparent', fontFamily: sans, fontSize: '13px', color: '#2D1F14', padding: '6px 0', outline: 'none' }}
                            />
                        )}
                    </QuestionCard>

                    {/* Q2 */}
                    <QuestionCard label="What type of animal is it?">
                        <PillToggle large options={['Dog', 'Cat', 'Other']} value={animalType} onChange={setAnimalType} />
                        {animalType === 'Other' && (
                            <input
                                type="text"
                                placeholder="Please specify the type of animal..."
                                value={animalTypeOther}
                                onChange={e => setAnimalTypeOther(e.target.value)}
                                autoFocus
                                style={{ width: '100%', marginTop: '10px', border: 'none', borderBottom: '1px solid rgba(45,31,20,0.2)', background: 'transparent', fontFamily: sans, fontSize: '13px', color: '#2D1F14', padding: '6px 0', outline: 'none' }}
                            />
                        )}
                    </QuestionCard>

                    {/* Q3 */}
                    <QuestionCard label="What's the animal's current status?">
                        <PillToggle
                            large
                            options={['Found / Stray', 'Needs urgent care', 'Vaccinated & healthy', 'Unknown']}
                            value={animalStatus}
                            onChange={setAnimalStatus}
                        />
                    </QuestionCard>

                    {/* Q4 */}
                    <QuestionCard label="Does it have a microchip?">
                        <PillToggle large options={["Yes", "No", "Don't know"]} value={hasMicrochip} onChange={setHasMicrochip} />
                    </QuestionCard>

                    {/* Q5 */}
                    <QuestionCard label="Is it vaccinated?">
                        <PillToggle large options={['Yes, fully', 'Partially', 'No', "Don't know"]} value={isVaccinated} onChange={setIsVaccinated} />
                    </QuestionCard>

                    {/* Q6 */}
                    <QuestionCard label="Is it neutered/spayed?">
                        <PillToggle large options={['Yes', 'No', "Don't know"]} value={isNeutered} onChange={setIsNeutered} />
                    </QuestionCard>

                    {/* Q7 */}
                    <QuestionCard label="Approximate age?">
                        <PillToggle
                            large
                            options={['Under 3 months', '3–12 months', '1–3 years', '3–7 years', 'Over 7 years', 'Unknown']}
                            value={approxAge}
                            onChange={setApproxAge}
                        />
                    </QuestionCard>

                    {/* Q8 */}
                    <QuestionCard label="Approximate size?">
                        <PillToggle
                            large
                            options={['Very small (under 5kg)', 'Small (5–10kg)', 'Medium (10–25kg)', 'Large (over 25kg)', 'Unknown']}
                            value={approxSize}
                            onChange={setApproxSize}
                        />
                    </QuestionCard>

                    {/* Continue button */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
                        <button
                            type="button"
                            disabled={!animalType}
                            onClick={handleContinue}
                            style={{
                                fontFamily: serif, fontSize: '15px', fontStyle: 'italic',
                                background: animalType ? '#C07A4A' : 'rgba(192,122,74,0.3)',
                                color: '#fff', border: 'none', borderRadius: '100px',
                                padding: '13px 28px', cursor: animalType ? 'pointer' : 'default',
                                transition: 'background 0.15s',
                            }}
                            onMouseEnter={e => { if (animalType) e.currentTarget.style.background = '#A86840'; }}
                            onMouseLeave={e => { if (animalType) e.currentTarget.style.background = '#C07A4A'; }}
                        >
                            Continue to listing →
                        </button>
                    </div>

                </div>
            </div>
        );
    }

    // ══════════════════════════════════════════════════════════════════════════
    // STEP 2 — FULL FORM
    // ══════════════════════════════════════════════════════════════════════════
    const leadPhoto   = previews[0] || null;
    const extraPhotos = previews.slice(1);

    console.log('RENDER - description value:', description.substring(0, 50));

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', backgroundColor: '#FAF7F4', overflowY: 'auto' }}>
            <Navbar />
            <StepIndicator step={2} />

            <form onSubmit={handleSubmit} style={{ maxWidth: '720px', margin: '0 auto', padding: '40px 48px 80px', width: '100%', boxSizing: 'border-box' }}>

                {/* Back link */}
                <button
                    type="button"
                    onClick={() => setStep(1)}
                    style={{ fontFamily: sans, fontSize: '11px', color: '#9A7A60', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: '24px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#C07A4A'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#9A7A60'; }}
                >
                    ← Back
                </button>

                {/* ── MASTHEAD ─────────────────────────────────────────── */}
                <div style={{ textAlign: 'center', marginBottom: '0' }}>
                    <div style={{ fontFamily: sans, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#C07A4A', marginBottom: '16px' }}>
                        The Paws Daily · New submission
                    </div>

                    <input
                        type="text"
                        placeholder="Write a headline for this animal..."
                        value={headline}
                        onChange={(e) => setHeadline(e.target.value)}
                        style={{
                            fontFamily: serif, fontSize: '40px', fontWeight: 700,
                            textAlign: 'center', border: 'none', background: 'none',
                            outline: 'none', width: '100%', boxSizing: 'border-box',
                            color: headline ? '#2D1F14' : 'rgba(45,31,20,0.25)',
                            lineHeight: 1.15, marginBottom: '4px',
                        }}
                    />
                    {errors.headline && (
                        <div style={{ fontFamily: sans, fontSize: '11px', color: '#C07A4A', marginBottom: '8px' }}>{errors.headline}</div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontFamily: sans, fontSize: '12px', color: '#B09880', flexWrap: 'wrap' }}>
                        <span>Found by you ·</span>
                        <input
                            type="text"
                            placeholder="add location"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            style={{
                                fontFamily: sans, fontSize: '12px', color: '#7A5C44',
                                border: 'none', borderBottom: '1px solid rgba(45,31,20,0.2)',
                                background: 'none', outline: 'none',
                                width: '120px', textAlign: 'center',
                            }}
                        />
                        <span>· {today}</span>
                    </div>

                    <div style={{ borderBottom: '3px double rgba(45,31,20,0.15)', marginTop: '20px' }} />
                </div>

                {/* ── LEAD PHOTO ───────────────────────────────────────── */}
                <div style={{ marginTop: '28px' }}>
                    <div style={{ fontFamily: sans, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#C07A4A', fontWeight: 500, marginBottom: '10px' }}>
                        Lead photo
                    </div>

                    {leadPhoto ? (
                        <>
                            <div style={{ position: 'relative' }}>
                                <img
                                    src={leadPhoto.url}
                                    alt="Lead"
                                    style={{ width: '100%', height: '300px', objectFit: 'cover', borderRadius: '2px', display: 'block' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => removePreview(0)}
                                    style={{ position: 'absolute', top: '8px', right: '8px', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'rgba(45,31,20,0.7)', color: '#FAF7F4', border: 'none', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                    ×
                                </button>
                            </div>

                            <input
                                type="text"
                                placeholder="Add a caption..."
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                style={{ fontFamily: serif, fontStyle: 'italic', fontSize: '11px', color: '#7A5C44', border: 'none', borderBottom: '1px solid rgba(45,31,20,0.12)', background: 'none', outline: 'none', width: '100%', boxSizing: 'border-box', padding: '6px 0', marginTop: '6px' }}
                            />

                            {/* CLIP analyse button */}
                            <button
                                type="button"
                                onClick={handleClipAnalyse}
                                disabled={clipLoading}
                                style={{
                                    marginTop: '10px', fontFamily: sans, fontSize: '11px', fontWeight: 500,
                                    background: 'rgba(192,122,74,0.1)', border: '1px solid rgba(192,122,74,0.25)',
                                    color: '#8B4E28', borderRadius: '100px', padding: '5px 14px',
                                    cursor: clipLoading ? 'default' : 'pointer', opacity: clipLoading ? 0.7 : 1,
                                }}
                            >
                                {clipLoading ? '🔍 Analysing...' : '🔍 Analyse with AI'}
                            </button>
                            {clipError && (
                                <div style={{ fontFamily: sans, fontSize: '11px', color: '#993C1D', marginTop: '6px' }}>{clipError}</div>
                            )}
                            {clipResults && (
                                <div style={{ marginTop: '10px', background: 'rgba(192,122,74,0.05)', border: '1px solid rgba(192,122,74,0.15)', borderRadius: '4px', padding: '12px 16px' }}>
                                    <div style={{ fontFamily: sans, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#C07A4A', marginBottom: '8px' }}>
                                        AI detected · feel free to correct
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                        {Object.entries(clipResults).map(([key, val]) => val && key !== 'species_confidence' ? (
                                            <span key={key} style={{ fontFamily: sans, fontSize: '11px', background: '#fff', border: '1px solid rgba(45,31,20,0.12)', borderRadius: '100px', padding: '3px 10px', color: '#5C4030' }}>
                                                {key}: {val}
                                            </span>
                                        ) : null)}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={applyClipResults}
                                        style={{ marginTop: '10px', fontFamily: sans, fontSize: '11px', background: '#2D1F14', color: '#FAF7F4', border: 'none', borderRadius: '100px', padding: '6px 14px', cursor: 'pointer' }}
                                    >
                                        Apply to form →
                                    </button>
                                </div>
                            )}

                            {(extraPhotos.length > 0 || previews.length < 5) && (
                                <div style={{ display: 'flex', gap: '8px', marginTop: '10px', alignItems: 'center' }}>
                                    {extraPhotos.map((p, i) => (
                                        <div key={i} style={{ position: 'relative' }}>
                                            <img src={p.url} alt="" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '2px', border: '1px solid rgba(45,31,20,0.1)', display: 'block' }} />
                                            <button type="button" onClick={() => removePreview(i + 1)} style={{ position: 'absolute', top: '-5px', right: '-5px', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#993C1D', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                                        </div>
                                    ))}
                                    {previews.length < 5 && (
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            style={{ width: '80px', height: '80px', border: '1px dashed rgba(45,31,20,0.2)', borderRadius: '2px', background: 'none', cursor: 'pointer', fontFamily: sans, fontSize: '10px', color: '#B09880', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                                        >
                                            <span style={{ fontSize: '20px', lineHeight: 1 }}>+</span>
                                            <span>Add photo</span>
                                        </button>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDrop}
                            style={{ border: '1px dashed rgba(45,31,20,0.2)', borderRadius: '2px', padding: '24px', textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.15s' }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#C07A4A'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(45,31,20,0.2)'; }}
                        >
                            <div style={{ fontFamily: sans, fontSize: '13px', color: '#7A5C44', marginBottom: '4px' }}>
                                Drag photos here or click to browse
                            </div>
                            <div style={{ fontFamily: sans, fontSize: '11px', color: '#B09880' }}>
                                Upload up to 5 photos. First photo will be the cover.
                            </div>
                        </div>
                    )}

                    <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={(e) => handleFiles(e.target.files)} />
                    {errors.photos && <div style={{ fontFamily: sans, fontSize: '11px', color: '#C07A4A', marginTop: '5px', textAlign: 'center' }}>{errors.photos}</div>}
                </div>

                {/* ── DESCRIPTION ─────────────────────────────────────── */}
                <div style={{ marginTop: '24px' }}>
                    {/* Label row with AI button */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <span style={{ fontFamily: sans, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#C07A4A', fontWeight: 500 }}>
                            Description
                        </span>
                        <button
                            type="button"
                            onClick={handleAiGenerate}
                            disabled={aiLoading}
                            style={{
                                fontFamily: sans, fontSize: '11px', fontWeight: 500,
                                background: 'rgba(192,122,74,0.1)',
                                border: '1px solid rgba(192,122,74,0.25)',
                                color: '#8B4E28', borderRadius: '100px',
                                padding: '4px 12px', cursor: aiLoading ? 'default' : 'pointer',
                                opacity: aiLoading ? 0.7 : 1, transition: 'opacity 0.15s',
                            }}
                        >
                            {aiLoading ? 'Generating...' : aiGenerated ? '✓ Regenerate' : '✨ Generate with AI'}
                        </button>
                        {aiGenerated && (
                            <span style={{ fontFamily: sans, fontSize: '10px', color: '#0F6E56' }}>
                                ✓ AI-generated — feel free to edit
                            </span>
                        )}
                        {aiError && (
                            <span style={{ fontFamily: sans, fontSize: '10px', color: '#993C1D' }}>
                                {aiError}
                            </span>
                        )}
                    </div>

                    <textarea
                        key={descVersion}
                        ref={descTextareaRef}
                        placeholder="Describe this animal — where found, behavior, age, markings..."
                        value={description}
                        onChange={(e) => { setDescription(e.target.value); if (aiGenerated) setAiGenerated(false); }}
                        style={{
                            fontFamily: serif, fontSize: '18px', lineHeight: 1.8,
                            color: '#2D1F14', border: 'none', background: 'none',
                            outline: 'none', width: '100%', boxSizing: 'border-box',
                            minHeight: '160px', resize: 'none',
                        }}
                    />
                    <div style={{ height: '1px', backgroundColor: 'rgba(45,31,20,0.1)' }} />
                    {errors.description && <div style={{ fontFamily: sans, fontSize: '11px', color: '#C07A4A', marginTop: '4px', textAlign: 'center' }}>{errors.description}</div>}
                </div>

                {/* ── DETAILS ROW ─────────────────────────────────────── */}
                <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: sans, fontSize: '9px', color: '#B09880', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Type:</span>
                    <PillToggle options={['Dog', 'Cat', 'Other']} value={animalType} onChange={setAnimalType} />
                    {errors.animalType && <span style={{ fontFamily: sans, fontSize: '11px', color: '#C07A4A' }}>{errors.animalType}</span>}

                    <span style={{ color: '#D4C4B8', fontSize: '14px' }}>·</span>

                    <span style={{ fontFamily: sans, fontSize: '9px', color: '#B09880', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Status:</span>
                    <PillToggle options={['Found', 'Urgent', 'Vaccinated']} value={status} onChange={setStatus} />
                </div>

                {/* ── STEP 1 SUMMARY BADGES ───────────────────────────── */}
                {(() => {
                    const step1Summary = [
                        foundHow && foundHow !== 'Other' ? { label: 'Found', value: foundHow } : foundHowOther ? { label: 'Found', value: foundHowOther } : null,
                        approxAge && approxAge !== 'Unknown' ? { label: 'Age', value: approxAge } : null,
                        approxSize && approxSize !== 'Unknown' ? { label: 'Size', value: approxSize } : null,
                        isVaccinated && isVaccinated !== "Don't know" ? { label: 'Vaccinated', value: isVaccinated } : null,
                        isNeutered && isNeutered !== "Don't know" ? { label: 'Neutered', value: isNeutered } : null,
                        hasMicrochip && hasMicrochip !== "Don't know" ? { label: 'Microchip', value: hasMicrochip } : null,
                    ].filter(Boolean);
                    return step1Summary.length > 0 ? (
                        <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
                            {step1Summary.map(({ label, value }) => (
                                <span key={label} style={{
                                    fontFamily: sans, fontSize: '10px',
                                    background: 'rgba(45,31,20,0.06)',
                                    border: '1px solid rgba(45,31,20,0.12)',
                                    borderRadius: '100px', padding: '4px 10px',
                                    color: '#5C4030', display: 'inline-flex', alignItems: 'center', gap: '4px',
                                }}>
                                    <span style={{ color: '#B09880', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
                                    {value}
                                </span>
                            ))}
                        </div>
                    ) : null;
                })()}

                {/* ── SUBMIT SECTION ──────────────────────────────────── */}
                <div style={{ marginTop: '32px', borderTop: '1px solid rgba(45,31,20,0.1)', paddingTop: '28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>

                    <input
                        type="text"
                        placeholder="Phone or email (visible only to logged-in users)"
                        value={contact}
                        onChange={(e) => setContact(e.target.value)}
                        style={{
                            fontFamily: sans, fontSize: '12px', color: '#7A5C44',
                            border: 'none', borderBottom: '1px solid rgba(45,31,20,0.15)',
                            background: 'none', outline: 'none',
                            width: '320px', textAlign: 'center', padding: '4px 0',
                        }}
                    />

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <div
                            onClick={() => setAgreed(!agreed)}
                            style={{ width: '16px', height: '16px', borderRadius: '3px', border: `1px solid ${errors.agreed ? '#C07A4A' : 'rgba(45,31,20,0.2)'}`, backgroundColor: agreed ? '#2D1F14' : '#fff', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.15s', cursor: 'pointer' }}
                        >
                            {agreed && (
                                <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                                    <path d="M1 3.5L3.5 6L8 1" stroke="#FAF7F4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            )}
                        </div>
                        <span style={{ fontFamily: sans, fontSize: '12px', color: '#7A5C44' }}>
                            I agree that this information will be visible to other Paws users
                        </span>
                    </label>
                    {errors.agreed && <div style={{ fontFamily: sans, fontSize: '11px', color: '#C07A4A' }}>{errors.agreed}</div>}

                    {submitError && (
                        <div style={{ fontFamily: sans, fontSize: '13px', color: '#993C1D', background: 'rgba(153,60,29,0.08)', border: '1px solid rgba(153,60,29,0.2)', borderRadius: '4px', padding: '12px 16px', width: '100%', boxSizing: 'border-box', textAlign: 'center' }}>
                            {submitError}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={submitting}
                        style={{ width: '100%', backgroundColor: submitting ? '#7A5C44' : '#2D1F14', color: '#FAF7F4', padding: '14px', fontSize: '15px', fontFamily: serif, fontStyle: 'italic', border: 'none', borderRadius: '2px', cursor: submitting ? 'default' : 'pointer', transition: 'background-color 0.15s', marginTop: '4px', opacity: submitting ? 0.7 : 1 }}
                        onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.backgroundColor = '#3D2B1A'; }}
                        onMouseLeave={(e) => { if (!submitting) e.currentTarget.style.backgroundColor = '#2D1F14'; }}
                    >
                        {submitting ? 'Publishing…' : 'Publish to The Paws Daily →'}
                    </button>
                </div>
            </form>
        </div>
    );
}
