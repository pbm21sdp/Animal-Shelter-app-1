import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { formatDate } from '../utils/date';
import Navbar from '../components/Navbar';
import { useAuthStore } from '../store/authStore';
import { Plus, ChevronUp } from 'lucide-react';

const API = 'http://localhost:5000/api';

const C = {
    cream:      '#FAF7F4',
    espresso:   '#2D1F14',
    terracotta: '#C07A4A',
    muted:      '#7A5C44',
    lightMuted: '#B09880',
    border:     'rgba(45,31,20,0.12)',
};
const serif = "'Cormorant Garamond', serif";
const sans  = "'DM Sans', sans-serif";

const VALID_CATEGORIES = ['transparency', 'announcement', 'urgent_appeal', 'community_spotlight', 'safety_awareness'];

const CATEGORIES = [
    { key: '',                    label: 'All',                  color: C.espresso,   bg: 'rgba(45,31,20,0.08)'   },
    { key: 'transparency',        label: 'Transparency',         color: '#2D6A4F',     bg: 'rgba(45,106,79,0.1)'   },
    { key: 'announcement',        label: 'Announcements',        color: '#C07A4A',     bg: 'rgba(192,122,74,0.12)' },
    { key: 'urgent_appeal',       label: 'Urgent Appeals',       color: '#C0392B',     bg: 'rgba(192,57,43,0.1)'   },
    { key: 'community_spotlight', label: 'Community Spotlight',  color: '#8B5CF6',     bg: 'rgba(139,92,246,0.1)'  },
    { key: 'safety_awareness',    label: 'Safety & Awareness',   color: '#1D6FA4',     bg: 'rgba(29,111,164,0.1)'  },
];

function categoryMeta(key) {
    return CATEGORIES.find(c => c.key === key) || CATEGORIES[0];
}

function CategoryBadge({ category }) {
    const meta = categoryMeta(category);
    return (
        <span style={{
            display: 'inline-block',
            fontFamily: sans,
            fontSize: '10px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: meta.color,
            backgroundColor: meta.bg,
            padding: '3px 8px',
            borderRadius: '4px',
        }}>
            {meta.label}
        </span>
    );
}

const CATEGORY_LABELS = {
    transparency:        'Transparency',
    announcement:        'Announcement',
    urgent_appeal:       'Urgent Appeal',
    community_spotlight: 'Community Spotlight',
    safety_awareness:    'Safety & Awareness',
};

