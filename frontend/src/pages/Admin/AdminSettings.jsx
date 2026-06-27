import React, { useState, useEffect, useRef } from 'react';
import { Settings, Trash2, Plus, RefreshCw, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API   = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const serif = "'Cormorant Garamond', serif";
const sans  = "'DM Sans', sans-serif";

// ── Toggle switch ──────────────────────────────────────────────────────────────
const Toggle = ({ checked, onChange, disabled }) => (
    <button
        type="button"
        onClick={() => !disabled && onChange(!checked)}
        style={{
            width: '36px', height: '20px', borderRadius: '100px',
            background: checked ? '#C07A4A' : 'rgba(45,31,20,0.15)',
            border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
            padding: '2px', display: 'flex', alignItems: 'center',
            transition: 'background 0.2s', flexShrink: 0,
            justifyContent: checked ? 'flex-end' : 'flex-start',
        }}
    >
        <span style={{
            width: '16px', height: '16px', borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 1px 3px rgba(45,31,20,0.25)',
            display: 'block',
            transition: 'transform 0.2s',
        }} />
    </button>
);

// ── Section wrapper ───────────────────────────────────────────────────────────
const Section = ({ title, description, children }) => (
    <div style={{
        backgroundColor: '#FFFAF7',
        border: '1px solid rgba(45,31,20,0.1)',
        borderRadius: '10px',
        padding: '24px',
        marginBottom: '24px',
    }}>
        <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontFamily: serif, fontSize: '20px', fontWeight: 700, color: '#2D1F14', margin: '0 0 4px' }}>
                {title}
            </h3>
            {description && (
                <p style={{ fontFamily: sans, fontSize: '12px', color: '#B09880', margin: 0 }}>
                    {description}
                </p>
            )}
        </div>
        {children}
    </div>
);

