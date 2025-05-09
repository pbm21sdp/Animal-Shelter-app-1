import { create } from 'zustand';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const useUserStore = create((set, get) => ({
    // User profile state
    userProfile: null,
    userMessages: [],
    userAdoptions: [],
    isLoading: false,
    error: null,

    // Get user profile
    getUserProfile: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(`${API_URL}/api/users/profile`, {
                withCredentials: true,
            });

            if (response.data.success) {
                set({ userProfile: response.data.user });
            } else {
                set({ error: response.data.message });
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
            const errorMsg = error.response?.data?.message || 'Error fetching profile';
            set({ error: errorMsg });
            toast.error(errorMsg);
        } finally {
            set({ isLoading: false });
        }
    },

    // Update user profile
    updateUserProfile: async (userData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.put(`${API_URL}/api/users/profile`, userData, {
                withCredentials: true,
            });

            if (response.data.success) {
                set({ userProfile: response.data.user });
                toast.success('Profile updated successfully');
                return true;
            } else {
                set({ error: response.data.message });
                toast.error(response.data.message);
                return false;
            }
        } catch (error) {
            console.error('Error updating user profile:', error);
            const errorMsg = error.response?.data?.message || 'Error updating profile';
            set({ error: errorMsg });
            toast.error(errorMsg);
            return false;
        } finally {
            set({ isLoading: false });
        }
    },

    // Upload avatar
    uploadAvatar: async (formData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.post(`${API_URL}/api/users/avatar`, formData, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.success) {
                // Update user profile with new avatar URL
                set(state => ({
                    userProfile: {
                        ...state.userProfile,
                        avatar: response.data.avatarUrl
                    }
                }));
                toast.success('Avatar uploaded successfully');
                return response.data.avatarUrl;
            } else {
                set({ error: response.data.message });
                toast.error(response.data.message);
                return null;
            }
        } catch (error) {
            console.error('Error uploading avatar:', error);
            const errorMsg = error.response?.data?.message || 'Error uploading avatar';
            set({ error: errorMsg });
            toast.error(errorMsg);
            return null;
        } finally {
            set({ isLoading: false });
        }
    },

    // Get user messages
    getUserMessages: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(`${API_URL}/api/users/messages`, {
                withCredentials: true,
            });

            if (response.data.success) {
                set({ userMessages: response.data.messages });
            } else {
                set({ error: response.data.message });
            }
        } catch (error) {
            console.error('Error fetching user messages:', error);
            const errorMsg = error.response?.data?.message || 'Error fetching messages';
            set({ error: errorMsg });
        } finally {
            set({ isLoading: false });
        }
    },

    // Get user adoptions
    getUserAdoptions: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(`${API_URL}/api/users/adoptions`, {
                withCredentials: true,
            });

            if (response.data.success) {
                set({ userAdoptions: response.data.adoptions });
            } else {
                set({ error: response.data.message });
            }
        } catch (error) {
            console.error('Error fetching user adoptions:', error);
            const errorMsg = error.response?.data?.message || 'Error fetching adoptions';
            set({ error: errorMsg });
        } finally {
            set({ isLoading: false });
        }
    },

    // Clear user data (for logout)
    clearUserData: () => {
        set({
            userProfile: null,
            userMessages: [],
            userAdoptions: [],
            error: null
        });
    },
}));