import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { useAuthStore } from '../store/authStore';
import { formatTimeAgo, formatTime } from '../utils/date';

const API  = 'http://localhost:5000/api';
const BASE = 'http://localhost:5000';
const serif = "'Cormorant Garamond', serif";
const sans  = "'DM Sans', sans-serif";

const C = {
    cream:     '#FAF7F4',
    espresso:  '#2D1F14',
    terracotta:'#C07A4A',
    muted:     '#7A5C44',
    border:    'rgba(45,31,20,0.1)',
    borderFaint:'rgba(45,31,20,0.06)',
};


function fmtTime(dateStr) {
    return formatTime(dateStr);
}

function Avatar({ name, avatar, size = 36 }) {
    const initial = (name || '?').charAt(0).toUpperCase();
    const src = avatar
        ? (avatar.startsWith('http') ? avatar : `${BASE}${avatar.startsWith('/') ? avatar : `/${avatar}`}`)
        : null;
    return (
        <div style={{
            width: size, height: size,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #C07A4A, #8B4E28)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, overflow: 'hidden',
        }}>
            {src ? (
                <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                     onError={e => { e.target.style.display = 'none'; }} />
            ) : (
                <span style={{ fontFamily: sans, fontSize: size * 0.38, fontWeight: 700, color: '#fff' }}>{initial}</span>
            )}
        </div>
    );
}

