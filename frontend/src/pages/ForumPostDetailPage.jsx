import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { ArrowLeft } from 'lucide-react';

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

const CATEGORY_META = {
    transparency:        { label: 'Transparency',         color: '#2D6A4F', bg: 'rgba(45,106,79,0.1)'   },
    announcement:        { label: 'Announcements',        color: '#C07A4A', bg: 'rgba(192,122,74,0.12)' },
    urgent_appeal:       { label: 'Urgent Appeal',        color: '#C0392B', bg: 'rgba(192,57,43,0.1)'   },
    community_spotlight: { label: 'Community Spotlight',  color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)'  },
    safety_awareness:    { label: 'Safety & Awareness',   color: '#1D6FA4', bg: 'rgba(29,111,164,0.1)'  },
};

export default function ForumPostDetailPage() {
    const { id } = useParams();
    const [post,    setPost]    = useState(null);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState('');

    useEffect(() => {
        axios.get(`${API}/forum/posts/${id}`)
            .then(res => {
                if (res.data.success) setPost(res.data.post);
                else setError('Post not found');
            })
            .catch(() => setError('Could not load this post.'))
            .finally(() => setLoading(false));
    }, [id]);

    const meta = post ? (CATEGORY_META[post.category] || { label: post.category, color: C.muted, bg: C.border }) : null;

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, backgroundColor: C.cream, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            <Navbar />

            <div style={{ maxWidth: '720px', margin: '0 auto', width: '100%', padding: '32px 24px 64px' }}>
                <Link
                    to="/forum"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontFamily: sans, fontSize: '12px', color: C.muted, textDecoration: 'none', marginBottom: '28px' }}
                >
                    <ArrowLeft size={14} /> Back to Forum
                </Link>

                {loading && (
                    <div style={{ textAlign: 'center', padding: '60px 0', fontFamily: sans, fontSize: '13px', color: C.lightMuted }}>
                        Loading…
                    </div>
                )}

                {error && (
                    <div style={{ textAlign: 'center', padding: '60px 0', fontFamily: serif, fontSize: '20px', color: C.muted }}>
                        {error}
                    </div>
                )}

                {post && (
                    <>
                        {/* Category badge + date */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                            <span style={{
                                fontFamily: sans, fontSize: '10px', fontWeight: 600,
                                textTransform: 'uppercase', letterSpacing: '0.1em',
                                color: meta.color, backgroundColor: meta.bg,
                                padding: '3px 8px', borderRadius: '4px',
                            }}>
                                {meta.label}
                            </span>
                            <span style={{ fontFamily: sans, fontSize: '11px', color: C.lightMuted }}>
                                {new Date(post.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                                {post.updated_at !== post.created_at && ' · edited'}
                            </span>
                        </div>

                        {/* Title */}
                        <h1 style={{ fontFamily: serif, fontSize: '34px', fontWeight: 700, color: C.espresso, lineHeight: 1.25, margin: '0 0 20px' }}>
                            {post.title}
                        </h1>

                        {/* Divider */}
                        <div style={{ height: '1px', backgroundColor: C.border, margin: '0 0 28px' }} />

                        {/* Photos */}
                        {post.photos && post.photos.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
                                {post.photos.map(photo => (
                                    <img
                                        key={photo.id}
                                        src={`${API}/forum/posts/${post.id}/photos/${photo.id}`}
                                        alt=""
                                        style={{ width: '100%', borderRadius: '6px', objectFit: 'cover' }}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Content */}
                        <div style={{
                            fontFamily: sans, fontSize: '14px', color: C.espresso,
                            lineHeight: 1.8, whiteSpace: 'pre-wrap',
                        }}>
                            {post.content}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
