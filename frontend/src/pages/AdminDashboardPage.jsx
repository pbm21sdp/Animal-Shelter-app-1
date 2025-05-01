// pages/AdminDashboardPage.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import AdminPetDashboard from './Admin/AdminPetDashboard';
import LoadingSpinner from '../components/LoadingSpinner';

const AdminDashboardPage = () => {
    const navigate = useNavigate();
    const { user, isLoading } = useAuthStore();

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

    return <AdminPetDashboard />;
};

export default AdminDashboardPage;