import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, MessageCircle, Bell } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { formatTimeAgo } from '../utils/date';
import axios from 'axios';

const BASE_URL = 'http://localhost:5000';
const API      = 'http://localhost:5000/api';

export default function Navbar() {
    const { user, logout } = useAuthStore();
    const isAuthenticated = !!user;
    const navigate  = useNavigate();
    const location  = useLocation();

    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [searchValue, setSearchValue]                 = useState('');
    const [unreadCount, setUnreadCount]                 = useState(0);

    // ── Notifications state ──────────────────────────────────────────────────
    const [notifUnread, setNotifUnread]           = useState(0);
    const [showNotifDropdown, setShowNotifDropdown] = useState(false);
    const [notifications, setNotifications]       = useState([]);
    const [notifLoading, setNotifLoading]         = useState(false);
    const notifRef   = useRef(null);
    const profileRef = useRef(null);

    // ── Unread messages polling ──────────────────────────────────────────────
    useEffect(() => {
        if (!isAuthenticated) { setUnreadCount(0); return; }
        const fetchUnread = async () => {
            try {
                const r = await axios.get(`${API}/conversations/unread-count`, { withCredentials: true });
                setUnreadCount(r.data.count || 0);
            } catch (e) {}
        };
        fetchUnread();
        const interval = setInterval(fetchUnread, 30000);
        return () => clearInterval(interval);
    }, [isAuthenticated]);

    // ── Notification unread count polling ───────────────────────────────────
    useEffect(() => {
        if (!isAuthenticated) { setNotifUnread(0); return; }
        const fetchNotifUnread = async () => {
            try {
                const r = await axios.get(`${API}/notifications/unread-count`, { withCredentials: true });
                setNotifUnread(r.data.count || 0);
            } catch (e) {}
        };
        fetchNotifUnread();
        const interval = setInterval(fetchNotifUnread, 30000);
        return () => clearInterval(interval);
    }, [isAuthenticated]);

    // ── Click-outside: close both dropdowns ─────────────────────────────────
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (showNotifDropdown && notifRef.current && !notifRef.current.contains(e.target)) {
                setShowNotifDropdown(false);
            }
            if (showProfileDropdown && profileRef.current && !profileRef.current.contains(e.target)) {
                setShowProfileDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showNotifDropdown, showProfileDropdown]);

    // ── Helpers ──────────────────────────────────────────────────────────────
    const getAvatarUrl = (url) => {
        if (!url) return '/default-avatar.png';
        if (url.startsWith('http')) return url;
        const formatted = url.startsWith('/') ? url : `/${url}`;
        return `${BASE_URL}${formatted}?t=${Date.now()}`;
    };

    const isActive = (path) => location.pathname === path;

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter' && searchValue.trim()) {
            navigate(`/animals?search=${encodeURIComponent(searchValue.trim())}`);
            setSearchValue('');
        }
    };

    // ── Notification actions ─────────────────────────────────────────────────
    const openNotifDropdown = async () => {
        setShowNotifDropdown(true);
        setShowProfileDropdown(false);
        setNotifLoading(true);
        try {
            const r = await axios.get(`${API}/notifications?limit=20`, { withCredentials: true });
            setNotifications(r.data.notifications || []);
        } catch (e) {}
        finally { setNotifLoading(false); }
    };

    const toggleNotifDropdown = () => {
        if (showNotifDropdown) {
            setShowNotifDropdown(false);
        } else {
            openNotifDropdown();
        }
    };

    const handleNotifClick = async (notif) => {
        if (!notif.is_read) {
            try {
                await axios.patch(`${API}/notifications/${notif.id}/read`, {}, { withCredentials: true });
                setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
                setNotifUnread(prev => Math.max(0, prev - 1));
            } catch (e) {}
        }
        setShowNotifDropdown(false);
        if (notif.related_animal_id) {
            navigate(`/pet/${notif.related_animal_id}`);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await axios.patch(`${API}/notifications/read-all`, {}, { withCredentials: true });
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setNotifUnread(0);
        } catch (e) {}
    };

    const navLinks = [
        { to: '/',           label: 'Home' },
        { to: '/animals',    label: 'Animals' },
        { to: '/map',        label: 'Map' },
        { to: '/my-animals', label: 'My Animals' },
        { to: '/about',      label: 'About' },
    ];

    const dropdownLinks = [
        { to: '/profile',  label: 'Profile' },
        { to: '/messages', label: 'Messages' },
    ];

    return (
        <header style={{
            backgroundColor: '#FAF7F4',
            borderBottom: '1px solid rgba(45,31,20,0.12)',
            height: '56px',
            padding: '0 40px',
            display: 'flex',
            alignItems: 'center',
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            flexShrink: 0,
        }}>
            {/* Logo */}
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '7px', textDecoration: 'none', outline: 'none', flexShrink: 0, marginRight: '36px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#C07A4A', display: 'inline-block', flexShrink: 0 }} />
                <span style={{ fontFamily: "'Cormorant Garamond', serif", color: '#2D1F14', fontWeight: 700, fontSize: '20px', letterSpacing: '0.01em' }}>Paws</span>
            </Link>

            {/* Nav links */}
            <nav style={{ display: 'flex', alignItems: 'center', gap: '28px', flexShrink: 0 }}>
                {navLinks.map(({ to, label }) => (
                    <Link
                        key={label}
                        to={to}
                        style={{
                            fontFamily: "'DM Sans', sans-serif",
                            color: isActive(to) ? '#C07A4A' : '#7A5C44',
                            fontSize: '13px',
                            fontWeight: isActive(to) ? 500 : 400,
                            textDecoration: 'none',
                            transition: 'color 0.15s',
                            whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={(e) => { if (!isActive(to)) e.currentTarget.style.color = '#2D1F14'; }}
                        onMouseLeave={(e) => { if (!isActive(to)) e.currentTarget.style.color = '#7A5C44'; }}
                    >
                        {label}
                    </Link>
                ))}
            </nav>

            <div style={{ flex: 1 }} />

            {/* Right section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>

                {/* Location pill */}
                <div
                    style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        padding: '5px 12px', borderRadius: '100px',
                        backgroundColor: 'rgba(192,122,74,0.08)',
                        border: '1px solid rgba(192,122,74,0.2)',
                        cursor: 'default', flexShrink: 0,
                    }}
                >
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#8B4E28', whiteSpace: 'nowrap' }}>
                        ◎ {user?.city || 'Somewhere'}
                    </span>
                </div>

                {/* Search bar */}
                <input
                    type="text"
                    placeholder="Search animals..."
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    style={{
                        width: '200px', backgroundColor: '#FAF7F4',
                        border: '1px solid rgba(45,31,20,0.15)', borderRadius: '100px',
                        padding: '6px 14px', fontSize: '12px',
                        fontFamily: "'DM Sans', sans-serif", color: '#7A5C44', outline: 'none',
                    }}
                    onFocus={(e) => { e.target.style.borderColor = '#C07A4A'; }}
                    onBlur={(e)  => { e.target.style.borderColor = 'rgba(45,31,20,0.15)'; }}
                />

                {/* + Add animal */}
                <Link
                    to="/add-animal"
                    style={{
                        backgroundColor: '#2D1F14', color: '#FAF7F4',
                        borderRadius: '100px', fontSize: '12px',
                        fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
                        padding: '7px 16px', textDecoration: 'none',
                        transition: 'opacity 0.15s', whiteSpace: 'nowrap', display: 'inline-block',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.82'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                >
                    + Add animal
                </Link>

                {/* Auth section */}
                {user ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

                        {/* Messages button */}
                        <div style={{ position: 'relative' }}>
                            <button
                                onClick={() => navigate('/messages')}
                                style={{
                                    width: '30px', height: '30px', borderRadius: '50%',
                                    backgroundColor: '#fff', border: '1px solid rgba(45,31,20,0.15)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', padding: 0, flexShrink: 0, transition: 'background-color 0.15s',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(45,31,20,0.04)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fff'; }}
                            >
                                <MessageCircle style={{ width: '14px', height: '14px', color: '#2D1F14' }} />
                            </button>
                            {unreadCount > 0 && (
                                <span style={{
                                    position: 'absolute', top: '-2px', right: '-2px',
                                    minWidth: '14px', height: '14px', borderRadius: '50%',
                                    backgroundColor: '#C07A4A', border: '2px solid #FAF7F4',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontFamily: "'DM Sans', sans-serif", fontSize: '8px',
                                    fontWeight: 600, color: '#FAF7F4', lineHeight: 1, padding: '0 2px',
                                }}>
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </div>

                        {/* Bell notifications button */}
                        <div style={{ position: 'relative' }} ref={notifRef}>
                            <button
                                onClick={toggleNotifDropdown}
                                style={{
                                    width: '30px', height: '30px', borderRadius: '50%',
                                    backgroundColor: showNotifDropdown ? 'rgba(45,31,20,0.06)' : '#fff',
                                    border: '1px solid rgba(45,31,20,0.15)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', padding: 0, flexShrink: 0, transition: 'background-color 0.15s',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(45,31,20,0.04)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = showNotifDropdown ? 'rgba(45,31,20,0.06)' : '#fff'; }}
                            >
                                <Bell style={{ width: '14px', height: '14px', color: '#2D1F14' }} />
                            </button>

                            {/* Unread badge */}
                            {notifUnread > 0 && (
                                <span style={{
                                    position: 'absolute', top: '-2px', right: '-2px',
                                    minWidth: '14px', height: '14px', borderRadius: '50%',
                                    backgroundColor: '#993C1D', border: '2px solid #FAF7F4',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontFamily: "'DM Sans', sans-serif", fontSize: '8px',
                                    fontWeight: 600, color: '#FAF7F4', lineHeight: 1, padding: '0 2px',
                                    pointerEvents: 'none',
                                }}>
                                    {notifUnread > 99 ? '99+' : notifUnread}
                                </span>
                            )}

                            {/* Notification dropdown */}
                            <AnimatePresence>
                                {showNotifDropdown && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -6 }}
                                        transition={{ duration: 0.15 }}
                                        style={{
                                            position: 'absolute',
                                            top: 'calc(100% + 8px)',
                                            right: 0,
                                            width: '320px',
                                            maxHeight: '400px',
                                            backgroundColor: '#FFFAF7',
                                            border: '1px solid #E8D4C8',
                                            borderRadius: '12px',
                                            boxShadow: '0 6px 24px rgba(92,61,46,0.12)',
                                            overflow: 'hidden',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            zIndex: 200,
                                        }}
                                    >
                                        {/* Dropdown header */}
                                        <div style={{
                                            display: 'flex', alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '12px 16px',
                                            borderBottom: '1px solid #E8D4C8',
                                            flexShrink: 0,
                                        }}>
                                            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '16px', fontWeight: 700, color: '#2D1F14' }}>
                                                Notifications
                                            </span>
                                            {notifUnread > 0 && (
                                                <button
                                                    onClick={handleMarkAllRead}
                                                    style={{
                                                        fontFamily: "'DM Sans', sans-serif",
                                                        fontSize: '11px', color: '#C07A4A',
                                                        background: 'none', border: 'none',
                                                        cursor: 'pointer', padding: '2px 4px',
                                                        borderRadius: '4px', transition: 'background 0.12s',
                                                    }}
                                                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(192,122,74,0.08)'; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                                                >
                                                    Mark all as read
                                                </button>
                                            )}
                                        </div>

                                        {/* List */}
                                        <div style={{ overflowY: 'auto', flex: 1 }}>
                                            {notifLoading ? (
                                                <div style={{ padding: '24px 16px', textAlign: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#B09880' }}>
                                                    Loading…
                                                </div>
                                            ) : notifications.length === 0 ? (
                                                <div style={{ padding: '24px 16px', textAlign: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#B09880' }}>
                                                    No notifications yet
                                                </div>
                                            ) : (
                                                notifications.map((notif) => (
                                                    <button
                                                        key={notif.id}
                                                        onClick={() => handleNotifClick(notif)}
                                                        style={{
                                                            display: 'flex', flexDirection: 'column', gap: '4px',
                                                            width: '100%', textAlign: 'left',
                                                            padding: '12px 16px',
                                                            borderBottom: '1px solid rgba(45,31,20,0.06)',
                                                            background: notif.is_read ? 'transparent' : 'rgba(192,122,74,0.05)',
                                                            border: 'none', cursor: 'pointer',
                                                            transition: 'background 0.12s',
                                                            position: 'relative',
                                                        }}
                                                        onMouseEnter={(e) => { e.currentTarget.style.background = notif.is_read ? 'rgba(45,31,20,0.03)' : 'rgba(192,122,74,0.1)'; }}
                                                        onMouseLeave={(e) => { e.currentTarget.style.background = notif.is_read ? 'transparent' : 'rgba(192,122,74,0.05)'; }}
                                                    >
                                                        {/* Unread dot */}
                                                        {!notif.is_read && (
                                                            <span style={{
                                                                position: 'absolute', top: '14px', right: '14px',
                                                                width: '7px', height: '7px', borderRadius: '50%',
                                                                backgroundColor: '#C07A4A', flexShrink: 0,
                                                            }} />
                                                        )}
                                                        <span style={{
                                                            fontFamily: "'DM Sans', sans-serif",
                                                            fontSize: '12px',
                                                            color: '#2D1F14',
                                                            lineHeight: 1.5,
                                                            paddingRight: '16px',
                                                        }}>
                                                            {notif.message}
                                                        </span>
                                                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '10px', color: '#B09880' }}>
                                                            {formatTimeAgo(notif.created_at)}
                                                        </span>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Avatar + profile dropdown */}
                        <div style={{ position: 'relative' }} ref={profileRef}>
                            <button
                                onClick={() => { setShowProfileDropdown(!showProfileDropdown); setShowNotifDropdown(false); }}
                                style={{
                                    width: '30px', height: '30px', borderRadius: '50%',
                                    backgroundColor: '#FDEADE', border: '1px solid #E8D4C8',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', overflow: 'hidden', padding: 0, flexShrink: 0,
                                }}
                            >
                                {user.avatar ? (
                                    <img
                                        src={getAvatarUrl(user.avatar)}
                                        alt="Profile"
                                        style={{ width: '30px', height: '30px', objectFit: 'cover', borderRadius: '50%' }}
                                        onError={(e) => { e.target.onerror = null; e.target.src = '/default-avatar.png'; }}
                                    />
                                ) : (
                                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#D4967A' }}>
                                        {user.name?.charAt(0).toUpperCase() || '?'}
                                    </span>
                                )}
                            </button>

                            <AnimatePresence>
                                {showProfileDropdown && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -6 }}
                                        transition={{ duration: 0.15 }}
                                        style={{
                                            position: 'absolute',
                                            top: 'calc(100% + 8px)',
                                            right: 0,
                                            width: '176px',
                                            backgroundColor: '#FFFAF7',
                                            border: '1px solid #E8D4C8',
                                            borderRadius: '12px',
                                            boxShadow: '0 6px 24px rgba(92,61,46,0.09)',
                                            overflow: 'hidden',
                                            zIndex: 100,
                                        }}
                                    >
                                        {dropdownLinks.map(({ to, label }) => (
                                            <Link
                                                key={label}
                                                to={to}
                                                style={{
                                                    display: 'block', padding: '10px 16px',
                                                    color: '#5C3D2E', fontSize: '13px',
                                                    textDecoration: 'none', transition: 'background-color 0.12s',
                                                    fontFamily: "'DM Sans', sans-serif",
                                                }}
                                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FDEADE'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                                onClick={() => setShowProfileDropdown(false)}
                                            >
                                                {label}
                                            </Link>
                                        ))}
                                        {user?.isAdmin && (
                                            <Link
                                                to="/admin/pets"
                                                style={{
                                                    display: 'block', padding: '10px 16px',
                                                    color: '#C07A4A', fontSize: '13px',
                                                    textDecoration: 'none', fontWeight: 500,
                                                    transition: 'background-color 0.12s',
                                                    fontFamily: "'DM Sans', sans-serif",
                                                }}
                                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FDEADE'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                                onClick={() => setShowProfileDropdown(false)}
                                            >
                                                Admin Dashboard
                                            </Link>
                                        )}
                                        <button
                                            onClick={() => { logout(); setShowProfileDropdown(false); }}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '7px',
                                                width: '100%', padding: '10px 16px',
                                                color: '#9C7B6A', fontSize: '13px',
                                                background: 'none', border: 'none',
                                                borderTop: '1px solid #E8D4C8',
                                                cursor: 'pointer', textAlign: 'left',
                                                transition: 'background-color 0.12s',
                                                fontFamily: "'DM Sans', sans-serif",
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FDEADE'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                        >
                                            <LogOut style={{ width: '14px', height: '14px' }} />
                                            Logout
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Link
                            to="/login"
                            style={{
                                color: '#7A5C44', backgroundColor: 'transparent',
                                borderRadius: '20px', padding: '7px 18px',
                                fontSize: '13px', fontWeight: 500,
                                textDecoration: 'none', transition: 'color 0.15s',
                                border: '1px solid rgba(45,31,20,0.2)',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = '#2D1F14'; e.currentTarget.style.borderColor = 'rgba(45,31,20,0.4)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = '#7A5C44'; e.currentTarget.style.borderColor = 'rgba(45,31,20,0.2)'; }}
                        >
                            Log in
                        </Link>
                        <Link
                            to="/signup"
                            style={{
                                backgroundColor: '#D4967A', color: '#FDF8F5',
                                borderRadius: '20px', padding: '7px 18px',
                                fontSize: '13px', fontWeight: 600,
                                textDecoration: 'none', transition: 'background-color 0.15s',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#C4846A'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#D4967A'; }}
                        >
                            Sign up
                        </Link>
                    </div>
                )}
            </div>
        </header>
    );
}
