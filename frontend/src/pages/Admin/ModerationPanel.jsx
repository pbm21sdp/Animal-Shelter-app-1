import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { CheckCircle, XCircle, RefreshCw, Clock, MapPin, User, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDate } from '../../utils/date';

const API   = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const serif = "'Cormorant Garamond', serif";
const sans  = "'DM Sans', sans-serif";

const getPetPhotoUrl = (pet) => {
    if (!pet.photos || pet.photos.length === 0) return null;
    const primary = pet.photos.find(p => p.is_primary) || pet.photos[0];
    if (!primary) return null;
    if (primary.id) return `${API}/pets/photos/${primary.id}`;
    if (primary.photo_url) return primary.photo_url;
    return null;
};

const TYPE_LABELS = { dog: 'Dog', cat: 'Cat', bird: 'Bird', rabbit: 'Rabbit', other: 'Other' };

const cap = str => str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

// ── Reject dialog ──────────────────────────────────────────────────────────────
const RejectDialog = ({ pet, onConfirm, onCancel }) => {
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [hoverCancel, setHoverCancel] = useState(false);
    const [hoverReject, setHoverReject] = useState(false);

    const handleSubmit = async () => {
        if (!reason.trim()) return;
        setSubmitting(true);
        await onConfirm(pet.id, reason.trim());
        setSubmitting(false);
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'rgba(45,31,20,0.45)', padding: '16px',
        }}>
            <div style={{
                backgroundColor: '#FFFAF7',
                border: '1px solid rgba(45,31,20,0.1)',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(45,31,20,0.12)',
                width: '100%', maxWidth: '440px',
                padding: '24px',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                    <AlertTriangle style={{ width: '18px', height: '18px', color: '#993C1D', flexShrink: 0 }} />
                    <h3 style={{ fontFamily: serif, fontSize: '20px', fontWeight: 600, color: '#2D1F14', margin: 0 }}>
                        Reject listing
                    </h3>
                </div>

                <p style={{ fontFamily: sans, fontSize: '13px', color: '#7A5C44', marginBottom: '16px', lineHeight: 1.6 }}>
                    You are rejecting <span style={{ fontWeight: 600, color: '#2D1F14' }}>"{pet.name}"</span>.
                    The uploader will receive a notification with your reason.
                </p>

                <label style={{ fontFamily: sans, fontSize: '11px', fontWeight: 600, color: '#2D1F14', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '8px' }}>
                    Reason <span style={{ color: '#993C1D' }}>*</span>
                </label>
                <textarea
                    rows={4}
                    placeholder="E.g. Photo quality too low, description insufficient, duplicate listing…"
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    autoFocus
                    style={{
                        width: '100%', boxSizing: 'border-box',
                        border: '1px solid rgba(45,31,20,0.2)', borderRadius: '6px',
                        padding: '10px 12px',
                        fontFamily: sans, fontSize: '13px', color: '#2D1F14',
                        background: '#FAF7F4', resize: 'none', outline: 'none',
                        transition: 'border-color 0.15s',
                    }}
                    onFocus={e => { e.target.style.borderColor = '#C07A4A'; }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(45,31,20,0.2)'; }}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                    <button
                        onClick={onCancel}
                        disabled={submitting}
                        onMouseEnter={() => setHoverCancel(true)}
                        onMouseLeave={() => setHoverCancel(false)}
                        style={{
                            fontFamily: sans, fontSize: '12px', fontWeight: 500,
                            padding: '8px 16px', borderRadius: '6px', cursor: 'pointer',
                            border: '1px solid rgba(45,31,20,0.2)',
                            background: hoverCancel ? 'rgba(45,31,20,0.04)' : 'transparent',
                            color: '#7A5C44',
                            transition: 'background 0.12s',
                            opacity: submitting ? 0.5 : 1,
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!reason.trim() || submitting}
                        onMouseEnter={() => setHoverReject(true)}
                        onMouseLeave={() => setHoverReject(false)}
                        style={{
                            fontFamily: sans, fontSize: '12px', fontWeight: 600,
                            padding: '8px 16px', borderRadius: '6px', cursor: 'pointer',
                            border: 'none',
                            background: hoverReject && reason.trim() && !submitting ? '#7A2010' : '#993C1D',
                            color: '#FAF7F4',
                            display: 'flex', alignItems: 'center', gap: '6px',
                            transition: 'background 0.12s',
                            opacity: (!reason.trim() || submitting) ? 0.5 : 1,
                        }}
                    >
                        {submitting && <RefreshCw style={{ width: '13px', height: '13px' }} className="animate-spin" />}
                        Reject listing
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── Pet card ──────────────────────────────────────────────────────────────────
const PetModerationCard = ({ pet, onApprove, onReject }) => {
    const [approving, setApproving] = useState(false);
    const [hoverApprove, setHoverApprove] = useState(false);
    const [hoverReject, setHoverReject] = useState(false);
    const [hoverCard, setHoverCard] = useState(false);
    const photoUrl = getPetPhotoUrl(pet);

    const handleApprove = async () => {
        setApproving(true);
        await onApprove(pet.id);
        setApproving(false);
    };

    const uploaderLabel = pet.uploader_name || pet.uploader_email || null;

    return (
        <div
            onMouseEnter={() => setHoverCard(true)}
            onMouseLeave={() => setHoverCard(false)}
            style={{
                backgroundColor: '#FFFAF7',
                border: `1px solid ${hoverCard ? 'rgba(192,122,74,0.25)' : 'rgba(45,31,20,0.1)'}`,
                borderRadius: '10px',
                overflow: 'hidden',
                display: 'flex', flexDirection: 'column',
                boxShadow: hoverCard ? '0 4px 16px rgba(45,31,20,0.08)' : '0 1px 4px rgba(45,31,20,0.05)',
                transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
        >
            {/* Photo */}
            <div style={{ height: '160px', backgroundColor: '#E8D4C8', position: 'relative', overflow: 'hidden' }}>
                {photoUrl ? (
                    <img
                        src={photoUrl}
                        alt={pet.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={e => { e.target.style.display = 'none'; }}
                    />
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontFamily: sans, fontSize: '12px', color: '#B09880' }}>
                        No photo
                    </div>
                )}
                <span style={{
                    position: 'absolute', top: '8px', left: '8px',
                    background: 'rgba(250,247,244,0.92)', borderRadius: '100px',
                    fontFamily: sans, fontSize: '10px', fontWeight: 600,
                    color: '#2D1F14', padding: '3px 9px',
                }}>
                    {TYPE_LABELS[pet.type] || cap(pet.type)}
                </span>
                {pet.photos && pet.photos.length > 1 && (
                    <span style={{
                        position: 'absolute', top: '8px', right: '8px',
                        background: 'rgba(45,31,20,0.55)', borderRadius: '100px',
                        fontFamily: sans, fontSize: '10px', color: '#FAF7F4',
                        padding: '3px 8px',
                    }}>
                        +{pet.photos.length - 1}
                    </span>
                )}
            </div>

            {/* Content */}
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>

                {/* Name + gender */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <h3 style={{ fontFamily: serif, fontSize: '18px', fontWeight: 700, color: '#2D1F14', margin: 0, lineHeight: 1.2 }}>
                        {pet.name}
                    </h3>
                    {pet.gender && pet.gender !== 'unknown' && (
                        <span style={{ fontFamily: sans, fontSize: '13px', color: '#B09880', flexShrink: 0 }}>
                            {pet.gender === 'male' ? '♂' : '♀'}
                        </span>
                    )}
                </div>

                {/* Breed / age / size */}
                <div style={{ fontFamily: sans, fontSize: '12px', color: '#7A5C44', lineHeight: 1.5 }}>
                    <div style={{ fontWeight: 500, color: '#5C4030' }}>{pet.breed || 'Unknown breed'}</div>
                    <div>{[pet.age_category, pet.size, pet.color].filter(Boolean).join(' · ')}</div>
                </div>

                {/* Location */}
                {(pet.location_city || pet.location_address) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontFamily: sans, fontSize: '11px', color: '#B09880' }}>
                        <MapPin style={{ width: '12px', height: '12px', flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {[pet.location_city, pet.location_country].filter(Boolean).join(', ')}
                        </span>
                    </div>
                )}

                {/* Traits */}
                {pet.traits && pet.traits.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {pet.traits.slice(0, 4).map((t, i) => (
                            <span key={i} style={{
                                fontFamily: sans, fontSize: '10px',
                                background: 'rgba(192,122,74,0.08)',
                                border: '1px solid rgba(192,122,74,0.18)',
                                borderRadius: '100px', padding: '2px 8px',
                                color: '#7A5C44',
                            }}>
                                {t}
                            </span>
                        ))}
                        {pet.traits.length > 4 && (
                            <span style={{ fontFamily: sans, fontSize: '10px', color: '#B09880' }}>+{pet.traits.length - 4}</span>
                        )}
                    </div>
                )}

                {/* Description excerpt */}
                {pet.description && (
                    <p style={{
                        fontFamily: sans, fontSize: '11px', color: '#9A7A60',
                        margin: 0, lineHeight: 1.6,
                        display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                        {pet.description}
                    </p>
                )}

                {/* Submitted at */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontFamily: sans, fontSize: '11px', color: '#B09880', marginTop: 'auto' }}>
                    <Clock style={{ width: '12px', height: '12px', flexShrink: 0 }} />
                    <span>Submitted {formatDate(pet.created_at)}</span>
                </div>

                {/* Uploader */}
                {uploaderLabel && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontFamily: sans, fontSize: '11px', color: '#B09880' }}>
                        <User style={{ width: '12px', height: '12px', flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{uploaderLabel}</span>
                    </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', paddingTop: '10px', borderTop: '1px solid rgba(45,31,20,0.08)' }}>
                    <button
                        onClick={handleApprove}
                        disabled={approving}
                        onMouseEnter={() => setHoverApprove(true)}
                        onMouseLeave={() => setHoverApprove(false)}
                        style={{
                            flex: 1,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                            fontFamily: sans, fontSize: '12px', fontWeight: 600,
                            padding: '8px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                            background: hoverApprove && !approving ? '#1A4A2A' : 'rgba(34,197,94,0.12)',
                            color: hoverApprove && !approving ? '#FAF7F4' : '#166534',
                            transition: 'background 0.12s, color 0.12s',
                            opacity: approving ? 0.6 : 1,
                        }}
                    >
                        {approving
                            ? <RefreshCw style={{ width: '13px', height: '13px' }} className="animate-spin" />
                            : <CheckCircle style={{ width: '13px', height: '13px' }} />}
                        Approve
                    </button>
                    <button
                        onClick={() => onReject(pet)}
                        onMouseEnter={() => setHoverReject(true)}
                        onMouseLeave={() => setHoverReject(false)}
                        style={{
                            flex: 1,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                            fontFamily: sans, fontSize: '12px', fontWeight: 600,
                            padding: '8px 12px', borderRadius: '6px', cursor: 'pointer',
                            border: `1px solid ${hoverReject ? '#993C1D' : 'rgba(153,60,29,0.25)'}`,
                            background: hoverReject ? 'rgba(153,60,29,0.06)' : 'transparent',
                            color: '#993C1D',
                            transition: 'background 0.12s, border-color 0.12s',
                        }}
                    >
                        <XCircle style={{ width: '13px', height: '13px' }} />
                        Reject
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── Main panel ────────────────────────────────────────────────────────────────
const ModerationPanel = () => {
    const [pets, setPets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [rejectTarget, setRejectTarget] = useState(null);
    const [hoverRefresh, setHoverRefresh] = useState(false);

    const fetchPending = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(`${API}/pets/admin/pending`, { withCredentials: true });
            setPets(res.data.pets || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load pending listings');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchPending(); }, [fetchPending]);

    const handleApprove = async (petId) => {
        try {
            await axios.patch(`${API}/pets/${petId}/approve`, {}, { withCredentials: true });
            toast.success('Listing approved and published.');
            setPets(prev => prev.filter(p => p.id !== petId));
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to approve listing');
        }
    };

    const handleRejectOpen   = (pet) => setRejectTarget(pet);
    const handleRejectCancel = () => setRejectTarget(null);

    const handleRejectConfirm = async (petId, reason) => {
        try {
            await axios.patch(`${API}/pets/${petId}/reject`, { reason }, { withCredentials: true });
            toast.success('Listing rejected. Uploader has been notified.');
            setPets(prev => prev.filter(p => p.id !== petId));
            setRejectTarget(null);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to reject listing');
        }
    };

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div>
                    <h2 style={{ fontFamily: serif, fontSize: '24px', fontWeight: 700, color: '#2D1F14', margin: '0 0 4px' }}>
                        Content Moderation
                    </h2>
                    <p style={{ fontFamily: sans, fontSize: '13px', color: '#B09880', margin: 0 }}>
                        Review community-submitted listings before they go public.
                    </p>
                </div>
                <button
                    onClick={fetchPending}
                    disabled={loading}
                    onMouseEnter={() => setHoverRefresh(true)}
                    onMouseLeave={() => setHoverRefresh(false)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        fontFamily: sans, fontSize: '12px', fontWeight: 500,
                        color: '#7A5C44', cursor: 'pointer',
                        border: '1px solid rgba(45,31,20,0.15)',
                        borderRadius: '6px', padding: '7px 14px',
                        background: hoverRefresh ? 'rgba(45,31,20,0.04)' : 'transparent',
                        transition: 'background 0.12s',
                        opacity: loading ? 0.5 : 1,
                    }}
                >
                    <RefreshCw style={{ width: '13px', height: '13px' }} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* Loading */}
            {loading && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0', fontFamily: sans, fontSize: '13px', color: '#B09880', gap: '8px' }}>
                    <RefreshCw style={{ width: '18px', height: '18px' }} className="animate-spin" />
                    Loading pending listings…
                </div>
            )}

            {/* Error */}
            {!loading && error && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    background: 'rgba(153,60,29,0.06)', border: '1px solid rgba(153,60,29,0.2)',
                    borderRadius: '8px', padding: '14px 16px',
                    fontFamily: sans, fontSize: '13px', color: '#993C1D',
                }}>
                    <AlertTriangle style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                    {error}
                </div>
            )}

            {/* Empty state */}
            {!loading && !error && pets.length === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: '12px' }}>
                    <CheckCircle style={{ width: '40px', height: '40px', color: '#C07A4A', opacity: 0.4 }} />
                    <p style={{ fontFamily: serif, fontSize: '20px', fontWeight: 600, color: '#2D1F14', margin: 0 }}>All caught up!</p>
                    <p style={{ fontFamily: sans, fontSize: '13px', color: '#B09880', margin: 0 }}>No listings are waiting for review.</p>
                </div>
            )}

            {/* Count badge */}
            {!loading && !error && pets.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                    <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        background: 'rgba(192,122,74,0.1)', border: '1px solid rgba(192,122,74,0.25)',
                        borderRadius: '100px', padding: '5px 12px',
                        fontFamily: sans, fontSize: '12px', fontWeight: 500, color: '#7A5C44',
                    }}>
                        <Clock style={{ width: '13px', height: '13px' }} />
                        {pets.length} pending {pets.length === 1 ? 'listing' : 'listings'}
                    </span>
                </div>
            )}

            {/* Grid */}
            {!loading && !error && pets.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {pets.map(pet => (
                        <PetModerationCard
                            key={pet.id}
                            pet={pet}
                            onApprove={handleApprove}
                            onReject={handleRejectOpen}
                        />
                    ))}
                </div>
            )}

            {/* Reject dialog */}
            {rejectTarget && (
                <RejectDialog
                    pet={rejectTarget}
                    onConfirm={handleRejectConfirm}
                    onCancel={handleRejectCancel}
                />
            )}
        </div>
    );
};

export default ModerationPanel;
