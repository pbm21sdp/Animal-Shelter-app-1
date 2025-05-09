// Complete version of adoptionStore.js with fixes
import { create } from "zustand";
import axios from "axios";

const API_URL = "http://localhost:5000/api/adoptions";

export const useAdoptionStore = create((set, get) => ({
    adoptions: [],
    userAdoptions: [],
    selectedAdoption: null,
    isLoading: false,
    error: null,

    // Submit adoption application
    submitAdoption: async (adoptionData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.post(API_URL, adoptionData, {
                withCredentials: true
            });

            set({
                isLoading: false
            });

            return { success: true, adoption: response.data.adoption };
        } catch (error) {
            console.error('Error submitting adoption application:', error);
            set({
                error: error.response?.data?.message || 'Error submitting adoption application',
                isLoading: false
            });
            return { success: false, error: error.response?.data?.message || 'Error submitting adoption application' };
        }
    },

    // Get current user's adoptions
    getUserAdoptions: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(`${API_URL}/user`, {
                withCredentials: true
            });

            set({
                userAdoptions: response.data.adoptions,
                isLoading: false
            });

            return response.data.adoptions;
        } catch (error) {
            console.error('Error fetching user adoptions:', error);
            set({
                error: error.response?.data?.message || 'Error fetching adoptions',
                isLoading: false,
                userAdoptions: []
            });
            return [];
        }
    },

    // Get adoption details - updated to support both forScheduling and adminAction
    getAdoptionDetails: async (adoptionId, forScheduling = false, adminAction = false) => {
        set({ isLoading: true, error: null });
        try {
            // Build the query parameters based on the action type
            const queryParams = new URLSearchParams();
            if (forScheduling) queryParams.append('forScheduling', 'true');
            if (adminAction) queryParams.append('adminAction', 'true');

            // Include query parameters if they exist
            const queryString = queryParams.toString();
            const url = queryString
                ? `${API_URL}/${adoptionId}?${queryString}`
                : `${API_URL}/${adoptionId}`;

            const response = await axios.get(url, {
                withCredentials: true
            });

            set({
                selectedAdoption: response.data.adoption,
                isLoading: false
            });

            return response.data.adoption;
        } catch (error) {
            console.error('Error fetching adoption details:', error);
            set({
                error: error.response?.data?.message || 'Error fetching adoption details',
                isLoading: false
            });
            return null;
        }
    },

    // Admin: Get all adoptions
    getAllAdoptions: async (filters = {}) => {
        set({ isLoading: true, error: null });
        try {
            // Build query string from filters
            const queryParams = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value) queryParams.append(key, value);
            });

            const response = await axios.get(`${API_URL}/admin?${queryParams.toString()}`, {
                withCredentials: true
            });

            set({
                adoptions: response.data.adoptions,
                isLoading: false
            });

            return response.data.adoptions;
        } catch (error) {
            console.error('Error fetching all adoptions:', error);
            set({
                error: error.response?.data?.message || 'Error fetching adoptions',
                isLoading: false,
                adoptions: []
            });
            return [];
        }
    },

    // Admin: Update adoption status - updated to use adminAction
    updateAdoptionStatus: async (adoptionId, data) => {
        set({ isLoading: true, error: null });
        try {
            // First get the adoption details with admin flag
            await get().getAdoptionDetails(adoptionId, false, true);

            const response = await axios.put(`${API_URL}/admin/${adoptionId}`, data, {
                withCredentials: true
            });

            // Update adoption in state
            set(state => ({
                adoptions: state.adoptions.map(adoption =>
                    adoption._id === adoptionId ? response.data.adoption : adoption
                ),
                selectedAdoption: state.selectedAdoption?._id === adoptionId ? response.data.adoption : state.selectedAdoption,
                isLoading: false
            }));

            return { success: true, adoption: response.data.adoption };
        } catch (error) {
            console.error('Error updating adoption status:', error);
            set({
                error: error.response?.data?.message || 'Error updating adoption status',
                isLoading: false
            });
            return { success: false, error: error.response?.data?.message || 'Error updating adoption status' };
        }
    },

    // Admin: Delete adoption - updated to use adminAction
    deleteAdoption: async (adoptionId) => {
        set({ isLoading: true, error: null });
        try {
            // First get the adoption details with admin flag
            await get().getAdoptionDetails(adoptionId, false, true);

            await axios.delete(`${API_URL}/admin/${adoptionId}`, {
                withCredentials: true
            });

            // Remove from state
            set(state => ({
                adoptions: state.adoptions.filter(adoption => adoption._id !== adoptionId),
                selectedAdoption: state.selectedAdoption?._id === adoptionId ? null : state.selectedAdoption,
                isLoading: false
            }));

            return { success: true };
        } catch (error) {
            console.error('Error deleting adoption:', error);
            set({
                error: error.response?.data?.message || 'Error deleting adoption',
                isLoading: false
            });
            return { success: false, error: error.response?.data?.message || 'Error deleting adoption' };
        }
    },

    // Admin: Get user adoptions by userId
    getUserAdoptionsByUserId: async (userId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(`${API_URL}/admin/user/${userId}`, {
                withCredentials: true
            });

            set({
                userAdoptions: response.data.adoptions,
                isLoading: false
            });

            return response.data.adoptions;
        } catch (error) {
            console.error('Error fetching user adoptions by ID:', error);
            set({
                error: error.response?.data?.message || 'Error fetching user adoptions',
                isLoading: false,
                userAdoptions: []
            });
            return [];
        }
    },

    getAdoptionDetailsAdmin: async (adoptionId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(`${API_URL}/admin/details/${adoptionId}`, {
                withCredentials: true
            });

            set({
                selectedAdoption: response.data.adoption,
                isLoading: false
            });

            return response.data.adoption;
        } catch (error) {
            console.error('Error fetching adoption details (admin):', error);
            set({
                error: error.response?.data?.message || 'Error fetching adoption details',
                isLoading: false
            });
            return null;
        }
    },

    // Clear error
    clearError: () => set({ error: null }),

    // Clear selected adoption
    clearSelectedAdoption: () => set({ selectedAdoption: null })
}));