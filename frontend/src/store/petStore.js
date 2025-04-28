// store/petStore.js
import { create } from "zustand";
import axios from "axios";

const API_URL = "http://localhost:5000/api/pets";

export const usePetStore = create((set) => ({
    pets: [],
    selectedPet: null,
    similarPets: [],
    isLoading: false,
    error: null,
    totalPets: 0,

    getAllPets: async (filters = {}) => {
        set({ isLoading: true, error: null });
        try {
            const queryParams = new URLSearchParams(filters).toString();
            const response = await axios.get(`${API_URL}?${queryParams}`);

            // Handle different response formats
            let petsData = [];
            if (Array.isArray(response.data)) {
                petsData = response.data;
            } else if (response.data && response.data.success && Array.isArray(response.data.pets)) {
                petsData = response.data.pets;
            } else if (response.data && Array.isArray(response.data.data)) {
                petsData = response.data.data;
            }

            set({
                pets: petsData,
                isLoading: false,
                totalPets: response.data.totalPets || petsData.length
            });
        } catch (error) {
            console.error('Error fetching pets:', error);
            set({
                error: error.response?.data?.message || "Error fetching pets",
                isLoading: false,
                pets: []
            });
            throw error;
        }
    },

    searchPets: async (searchParams) => {
        set({ isLoading: true, error: null });
        try {
            const queryParams = new URLSearchParams(searchParams).toString();
            const response = await axios.get(`${API_URL}/search?${queryParams}`);

            // Handle different response formats
            let petsData = [];
            if (Array.isArray(response.data)) {
                petsData = response.data;
            } else if (response.data && response.data.success && Array.isArray(response.data.pets)) {
                petsData = response.data.pets;
            } else if (response.data && Array.isArray(response.data.data)) {
                petsData = response.data.data;
            }

            set({
                pets: petsData,
                isLoading: false,
                totalPets: response.data.totalPets || petsData.length
            });
        } catch (error) {
            console.error('Error searching pets:', error);
            set({
                error: error.response?.data?.message || "Error searching pets",
                isLoading: false,
                pets: []
            });
            throw error;
        }
    },

    getPetById: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(`${API_URL}/${id}`);

            let petData = null;
            if (response.data && response.data.success && response.data.pet) {
                petData = response.data.pet;
            } else if (response.data && response.data.data) {
                petData = response.data.data;
            } else {
                petData = response.data;
            }

            set({
                selectedPet: petData,
                isLoading: false
            });
            return petData;
        } catch (error) {
            console.error('Error fetching pet:', error);
            set({
                error: error.response?.data?.message || "Error fetching pet",
                isLoading: false
            });
            throw error;
        }
    },

    getSimilarPets: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(`${API_URL}/${id}/similar`);

            let similarPetsData = [];
            if (Array.isArray(response.data)) {
                similarPetsData = response.data;
            } else if (response.data && response.data.success && Array.isArray(response.data.pets)) {
                similarPetsData = response.data.pets;
            } else if (response.data && Array.isArray(response.data.data)) {
                similarPetsData = response.data.data;
            }

            set({
                similarPets: similarPetsData,
                isLoading: false
            });
        } catch (error) {
            console.error('Error fetching similar pets:', error);
            set({
                error: error.response?.data?.message || "Error fetching similar pets",
                isLoading: false,
                similarPets: []
            });
            throw error;
        }
    },

    // Admin methods (if needed)
    createPet: async (petData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.post(API_URL, petData);
            const newPet = response.data?.pet || response.data;

            set((state) => ({
                pets: [...state.pets, newPet],
                isLoading: false
            }));
            return newPet;
        } catch (error) {
            set({
                error: error.response?.data?.message || "Error creating pet",
                isLoading: false
            });
            throw error;
        }
    },

    updatePet: async (id, petData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.put(`${API_URL}/${id}`, petData);
            const updatedPet = response.data?.pet || response.data;

            set((state) => ({
                pets: state.pets.map(pet =>
                    pet.id === id ? updatedPet : pet
                ),
                selectedPet: state.selectedPet?.id === id ? updatedPet : state.selectedPet,
                isLoading: false
            }));
            return updatedPet;
        } catch (error) {
            set({
                error: error.response?.data?.message || "Error updating pet",
                isLoading: false
            });
            throw error;
        }
    },

    deletePet: async (id) => {
        set({ isLoading: true, error: null });
        try {
            await axios.delete(`${API_URL}/${id}`);
            set((state) => ({
                pets: state.pets.filter(pet => pet.id !== id),
                selectedPet: state.selectedPet?.id === id ? null : state.selectedPet,
                isLoading: false
            }));
        } catch (error) {
            set({
                error: error.response?.data?.message || "Error deleting pet",
                isLoading: false
            });
            throw error;
        }
    },

    // Utility methods
    clearError: () => set({ error: null }),
    clearSelectedPet: () => set({ selectedPet: null, similarPets: [] })
}));