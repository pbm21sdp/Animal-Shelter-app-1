import { create } from "zustand";
import axios from "axios";

const API_URL = "http://localhost:5000/api/messages";

export const useMessageStore = create((set) => ({
    messages: [],
    isLoading: false,
    error: null,
    success: null,
    userMessages: [],
    unreadCount: 0,

    // Send a message
    sendMessage: async (email, message) => {
        set({ isLoading: true, error: null, success: null });
        try {
            const response = await axios.post(API_URL, { email, message });

            set({
                isLoading: false,
                success: response.data.message || 'Message sent successfully'
            });

            return { success: true };
        } catch (error) {
            console.error('Error sending message:', error);
            set({
                error: error.response?.data?.message || 'Error sending message',
                isLoading: false
            });
            return { success: false, error: error.response?.data?.message || 'Error sending message' };
        }
    },

    // For admin: Get all messages
    getAllMessages: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(`${API_URL}/admin`, {
                withCredentials: true
            });

            set({
                messages: response.data.messages,
                isLoading: false
            });

            return { success: true };
        } catch (error) {
            console.error('Error fetching messages:', error);
            set({
                error: error.response?.data?.message || 'Error fetching messages',
                isLoading: false
            });
            return { success: false, error: error.response?.data?.message || 'Error fetching messages' };
        }
    },

    // For admin: Mark message as read
    markMessageAsRead: async (messageId) => {
        set({ isLoading: true, error: null });
        try {
            await axios.put(`${API_URL}/admin/${messageId}/mark-read`, {}, {
                withCredentials: true
            });

            set(state => ({
                messages: state.messages.map(message =>
                    message._id === messageId
                        ? { ...message, read: true }
                        : message
                ),
                isLoading: false
            }));

            return { success: true };
        } catch (error) {
            console.error('Error marking message as read:', error);
            set({
                error: error.response?.data?.message || 'Error marking message as read',
                isLoading: false
            });
            return { success: false, error: error.response?.data?.message || 'Error marking message as read' };
        }
    },

    // For admin: Delete a message
    deleteMessage: async (messageId) => {
        set({ isLoading: true, error: null });
        try {
            await axios.delete(`${API_URL}/admin/${messageId}`, {
                withCredentials: true
            });

            set(state => ({
                messages: state.messages.filter(message => message._id !== messageId),
                isLoading: false
            }));

            return { success: true };
        } catch (error) {
            console.error('Error deleting message:', error);
            set({
                error: error.response?.data?.message || 'Error deleting message',
                isLoading: false
            });
            return { success: false, error: error.response?.data?.message || 'Error deleting message' };
        }
    },

    getUserMessages: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(`${API_URL}/user`, {
                withCredentials: true
            });

            const messages = response.data.messages || [];

            set({
                userMessages: messages,
                isLoading: false
            });

            return { success: true };
        } catch (error) {
            console.error('Error fetching user messages:', error);
            set({
                error: error.response?.data?.message || 'Failed to load messages',
                isLoading: false
            });
            return { success: false };
        }
    },

    getMessagesForUser: async (userId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(`${API_URL}/admin/user/${userId}`, {
                withCredentials: true
            });
            return { success: true, messages: response.data.messages };
        } catch (error) {
            console.error('Error fetching user messages:', error);
            set({
                error: error.response?.data?.message || 'Error fetching user messages',
                isLoading: false
            });
            return { success: false, error: error.response?.data?.message };
        }
    },

    // Clear success and error messages
    clearNotifications: () => set({ error: null, success: null })
}));