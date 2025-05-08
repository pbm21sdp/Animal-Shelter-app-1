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
    searchSuggestions: [],
    notFound: false,

    resetNotFound: () => set({ notFound: false }),

    getAllPets: async (filters = {}) => {
        set({ isLoading: true, error: null });
        try {
            // Create a clean copy of filters
            const cleanFilters = { ...filters };

            // For admin dashboard, we want to see ALL pets regardless of adoption status
            // So we'll add a flag to indicate this is an admin request
            if (filters.isAdminRequest) {
                // Remove this flag before sending to backend
                delete cleanFilters.isAdminRequest;
                // Add a showAll flag to tell the backend to include all pets
                cleanFilters.showAll = true;
            }

            // Get filtered pets (with limit if specified)
            const queryParams = new URLSearchParams(cleanFilters).toString();
            const response = await axios.get(`${API_URL}?${queryParams}`);

            // Get total count without limit if a limit was specified
            let totalPets = 0;
            if (filters.limit) {
                const totalResponse = await axios.get(API_URL);
                let totalPetsData = [];

                if (Array.isArray(totalResponse.data)) {
                    totalPetsData = totalResponse.data;
                } else if (totalResponse.data && totalResponse.data.success && Array.isArray(totalResponse.data.pets)) {
                    totalPetsData = totalResponse.data.pets;
                } else if (totalResponse.data && Array.isArray(totalResponse.data.data)) {
                    totalPetsData = totalResponse.data.data;
                }

                totalPets = totalPetsData.length;
            }

            // Handle different response formats for the main request
            let petsData = [];
            if (Array.isArray(response.data)) {
                petsData = response.data;
            } else if (response.data && response.data.success && Array.isArray(response.data.pets)) {
                petsData = response.data.pets;
            } else if (response.data && Array.isArray(response.data.data)) {
                petsData = response.data.data;
            }

            // If we have a limit but didn't fetch total, use the current pets length
            if (!filters.limit) {
                totalPets = petsData.length;
            }

            set({
                pets: petsData,
                isLoading: false,
                totalPets: totalPets
            });

            return petsData;
        } catch (error) {
            console.error('Error fetching pets:', error);
            set({
                error: error.response?.data?.message || "Error fetching pets",
                isLoading: false,
                pets: []
            });
            throw error;
        }
        finally {
            set({ isLoading: false });
        }
    },

    searchPets: async (searchParams) => {
        set({ isLoading: true, error: null });
        try {
            // Create a cleaned copy of the search params to remove empty values
            const cleanedParams = {};

            // Only add parameters if they have meaningful values
            Object.keys(searchParams).forEach(key => {
                const value = searchParams[key];
                if (value === 'any' && key !== 'type') {
                    // Skip 'any' values except for type (which backend handles)
                    return;
                }
                if (value === '' || value === null || value === undefined) {
                    // Skip empty values
                    return;
                }
                cleanedParams[key] = value;
            });

            // console.log("Sending search params to API:", cleanedParams);

            const queryParams = new URLSearchParams(cleanedParams).toString();
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

            return petsData;
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

    getPetById: async (id, currentUser = null) => {
        set({ isLoading: true, error: null, notFound: false });

        try {
            // Fetch the pet data
            const response = await axios.get(`http://localhost:5000/api/pets/${id}`, {
                withCredentials: true
            });

            if (!response.data || !response.data.success) {
                set({ notFound: true, isLoading: false });
                return { success: false };
            }

            const pet = response.data.pet;

            // Check pet availability based on status
            if (pet && pet.adoption_status !== 'available') {
                // Admin users can always access
                if (currentUser && currentUser.isAdmin) {
                    set({ selectedPet: pet });
                    return { success: true, pet };
                }

                // For pending adoptions, check if current user is the applicant
                if (pet.adoption_status === 'pending' && currentUser) {
                    try {
                        const applicantCheck = await axios.get(
                            `http://localhost:5000/api/adoptions/check/${id}`,
                            { withCredentials: true }
                        );

                        // If user is the applicant, allow access
                        if (applicantCheck.data.success && applicantCheck.data.isApplicant) {
                            set({ selectedPet: pet });
                            return { success: true, pet };
                        }
                    } catch (error) {
                        console.error("Error checking adoption applicant status:", error);
                    }
                }

                // If we reach here, pet is not available and user is not admin or applicant
                set({ notFound: true, isLoading: false });
                return { success: false };
            }

            // Pet is available, store it and return success
            set({ selectedPet: pet });
            return { success: true, pet };

        } catch (error) {
            console.error("Error fetching pet details:", error);
            const errorMessage = error.response?.data?.message || "Failed to fetch pet details";
            set({ error: errorMessage, notFound: true });
            return { success: false, error: errorMessage };
        } finally {
            set({ isLoading: false });
        }
    },

    getSimilarPets: async (petId) => {
        try {
            const response = await axios.get(
                `http://localhost:5000/api/pets/${petId}/similar`,
                { withCredentials: true }
            );

            if (response.data.success) {
                set({ similarPets: response.data.pets });
            }
        } catch (error) {
            console.error("Error fetching similar pets:", error);
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

    // Get search suggestions as user types
    getSearchSuggestions: async (term) => {
        try {
            if (!term || term.length < 2) {
                set({searchSuggestions: []});
                return [];
            }

            const response = await axios.get(`${API_URL}/suggestions?term=${encodeURIComponent(term)}`);

            let suggestions = [];
            if (response.data && response.data.success && Array.isArray(response.data.suggestions)) {
                suggestions = response.data.suggestions;
            }

            set({searchSuggestions: suggestions});
            return suggestions;
        } catch (error) {
            console.error('Error fetching search suggestions:', error);
            set({searchSuggestions: []});
            return [];
        }
    },

    // Utility methods
    clearError: () => set({ error: null }),
    clearSelectedPet: () => set({ selectedPet: null, similarPets: [] })
}));