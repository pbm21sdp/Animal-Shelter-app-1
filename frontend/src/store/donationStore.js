// store/donationStore.js
import { create } from "zustand";
import axios from "axios";

const API_URL = "http://localhost:5000/api/donations";

export const useDonationStore = create((set, get) => ({
    // State
    donations: [],
    isLoading: false,
    error: null,
    totalDonated: 0,
    pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10
    },

    // Create a donation checkout session and redirect to Stripe
    createDonation: async (userId, email, amountInCents) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.post(`${API_URL}/create-checkout`, {
                userId,
                email,
                amountInCents
            });

            if (response.data.url) {
                window.location.href = response.data.url;
                return true;
            } else {
                set({
                    error: "No checkout URL received from server",
                    isLoading: false
                });
                return false;
            }
        } catch (error) {
            console.error('Error creating donation session:', error);
            set({
                error: error.response?.data?.message || "Error processing donation",
                isLoading: false
            });
            return false;
        }
    },

    // Fetch all donations with pagination (admin only)
    getAllDonations: async (params = {}) => {
        set({ isLoading: true, error: null });
        try {
            const queryParams = new URLSearchParams({
                page: params.page || 1,
                limit: params.limit || 10,
                ...(params.status && params.status !== 'all' && { status: params.status }),
                ...(params.sortBy && { sortBy: params.sortBy }),
                ...(params.sortOrder && { sortOrder: params.sortOrder }),
                ...(params.userId && params.userId !== 'all' && { userId: params.userId }) // ADD THIS IF MISSING
            });

            const response = await axios.get(
                `${API_URL}/admin?${queryParams}`,
                { withCredentials: true }
            );

            if (response.data.success) {
                set({
                    donations: response.data.donations,
                    pagination: response.data.pagination,
                    isLoading: false
                });
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
            const response = await axios.get(`${API_URL}/admin/user/${userId}`, {
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
    updateDonation: async (donationId, donationData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.put(
                `${API_URL}/admin/${donationId}`,
                donationData,
                { withCredentials: true }
            );

            if (response.data.success) {
                // Update the donation in the state
                const updatedDonations = get().donations.map(donation =>
                    donation._id === donationId ? response.data.donation : donation
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
    deleteDonation: async (donationId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.delete(
                `${API_URL}/admin/${donationId}`,
                { withCredentials: true }
            );

            if (response.data.success) {
                // Remove the donation from the state
                const updatedDonations = get().donations.filter(donation => donation._id !== donationId);
                set({
                    donations: updatedDonations,
                    pagination: {
                        ...get().pagination,
                        totalItems: get().pagination.totalItems - 1
                    },
                    isLoading: false
                });
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

    // Verify donation was successful
    verifyDonation: async (sessionId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(`${API_URL}/verify/${sessionId}`, {
                withCredentials: true
            });
            set({ isLoading: false });
            return response.data;
        } catch (error) {
            console.error('Error verifying donation:', error);
            set({
                error: error.response?.data?.message || "Error verifying donation",
                isLoading: false
            });
            return null;
        }
    },

    // Clear error
    clearError: () => set({ error: null })
}));