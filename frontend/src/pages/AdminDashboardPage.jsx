import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { PawPrint, Users, BarChart3, Settings, Heart, ShieldCheck, MessageSquare } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import Navbar from '../components/Navbar';

import PetsManagement from './Admin/PetsManagement';
import UsersManagement from './Admin/UsersManagement';
import AdoptionsManagement from './Admin/AdoptionsManagement';
import AdminSettings from './Admin/AdminSettings';
import StatisticsManagement from './Admin/StatisticsManagement';
import ModerationPanel from './Admin/ModerationPanel';
import ForumManagement from './Admin/ForumManagement';

const sans = "'DM Sans', sans-serif";

const AdminDashboardPage = () => {
    const { user, isLoading } = useAuthStore();
    const [activePanel, setActivePanel] = useState('pets');

    useEffect(() => {
        const metaTag = document.createElement('meta');
        metaTag.name = 'viewport';
        metaTag.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0';
        document.getElementsByTagName('head')[0].appendChild(metaTag);

        document.addEventListener('gesturestart', function(e) {
            e.preventDefault();
        });

        return () => {
            document.removeEventListener('gesturestart', function(e) {
                e.preventDefault();
            });

            const metaTags = document.getElementsByTagName('meta');
            for (let i = 0; i < metaTags.length; i++) {
                if (metaTags[i].name === 'viewport' &&
                    metaTags[i].content === 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0') {
                    metaTags[i].parentNode.removeChild(metaTags[i]);
                    break;
                }
            }
        };
    }, []);

    if (isLoading) {
        return <LoadingSpinner />;
    }

    const navItems = [
        { id: 'pets',       label: 'Pets',       icon: <PawPrint   className="h-5 w-5" /> },
        { id: 'adoptions',  label: 'Adoptions',  icon: <Heart      className="h-5 w-5" /> },
        { id: 'users',      label: 'Users',      icon: <Users      className="h-5 w-5" /> },
        { id: 'moderation', label: 'Moderation', icon: <ShieldCheck   className="h-5 w-5" /> },
        { id: 'forum',      label: 'Forum',      icon: <MessageSquare className="h-5 w-5" /> },
        { id: 'statistics', label: 'Statistics', icon: <BarChart3    className="h-5 w-5" /> },
        { id: 'settings',   label: 'Settings',   icon: <Settings    className="h-5 w-5" /> },
    ];

    return (
        <div className="min-h-screen w-screen flex flex-col" style={{ backgroundColor: '#FAF7F4' }}>
            <Navbar />

            {/* Main layout */}
            <div className="flex flex-grow overflow-hidden">

                {/* Sidebar — desktop only */}
                <aside
                    className="hidden md:flex flex-col w-48"
                    style={{
                        backgroundColor: '#FAF7F4',
                        borderRight: '1px solid rgba(45,31,20,0.1)',
                        flexShrink: 0,
                    }}
                >
                    <nav className="flex-1 pt-5 pb-4 overflow-y-auto">
                        <div style={{ padding: '0 8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            {navItems.map((item) => {
                                const active = activePanel === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => setActivePanel(item.id)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            width: '100%',
                                            padding: '10px 14px',
                                            borderRadius: '6px',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontFamily: sans,
                                            fontSize: '13px',
                                            fontWeight: active ? 500 : 400,
                                            backgroundColor: active ? 'rgba(192,122,74,0.1)' : 'transparent',
                                            color: active ? '#C07A4A' : '#7A5C44',
                                            textAlign: 'left',
                                            transition: 'background-color 0.15s, color 0.15s',
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!active) {
                                                e.currentTarget.style.backgroundColor = 'rgba(45,31,20,0.04)';
                                                e.currentTarget.style.color = '#2D1F14';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!active) {
                                                e.currentTarget.style.backgroundColor = 'transparent';
                                                e.currentTarget.style.color = '#7A5C44';
                                            }
                                        }}
                                    >
                                        <span style={{ color: active ? '#C07A4A' : '#B09880', display: 'flex' }}>
                                            {item.icon}
                                        </span>
                                        {item.label}
                                    </button>
                                );
                            })}
                        </div>
                    </nav>
                </aside>

                {/* Mobile Navigation — top bar on small screens */}
                <div
                    className="md:hidden w-full"
                    style={{
                        position: 'absolute',
                        top: '56px',
                        left: 0,
                        right: 0,
                        backgroundColor: '#FAF7F4',
                        borderBottom: '1px solid rgba(45,31,20,0.1)',
                        padding: '6px 8px',
                        zIndex: 10,
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', overflowX: 'auto', padding: '2px 4px', gap: '2px' }}>
                        {navItems.map((item) => {
                            const active = activePanel === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActivePanel(item.id)}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '3px',
                                        padding: '7px 10px',
                                        borderRadius: '6px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontFamily: sans,
                                        fontSize: '10px',
                                        fontWeight: active ? 500 : 400,
                                        backgroundColor: active ? 'rgba(192,122,74,0.1)' : 'transparent',
                                        color: active ? '#C07A4A' : '#7A5C44',
                                        whiteSpace: 'nowrap',
                                        flexShrink: 0,
                                    }}
                                >
                                    <span style={{ color: active ? '#C07A4A' : '#B09880', display: 'flex' }}>
                                        {item.icon}
                                    </span>
                                    {item.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Main Content */}
                <main
                    className="flex-1 overflow-y-auto p-4 sm:p-6"
                    style={{ backgroundColor: '#FAF7F4' }}
                >
                    <div className="max-w-full mx-auto">
                        {activePanel === 'moderation'  && <ModerationPanel />}
                        {activePanel === 'forum'       && <ForumManagement />}
                        {activePanel === 'statistics'  && <StatisticsManagement />}
                        {activePanel === 'pets'        && <PetsManagement />}
                        {activePanel === 'adoptions'   && <AdoptionsManagement />}
                        {activePanel === 'users'       && <UsersManagement />}
                        {activePanel === 'settings'    && <AdminSettings />}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminDashboardPage;
