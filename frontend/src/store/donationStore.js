// store/donationStore.js
import { create } from 'zustand';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api'; // Base API URL

export const useDonationStore = create((set, get) => ({
    donations: [],
    isLoading: false,
    error: null,

    // Fetch all donations (admin only)
    getAllDonations: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(`${API_URL}/donations/admin`, {
                withCredentials: true
            });

            if (response.data.success) {
                set({ donations: response.data.donations, isLoading: false });
            } else {
                set({ error: 'Failed to fetch donations', isLoading: false });
            }
        } catch (error) {
            console.error('Error fetching donations:', error);
            set({
                error: error.response?.data?.message || 'Error fetching donations',
                isLoading: false
            });
        }
    },

    // Fetch donations for a specific user (admin only)
    getUserDonations: async (userId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(`${API_URL}/donations/admin/user/${userId}`, {
                withCredentials: true
            });

            if (response.data.success) {
                set({ donations: response.data.donations, isLoading: false });
            } else {
                set({ error: 'Failed to fetch user donations', isLoading: false });
            }
        } catch (error) {
            console.error('Error fetching user donations:', error);
            set({
                error: error.response?.data?.message || 'Error fetching user donations',
                isLoading: false
            });
        }
    },

    // Update a donation (admin only)
    updateDonationStore: async (donationId, donationData) => {
        set({ isLoading: true, error: null });
        try {
            // First, check the API to see which endpoint works
            // Try the first format
            let response;
            try {
                response = await axios.put(
                    `${API_URL}/donations/admin/${donationId}`,
                    donationData,
                    { withCredentials: true }
                );
            } catch (firstError) {
                // If first format fails, try alternative format
                console.log("First endpoint failed, trying alternative");
                response = await axios.put(
                    `${API_URL}/donations/${donationId}/admin`,
                    donationData,
                    { withCredentials: true }
                );
            }

            if (response.data.success) {
                // Update the donation in the state
                const updatedDonations = get().donations.map(donation =>
                    donation._id === donationId ? { ...donation, ...donationData } : donation
                );
                set({ donations: updatedDonations, isLoading: false });
                return { success: true };
            } else {
                set({ error: 'Failed to update donation', isLoading: false });
                return { success: false, error: 'Failed to update donation' };
            }
        } catch (error) {
            console.error('Error updating donation:', error);
            set({
                error: error.response?.data?.message || 'Error updating donation',
                isLoading: false
            });
            return { success: false, error: error.response?.data?.message || 'Error updating donation' };
        }
    },

    // Delete a donation (admin only)
    deleteDonationStore: async (donationId) => {
        set({ isLoading: true, error: null });
        try {
            // First, check the API to see which endpoint works
            // Try the first format
            let response;
            try {
                response = await axios.delete(
                    `${API_URL}/donations/admin/${donationId}`,
                    { withCredentials: true }
                );
            } catch (firstError) {
                // If first format fails, try alternative format
                console.log("First endpoint failed, trying alternative");
                response = await axios.delete(
                    `${API_URL}/donations/${donationId}/admin`,
                    { withCredentials: true }
                );
            }

            if (response.data.success) {
                // Remove the donation from the state
                const updatedDonations = get().donations.filter(donation => donation._id !== donationId);
                set({ donations: updatedDonations, isLoading: false });
                return { success: true };
            } else {
                set({ error: 'Failed to delete donation', isLoading: false });
                return { success: false, error: 'Failed to delete donation' };
            }
        } catch (error) {
            console.error('Error deleting donation:', error);
            set({
                error: error.response?.data?.message || 'Error deleting donation',
                isLoading: false
            });
            return { success: false, error: error.response?.data?.message || 'Error deleting donation' };
        }
    },

    // Clear error
    clearError: () => set({ error: null })
}));