// ── Main component ─────────────────────────────────────────────────────────────
const AdminSettings = () => {
    // ── Reject reasons state ────────────────────────────────────────────────
    const [reasons, setReasons]           = useState([]);
    const [loadingReasons, setLoadingReasons] = useState(true);
    const [togglingId, setTogglingId]     = useState(null);

    // ── Forbidden words state ───────────────────────────────────────────────
    const [words, setWords]               = useState([]);
    const [loadingWords, setLoadingWords] = useState(true);
    const [newWord, setNewWord]           = useState('');
    const [addingWord, setAddingWord]     = useState(false);
    const [deletingId, setDeletingId]     = useState(null);
    const wordInputRef = useRef(null);

    // ── Fetch on mount ──────────────────────────────────────────────────────
    useEffect(() => {
        fetchReasons();
        fetchWords();
    }, []);

    const fetchReasons = async () => {
        setLoadingReasons(true);
        try {
            const res = await axios.get(`${API}/settings/reject-reasons`, { withCredentials: true });
            setReasons(res.data.reasons || []);
        } catch {
            toast.error('Failed to load rejection reasons');
        } finally {
            setLoadingReasons(false);
        }
    };

    const fetchWords = async () => {
        setLoadingWords(true);
        try {
            const res = await axios.get(`${API}/settings/forbidden-words`, { withCredentials: true });
            setWords(res.data.words || []);
        } catch {
            toast.error('Failed to load forbidden words');
        } finally {
            setLoadingWords(false);
        }
    };

    // ── Rejection reasons actions ───────────────────────────────────────────
    const handleToggleReason = async (reason) => {
        setTogglingId(reason.id);
        try {
            const res = await axios.patch(
                `${API}/settings/reject-reasons/${reason.id}/toggle`,
                {},
                { withCredentials: true }
            );
            setReasons(prev => prev.map(r => r.id === reason.id ? res.data.reason : r));
        } catch {
            toast.error('Failed to update reason');
        } finally {
            setTogglingId(null);
        }
    };

    // ── Forbidden words actions ─────────────────────────────────────────────
    const handleAddWord = async (e) => {
        e.preventDefault();
        const trimmed = newWord.trim().toLowerCase();
        if (!trimmed) return;
        setAddingWord(true);
        try {
            const res = await axios.post(
                `${API}/settings/forbidden-words`,
                { word: trimmed },
                { withCredentials: true }
            );
            setWords(prev => [...prev, res.data.word].sort((a, b) => a.word.localeCompare(b.word)));
            setNewWord('');
            wordInputRef.current?.focus();
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to add word';
            toast.error(msg);
        } finally {
            setAddingWord(false);
        }
    };

    const handleDeleteWord = async (word) => {
        setDeletingId(word.id);
        try {
            await axios.delete(`${API}/settings/forbidden-words/${word.id}`, { withCredentials: true });
            setWords(prev => prev.filter(w => w.id !== word.id));
        } catch {
            toast.error('Failed to delete word');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <Settings style={{ width: '20px', height: '20px', color: '#C07A4A' }} />
                    <h2 style={{ fontFamily: serif, fontSize: '26px', fontWeight: 700, color: '#2D1F14', margin: 0 }}>
                        Settings
                    </h2>
                </div>
                <p style={{ fontFamily: sans, fontSize: '13px', color: '#B09880', margin: 0 }}>
                    Manage content moderation rules and platform configuration.
                </p>
            </div>

            {/* ── Rejection Reasons ── */}
            <Section
                title="Rejection Reasons"
                description="Toggle which reasons are shown to admins when rejecting a listing. Disabled reasons won't appear in the moderation panel."
            >
                {loadingReasons ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: sans, fontSize: '13px', color: '#B09880', padding: '8px 0' }}>
                        <RefreshCw style={{ width: '14px', height: '14px' }} className="animate-spin" />
                        Loading…
                    </div>
                ) : reasons.length === 0 ? (
                    <div style={{ fontFamily: sans, fontSize: '13px', color: '#B09880' }}>No reasons configured.</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {reasons.map((reason) => (
                            <div
                                key={reason.id}
                                style={{
                                    display: 'flex', alignItems: 'center',
                                    justifyContent: 'space-between', gap: '12px',
                                    padding: '12px 16px', borderRadius: '8px',
                                    border: `1px solid ${reason.is_active ? 'rgba(192,122,74,0.2)' : 'rgba(45,31,20,0.1)'}`,
                                    background: reason.is_active ? 'rgba(192,122,74,0.03)' : 'transparent',
                                    transition: 'border-color 0.15s, background 0.15s',
                                }}
                            >
                                <span style={{
                                    fontFamily: sans, fontSize: '13px',
                                    color: reason.is_active ? '#2D1F14' : '#B09880',
                                    transition: 'color 0.15s',
                                    flex: 1,
                                }}>
                                    {reason.label}
                                </span>
                                <Toggle
                                    checked={reason.is_active}
                                    onChange={() => handleToggleReason(reason)}
                                    disabled={togglingId === reason.id}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </Section>

            {/* ── Forbidden Words ── */}
            <Section
                title="Forbidden Words"
                description="Words listed here are flagged or blocked from appearing in pet listing content. All words are matched case-insensitively."
            >
                {/* Add new word form */}
                <form onSubmit={handleAddWord} style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                    <input
                        ref={wordInputRef}
                        type="text"
                        value={newWord}
                        onChange={e => setNewWord(e.target.value)}
                        placeholder="Add a word…"
                        maxLength={100}
                        style={{
                            flex: 1, border: '1px solid rgba(45,31,20,0.15)',
                            borderRadius: '6px', padding: '8px 12px',
                            fontFamily: sans, fontSize: '13px', color: '#2D1F14',
                            background: '#FAF7F4', outline: 'none',
                            transition: 'border-color 0.15s',
                        }}
                        onFocus={e => { e.target.style.borderColor = '#C07A4A'; }}
                        onBlur={e => { e.target.style.borderColor = 'rgba(45,31,20,0.15)'; }}
                    />
                    <button
                        type="submit"
                        disabled={!newWord.trim() || addingWord}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '8px 14px', borderRadius: '6px', border: 'none',
                            background: newWord.trim() && !addingWord ? '#2D1F14' : 'rgba(45,31,20,0.15)',
                            color: newWord.trim() && !addingWord ? '#FAF7F4' : '#B09880',
                            fontFamily: sans, fontSize: '12px', fontWeight: 600,
                            cursor: newWord.trim() && !addingWord ? 'pointer' : 'not-allowed',
                            transition: 'background 0.15s, color 0.15s',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {addingWord
                            ? <RefreshCw style={{ width: '13px', height: '13px' }} className="animate-spin" />
                            : <Plus style={{ width: '13px', height: '13px' }} />
                        }
                        Add word
                    </button>
                </form>

                {/* Words list */}
                {loadingWords ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: sans, fontSize: '13px', color: '#B09880' }}>
                        <RefreshCw style={{ width: '14px', height: '14px' }} className="animate-spin" />
                        Loading…
                    </div>
                ) : words.length === 0 ? (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        fontFamily: sans, fontSize: '13px', color: '#B09880',
                        padding: '16px', borderRadius: '8px',
                        border: '1px dashed rgba(45,31,20,0.15)',
                        justifyContent: 'center',
                    }}>
                        <AlertTriangle style={{ width: '14px', height: '14px' }} />
                        No forbidden words configured yet.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {words.map((w) => (
                            <div
                                key={w.id}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                                    padding: '5px 10px 5px 12px',
                                    background: 'rgba(153,60,29,0.07)',
                                    border: '1px solid rgba(153,60,29,0.2)',
                                    borderRadius: '100px',
                                    fontFamily: sans, fontSize: '12px', color: '#2D1F14',
                                }}
                            >
                                <span>{w.word}</span>
                                <button
                                    onClick={() => handleDeleteWord(w)}
                                    disabled={deletingId === w.id}
                                    title="Remove"
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        width: '16px', height: '16px', borderRadius: '50%',
                                        background: 'none', border: 'none', padding: 0,
                                        cursor: deletingId === w.id ? 'not-allowed' : 'pointer',
                                        color: deletingId === w.id ? '#B09880' : '#993C1D',
                                        transition: 'color 0.12s',
                                        flexShrink: 0,
                                    }}
                                    onMouseEnter={e => { if (deletingId !== w.id) e.currentTarget.style.color = '#7A2010'; }}
                                    onMouseLeave={e => { if (deletingId !== w.id) e.currentTarget.style.color = '#993C1D'; }}
                                >
                                    {deletingId === w.id
                                        ? <RefreshCw style={{ width: '11px', height: '11px' }} className="animate-spin" />
                                        : <Trash2 style={{ width: '11px', height: '11px' }} />
                                    }
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </Section>
        </div>
    );
};

export default AdminSettings;