export default function MessagesPage() {
    const { user } = useAuthStore();
    const [searchParams] = useSearchParams();
    const [conversations, setConversations]         = useState([]);
    const [activeConvId, setActiveConvId]           = useState(null);
    const [messages, setMessages]                   = useState([]);
    const [newMessage, setNewMessage]               = useState('');
    const [loading, setLoading]                     = useState(true);
    const [sending, setSending]                     = useState(false);
    const [sendError, setSendError]                 = useState('');
    const [hoveredConvId, setHoveredConvId]         = useState(null);
    const [contractGenerating, setContractGenerating] = useState(false);
    const messagesEndRef = useRef(null);

    // Adopt dialog state
    const [adoptDialog, setAdoptDialog]         = useState(null);
    const [adopterSearch, setAdopterSearch]     = useState('');
    const [adopterResults, setAdopterResults]   = useState([]);
    const [selectedAdopter, setSelectedAdopter] = useState(null);
    const [adopterLoading, setAdopterLoading]   = useState(false);
    const [adoptConfirming, setAdoptConfirming] = useState(false);

    // Delete conversation confirm dialog
    const [deleteConvTarget,   setDeleteConvTarget]   = useState(null);
    const [deletingConv, setDeletingConv] = useState(false);

    const activeConv = conversations.find(c => c.id === activeConvId) || null;

    useEffect(() => {
        axios.get(`${API}/conversations`, { withCredentials: true })
            .then(r => setConversations(r.data.conversations || []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    // Auto-select conversation from URL param ?conv=<id>
    useEffect(() => {
        const convParam = searchParams.get('conv');
        if (convParam && conversations.length > 0) {
            const convId = parseInt(convParam, 10);
            if (conversations.find(c => c.id === convId)) {
                setActiveConvId(convId);
            }
        }
    }, [conversations, searchParams]);

    useEffect(() => {
        if (!activeConvId) { setMessages([]); return; }
        axios.get(`${API}/conversations/${activeConvId}/messages`, { withCredentials: true })
            .then(r => {
                setMessages(r.data.messages || []);
                setConversations(prev => prev.map(c =>
                    c.id === activeConvId ? { ...c, unread_count: 0 } : c
                ));
            })
            .catch(() => {});
    }, [activeConvId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!newMessage.trim() || !activeConvId || sending) return;
        setSending(true);
        setSendError('');
        try {
            await axios.post(`${API}/conversations/${activeConvId}/messages`,
                { content: newMessage.trim() },
                { withCredentials: true }
            );
            const r = await axios.get(`${API}/conversations/${activeConvId}/messages`, { withCredentials: true });
            setMessages(r.data.messages || []);
            setNewMessage('');
            setConversations(prev => prev.map(c =>
                c.id === activeConvId ? { ...c, last_message: newMessage.trim(), last_message_at: new Date().toISOString() } : c
            ));
        } catch (e) {
            setSendError(e.response?.data?.message || 'Failed to send message.');
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // ── Adopt dialog ─────────────────────────────────────────────────────────
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

    const openAdoptDialog = () => {
        if (!activeConv?.pet_id) return;
        setAdoptDialog({ id: activeConv.pet_id, name: activeConv.pet_name });
        if (activeConv.other_user?.name) {
            // Normalize other_user: backend returns `id` but dialog expects `_id`
            const ou = activeConv.other_user;
            setSelectedAdopter({ ...ou, _id: ou._id || ou.id });
            setAdopterSearch(ou.name);
        } else {
            setAdopterSearch('');
        }
        setAdopterResults([]);
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
            setConversations(prev => prev.map(c =>
                c.id === activeConvId ? { ...c, pet_is_adopted: true } : c
            ));
            closeAdoptDialog();
        } catch {
            // ignore — backend returns error if already adopted
        } finally {
            setAdoptConfirming(false);
        }
    };

    const handleGenerateContract = async () => {
        if (!activeConv?.pet_id || contractGenerating) return;
        setContractGenerating(true);
        let petData = null;
        try {
            const r = await axios.get(`${API}/pets/${activeConv.pet_id}`, { withCredentials: true });
            petData = r.data.pet || r.data;
        } catch { /* use fallback below */ }
        const params = new URLSearchParams({
            name:          petData?.name          || activeConv.pet_name || '',
            species:       petData?.type          || '',
            breed:         petData?.breed         || '',
            color:         petData?.color         || '',
            sex:           petData?.sex           || petData?.gender || '',
            age:           petData?.age_category  || '',
            size:          petData?.size          || '',
            coat:          petData?.coat          || '',
            health_status: petData?.health_status || '',
            description:   petData?.description   || '',
            location_city: petData?.location_city || '',
        });
        window.open(`${API}/ai/contract?${params.toString()}`, '_blank');
        setContractGenerating(false);
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10, background: C.cream, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Navbar />

            <div style={{ flex: 1, display: 'flex', overflow: 'hidden', borderTop: `1px solid ${C.border}` }}>

                {/* ── LEFT PANEL ─────────────────────────────────────────── */}
                <div style={{ width: '320px', flexShrink: 0, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', minHeight: '68px', boxSizing: 'border-box' }}>
                        <h1 style={{ fontFamily: serif, fontSize: '22px', fontWeight: 700, color: C.espresso, margin: 0 }}>
                            Messages
                        </h1>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {loading && (
                            <div style={{ padding: '40px 20px', textAlign: 'center', fontFamily: sans, fontSize: '13px', color: C.muted }}>
                                Loading…
                            </div>
                        )}

                        {!loading && conversations.length === 0 && (
                            <div style={{ padding: '60px 20px', textAlign: 'center', fontFamily: sans, fontSize: '13px', fontStyle: 'italic', color: C.muted }}>
                                No messages yet.
                            </div>
                        )}

                        {conversations.map(conv => {
                            const isActive = conv.id === activeConvId;
                            return (
                                <div
                                    key={conv.id}
                                    onClick={() => setActiveConvId(conv.id)}
                                    style={{
                                        padding: '14px 16px',
                                        borderBottom: `1px solid ${C.borderFaint}`,
                                        cursor: 'pointer',
                                        background: isActive ? 'rgba(192,122,74,0.06)' : 'transparent',
                                        transition: 'background 0.12s',
                                        position: 'relative',
                                    }}
                                    onMouseEnter={e => { setHoveredConvId(conv.id); if (!isActive) e.currentTarget.style.background = 'rgba(45,31,20,0.02)'; }}
                                    onMouseLeave={e => { setHoveredConvId(null); if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                                >
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                        <Avatar name={conv.other_user?.name} avatar={conv.other_user?.avatar} />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                                                <span style={{ fontFamily: sans, fontSize: '13px', fontWeight: conv.unread_count > 0 ? 700 : 500, color: C.espresso }}>
                                                    {conv.other_user?.name || 'User'}
                                                </span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, marginLeft: '6px' }}>
                                                    {conv.unread_count > 0 && (
                                                        <span style={{ background: C.terracotta, color: '#fff', fontFamily: sans, fontSize: '9px', fontWeight: 700, borderRadius: '100px', padding: '2px 6px', lineHeight: 1.4 }}>
                                                            {conv.unread_count}
                                                        </span>
                                                    )}
                                                    <span style={{ fontFamily: sans, fontSize: '9px', color: C.muted }}>{formatTimeAgo(conv.last_message_at)}</span>
                                                </div>
                                            </div>
                                            {conv.pet_name && (
                                                <div style={{ fontFamily: sans, fontSize: '10px', color: C.terracotta, marginBottom: '2px' }}>
                                                    re: {conv.pet_name}
                                                </div>
                                            )}
                                            <div style={{ fontFamily: sans, fontSize: '11px', color: C.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                                                {conv.last_message || '—'}
                                            </div>
                                        </div>
                                    </div>
                                    {hoveredConvId === conv.id && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDeleteConvTarget(conv);
                                            }}
                                            style={{
                                                position: 'absolute', bottom: '8px', right: '10px',
                                                background: 'none', border: 'none', cursor: 'pointer',
                                                fontFamily: sans, fontSize: '10px', color: 'rgba(45,31,20,0.35)',
                                                padding: '2px 6px', borderRadius: '4px',
                                                transition: 'color 0.15s, background 0.15s',
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.color = '#993C1D'; e.currentTarget.style.background = 'rgba(153,60,29,0.06)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(45,31,20,0.35)'; e.currentTarget.style.background = 'none'; }}
                                        >
                                            Delete
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── RIGHT PANEL ────────────────────────────────────────── */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    {!activeConvId ? (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '40px' }}>
                            <div style={{ width: '64px', height: '1px', background: C.border }} />
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontFamily: serif, fontSize: '22px', fontStyle: 'italic', color: C.muted, marginBottom: '8px' }}>
                                    Your conversations
                                </div>
                                <div style={{ fontFamily: sans, fontSize: '12px', color: 'rgba(45,31,20,0.4)', lineHeight: 1.7, maxWidth: '280px' }}>
                                    Select a conversation from the left to read and reply to messages about animals you are interested in.
                                </div>
                            </div>
                            <div style={{ width: '64px', height: '1px', background: C.border }} />
                        </div>
                    ) : (
                        <>
                            {/* Header */}
                            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Avatar name={activeConv?.other_user?.name} avatar={activeConv?.other_user?.avatar} />
                                <div>
                                    <div style={{ fontFamily: sans, fontSize: '14px', fontWeight: 700, color: C.espresso }}>
                                        {activeConv?.other_user?.name || 'User'}
                                    </div>
                                    {activeConv?.pet_name && (
                                        <div style={{ fontFamily: sans, fontSize: '11px', color: C.terracotta }}>
                                            {activeConv.is_adoption_request ? '🐾 Adoption request · ' : 're: '}
                                            {activeConv.pet_name}
                                        </div>
                                    )}
                                </div>
                                {activeConv?.is_adoption_request && user?._id === activeConv?.pet_uploader_id && (
                                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                                        {!activeConv.pet_is_adopted && (
                                            <button
                                                onClick={openAdoptDialog}
                                                style={{
                                                    fontFamily: sans, fontSize: '12px', fontWeight: 500,
                                                    color: '#0F6E56',
                                                    background: 'rgba(15,110,86,0.1)',
                                                    border: '1px solid rgba(15,110,86,0.3)',
                                                    borderRadius: '4px',
                                                    padding: '8px 14px',
                                                    cursor: 'pointer',
                                                    transition: 'background 0.15s',
                                                    flexShrink: 0,
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(15,110,86,0.18)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(15,110,86,0.1)'; }}
                                            >
                                                ✓ Mark as adopted
                                            </button>
                                        )}
                                        {activeConv.pet_is_adopted && (
                                            <span style={{ fontFamily: sans, fontSize: '11px', color: '#0F6E56', background: 'rgba(15,110,86,0.08)', border: '1px solid rgba(15,110,86,0.2)', borderRadius: '4px', padding: '8px 12px' }}>
                                                ✓ Adopted
                                            </span>
                                        )}
                                        <button
                                            onClick={handleGenerateContract}
                                            disabled={contractGenerating}
                                            style={{
                                                fontFamily: sans, fontSize: '12px', fontWeight: 500,
                                                color: '#FAF7F4',
                                                background: '#2D1F14',
                                                border: 'none', borderRadius: '4px',
                                                padding: '8px 14px',
                                                cursor: contractGenerating ? 'default' : 'pointer',
                                                opacity: contractGenerating ? 0.6 : 1,
                                                transition: 'background 0.15s',
                                                flexShrink: 0,
                                            }}
                                            onMouseEnter={e => { if (!contractGenerating) e.currentTarget.style.background = '#C07A4A'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = '#2D1F14'; }}
                                        >
                                            {contractGenerating ? 'Generating…' : '📄 Generate Contract'}
                                        </button>
                                    </div>
                                )}
                                <button
                                    onClick={() => setActiveConvId(null)}
                                    style={{ marginLeft: activeConv?.is_adoption_request && user?._id === activeConv?.pet_uploader_id ? '0' : 'auto', background: 'none', border: 'none', cursor: 'pointer', fontFamily: sans, fontSize: '18px', color: C.muted, padding: '4px 8px', borderRadius: '4px' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(45,31,20,0.06)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                >
                                    ×
                                </button>
                            </div>

                            {/* Messages area */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {activeConv?.pet_id && (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '8px 12px',
                                        background: 'rgba(192,122,74,0.06)',
                                        border: '1px solid rgba(192,122,74,0.15)',
                                        borderRadius: '8px',
                                        marginBottom: '12px',
                                        alignSelf: activeConv.participant_one === user?._id ? 'flex-end' : 'flex-start',
                                        maxWidth: '320px',
                                    }}>
                                        {activeConv.pet_photo_id && (
                                            <img
                                                src={`${API}/pets/photos/${activeConv.pet_photo_id}`}
                                                alt={activeConv.pet_name}
                                                style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }}
                                                onError={e => { e.target.style.display = 'none'; }}
                                            />
                                        )}
                                        <div>
                                            <div style={{ fontFamily: sans, fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.1em', color: C.terracotta, marginBottom: '2px' }}>
                                                Re: Animal listing
                                            </div>
                                            <div style={{ fontFamily: serif, fontSize: '13px', fontWeight: 700, color: C.espresso }}>
                                                {activeConv.pet_name || 'Animal'}
                                            </div>
                                            {activeConv.location_city && (
                                                <div style={{ fontFamily: sans, fontSize: '9px', color: C.muted }}>
                                                    📍 {activeConv.location_city}
                                                </div>
                                            )}
                                        </div>
                                        <Link
                                            to={`/pet/${activeConv.pet_id}`}
                                            style={{ marginLeft: 'auto', fontFamily: sans, fontSize: '10px', color: C.terracotta, textDecoration: 'none', flexShrink: 0 }}
                                        >
                                            View listing →
                                        </Link>
                                    </div>
                                )}
                                {messages.map(msg => {
                                    const isOwn = msg.sender_id === user?._id;
                                    return (
                                        <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start' }}>
                                            <div style={{
                                                maxWidth: '70%',
                                                padding: '10px 14px',
                                                borderRadius: isOwn ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                                                background: isOwn ? C.espresso : '#fff',
                                                color: isOwn ? C.cream : C.espresso,
                                                border: isOwn ? 'none' : `1px solid ${C.border}`,
                                                fontFamily: sans, fontSize: '13px', lineHeight: 1.5,
                                                wordBreak: 'break-word',
                                            }}>
                                                {msg.content}
                                            </div>
                                            <span style={{ fontFamily: sans, fontSize: '9px', color: C.muted, marginTop: '3px', textAlign: isOwn ? 'right' : 'left' }}>
                                                {fmtTime(msg.created_at)}
                                            </span>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input area */}
                            <div style={{ borderTop: `1px solid ${C.border}`, padding: '12px 16px' }}>
                            {sendError && (
                                <div style={{
                                    fontFamily: sans, fontSize: '12px', color: '#7A3010',
                                    backgroundColor: 'rgba(201,122,74,0.08)',
                                    border: '1px solid rgba(201,122,74,0.25)',
                                    borderRadius: '6px', padding: '8px 12px',
                                    marginBottom: '8px',
                                }}>
                                    {sendError}
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                                <textarea
                                    rows={2}
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Type a message…"
                                    style={{
                                        flex: 1, border: `1px solid rgba(45,31,20,0.15)`, borderRadius: '8px',
                                        padding: '8px 12px', fontFamily: sans, fontSize: '13px',
                                        color: C.espresso, resize: 'none', outline: 'none', background: '#fff',
                                        lineHeight: 1.5,
                                    }}
                                    onFocus={e => { e.target.style.borderColor = C.terracotta; }}
                                    onBlur={e  => { e.target.style.borderColor = 'rgba(45,31,20,0.15)'; }}
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={sending || !newMessage.trim()}
                                    style={{
                                        background: C.terracotta, color: '#fff',
                                        border: 'none', borderRadius: '8px',
                                        padding: '8px 16px', fontFamily: sans, fontSize: '13px', fontWeight: 500,
                                        cursor: (sending || !newMessage.trim()) ? 'default' : 'pointer',
                                        opacity: (sending || !newMessage.trim()) ? 0.55 : 1,
                                        transition: 'opacity 0.15s', flexShrink: 0,
                                    }}
                                >
                                    Send
                                </button>
                            </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

        {/* ── Delete conversation confirm dialog ── */}
        {deleteConvTarget && (
            <div
                style={{ position: 'fixed', inset: 0, background: 'rgba(45,31,20,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
                onClick={() => { if (!deletingConv) setDeleteConvTarget(null); }}
            >
                <div
                    style={{ background: C.cream, borderRadius: '6px', padding: '32px', maxWidth: '420px', width: '100%' }}
                    onClick={e => e.stopPropagation()}
                >
                    <div style={{ fontFamily: serif, fontSize: '22px', fontWeight: 700, color: C.espresso, marginBottom: '8px' }}>
                        Delete conversation?
                    </div>
                    <div style={{ fontFamily: sans, fontSize: '13px', color: C.muted, marginBottom: '6px', lineHeight: 1.6 }}>
                        Your conversation with <strong style={{ color: C.espresso }}>{deleteConvTarget.other_user?.name || 'this user'}</strong>
                        {deleteConvTarget.pet_name ? <> about <em>{deleteConvTarget.pet_name}</em></> : ''} will be removed.
                    </div>
                    <div style={{ fontFamily: sans, fontSize: '12px', color: '#B09880', marginBottom: '24px' }}>
                        This only removes it for you — the other person's copy stays intact.
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={() => setDeleteConvTarget(null)} disabled={deletingConv}
                            style={{ flex: 1, fontFamily: sans, fontSize: '12px', padding: '10px', border: '1px solid rgba(45,31,20,0.2)', borderRadius: '3px', background: 'transparent', color: C.muted, cursor: deletingConv ? 'default' : 'pointer' }}
                        >
                            Cancel
                        </button>
                        <button
                            disabled={deletingConv}
                            onClick={async () => {
                                setDeletingConv(true);
                                try {
                                    await axios.delete(`${API}/conversations/${deleteConvTarget.id}`, { withCredentials: true });
                                    setConversations(prev => prev.filter(c => c.id !== deleteConvTarget.id));
                                    if (activeConvId === deleteConvTarget.id) setActiveConvId(null);
                                    setDeleteConvTarget(null);
                                } catch {
                                    /* ignore */
                                } finally {
                                    setDeletingConv(false);
                                }
                            }}
                            style={{ flex: 2, fontFamily: sans, fontSize: '12px', padding: '10px', border: 'none', borderRadius: '3px', background: '#993C1D', color: '#fff', cursor: deletingConv ? 'default' : 'pointer', opacity: deletingConv ? 0.6 : 1 }}
                        >
                            {deletingConv ? 'Deleting…' : 'Yes, delete for me'}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* ── Adopter selection dialog ──────────────────────────────────────── */}
        {adoptDialog && (
            <div
                style={{ position: 'fixed', inset: 0, background: 'rgba(45,31,20,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
                onClick={closeAdoptDialog}
            >
                <div
                    style={{ background: '#FAF7F4', borderRadius: '6px', padding: '32px', maxWidth: '480px', width: '100%' }}
                    onClick={e => e.stopPropagation()}
                >
                    <div style={{ fontFamily: serif, fontSize: '22px', fontWeight: 700, color: '#2D1F14', marginBottom: '6px' }}>
                        Who adopted {adoptDialog.name}?
                    </div>
                    <div style={{ fontFamily: sans, fontSize: '13px', color: '#7A5C44', marginBottom: '20px', lineHeight: 1.5 }}>
                        Search for the person who adopted this animal, or skip if they're not on Paws.
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
