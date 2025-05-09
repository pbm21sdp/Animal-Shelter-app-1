// store/meetingStore.js
import { create } from "zustand";
import axios from "axios";

const API_URL = "http://localhost:5000/api/meetings";

export const useMeetingStore = create((set, get) => ({
    meetings: [],
    userMeetings: [],
    selectedMeeting: null,
    isLoading: false,
    error: null,
    success: null,

    // Get user's scheduled meetings
    getUserMeetings: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(`${API_URL}/user`, {
                withCredentials: true
            });

            set({
                userMeetings: response.data.meetings,
                isLoading: false
            });

            return response.data.meetings;
        } catch (error) {
            console.error('Error fetching user meetings:', error);
            set({
                error: error.response?.data?.message || 'Error fetching meetings',
                isLoading: false,
                userMeetings: []
            });
            return [];
        }
    },

    // Respond to meeting (accept or reject)
    respondToMeeting: async (meetingId, status) => {
        set({ isLoading: true, error: null, success: null });
        try {
            const response = await axios.put(`${API_URL}/respond/${meetingId}`,
                { status },
                { withCredentials: true }
            );

            // Update meeting in state
            set(state => ({
                userMeetings: state.userMeetings.map(meeting =>
                    meeting._id === meetingId ? response.data.meeting : meeting
                ),
                isLoading: false,
                success: `Meeting ${status} successfully`
            }));

            return { success: true, meeting: response.data.meeting };
        } catch (error) {
            console.error('Error responding to meeting:', error);
            set({
                error: error.response?.data?.message || `Error ${status} meeting`,
                isLoading: false
            });
            return { success: false, error: error.response?.data?.message || `Error ${status} meeting` };
        }
    },

    // Admin: Schedule a meeting
    scheduleMeeting: async (meetingData) => {
        set({ isLoading: true, error: null, success: null });
        try {
            const response = await axios.post(`${API_URL}/admin`,
                meetingData,
                { withCredentials: true }
            );

            set({
                isLoading: false,
                success: 'Meeting scheduled successfully'
            });

            return { success: true, meeting: response.data.meeting };
        } catch (error) {
            console.error('Error scheduling meeting:', error);
            set({
                error: error.response?.data?.message || 'Error scheduling meeting',
                isLoading: false
            });
            return { success: false, error: error.response?.data?.message || 'Error scheduling meeting' };
        }
    },

    // Admin: Get all meetings
    getAllMeetings: async (filters = {}) => {
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
                meetings: response.data.meetings,
                isLoading: false
            });

            return response.data.meetings;
        } catch (error) {
            console.error('Error fetching all meetings:', error);
            set({
                error: error.response?.data?.message || 'Error fetching meetings',
                isLoading: false,
                meetings: []
            });
            return [];
        }
    },

    // Admin: Get meeting details
    getMeetingDetails: async (meetingId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(`${API_URL}/admin/${meetingId}`, {
                withCredentials: true
            });

            set({
                selectedMeeting: response.data.meeting,
                isLoading: false
            });

            return { meeting: response.data.meeting, adoption: response.data.adoption };
        } catch (error) {
            console.error('Error fetching meeting details:', error);
            set({
                error: error.response?.data?.message || 'Error fetching meeting details',
                isLoading: false
            });
            return null;
        }
    },

    // Admin: Update meeting
    updateMeeting: async (meetingId, meetingData) => {
        set({ isLoading: true, error: null, success: null });
        try {
            const response = await axios.put(`${API_URL}/admin/${meetingId}`,
                meetingData,
                { withCredentials: true }
            );

            // Update meeting in state
            set(state => ({
                meetings: state.meetings.map(meeting =>
                    meeting._id === meetingId ? response.data.meeting : meeting
                ),
                selectedMeeting: state.selectedMeeting?._id === meetingId ? response.data.meeting : state.selectedMeeting,
                isLoading: false,
                success: 'Meeting updated successfully'
            }));

            return { success: true, meeting: response.data.meeting };
        } catch (error) {
            console.error('Error updating meeting:', error);
            set({
                error: error.response?.data?.message || 'Error updating meeting',
                isLoading: false
            });
            return { success: false, error: error.response?.data?.message || 'Error updating meeting' };
        }
    },

    // Admin: Delete meeting
    deleteMeeting: async (meetingId) => {
        set({ isLoading: true, error: null, success: null });
        try {
            await axios.delete(`${API_URL}/admin/${meetingId}`, {
                withCredentials: true
            });

            // Remove from state
            set(state => ({
                meetings: state.meetings.filter(meeting => meeting._id !== meetingId),
                selectedMeeting: state.selectedMeeting?._id === meetingId ? null : state.selectedMeeting,
                isLoading: false,
                success: 'Meeting deleted successfully'
            }));

            return { success: true };
        } catch (error) {
            console.error('Error deleting meeting:', error);
            set({
                error: error.response?.data?.message || 'Error deleting meeting',
                isLoading: false
            });
            return { success: false, error: error.response?.data?.message || 'Error deleting meeting' };
        }
    },

    // Clear selected meeting
    clearSelectedMeeting: () => set({ selectedMeeting: null }),

    // Clear error and success
    clearNotifications: () => set({ error: null, success: null })
}));