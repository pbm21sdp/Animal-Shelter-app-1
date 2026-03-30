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

    return (
        <header
            className="w-full sticky top-0 z-50"
            style={{
                backgroundColor: 'var(--color-bg)',
                borderBottom: '0.5px solid var(--color-border)'
            }}
        >
            <div className="container mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-2 group">
                        <span className="text-3xl group-hover:scale-110 transition-transform duration-200">
                            🐾
                        </span>
                        <span
                            className="text-xl font-semibold tracking-tight"
                            style={{ color: 'var(--color-dark)' }}
                        >
                            Paws
                        </span>
                    </Link>

                    {/* Navigation Links */}
                    <nav className="hidden md:flex items-center space-x-8">
                        <Link
                            to="/"
                            className="relative py-1 transition-colors duration-200"
                            style={{
                                color: isActive('/') ? 'var(--color-dark)' : 'var(--color-muted)',
                                fontSize: '13px',
                                fontWeight: isActive('/') ? '500' : '400'
                            }}
                        >
                            Home
                            {isActive('/') && (
                                <motion.div
                                    layoutId="navbar-indicator"
                                    className="absolute -bottom-1 left-0 right-0 h-0.5"
                                    style={{ backgroundColor: 'var(--color-accent)' }}
                                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                />
                            )}
                        </Link>
                        <Link
                            to="/pet-search"
                            className="relative py-1 transition-colors duration-200"
                            style={{
                                color: isActive('/pet-search') ? 'var(--color-dark)' : 'var(--color-muted)',
                                fontSize: '13px',
                                fontWeight: isActive('/pet-search') ? '500' : '400'
                            }}
                        >
                            Pet search
                            {isActive('/pet-search') && (
                                <motion.div
                                    layoutId="navbar-indicator"
                                    className="absolute -bottom-1 left-0 right-0 h-0.5"
                                    style={{ backgroundColor: 'var(--color-accent)' }}
                                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                />
                            )}
                        </Link>
                        <Link
                            to="/adoption-process"
                            className="relative py-1 transition-colors duration-200"
                            style={{
                                color: isActive('/adoption-process') ? 'var(--color-dark)' : 'var(--color-muted)',
                                fontSize: '13px',
                                fontWeight: isActive('/adoption-process') ? '500' : '400'
                            }}
                        >
                            Adoption process
                            {isActive('/adoption-process') && (
                                <motion.div
                                    layoutId="navbar-indicator"
                                    className="absolute -bottom-1 left-0 right-0 h-0.5"
                                    style={{ backgroundColor: 'var(--color-accent)' }}
                                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                />
                            )}
                        </Link>
                        <Link
                            to="/adoption-faq"
                            className="relative py-1 transition-colors duration-200"
                            style={{
                                color: isActive('/adoption-faq') ? 'var(--color-dark)' : 'var(--color-muted)',
                                fontSize: '13px',
                                fontWeight: isActive('/adoption-faq') ? '500' : '400'
                            }}
                        >
                            FAQ
                            {isActive('/adoption-faq') && (
                                <motion.div
                                    layoutId="navbar-indicator"
                                    className="absolute -bottom-1 left-0 right-0 h-0.5"
                                    style={{ backgroundColor: 'var(--color-accent)' }}
                                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                />
                            )}
                        </Link>

                        {/* Search */}
                        <DynamicSearch redirectOnSelect={true} />
                    </nav>

                    {/* Right Side Actions */}
                    <div className="flex items-center space-x-3">
                        {/* Admin Button - Subtle Pill Style */}
                        {user?.isAdmin && (
                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => navigate('/admin/pets')}
                                className="px-4 py-2 rounded-full text-xs font-medium transition-all duration-200"
                                style={{
                                    backgroundColor: 'var(--color-accent-light)',
                                    color: 'var(--color-accent)'
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
                                className="p-2 rounded-full flex items-center justify-center transition-all duration-200"
                                style={{
                                    backgroundColor: showProfileDropdown ? 'var(--color-accent-light)' : 'transparent'
                                }}
                            >
                                {user && user.avatar ? (
                                    <img
                                        src={getAvatarUrl(user.avatar)}
                                        alt="Profile"
                                        className="h-8 w-8 rounded-full object-cover ring-2"
                                        style={{ ringColor: 'var(--color-border)' }}
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = '/default-avatar.png';
                                        }}
                                    />
                                ) : (
                                    <User className="h-5 w-5" style={{ color: 'var(--color-muted)' }} />
                                )}
                            </motion.button>

                            {/* Dropdown Menu */}
                            <AnimatePresence>
                                {showProfileDropdown && (
                                    <motion.div
                                        id="profile-dropdown"
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute top-full right-0 mt-2 w-48 rounded-xl shadow-lg py-2 overflow-hidden"
                                        style={{
                                            backgroundColor: 'var(--color-bg)',
                                            border: '1px solid var(--color-border)'
                                        }}
                                    >
                                        <Link
                                            to="/profile?tab=profile"
                                            className="block px-4 py-2.5 text-sm transition-colors duration-150"
                                            style={{ color: 'var(--color-dark)' }}
                                            onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-accent-light)'}
                                            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowProfileDropdown(false);
                                            }}
                                        >
                                            <div className="flex items-center">
                                                <User className="h-4 w-4 mr-2" />
                                                Profile
                                            </div>
                                        </Link>
                                        <Link
                                            to="/profile?tab=messages"
                                            className="block px-4 py-2.5 text-sm transition-colors duration-150"
                                            style={{ color: 'var(--color-dark)' }}
                                            onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-accent-light)'}
                                            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowProfileDropdown(false);
                                            }}
                                        >
                                            <div className="flex items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                                </svg>
                                                Messages
                                            </div>
                                        </Link>
                                        <Link
                                            to="/profile?tab=adoptions"
                                            className="block px-4 py-2.5 text-sm transition-colors duration-150"
                                            style={{ color: 'var(--color-dark)' }}
                                            onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-accent-light)'}
                                            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowProfileDropdown(false);
                                            }}
                                        >
                                            <div className="flex items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                    <line x1="16" y1="2" x2="16" y2="6" />
                                                    <line x1="8" y1="2" x2="8" y2="6" />
                                                    <line x1="3" y1="10" x2="21" y2="10" />
                                                </svg>
                                                Requests
                                            </div>
                                        </Link>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Logout Button */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleLogout}
                            className="flex items-center px-3 py-2 rounded-full text-xs font-medium transition-all duration-200"
                            style={{
                                color: 'var(--color-muted)'
                            }}
                        >
                            <LogOut className="h-4 w-4 mr-1.5" />
                            Logout
                        </motion.button>
                    </div>
                </div>
            </div>
        </header>
    );
}
