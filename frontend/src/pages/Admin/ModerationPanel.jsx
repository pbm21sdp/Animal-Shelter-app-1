import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { CheckCircle, XCircle, RefreshCw, Clock, MapPin, User, Tag, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getPetPhotoUrl = (pet) => {
    if (!pet.photos || pet.photos.length === 0) return null;
    const primary = pet.photos.find(p => p.is_primary) || pet.photos[0];
    if (!primary) return null;
    if (primary.id) return `${API}/pets/photos/${primary.id}`;
    if (primary.photo_url) return primary.photo_url;
    return null;
};

const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
};

const TYPE_LABELS = { dog: 'Dog', cat: 'Cat', bird: 'Bird', rabbit: 'Rabbit', other: 'Other' };
const AGE_LABELS = { baby: 'Baby', young: 'Young', adult: 'Adult', senior: 'Senior' };

const RejectDialog = ({ pet, onConfirm, onCancel }) => {
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!reason.trim()) return;
        setSubmitting(true);
        await onConfirm(pet.id, reason.trim());
        setSubmitting(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                <div className="flex items-center gap-3 mb-4">
                    <AlertTriangle className="h-6 w-6 text-red-500 shrink-0" />
                    <h3 className="text-lg font-semibold text-gray-900">Reject Listing</h3>
                </div>
                <p className="text-sm text-gray-600 mb-1">
                    You are rejecting <span className="font-medium text-gray-900">"{pet.name}"</span>.
                    The uploader will receive a notification with your reason.
                </p>
                <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">
                    Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                    rows={4}
                    placeholder="E.g. Photo quality too low, description insufficient, duplicate listing…"
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    autoFocus
                />
                <div className="flex justify-end gap-3 mt-4">
                    <button
                        onClick={onCancel}
                        disabled={submitting}
                        className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!reason.trim() || submitting}
                        className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {submitting && <RefreshCw className="h-4 w-4 animate-spin" />}
                        Reject listing
                    </button>
                </div>
            </div>
        </div>
    );
};

const PetModerationCard = ({ pet, onApprove, onReject }) => {
    const [approving, setApproving] = useState(false);
    const photoUrl = getPetPhotoUrl(pet);

    const handleApprove = async () => {
        setApproving(true);
        await onApprove(pet.id);
        setApproving(false);
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            {/* Photo strip */}
            <div className="h-40 bg-gray-100 relative overflow-hidden">
                {photoUrl ? (
                    <img
                        src={photoUrl}
                        alt={pet.name}
                        className="w-full h-full object-cover"
                        onError={e => { e.target.style.display = 'none'; }}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm">No photo</div>
                )}
                {/* Pet type badge */}
                <span className="absolute top-2 left-2 bg-white/90 text-gray-700 text-xs font-medium px-2 py-1 rounded-full shadow-sm">
                    {TYPE_LABELS[pet.type] || pet.type}
                </span>
                {/* Photo count */}
                {pet.photos && pet.photos.length > 1 && (
                    <span className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                        +{pet.photos.length - 1} photos
                    </span>
                )}
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col flex-1 gap-3">
                {/* Name + gender */}
                <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-semibold text-gray-900 leading-tight">{pet.name}</h3>
                    <span className={`text-sm font-medium shrink-0 ${pet.gender === 'male' ? 'text-blue-500' : 'text-pink-500'}`}>
                        {pet.gender === 'male' ? '♂' : '♀'}
                    </span>
                </div>

                {/* Details */}
                <div className="flex flex-col gap-1 text-sm text-gray-600">
                    <span className="font-medium text-gray-800">{pet.breed || 'Unknown breed'}</span>
                    <span>{AGE_LABELS[pet.age_category] || pet.age_category} · {pet.size} · {pet.color}</span>
                </div>

                {/* Location */}
                {(pet.location_city || pet.location_address) && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{[pet.location_city, pet.location_country].filter(Boolean).join(', ')}</span>
                    </div>
                )}

                {/* Traits */}
                {pet.traits && pet.traits.length > 0 && (
                    <div className="flex items-start gap-1 flex-wrap">
                        <Tag className="h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0" />
                        {pet.traits.slice(0, 4).map((t, i) => (
                            <span key={i} className="text-xs bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded">
                                {t}
                            </span>
                        ))}
                        {pet.traits.length > 4 && (
                            <span className="text-xs text-gray-400">+{pet.traits.length - 4}</span>
                        )}
                    </div>
                )}

                {/* Description excerpt */}
                {pet.description && (
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{pet.description}</p>
                )}

                {/* Submitted at */}
                <div className="flex items-center gap-1 text-xs text-gray-400 mt-auto">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    <span>Submitted {formatDate(pet.created_at)}</span>
                </div>

                {/* Uploader ID (MongoDB ObjectId shown as truncated reference) */}
                {pet.uploader_id && (
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                        <User className="h-3.5 w-3.5 shrink-0" />
                        <span className="font-mono truncate">uid: {pet.uploader_id.slice(-8)}</span>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <button
                        onClick={handleApprove}
                        disabled={approving}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors"
                    >
                        {approving
                            ? <RefreshCw className="h-4 w-4 animate-spin" />
                            : <CheckCircle className="h-4 w-4" />}
                        Approve
                    </button>
                    <button
                        onClick={() => onReject(pet)}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-sm font-medium py-2 px-3 rounded-lg border border-red-200 transition-colors"
                    >
                        <XCircle className="h-4 w-4" />
                        Reject
                    </button>
                </div>
            </div>
        </div>
    );
};

const ModerationPanel = () => {
    const [pets, setPets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [rejectTarget, setRejectTarget] = useState(null);

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

    const handleRejectOpen = (pet) => setRejectTarget(pet);
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
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Content Moderation</h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Review community-submitted animal listings before they go public.
                    </p>
                </div>
                <button
                    onClick={fetchPending}
                    disabled={loading}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center py-20 text-gray-400">
                    <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                    <span className="text-sm">Loading pending listings…</span>
                </div>
            )}

            {/* Error */}
            {!loading && error && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
                    <AlertTriangle className="h-5 w-5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Empty state */}
            {!loading && !error && pets.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-3">
                    <CheckCircle className="h-12 w-12 text-teal-400" />
                    <p className="text-base font-medium text-gray-600">All caught up!</p>
                    <p className="text-sm">No listings are waiting for review.</p>
                </div>
            )}

            {/* Count badge */}
            {!loading && !error && pets.length > 0 && (
                <div className="mb-4 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-sm font-medium px-3 py-1 rounded-full">
                        <Clock className="h-4 w-4" />
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
