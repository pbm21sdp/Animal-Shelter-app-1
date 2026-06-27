import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, X, RefreshCw, ChevronUp } from 'lucide-react';
import AdminModal from './shared/AdminModal';

const API = 'http://localhost:5000/api';

const C = {
    espresso:   '#2D1F14',
    terracotta: '#C07A4A',
    muted:      '#7A5C44',
    lightMuted: '#B09880',
    border:     'rgba(45,31,20,0.12)',
    red:        '#C0392B',
    cream:      '#FAF7F4',
};
const sans  = "'DM Sans', sans-serif";
const serif = "'Cormorant Garamond', serif";

const CATEGORIES = [
    { value: 'transparency',        label: 'Transparency'        },
    { value: 'announcement',        label: 'Announcement'        },
    { value: 'urgent_appeal',       label: 'Urgent Appeal'       },
    { value: 'community_spotlight', label: 'Community Spotlight' },
    { value: 'safety_awareness',    label: 'Safety & Awareness'  },
];

const CATEGORY_COLORS = {
    transparency:        '#2D6A4F',
    announcement:        '#C07A4A',
    urgent_appeal:       '#C0392B',
    community_spotlight: '#8B5CF6',
    safety_awareness:    '#1D6FA4',
};

const EMPTY_FORM = { title: '', content: '', category: 'announcement', photos: [] };

