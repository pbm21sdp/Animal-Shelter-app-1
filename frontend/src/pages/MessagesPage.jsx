import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { useAuthStore } from '../store/authStore';

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

function timeAgo(dateStr) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return 'now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `${days}d`;
}

function fmtTime(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
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
    const [conversations, setConversations]   = useState([]);
    const [activeConvId, setActiveConvId]     = useState(null);
    const [messages, setMessages]             = useState([]);
    const [newMessage, setNewMessage]         = useState('');
    const [loading, setLoading]               = useState(true);
    const [sending, setSending]               = useState(false);
    const [hoveredConvId, setHoveredConvId]   = useState(null);
    const messagesEndRef = useRef(null);

    const activeConv = conversations.find(c => c.id === activeConvId) || null;

    useEffect(() => {
        axios.get(`${API}/conversations`, { withCredentials: true })
            .then(r => setConversations(r.data.conversations || []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

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

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10, background: C.cream, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Navbar />

            <div style={{ flex: 1, display: 'flex', overflow: 'hidden', borderTop: `1px solid ${C.border}` }}>

                {/* ── LEFT PANEL ─────────────────────────────────────────── */}
                <div style={{ width: '320px', flexShrink: 0, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '20px', borderBottom: `1px solid ${C.border}` }}>
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
                                                    <span style={{ fontFamily: sans, fontSize: '9px', color: C.muted }}>{timeAgo(conv.last_message_at)}</span>
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
                                                if (!window.confirm('Delete this conversation? It will only be removed for you.')) return;
                                                axios.delete(`${API}/conversations/${conv.id}`, { withCredentials: true })
                                                    .then(() => {
                                                        setConversations(prev => prev.filter(c => c.id !== conv.id));
                                                        if (activeConvId === conv.id) setActiveConvId(null);
                                                    })
                                                    .catch(() => {});
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
                                            re: {activeConv.pet_name}
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => setActiveConvId(null)}
                                    style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontFamily: sans, fontSize: '18px', color: C.muted, padding: '4px 8px', borderRadius: '4px' }}
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
                                        alignSelf: 'flex-end',
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
                            <div style={{ borderTop: `1px solid ${C.border}`, padding: '12px 16px', display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
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
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
