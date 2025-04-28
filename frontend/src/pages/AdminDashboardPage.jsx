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

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (!user || !user.isAdmin) {
        return null; // This will prevent flashes of content before redirect
    }

    return <AdminPetDashboard />;
};

export default AdminDashboardPage;