function Field({ label, children }) {
    return (
        <div>
            <label style={{ display: 'block', fontFamily: sans, fontSize: '11px', fontWeight: 600, color: C.muted, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {label}
            </label>
            {children}
        </div>
    );
}

function inputCss(extra = {}) {
    return {
        width: '100%', boxSizing: 'border-box',
        fontFamily: sans, fontSize: '13px', color: C.espresso,
        border: `1px solid ${C.border}`, borderRadius: '6px',
        padding: '7px 10px', backgroundColor: '#FFFAF7',
        outline: 'none', ...extra,
    };
}

function InlineForm({ editPost, onCancel, onSaved }) {
    const [form,   setForm]   = useState(editPost
        ? { title: editPost.title, content: editPost.content, category: editPost.category, photos: [] }
        : EMPTY_FORM
    );
    const [saving, setSaving] = useState(false);
    const [error,  setError]  = useState('');

    async function handleSave() {
        if (!form.title.trim() || !form.content.trim()) { setError('Title and content are required.'); return; }
        setSaving(true); setError('');
        try {
            if (editPost) {
                await axios.put(
                    `${API}/forum/posts/${editPost.id}`,
                    { title: form.title, content: form.content, category: form.category },
                    { withCredentials: true }
                );
            } else {
                const fd = new FormData();
                fd.append('title', form.title);
                fd.append('content', form.content);
                fd.append('category', form.category);
                for (const f of form.photos) fd.append('photos', f);
                await axios.post(`${API}/forum/posts`, fd, {
                    withCredentials: true,
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            }
            onSaved();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save post.');
            setSaving(false);
        }
    }

    return (
        <div style={{
            border: `1px solid ${C.border}`,
            borderRadius: '8px',
            backgroundColor: '#FFFAF7',
            padding: '20px',
            marginBottom: '20px',
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontFamily: serif, fontSize: '18px', fontWeight: 600, color: C.espresso }}>
                    {editPost ? 'Edit Post' : 'New Forum Post'}
                </span>
                <button onClick={onCancel} style={{ border: 'none', background: 'none', cursor: 'pointer', color: C.lightMuted, display: 'flex', alignItems: 'center' }}>
                    <ChevronUp size={18} />
                </button>
            </div>

            {error && (
                <div style={{ backgroundColor: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.2)', borderRadius: '6px', padding: '8px 12px', fontFamily: sans, fontSize: '12px', color: C.red, marginBottom: '14px' }}>
                    {error}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <Field label="Category">
                    <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={inputCss()}>
                        {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                </Field>
                <Field label="Title">
                    <input
                        type="text" maxLength={150}
                        value={form.title}
                        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                        placeholder="Post title…"
                        style={inputCss()}
                    />
                </Field>
            </div>

            <Field label="Content">
                <textarea
                    value={form.content}
                    onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                    placeholder="Write the post content…"
                    rows={5}
                    style={inputCss({ resize: 'vertical', minHeight: '100px', marginBottom: '12px' })}
                />
            </Field>

            {!editPost && (
                <Field label="Photos (optional)">
                    <input
                        type="file" multiple accept="image/*"
                        onChange={e => setForm(f => ({ ...f, photos: Array.from(e.target.files) }))}
                        style={{ fontFamily: sans, fontSize: '12px', color: C.muted, marginTop: '2px' }}
                    />
                    {form.photos.length > 0 && (
                        <div style={{ fontFamily: sans, fontSize: '11px', color: C.lightMuted, marginTop: '3px' }}>
                            {form.photos.length} file{form.photos.length > 1 ? 's' : ''} selected
                        </div>
                    )}
                </Field>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                <button onClick={onCancel} style={{ padding: '7px 16px', borderRadius: '6px', border: `1px solid ${C.border}`, background: 'transparent', cursor: 'pointer', fontFamily: sans, fontSize: '12px', color: C.muted }}>
                    Cancel
                </button>
                <button
                    onClick={handleSave} disabled={saving}
                    style={{ padding: '7px 18px', borderRadius: '6px', border: 'none', background: saving ? C.lightMuted : C.terracotta, cursor: saving ? 'default' : 'pointer', fontFamily: sans, fontSize: '12px', fontWeight: 500, color: '#fff' }}
                >
                    {saving ? 'Saving…' : editPost ? 'Save Changes' : 'Publish Post'}
                </button>
            </div>
        </div>
    );
}

const LIMIT = 10;

export default function ForumManagement() {
    const [posts,        setPosts]        = useState([]);
    const [total,        setTotal]        = useState(0);
    const [page,         setPage]         = useState(1);
    const [loading,      setLoading]      = useState(true);
    const [showForm,     setShowForm]     = useState(false);
    const [editPost,     setEditPost]     = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const fetchPosts = useCallback(async (p = 1) => {
        setLoading(true);
        try {
            const res = await axios.get(`${API}/forum/posts?limit=${LIMIT}&offset=${(p - 1) * LIMIT}`);
            if (res.data.success) { setPosts(res.data.posts); setTotal(res.data.total); }
        } catch { /* ignore */ }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchPosts(page); }, [page, fetchPosts]);

    function openCreate() { setEditPost(null); setShowForm(true); }
    function openEdit(post) { setEditPost(post); setShowForm(true); }
    function closeForm() { setShowForm(false); setEditPost(null); }
    function handleSaved() { closeForm(); fetchPosts(page); }

    async function handleDelete() {
        if (!deleteTarget) return;
        try { await axios.delete(`${API}/forum/posts/${deleteTarget.id}`, { withCredentials: true }); }
        catch { /* ignore */ }
        finally { setDeleteTarget(null); fetchPosts(page); }
    }

    const totalPages = Math.max(1, Math.ceil(total / LIMIT));

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontFamily: serif, fontSize: '24px', fontWeight: 700, color: C.espresso, margin: 0 }}>
                    Forum Posts
                </h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={() => fetchPosts(page)}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', borderRadius: '6px', border: `1px solid ${C.border}`, background: 'transparent', cursor: 'pointer', fontFamily: sans, fontSize: '12px', color: C.muted }}
                    >
                        <RefreshCw size={13} /> Refresh
                    </button>
                    {!showForm && (
                        <button
                            onClick={openCreate}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '6px', border: 'none', background: C.terracotta, cursor: 'pointer', fontFamily: sans, fontSize: '12px', fontWeight: 500, color: '#fff' }}
                        >
                            <Plus size={13} /> New Post
                        </button>
                    )}
                </div>
            </div>

            {/* Inline create / edit form */}
            {showForm && (
                <InlineForm editPost={editPost} onCancel={closeForm} onSaved={handleSaved} />
            )}

            {/* Table */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', fontFamily: sans, fontSize: '13px', color: C.lightMuted }}>Loading…</div>
            ) : posts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', fontFamily: serif, fontSize: '18px', color: C.muted }}>
                    No posts yet. Create the first one!
                </div>
            ) : (
                <div style={{ border: `1px solid ${C.border}`, borderRadius: '8px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: sans }}>
                        <thead>
                            <tr style={{ backgroundColor: 'rgba(45,31,20,0.04)' }}>
                                {['Title', 'Category', 'Date', ''].map(h => (
                                    <th key={h} style={{ padding: '10px 14px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.muted, textAlign: 'left', borderBottom: `1px solid ${C.border}` }}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {posts.map((post, i) => (
                                <tr key={post.id} style={{ backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(45,31,20,0.015)' }}>
                                    <td style={{ padding: '11px 14px', fontSize: '13px', color: C.espresso, fontWeight: 500, maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {post.title}
                                    </td>
                                    <td style={{ padding: '11px 14px' }}>
                                        <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: CATEGORY_COLORS[post.category] || C.muted, backgroundColor: (CATEGORY_COLORS[post.category] || C.muted) + '18', padding: '2px 7px', borderRadius: '3px' }}>
                                            {CATEGORIES.find(c => c.value === post.category)?.label || post.category}
                                        </span>
                                    </td>
                                    <td style={{ padding: '11px 14px', fontSize: '12px', color: C.lightMuted, whiteSpace: 'nowrap' }}>
                                        {new Date(post.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td style={{ padding: '11px 14px' }}>
                                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                            <button onClick={() => openEdit(post)} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 9px', borderRadius: '5px', border: `1px solid ${C.border}`, background: 'transparent', cursor: 'pointer', fontFamily: sans, fontSize: '11px', color: C.muted }}>
                                                <Edit size={11} /> Edit
                                            </button>
                                            <button onClick={() => setDeleteTarget(post)} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 9px', borderRadius: '5px', border: `1px solid rgba(192,57,43,0.3)`, background: 'transparent', cursor: 'pointer', fontFamily: sans, fontSize: '11px', color: C.red }}>
                                                <Trash2 size={11} /> Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', paddingTop: '20px' }}>
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ fontFamily: sans, fontSize: '12px', padding: '5px 12px', borderRadius: '4px', border: `1px solid ${C.border}`, background: 'transparent', cursor: page === 1 ? 'default' : 'pointer', color: page === 1 ? C.lightMuted : C.muted }}>← Prev</button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                        <button key={p} onClick={() => setPage(p)} style={{ fontFamily: sans, fontSize: '12px', padding: '5px 10px', borderRadius: '4px', border: `1px solid ${p === page ? C.terracotta : C.border}`, background: p === page ? 'rgba(192,122,74,0.1)' : 'transparent', color: p === page ? C.terracotta : C.muted, fontWeight: p === page ? 600 : 400, cursor: 'pointer' }}>{p}</button>
                    ))}
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ fontFamily: sans, fontSize: '12px', padding: '5px 12px', borderRadius: '4px', border: `1px solid ${C.border}`, background: 'transparent', cursor: page === totalPages ? 'default' : 'pointer', color: page === totalPages ? C.lightMuted : C.muted }}>Next →</button>
                </div>
            )}

            {/* Delete Confirm Modal */}
            <AdminModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Post" size="sm">
                <div style={{ padding: '20px' }}>
                    <p style={{ fontFamily: sans, fontSize: '13px', color: C.muted, margin: '0 0 20px' }}>
                        Are you sure you want to delete <strong style={{ color: C.espresso }}>{deleteTarget?.title}</strong>? This will also remove all associated photos and cannot be undone.
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button onClick={() => setDeleteTarget(null)} style={{ padding: '7px 16px', borderRadius: '6px', border: `1px solid ${C.border}`, background: 'transparent', cursor: 'pointer', fontFamily: sans, fontSize: '13px', color: C.muted }}>
                            Cancel
                        </button>
                        <button onClick={handleDelete} style={{ padding: '7px 18px', borderRadius: '6px', border: 'none', background: C.red, cursor: 'pointer', fontFamily: sans, fontSize: '13px', fontWeight: 500, color: '#fff' }}>
                            Yes, Delete
                        </button>
                    </div>
                </div>
            </AdminModal>
        </div>
    );
}
