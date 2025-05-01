// store/donationStore.js
import { create } from "zustand";
import axios from "axios";
import { loadStripe } from '@stripe/stripe-js';

const API_URL = "http://localhost:5000/api/donations";
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export const useDonationStore = create((set, get) => ({
    donations: [],
    isLoading: false,
    error: null,
    totalDonated: 0,

    // Create a donation checkout session and redirect to Stripe
    createDonation: async (userId, email, amountInCents) => {
        set({ isLoading: true, error: null });
        try {
            // Create checkout session on backend with specified amount
            const response = await axios.post(`${API_URL}/create-checkout`, {
                userId,
                email,
                amountInCents // Pass the amount in cents
            });

            // Redirect to Stripe Checkout using the URL
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

    // Get user's donation history
    getUserDonations: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(`${API_URL}/user`);

            // Calculate total amount donated
            const total = response.data.donations.reduce((sum, donation) => {
                return donation.status === 'completed' ? sum + donation.amount : sum;
            }, 0);

            set({
                donations: response.data.donations,
                totalDonated: total,
                isLoading: false
            });
        } catch (error) {
            console.error('Error fetching user donations:', error);
            set({
                error: error.response?.data?.message || "Error fetching donations",
                isLoading: false
            });
        }
    },

    // For admin: Get all donations
    getAllDonations: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(`${API_URL}/admin`);
            set({
                donations: response.data.donations,
                isLoading: false
            });
        } catch (error) {
            console.error('Error fetching all donations:', error);
            set({
                error: error.response?.data?.message || "Error fetching donations",
                isLoading: false
            });
        }
    },

    // Verify donation was successful (for success page)
    verifyDonation: async (sessionId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(`${API_URL}/verify/${sessionId}`);
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

    // Reset error state
    clearError: () => set({ error: null })
}));