function AdminCreateForm({ onCreated }) {
    const [open,   setOpen]   = useState(false);
    const [form,   setForm]   = useState({ title: '', content: '', category: 'announcement', photos: [] });
    const [saving, setSaving] = useState(false);
    const [error,  setError]  = useState('');

    async function handleSubmit() {
        if (!form.title.trim() || !form.content.trim()) { setError('Title and content are required.'); return; }
        setSaving(true); setError('');
        try {
            const fd = new FormData();
            fd.append('title', form.title);
            fd.append('content', form.content);
            fd.append('category', form.category);
            for (const f of form.photos) fd.append('photos', f);
            await axios.post(`${API}/forum/posts`, fd, {
                withCredentials: true,
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setOpen(false);
            setForm({ title: '', content: '', category: 'announcement', photos: [] });
            onCreated();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create post.');
            setSaving(false);
        }
    }

    if (!open) {
        return (
            <button
                onClick={() => setOpen(true)}
                style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    fontFamily: sans, fontSize: '12px', fontWeight: 500,
                    color: '#fff', backgroundColor: C.terracotta,
                    border: 'none', borderRadius: '6px',
                    padding: '8px 16px', cursor: 'pointer',
                }}
            >
                <Plus size={14} /> Add article
            </button>
        );
    }

    return (
        <div style={{
            border: `1px solid ${C.border}`, borderRadius: '8px',
            backgroundColor: '#FFFAF7', padding: '18px', marginTop: '16px',
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontFamily: serif, fontSize: '18px', fontWeight: 600, color: C.espresso }}>New post</span>
                <button onClick={() => setOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: C.lightMuted }}>
                    <ChevronUp size={18} />
                </button>
            </div>

            {error && (
                <div style={{ backgroundColor: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.2)', borderRadius: '5px', padding: '7px 10px', fontFamily: sans, fontSize: '12px', color: '#C0392B', marginBottom: '12px' }}>
                    {error}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                    <label style={{ display: 'block', fontFamily: sans, fontSize: '10px', fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '3px' }}>Category</label>
                    <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                        style={{ width: '100%', fontFamily: sans, fontSize: '13px', color: C.espresso, border: `1px solid ${C.border}`, borderRadius: '5px', padding: '6px 9px', backgroundColor: '#FFFAF7', outline: 'none', boxSizing: 'border-box' }}>
                        {VALID_CATEGORIES.map(v => <option key={v} value={v}>{CATEGORY_LABELS[v]}</option>)}
                    </select>
                </div>
                <div>
                    <label style={{ display: 'block', fontFamily: sans, fontSize: '10px', fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '3px' }}>Title</label>
                    <input type="text" maxLength={150} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Post title…"
                        style={{ width: '100%', fontFamily: sans, fontSize: '13px', color: C.espresso, border: `1px solid ${C.border}`, borderRadius: '5px', padding: '6px 9px', backgroundColor: '#FFFAF7', outline: 'none', boxSizing: 'border-box' }} />
                </div>
            </div>

            <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontFamily: sans, fontSize: '10px', fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '3px' }}>Content</label>
                <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Write the post content…" rows={5}
                    style={{ width: '100%', fontFamily: sans, fontSize: '13px', color: C.espresso, border: `1px solid ${C.border}`, borderRadius: '5px', padding: '6px 9px', backgroundColor: '#FFFAF7', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontFamily: sans, fontSize: '10px', fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '3px' }}>Photos (optional)</label>
                <input type="file" multiple accept="image/*" onChange={e => setForm(f => ({ ...f, photos: Array.from(e.target.files) }))}
                    style={{ fontFamily: sans, fontSize: '12px', color: C.muted }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button onClick={() => setOpen(false)} style={{ padding: '6px 14px', borderRadius: '5px', border: `1px solid ${C.border}`, background: 'transparent', cursor: 'pointer', fontFamily: sans, fontSize: '12px', color: C.muted }}>
                    Cancel
                </button>
                <button onClick={handleSubmit} disabled={saving}
                    style={{ padding: '6px 16px', borderRadius: '5px', border: 'none', background: saving ? C.lightMuted : C.terracotta, cursor: saving ? 'default' : 'pointer', fontFamily: sans, fontSize: '12px', fontWeight: 500, color: '#fff' }}>
                    {saving ? 'Publishing…' : 'Publish'}
                </button>
            </div>
        </div>
    );
}

function PostCard({ post }) {
    const excerpt = post.content.length > 150
        ? post.content.slice(0, 150) + '…'
        : post.content;

    return (
        <Link to={`/forum/${post.id}`} style={{ textDecoration: 'none', display: 'block' }}>
            <div
                style={{
                    display: 'flex',
                    gap: '16px',
                    padding: '20px 0',
                    borderBottom: `1px solid ${C.border}`,
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(192,122,74,0.03)'; e.currentTarget.style.margin = '0 -16px'; e.currentTarget.style.padding = '20px 16px'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.margin = '0'; e.currentTarget.style.padding = '20px 0'; }}
            >
                {post.primary_photo_id && (
                    <img
                        src={`${API}/forum/posts/${post.id}/photos/${post.primary_photo_id}`}
                        alt=""
                        style={{ width: '88px', height: '72px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }}
                    />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <CategoryBadge category={post.category} />
                        <span style={{ fontFamily: sans, fontSize: '10px', color: C.lightMuted }}>
                            {formatDate(post.created_at, 'short')}
                        </span>
                    </div>
                    <div style={{ fontFamily: serif, fontSize: '18px', fontWeight: 700, color: C.espresso, lineHeight: 1.3, marginBottom: '6px' }}>
                        {post.title}
                    </div>
                    <div style={{ fontFamily: sans, fontSize: '12px', color: C.muted, lineHeight: 1.65 }}>
                        {excerpt}
                    </div>
                </div>
            </div>
        </Link>
    );
}

const LIMIT = 8;

export default function ForumPage() {
    const { user } = useAuthStore();
    const isAdmin = user?.isAdmin === true;

    const [posts,     setPosts]     = useState([]);
    const [total,     setTotal]     = useState(0);
    const [page,      setPage]      = useState(1);
    const [category,  setCategory]  = useState('');
    const [loading,   setLoading]   = useState(true);

    const fetchPosts = useCallback(async (cat, p) => {
        setLoading(true);
        try {
            const offset = (p - 1) * LIMIT;
            const params = new URLSearchParams({ limit: LIMIT, offset });
            if (cat) params.set('category', cat);
            const res = await axios.get(`${API}/forum/posts?${params}`);
            if (res.data.success) {
                setPosts(res.data.posts);
                setTotal(res.data.total);
            }
        } catch {
            /* ignore */
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPosts(category, page);
    }, [category, page, fetchPosts]);

    const totalPages = Math.max(1, Math.ceil(total / LIMIT));

    function handleCategoryChange(key) {
        setCategory(key);
        setPage(1);
    }

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, backgroundColor: C.cream, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            <Navbar />

            {/* Header */}
            <div style={{
                textAlign: 'center',
                padding: '40px 24px 28px',
                borderBottom: `3px double rgba(45,31,20,0.2)`,
            }}>
                <div style={{ fontFamily: sans, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.14em', color: C.lightMuted, marginBottom: '6px' }}>
                    Community
                </div>
                <div style={{ fontFamily: serif, fontSize: '36px', fontWeight: 700, color: C.espresso, lineHeight: 1 }}>
                    Paws Forum
                </div>
                <div style={{ fontFamily: serif, fontSize: '15px', fontStyle: 'italic', color: C.muted, marginTop: '6px' }}>
                    Transparency, announcements, and stories from the people running Paws.
                </div>
            </div>

            {/* Category tabs + admin button */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '14px 24px',
                borderBottom: `1px solid ${C.border}`,
                overflowX: 'auto',
                flexWrap: 'wrap',
            }}>
                {CATEGORIES.map(cat => {
                    const active = category === cat.key;
                    return (
                        <button
                            key={cat.key}
                            onClick={() => handleCategoryChange(cat.key)}
                            style={{
                                fontFamily: sans,
                                fontSize: '11px',
                                fontWeight: active ? 600 : 400,
                                color: active ? cat.color : C.muted,
                                backgroundColor: active ? cat.bg : 'transparent',
                                border: `1px solid ${active ? cat.color + '44' : C.border}`,
                                borderRadius: '20px',
                                padding: '5px 14px',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {cat.label}
                        </button>
                    );
                })}
                {/* Spacer pushes admin button to the right */}
                {isAdmin && <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
                    <AdminCreateForm onCreated={() => fetchPosts(1)} />
                </div>}
            </div>

            {/* Posts list */}
            <div style={{ maxWidth: '760px', margin: '0 auto', width: '100%', padding: '0 24px 40px' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', fontFamily: sans, fontSize: '13px', color: C.lightMuted }}>
                        Loading…
                    </div>
                ) : posts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', fontFamily: serif, fontSize: '20px', color: C.muted }}>
                        No posts yet in this category.
                    </div>
                ) : (
                    posts.map(post => <PostCard key={post.id} post={post} />)
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', paddingTop: '32px' }}>
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            style={{
                                fontFamily: sans, fontSize: '12px',
                                padding: '6px 14px', borderRadius: '4px',
                                border: `1px solid ${C.border}`,
                                backgroundColor: 'transparent', cursor: page === 1 ? 'default' : 'pointer',
                                color: page === 1 ? C.lightMuted : C.muted,
                            }}
                        >
                            ← Prev
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                            <button
                                key={p}
                                onClick={() => setPage(p)}
                                style={{
                                    fontFamily: sans, fontSize: '12px',
                                    padding: '6px 12px', borderRadius: '4px',
                                    border: `1px solid ${p === page ? C.terracotta : C.border}`,
                                    backgroundColor: p === page ? 'rgba(192,122,74,0.1)' : 'transparent',
                                    color: p === page ? C.terracotta : C.muted,
                                    fontWeight: p === page ? 600 : 400,
                                    cursor: 'pointer',
                                }}
                            >
                                {p}
                            </button>
                        ))}
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            style={{
                                fontFamily: sans, fontSize: '12px',
                                padding: '6px 14px', borderRadius: '4px',
                                border: `1px solid ${C.border}`,
                                backgroundColor: 'transparent', cursor: page === totalPages ? 'default' : 'pointer',
                                color: page === totalPages ? C.lightMuted : C.muted,
                            }}
                        >
                            Next →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
