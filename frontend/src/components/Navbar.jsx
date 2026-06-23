import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, MessageCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

export default function Navbar() {
    const { user, logout } = useAuthStore();
    const isAuthenticated = !!user;
    const navigate = useNavigate();
    const location = useLocation();
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!isAuthenticated) { setUnreadCount(0); return; }
        const fetchUnread = async () => {
            try {
                const r = await axios.get('http://localhost:5000/api/conversations/unread-count', { withCredentials: true });
                setUnreadCount(r.data.count || 0);
            } catch (e) {}
        };
        fetchUnread();
        const interval = setInterval(fetchUnread, 30000);
        return () => clearInterval(interval);
    }, [isAuthenticated]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            const el = document.getElementById('profile-dropdown');
            if (showProfileDropdown && el && !el.contains(event.target)) {
                setShowProfileDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showProfileDropdown]);

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

    const navLinks = [
        { to: '/',         label: 'Home' },
        { to: '/animals',  label: 'Animals' },
        { to: '/map',      label: 'Map' },
        { to: '/my-animals', label: 'My Animals' },
        { to: '/about',    label: 'About' },
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
            {/* Logo — left */}
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '7px', textDecoration: 'none', outline: 'none', flexShrink: 0, marginRight: '36px' }}>
                <span style={{
                    width: '8px', height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#C07A4A',
                    display: 'inline-block',
                    flexShrink: 0,
                }} />
                <span style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    color: '#2D1F14',
                    fontWeight: 700,
                    fontSize: '20px',
                    letterSpacing: '0.01em',
                }}>Paws</span>
            </Link>

            {/* Nav links — left-aligned, next to logo */}
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

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* Search + actions — right */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>

                {/* Location pill */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '5px 12px',
                        borderRadius: '100px',
                        backgroundColor: 'rgba(192,122,74,0.08)',
                        border: '1px solid rgba(192,122,74,0.2)',
                        cursor: 'default',
                        transition: 'background-color 0.15s',
                        flexShrink: 0,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(192,122,74,0.14)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(192,122,74,0.08)'; }}
                >
                    <span style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '11px',
                        color: '#8B4E28',
                        whiteSpace: 'nowrap',
                    }}>
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
                        width: '200px',
                        backgroundColor: '#FAF7F4',
                        border: '1px solid rgba(45,31,20,0.15)',
                        borderRadius: '100px',
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontFamily: "'DM Sans', sans-serif",
                        color: '#7A5C44',
                        outline: 'none',
                    }}
                    onFocus={(e) => { e.target.style.borderColor = '#C07A4A'; }}
                    onBlur={(e)  => { e.target.style.borderColor = 'rgba(45,31,20,0.15)'; }}
                />

                {/* + Add animal */}
                <Link
                    to="/add-animal"
                    style={{
                        backgroundColor: '#2D1F14',
                        color: '#FAF7F4',
                        borderRadius: '100px',
                        fontSize: '12px',
                        fontFamily: "'DM Sans', sans-serif",
                        fontWeight: 500,
                        padding: '7px 16px',
                        textDecoration: 'none',
                        transition: 'opacity 0.15s',
                        whiteSpace: 'nowrap',
                        display: 'inline-block',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.82'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                >
                    + Add animal
                </Link>

                    {/* Auth section */}
                    {user ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

                            {/* Notifications icon */}
                            <div style={{ position: 'relative' }}>
                                <button
                                    onClick={() => navigate('/messages')}
                                    style={{
                                        width: '30px',
                                        height: '30px',
                                        borderRadius: '50%',
                                        backgroundColor: '#fff',
                                        border: '1px solid rgba(45,31,20,0.15)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        padding: 0,
                                        flexShrink: 0,
                                        transition: 'background-color 0.15s',
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(45,31,20,0.04)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fff'; }}
                                >
                                    <MessageCircle style={{ width: '14px', height: '14px', color: '#2D1F14' }} />
                                </button>
                                {/* Unread badge */}
                                {unreadCount > 0 && (
                                    <span style={{
                                        position: 'absolute',
                                        top: '-2px',
                                        right: '-2px',
                                        minWidth: '14px',
                                        height: '14px',
                                        borderRadius: '50%',
                                        backgroundColor: '#C07A4A',
                                        border: '2px solid #FAF7F4',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontFamily: "'DM Sans', sans-serif",
                                        fontSize: '8px',
                                        fontWeight: 600,
                                        color: '#FAF7F4',
                                        lineHeight: 1,
                                        padding: '0 2px',
                                    }}>
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                            </div>

                        <div style={{ position: 'relative' }}>
                            {/* Avatar button */}
                            <button
                                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                                style={{
                                    width: '30px',
                                    height: '30px',
                                    borderRadius: '50%',
                                    backgroundColor: '#FDEADE',
                                    border: '1px solid #E8D4C8',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    overflow: 'hidden',
                                    padding: 0,
                                    flexShrink: 0,
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

                            {/* Dropdown */}
                            <AnimatePresence>
                                {showProfileDropdown && (
                                    <motion.div
                                        id="profile-dropdown"
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
                                                    display: 'block',
                                                    padding: '10px 16px',
                                                    color: '#5C3D2E',
                                                    fontSize: '13px',
                                                    textDecoration: 'none',
                                                    transition: 'background-color 0.12s',
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
                                                    display: 'block',
                                                    padding: '10px 16px',
                                                    color: '#C07A4A',
                                                    fontSize: '13px',
                                                    textDecoration: 'none',
                                                    transition: 'background-color 0.12s',
                                                    fontWeight: 500,
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
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '7px',
                                                width: '100%',
                                                padding: '10px 16px',
                                                color: '#9C7B6A',
                                                fontSize: '13px',
                                                background: 'none',
                                                border: 'none',
                                                borderTop: '1px solid #E8D4C8',
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                                transition: 'background-color 0.12s',
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
                        <Link
                            to="/signup"
                            style={{
                                backgroundColor: '#D4967A',
                                color: '#FDF8F5',
                                borderRadius: '20px',
                                padding: '7px 18px',
                                fontSize: '13px',
                                fontWeight: 600,
                                textDecoration: 'none',
                                transition: 'background-color 0.15s',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#C4846A'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#D4967A'; }}
                        >
                            Sign up
                        </Link>
                    )}
                </div>
        </header>
    );
}
