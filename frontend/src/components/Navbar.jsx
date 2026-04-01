import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import DynamicSearch from './DynamicSearch';

const BASE_URL = 'http://localhost:5000';

export default function Navbar() {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);

    useEffect(() => {
        const handleClickOutside = (event) => {
            const dropdownElement = document.getElementById('profile-dropdown');
            if (showProfileDropdown && dropdownElement && !dropdownElement.contains(event.target)) {
                setShowProfileDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showProfileDropdown]);

    const handleLogout = () => {
        logout();
    };

    const getAvatarUrl = (url) => {
        if (!url) return '/default-avatar.png';
        if (url.startsWith('http')) return url;
        const formattedUrl = url.startsWith('/') ? url : `/${url}`;
        const timestamp = `?t=${Date.now()}`;
        return `${BASE_URL}${formattedUrl}${timestamp}`;
    };

    const isActive = (path) => location.pathname === path;

    const NavLink = ({ to, children }) => (
        <Link
            to={to}
            className="relative py-1 transition-colors duration-200"
            style={{
                color: isActive(to) ? 'var(--color-dark)' : 'var(--color-muted)',
                fontSize: '13px',
                fontWeight: isActive(to) ? '500' : '400'
            }}
        >
            {children}
            {isActive(to) && (
                <motion.div
                    layoutId="navbar-indicator"
                    className="absolute -bottom-1 left-0 right-0"
                    style={{ height: '1.5px', backgroundColor: 'var(--color-accent)' }}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
            )}
        </Link>
    );

    return (
        <header
            className="w-full sticky top-0 z-50"
            style={{
                backgroundColor: '#FFFAF7',
                borderBottom: '0.5px solid #F0E8E0'
            }}
        >
            <div className="container mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-2 group">
                        <span className="text-2xl group-hover:scale-110 transition-transform duration-200">🐾</span>
                        <span
                            className="text-lg"
                            style={{ color: 'var(--color-dark)', fontWeight: 500 }}
                        >
                            Paws
                        </span>
                    </Link>

                    {/* Navigation Links */}
                    <nav className="hidden md:flex items-center space-x-8">
                        <NavLink to="/">Home</NavLink>
                        <NavLink to="/pet-search">Pet search</NavLink>
                        <NavLink to="/adoption-process">Adoption process</NavLink>
                        <NavLink to="/adoption-faq">FAQ</NavLink>
                        <DynamicSearch redirectOnSelect={true} />
                    </nav>

                    {/* Right Side */}
                    <div className="flex items-center space-x-3">
                        {user ? (
                            <>
                                {/* Admin pill */}
                                {user.isAdmin && (
                                    <motion.button
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => navigate('/admin/pets')}
                                        className="px-3 py-1.5 rounded-full transition-all duration-200"
                                        style={{
                                            backgroundColor: '#FDEADE',
                                            color: 'var(--color-accent)',
                                            fontSize: '12px',
                                            fontWeight: 500
                                        }}
                                    >
                                        Admin Dashboard
                                    </motion.button>
                                )}

                                {/* Profile Dropdown */}
                                <div className="relative">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                                        className="flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200"
                                        style={{
                                            backgroundColor: 'var(--color-accent-light)',
                                            color: 'var(--color-dark)',
                                            fontSize: '13px',
                                            fontWeight: 600
                                        }}
                                    >
                                        {user.avatar ? (
                                            <img
                                                src={getAvatarUrl(user.avatar)}
                                                alt="Profile"
                                                className="h-8 w-8 rounded-full object-cover"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = '/default-avatar.png';
                                                }}
                                            />
                                        ) : (
                                            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-dark)' }}>
                                                {user.name?.charAt(0).toUpperCase() || <User className="h-4 w-4" />}
                                            </span>
                                        )}
                                    </motion.button>

                                    <AnimatePresence>
                                        {showProfileDropdown && (
                                            <motion.div
                                                id="profile-dropdown"
                                                initial={{ opacity: 0, y: -8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -8 }}
                                                transition={{ duration: 0.15 }}
                                                className="absolute top-full right-0 mt-2 w-48 rounded-xl shadow-lg py-2 overflow-hidden"
                                                style={{
                                                    backgroundColor: 'var(--color-surface)',
                                                    border: '0.5px solid var(--color-blush)'
                                                }}
                                            >
                                                {[
                                                    { to: '/profile?tab=profile', label: 'Profile', icon: <User className="h-4 w-4 mr-2" /> },
                                                    { to: '/profile?tab=messages', label: 'Messages', icon: (
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                                        </svg>
                                                    )},
                                                    { to: '/profile?tab=adoptions', label: 'Requests', icon: (
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                            <line x1="16" y1="2" x2="16" y2="6" />
                                                            <line x1="8" y1="2" x2="8" y2="6" />
                                                            <line x1="3" y1="10" x2="21" y2="10" />
                                                        </svg>
                                                    )},
                                                ].map(({ to, label, icon }) => (
                                                    <Link
                                                        key={label}
                                                        to={to}
                                                        className="flex items-center px-4 py-2.5 transition-colors duration-150"
                                                        style={{ color: 'var(--color-dark)', fontSize: '13px' }}
                                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-accent-light)'}
                                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                        onClick={() => setShowProfileDropdown(false)}
                                                    >
                                                        {icon}{label}
                                                    </Link>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Logout */}
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleLogout}
                                    className="flex items-center gap-1.5 transition-all duration-200"
                                    style={{ color: 'var(--color-muted)', fontSize: '13px' }}
                                >
                                    <LogOut className="h-4 w-4" />
                                    Logout
                                </motion.button>
                            </>
                        ) : (
                            /* Logged-out: single Sign up pill */
                            <Link
                                to="/signup"
                                className="transition-all duration-200"
                                style={{
                                    backgroundColor: 'var(--color-accent)',
                                    color: '#FDF8F5',
                                    borderRadius: '20px',
                                    padding: '7px 18px',
                                    fontSize: '13px',
                                    fontWeight: 500
                                }}
                            >
                                Sign up
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
