// pages/AdminDashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { PawPrint, ArrowLeft, Users, MessageSquare, BarChart3, Settings } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

// Import admin panel components
import PetsManagement from './Admin/PetsManagement';
import UsersManagement from './Admin/UsersManagement';
import MessagesInbox from './Admin/MessagesInbox';
import DonationsStats from './Admin/DonationsStats';
import AdminSettings from './Admin/AdminSettings';

const AdminDashboardPage = () => {
    const navigate = useNavigate();
    const { user, isLoading } = useAuthStore();
    const [activePanel, setActivePanel] = useState('pets'); // Default panel

    useEffect(() => {
        // Redirect if not admin
        if (user && !user.isAdmin) {
            navigate('/');
        }
    }, [user, navigate]);

    // Prevent zoom issues by adding a meta tag
    useEffect(() => {
        // Create viewport meta tag to prevent scaling/zooming
        const metaTag = document.createElement('meta');
        metaTag.name = 'viewport';
        metaTag.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0';
        document.getElementsByTagName('head')[0].appendChild(metaTag);

        // Prevent mobile browser double-tap zooming
        document.addEventListener('gesturestart', function(e) {
            e.preventDefault();
        });

        // Cleanup function to remove event listeners when component unmounts
        return () => {
            document.removeEventListener('gesturestart', function(e) {
                e.preventDefault();
            });

            // Try to find and remove the meta tag
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

    if (!user || !user.isAdmin) {
        return null; // This will prevent flashes of content before redirect
    }

    // Navigation items
    const navItems = [
        { id: 'pets', label: 'Pets', icon: <PawPrint className="h-5 w-5" /> },
        { id: 'users', label: 'Users', icon: <Users className="h-5 w-5" /> },
        { id: 'messages', label: 'Messages', icon: <MessageSquare className="h-5 w-5" /> },
        { id: 'donations', label: 'Donations', icon: <BarChart3 className="h-5 w-5" /> },
        { id: 'settings', label: 'Settings', icon: <Settings className="h-5 w-5" /> }
    ];

    return (
        <div className="min-h-screen w-screen flex flex-col bg-gray-50">
            {/* Header */}
            <header className="bg-tealcustom text-white py-4 px-4 sm:px-6">
                <div className="w-full flex justify-between items-center">
                    <div className="flex items-center">
                        <PawPrint className="h-6 w-6 mr-2" />
                        <h1 className="text-xl font-bold">Paws Admin Dashboard</h1>
                    </div>
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center text-white hover:text-yellow-200"
                        style={{ padding: '10px', touchAction: 'manipulation' }}
                    >
                        <ArrowLeft className="h-5 w-5 mr-1" />
                        Back to Home
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex flex-grow overflow-hidden">
                {/* Sidebar */}
                <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200">
                    <nav className="flex-1 pt-5 pb-4 overflow-y-auto">
                        <div className="px-2 space-y-1">
                            {navItems.map((item) => (
                                <button
                                    key={item.id}
                                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-md w-full ${
                                        activePanel === item.id
                                            ? 'bg-teal-100 text-tealcustom'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                                    onClick={() => setActivePanel(item.id)}
                                >
                                    <span className="mr-3">{item.icon}</span>
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </nav>
                </aside>

                {/* Mobile Navigation */}
                <div className="md:hidden bg-white border-b border-gray-200 p-2">
                    <div className="flex justify-between overflow-x-auto px-2 py-1">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                className={`flex flex-col items-center px-3 py-2 text-xs font-medium rounded-md ${
                                    activePanel === item.id
                                        ? 'bg-teal-100 text-tealcustom'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                                onClick={() => setActivePanel(item.id)}
                            >
                                {item.icon}
                                <span className="mt-1">{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6">
                    <div className="max-w-full mx-auto">
                        {/* Active Panel Content */}
                        {activePanel === 'pets' && <PetsManagement />}
                        {activePanel === 'users' && <UsersManagement />}
                        {activePanel === 'messages' && <MessagesInbox />}
                        {activePanel === 'donations' && <DonationsStats />}
                        {activePanel === 'settings' && <AdminSettings />}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminDashboardPage;