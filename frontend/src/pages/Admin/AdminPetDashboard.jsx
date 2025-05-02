// pages/Admin/AdminPetDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePetStore } from '../../store/petStore';
import { useAuthStore } from '../../store/authStore';
import {useDonationStore} from "../../store/donationStore";
import { PawPrint, Plus, X, ArrowLeft, Edit, Trash2, Check, Camera, Star } from 'lucide-react';
import { Users, Banknote, Calendar, Filter, Search, RefreshCw, Copy } from 'lucide-react';
import axios from 'axios';


const AdminPetDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { pets, isLoading, error, getAllPets, createPet, updatePet, deletePet } = usePetStore();
    const { updateDonationStore, deleteDonationStore } = useDonationStore();

    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [selectedPet, setSelectedPet] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        type: 'dog',
        breed: '',
        age_category: 'young',
        gender: 'male',
        size: 'medium',
        color: '',
        coat: '',
        fee: '',
        description: '',
        health_status: 'healthy',
        story: '',
        location_address: '',
        location_city: '',
        location_country: '',
        shelter_contact_email: '',
        shelter_contact_phone: '',
        zip_code: '',
        traits: []
    });
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [currentPetPhotos, setCurrentPetPhotos] = useState([]);
    const [trait, setTrait] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredPets, setFilteredPets] = useState([]);


    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userDonations, setUserDonations] = useState([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [isLoadingDonations, setIsLoadingDonations] = useState(false);
    const [userError, setUserError] = useState(null);
    const [donationError, setDonationError] = useState(null);
    const [showDonationFilters, setShowDonationFilters] = useState(false);
    const [donationFilters, setDonationFilters] = useState({
        status: 'all',
        dateRange: 'all',
        minAmount: '',
        maxAmount: ''
    });

    // Edit Donations
    const [showDonationEditModal, setShowDonationEditModal] = useState(false);
    const [showDonationDeleteModal, setShowDonationDeleteModal] = useState(false);
    const [selectedDonation, setSelectedDonation] = useState(null);
    const [donationFormData, setDonationFormData] = useState({
        amount: '',
        status: '',
        date: ''
    });

    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [filteredUsers, setFilteredUsers] = useState([]);

    const [copiedSessionId, setCopiedSessionId] = useState(null);
    const [showCopyToast, setShowCopyToast] = useState(false);

    // Pagination for Pets
    const [currentPetPage, setCurrentPetPage] = useState(1);
    const [petsPerPage] = useState(10);

// Pagination for Users
    const [currentUserPage, setCurrentUserPage] = useState(1);
    const [usersPerPage] = useState(10);

// Pagination for Donations
    const [currentDonationPage, setCurrentDonationPage] = useState(1);
    const [donationsPerPage] = useState(10);

    // State for dynamic heights
    const [scrollableHeight, setScrollableHeight] = useState(400);

    // Check if user is admin
    useEffect(() => {
        if (!user?.isAdmin) {
            navigate('/');
        }
    }, [user, navigate]);

    // Fetch all pets on component mount
    useEffect(() => {
        getAllPets();
    }, [getAllPets]);

    // Update filtered pets when search term or pets change
    useEffect(() => {
        if (pets) {
            setFilteredPets(
                pets.filter(pet =>
                    pet.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    pet.breed?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    pet.type?.toLowerCase().includes(searchTerm.toLowerCase())
                )
            );
        }
    }, [searchTerm, pets]);

    // Update heights based on window size
    useEffect(() => {
        const updateHeight = () => {
            // Calculate approximately 60% of viewport height as a good default
            const calculatedHeight = Math.max(400, window.innerHeight * 0.6);
            setScrollableHeight(calculatedHeight);
        };

        updateHeight();
        window.addEventListener('resize', updateHeight);

        return () => window.removeEventListener('resize', updateHeight);
    }, []);

    // Reset form data
    const resetForm = () => {
        setFormData({
            name: '',
            type: 'dog',
            breed: '',
            age_category: 'young',
            gender: 'male',
            size: 'medium',
            color: '',
            coat: '',
            fee: '',
            description: '',
            health_status: 'healthy',
            story: '',
            location_address: '',
            location_city: '',
            location_country: '',
            shelter_contact_email: '',
            shelter_contact_phone: '',
            zip_code: '',
            traits: []
        });
        setPhotoFile(null);
        setPhotoPreview(null);
        setTrait('');
        setCurrentPetPhotos([]);
    };

    // Handle form input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle photo selection
    const handlePhotoChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setPhotoFile(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    // Add trait to list
    const addTrait = () => {
        if (trait.trim() && !formData.traits.includes(trait.trim())) {
            setFormData(prev => ({
                ...prev,
                traits: [...prev.traits, trait.trim()]
            }));
            setTrait('');
        }
    };

    // Remove trait from list
    const removeTrait = (traitToRemove) => {
        setFormData(prev => ({
            ...prev,
            traits: prev.traits.filter(t => t !== traitToRemove)
        }));
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const newPet = await createPet(formData);

            // If a photo is selected, upload it
            if (photoFile && newPet?.id) {
                await uploadPhoto(newPet.id, photoFile);
            }

            setShowAddModal(false);
            resetForm();
            getAllPets(); // Refresh the pet list
        } catch (error) {
            console.error('Error creating pet:', error);
        }
    };

    // Handle form update
    const handleUpdate = async (e) => {
        e.preventDefault();
        if (selectedPet) {
            try {
                await updatePet(selectedPet.id, formData);

                // If a photo is selected, upload it
                if (photoFile) {
                    await uploadPhoto(selectedPet.id, photoFile);
                }

                setShowEditModal(false);
                resetForm();
                setSelectedPet(null);
                getAllPets(); // Refresh the pet list
            } catch (error) {
                console.error('Error updating pet:', error);
            }
        }
    };

    // Handle pet deletion
    const handleDelete = async () => {
        if (selectedPet) {
            try {
                await deletePet(selectedPet.id);
                setShowDeleteConfirm(false);
                setSelectedPet(null);
                getAllPets(); // Refresh the pet list
            } catch (error) {
                console.error('Error deleting pet:', error);
            }
        }
    };

    // Open edit modal with pet data
    const handleEditClick = async (pet, e) => {
        // Stop event propagation to prevent table row click
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        setSelectedPet(pet);

        // Set form data from pet
        setFormData({
            name: pet.name || '',
            type: pet.type || 'dog',
            breed: pet.breed || '',
            age_category: pet.age_category || 'young',
            gender: pet.gender || 'male',
            size: pet.size || 'medium',
            color: pet.color || '',
            coat: pet.coat || '',
            fee: pet.fee || '',
            description: pet.description || '',
            health_status: pet.health_status || 'healthy',
            story: pet.story || '',
            location_address: pet.location_address || '',
            location_city: pet.location_city || '',
            location_country: pet.location_country || '',
            shelter_contact_email: pet.shelter_contact_email || '',
            shelter_contact_phone: pet.shelter_contact_phone || '',
            zip_code: pet.zip_code || '',
            traits: pet.traits ? (Array.isArray(pet.traits) ? pet.traits : [pet.traits]) : []
        });

        // Fetch photos for this pet
        try {
            const response = await axios.get(`http://localhost:5000/api/pets/${pet.id}/photos`);
            if (response.data.success) {
                setCurrentPetPhotos(response.data.photos || []);
            }
        } catch (error) {
            console.error('Error fetching pet photos:', error);
            setCurrentPetPhotos([]);
        }

        setShowEditModal(true);
    };

    // Handle delete button click
    const handleDeleteClick = (pet, e) => {
        // Stop event propagation
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        setSelectedPet(pet);
        setShowDeleteConfirm(true);
    };

    // Upload photo
    const uploadPhoto = async (petId, file) => {
        try {
            const formData = new FormData();
            formData.append('photo', file);

            await axios.post(
                `http://localhost:5000/api/pets/${petId}/photos`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    },
                    withCredentials: true
                }
            );

            return true;
        } catch (error) {
            console.error('Error uploading photo:', error);
            return false;
        }
    };

    // Set primary photo
    const setPrimaryPhoto = async (petId, photoId) => {
        try {
            await axios.put(
                `http://localhost:5000/api/pets/${petId}/photos/${photoId}/primary`,
                {},
                { withCredentials: true }
            );

            // Refresh photos
            const response = await axios.get(`http://localhost:5000/api/pets/${petId}/photos`);
            if (response.data.success) {
                setCurrentPetPhotos(response.data.photos || []);
            }
        } catch (error) {
            console.error('Error setting primary photo:', error);
        }
    };

    // Delete photo
    const deletePhoto = async (petId, photoId) => {
        try {
            await axios.delete(
                `http://localhost:5000/api/pets/${petId}/photos/${photoId}`,
                { withCredentials: true }
            );

            // Refresh photos
            const response = await axios.get(`http://localhost:5000/api/pets/${petId}/photos`);
            if (response.data.success) {
                setCurrentPetPhotos(response.data.photos || []);
            }
        } catch (error) {
            console.error('Error deleting photo:', error);
        }
    };

    // Get photo URL
    const getPhotoUrl = (photoId) => {
        return `http://localhost:5000/api/pets/photos/${photoId}`;
    };

    // Fetch all users
    const fetchUsers = async () => {
        setIsLoadingUsers(true);
        setUserError(null);
        try {
            const response = await axios.get('http://localhost:5000/api/users/admin', { withCredentials: true });
            if (response.data.success) {
                setUsers(response.data.users);
            } else {
                setUserError('Failed to fetch users');
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            setUserError(error.response?.data?.message || 'Error fetching users');
        } finally {
            setIsLoadingUsers(false);
        }
    };

// Fetch donations for a specific user
    const fetchUserDonations = async (userId) => {
        setIsLoadingDonations(true);
        setDonationError(null);
        try {
            const response = await axios.get(`http://localhost:5000/api/donations/admin/user/${userId}`, { withCredentials: true });
            if (response.data.success) {
                setUserDonations(response.data.donations);
            } else {
                setDonationError('Failed to fetch donations');
            }
        } catch (error) {
            console.error('Error fetching donations:', error);
            setDonationError(error.response?.data?.message || 'Error fetching donations');
        } finally {
            setIsLoadingDonations(false);
        }
    };

// Handle user selection to show their donations
    const handleUserSelect = (user) => {
        setSelectedUser(user);
        fetchUserDonations(user._id);
    };

// Handle donation filter changes
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setDonationFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

// Apply donation filters
    const getFilteredDonations = () => {
        if (!userDonations.length) return [];

        return userDonations.filter(donation => {
            // Status filter
            if (donationFilters.status !== 'all' && donation.status !== donationFilters.status) {
                return false;
            }

            // Amount filter
            const minAmount = donationFilters.minAmount ? parseFloat(donationFilters.minAmount) : 0;
            const maxAmount = donationFilters.maxAmount ? parseFloat(donationFilters.maxAmount) : Infinity;
            if (donation.amount < minAmount || donation.amount > maxAmount) {
                return false;
            }

            // Date range filter
            if (donationFilters.dateRange !== 'all') {
                const donationDate = new Date(donation.createdAt);

                if (donationFilters.dateRange === 'today') {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    if (donationDate < today) return false;
                } else if (donationFilters.dateRange === 'week') {
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    if (donationDate < weekAgo) return false;
                } else if (donationFilters.dateRange === 'month') {
                    const monthAgo = new Date();
                    monthAgo.setMonth(monthAgo.getMonth() - 1);
                    if (donationDate < monthAgo) return false;
                }
            }

            return true;
        });
    };

// Reset filters
    const resetFilters = () => {
        setDonationFilters({
            status: 'all',
            dateRange: 'all',
            minAmount: '',
            maxAmount: ''
        });
    };

// Format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text)
            .then(() => {
                // Visual feedback
                setCopiedSessionId(text);
                setShowCopyToast(true);

                // Hide toast after 2 seconds
                setTimeout(() => {
                    setShowCopyToast(false);
                    setTimeout(() => setCopiedSessionId(null), 300); // Reset after fade animation
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy text: ', err);
            });
    };

    // Handle donation edit click
    const handleDonationEditClick = (donation) => {
        setSelectedDonation(donation);

        // Format the date for the datetime-local input
        const donationDate = new Date(donation.createdAt);
        const formattedDate = donationDate.toISOString().slice(0, 16); // Format as YYYY-MM-DDTHH:MM

        setDonationFormData({
            amount: donation.amount,
            status: donation.status,
            date: formattedDate
        });

        setShowDonationEditModal(true);
    };

// Handle donation deletion click
    const handleDonationDeleteClick = (donation) => {
        setSelectedDonation(donation);
        setShowDonationDeleteModal(true);
    };

// Handle donation form change
    const handleDonationFormChange = (e) => {
        const { name, value } = e.target;
        setDonationFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const updateDonation = async () => {
        if (!selectedDonation) {
            console.error("No donation selected");
            return;
        }

        console.log("Updating donation:", selectedDonation);

        // Ensure we have the donation ID
        const donationId = selectedDonation._id;

        if (!donationId) {
            console.error("Donation ID is undefined:", selectedDonation);
            setDonationError("Cannot update donation - missing ID");
            return;
        }

        setIsLoadingDonations(true);
        setDonationError(null);

        try {
            const result = await updateDonationStore(donationId, {
                amount: parseFloat(donationFormData.amount),
                status: donationFormData.status,
                createdAt: new Date(donationFormData.date).toISOString()
            });

            if (result && result.success) {
                // Refresh donations
                fetchUserDonations(selectedUser._id);
                setShowDonationEditModal(false);
            } else {
                setDonationError(result?.error || 'Failed to update donation');
            }
        } catch (error) {
            console.error('Error updating donation:', error);
            setDonationError('Error updating donation: ' + (error.message || error));
        } finally {
            setIsLoadingDonations(false);
        }
    };

    const deleteDonation = async () => {
        if (!selectedDonation) {
            console.error("No donation selected");
            return;
        }

        console.log("Deleting donation:", selectedDonation);

        // Ensure we have the donation ID
        const donationId = selectedDonation._id;

        if (!donationId) {
            console.error("Donation ID is undefined:", selectedDonation);
            setDonationError("Cannot delete donation - missing ID");
            return;
        }

        setIsLoadingDonations(true);
        setDonationError(null);

        try {
            const result = await deleteDonationStore(donationId);

            if (result && result.success) {
                // Refresh donations
                fetchUserDonations(selectedUser._id);
                setShowDonationDeleteModal(false);
            } else {
                setDonationError(result?.error || 'Failed to delete donation');
            }
        } catch (error) {
            console.error('Error deleting donation:', error);
            setDonationError('Error deleting donation: ' + (error.message || error));
        } finally {
            setIsLoadingDonations(false);
        }
    };

    // Pagination Logic
    const indexOfLastPet = currentPetPage * petsPerPage;
    const indexOfFirstPet = indexOfLastPet - petsPerPage;
    const getCurrentPets = () => {
        return filteredPets.slice(indexOfFirstPet, indexOfLastPet);
    };

// Get current users for pagination
    const indexOfLastUser = currentUserPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const getCurrentUsers = () => {
        return filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
    };

// Get current donations for pagination
    const indexOfLastDonation = currentDonationPage * donationsPerPage;
    const indexOfFirstDonation = indexOfLastDonation - donationsPerPage;
    const getCurrentDonations = () => {
        return getFilteredDonations().slice(indexOfFirstDonation, indexOfLastDonation);
    };

// Change page handlers
    const paginate = (pageNumber, setter) => setter(pageNumber);

    const Pagination = ({ itemsPerPage, totalItems, currentPage, paginate }) => {
        const pageNumbers = [];

        for (let i = 1; i <= Math.ceil(totalItems / itemsPerPage); i++) {
            pageNumbers.push(i);
        }

        // Only show 5 page numbers max with current page in the middle when possible
        let visiblePages = pageNumbers;
        if (pageNumbers.length > 5) {
            const startIndex = Math.max(0, currentPage - 3);
            const endIndex = Math.min(pageNumbers.length, currentPage + 2);
            visiblePages = pageNumbers.slice(startIndex, endIndex);

            // Always show first and last page
            if (!visiblePages.includes(1)) {
                visiblePages.unshift(1);
                if (visiblePages[1] > 2) visiblePages.splice(1, 0, '...');
            }
            if (!visiblePages.includes(pageNumbers.length)) {
                if (visiblePages[visiblePages.length - 1] < pageNumbers.length - 1) {
                    visiblePages.push('...');
                }
                visiblePages.push(pageNumbers.length);
            }
        }

        if (pageNumbers.length <= 1) return null;

        return (
            <nav className="flex justify-center mt-4 mb-6">
                <ul className="flex">
                    <li className={`mx-1 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <button
                            onClick={() => currentPage > 1 && paginate(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-3 py-1 border rounded bg-gray-100 hover:bg-gray-200"
                        >
                            Prev
                        </button>
                    </li>

                    {visiblePages.map((number, index) => (
                        <li key={index} className="mx-1">
                            {number === '...' ? (
                                <span className="px-3 py-1">...</span>
                            ) : (
                                <button
                                    onClick={() => paginate(number)}
                                    className={`px-3 py-1 border rounded ${
                                        currentPage === number
                                            ? 'bg-tealcustom text-white'
                                            : 'bg-gray-100 hover:bg-gray-200'
                                    }`}
                                >
                                    {number}
                                </button>
                            )}
                        </li>
                    ))}

                    <li className={`mx-1 ${currentPage === pageNumbers.length ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <button
                            onClick={() => currentPage < pageNumbers.length && paginate(currentPage + 1)}
                            disabled={currentPage === pageNumbers.length}
                            className="px-3 py-1 border rounded bg-gray-100 hover:bg-gray-200"
                        >
                            Next
                        </button>
                    </li>
                </ul>
            </nav>
        );
    };


// Add useEffect for users
    useEffect(() => {
        fetchUsers();
    }, []);

// Add useEffect for filtering users by search term
    useEffect(() => {
        if (users.length) {
            setFilteredUsers(
                users.filter(user =>
                    user.name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                    user.email?.toLowerCase().includes(userSearchTerm.toLowerCase())
                )
            );
        }
    }, [userSearchTerm, users]);

// Add a cleanup function to clear selected user when component unmounts
    useEffect(() => {
        return () => {
            setSelectedUser(null);
            setUserDonations([]);
        };
    }, []);

    return (
        <div className="min-h-screen w-full bg-white">
            {/* Header */}
            <header className="bg-tealcustom text-white py-4 w-full">
                <div className="w-full px-4 flex justify-between items-center">
                    <div className="flex items-center">
                        <PawPrint className="h-6 w-6 mr-2" />
                        <h1 className="text-xl font-bold">Paws Admin Dashboard</h1>
                    </div>
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center text-white hover:text-yellow-200"
                        style={{ padding: '10px', touchAction: 'manipulation' }}
                    >
                        <ArrowLeft className="h-5 w-5 mr-1" />
                        Back to Home
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="w-full px-4 py-8">
                {/* Title and Add Pet Button */}
                <div className="flex flex-wrap justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold mb-4 sm:mb-0">Manage Pets</h2>
                    <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
                        <div className="relative w-full sm:w-auto">
                            <input
                                type="text"
                                placeholder="Search pets..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 w-full"
                            />
                        </div>
                        <button
                            onClick={() => {
                                resetForm();
                                setShowAddModal(true);
                            }}
                            className="bg-tealcustom hover:bg-teal-700 text-white px-4 py-2 rounded-md flex items-center w-full sm:w-auto justify-center"
                            style={{ padding: '10px', touchAction: 'manipulation', minWidth: '120px' }}
                        >
                            <Plus className="h-5 w-5 mr-1" />
                            Add New Pet
                        </button>
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                {/* Pets Table */}
                <div className="bg-white shadow-md rounded-lg overflow-hidden w-full">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pet</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Breed</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {isLoading ? (
                            <tr>
                                <td colSpan="7" className="px-6 py-4 text-center">Loading...</td>
                            </tr>
                        ) : filteredPets.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="px-6 py-4 text-center">No pets found</td>
                            </tr>
                        ) : (
                            // Use getCurrentPets() instead of filteredPets directly
                            getCurrentPets().map(pet => (
                                <tr key={pet.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-200 mr-3">
                                                {pet.photos && pet.photos.length > 0 ? (
                                                    <img
                                                        src={getPhotoUrl(pet.photos.find(p => p.is_primary)?.id || pet.photos[0].id)}
                                                        alt={pet.name}
                                                        className="h-full w-full object-cover"
                                                        onError={(e) => e.target.src = '/api/placeholder/40/40'}
                                                    />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center bg-gray-200 text-gray-500">
                                                        <PawPrint className="h-6 w-6" />
                                                        <span className="sr-only">No photo provided</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="font-medium text-gray-900">{pet.name}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">{pet.type}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{pet.breed}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{pet.age_category}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{pet.gender}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{pet.location_city}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleEditClick(pet, e);
                                                }}
                                                className="text-indigo-600 hover:text-indigo-900"
                                                style={{
                                                    touchAction: 'manipulation !important',
                                                    minHeight: '44px',
                                                    minWidth: '44px',
                                                    position: 'relative',
                                                    zIndex: 10,
                                                    padding: '10px'
                                                }}
                                                aria-label={`Edit ${pet.name}`}
                                            >
                                                <Edit className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleDeleteClick(pet, e);
                                                }}
                                                className="text-red-600 hover:text-red-900"
                                                style={{
                                                    touchAction: 'manipulation !important',
                                                    minHeight: '44px',
                                                    minWidth: '44px',
                                                    position: 'relative',
                                                    zIndex: 10
                                                }}
                                                aria-label={`Delete ${pet.name}`}
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>

                {/* Add Pagination Component for Pets */}
                <Pagination
                    itemsPerPage={petsPerPage}
                    totalItems={filteredPets.length}
                    currentPage={currentPetPage}
                    paginate={(pageNumber) => paginate(pageNumber, setCurrentPetPage)}
                />
            </main>

            {/* Add Pet Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-5xl max-h-screen overflow-y-auto">
                        <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-xl font-bold">Add New Pet</h3>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="text-gray-500 hover:text-gray-700 p-2"
                                style={{ touchAction: 'manipulation' }}
                                aria-label="Close modal"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Basic Info */}
                                <div>
                                    <h4 className="text-lg font-semibold mb-4">Basic Information</h4>

                                    <div className="mb-4">
                                        <label className="block text-gray-700 text-sm font-bold mb-2">
                                            Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-gray-700 text-sm font-bold mb-2">
                                            Type *
                                        </label>
                                        <select
                                            name="type"
                                            value={formData.type}
                                            onChange={handleChange}
                                            required
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        >
                                            <option value="dog">Dog</option>
                                            <option value="cat">Cat</option>
                                            <option value="bird">Bird</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-gray-700 text-sm font-bold mb-2">
                                            Breed *
                                        </label>
                                        <input
                                            type="text"
                                            name="breed"
                                            value={formData.breed}
                                            onChange={handleChange}
                                            required
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-gray-700 text-sm font-bold mb-2">
                                            Age Category *
                                        </label>
                                        <select
                                            name="age_category"
                                            value={formData.age_category}
                                            onChange={handleChange}
                                            required
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        >
                                            <option value="baby">Baby</option>
                                            <option value="young">Young</option>
                                            <option value="adult">Adult</option>
                                            <option value="senior">Senior</option>
                                        </select>
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-gray-700 text-sm font-bold mb-2">
                                            Gender *
                                        </label>
                                        <select
                                            name="gender"
                                            value={formData.gender}
                                            onChange={handleChange}
                                            required
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        >
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                        </select>
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-gray-700 text-sm font-bold mb-2">
                                            Size *
                                        </label>
                                        <select
                                            name="size"
                                            value={formData.size}
                                            onChange={handleChange}
                                            required
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        >
                                            <option value="small">Small</option>
                                            <option value="medium">Medium</option>
                                            <option value="large">Large</option>
                                            <option value="xlarge">Extra Large</option>
                                        </select>
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-gray-700 text-sm font-bold mb-2">
                                            Color
                                        </label>
                                        <input
                                            type="text"
                                            name="color"
                                            value={formData.color}
                                            onChange={handleChange}
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-gray-700 text-sm font-bold mb-2">
                                            Coat
                                        </label>
                                        <input
                                            type="text"
                                            name="coat"
                                            value={formData.coat}
                                            onChange={handleChange}
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-gray-700 text-sm font-bold mb-2">
                                            Adoption Fee ($)
                                        </label>
                                        <input
                                            type="number"
                                            name="fee"
                                            value={formData.fee}
                                            onChange={handleChange}
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-gray-700 text-sm font-bold mb-2">
                                            Health Status
                                        </label>
                                        <select
                                            name="health_status"
                                            value={formData.health_status}
                                            onChange={handleChange}
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        >
                                            <option value="healthy">Healthy</option>
                                            <option value="minor_issues">Minor Health Issues</option>
                                            <option value="special_needs">Special Needs</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Additional Info */}
                                <div>
                                    <h4 className="text-lg font-semibold mb-4">Additional Information</h4>

                                    <div className="mb-4">
                                        <label className="block text-gray-700 text-sm font-bold mb-2">
                                            Description
                                        </label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleChange}
                                            rows="3"
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        ></textarea>
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-gray-700 text-sm font-bold mb-2">
                                            Story
                                        </label>
                                        <textarea
                                            name="story"
                                            value={formData.story}
                                            onChange={handleChange}
                                            rows="3"
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        ></textarea>
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-gray-700 text-sm font-bold mb-2">
                                            Traits
                                        </label>
                                        <div className="flex">
                                            <input
                                                type="text"
                                                value={trait}
                                                onChange={(e) => setTrait(e.target.value)}
                                                className="shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                                placeholder="Add trait (e.g., friendly, playful)"
                                            />
                                            <button
                                                type="button"
                                                onClick={addTrait}
                                                className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-r flex-shrink-0"
                                                style={{ touchAction: 'manipulation' }}
                                            >
                                                <Plus className="h-5 w-5" />
                                            </button>
                                        </div>
                                        <div className="mt-2 flex flex-wrap">
                                            {formData.traits.map((t, index) => (
                                                <span
                                                    key={index}
                                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800 mr-2 mb-2"
                                                >
                                                    {t}
                                                    <button
                                                        type="button"
                                                        onClick={() => removeTrait(t)}
                                                        className="ml-1 text-teal-500 hover:text-teal-700 p-1"
                                                        style={{ touchAction: 'manipulation' }}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-gray-700 text-sm font-bold mb-2">
                                            Photo
                                        </label>
                                        <div className="flex items-center">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handlePhotoChange}
                                                className="hidden"
                                                id="photo-upload"
                                            />
                                            <label
                                                htmlFor="photo-upload"
                                                className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded flex items-center"
                                                style={{ touchAction: 'manipulation' }}
                                            >
                                                <Camera className="h-5 w-5 mr-2" />
                                                Select Photo
                                            </label>

                                            {photoPreview && (
                                                <div className="ml-4">
                                                    <img
                                                        src={photoPreview}
                                                        alt="Preview"
                                                        className="h-16 w-16 object-cover rounded"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <h4 className="text-lg font-semibold mb-4 mt-6">Location Information</h4>

                                    <div className="mb-4">
                                        <label className="block text-gray-700 text-sm font-bold mb-2">
                                            Address
                                        </label>
                                        <input
                                            type="text"
                                            name="location_address"
                                            value={formData.location_address}
                                            onChange={handleChange}
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-gray-700 text-sm font-bold mb-2">
                                            City *
                                        </label>
                                        <input
                                            type="text"
                                            name="location_city"
                                            value={formData.location_city}
                                            onChange={handleChange}
                                            required
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-gray-700 text-sm font-bold mb-2">
                                            Country *
                                        </label>
                                        <input
                                            type="text"
                                            name="location_country"
                                            value={formData.location_country}
                                            onChange={handleChange}
                                            required
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-gray-700 text-sm font-bold mb-2">
                                            Zip Code *
                                        </label>
                                        <input
                                            type="text"
                                            name="zip_code"
                                            value={formData.zip_code}
                                            onChange={handleChange}
                                            required
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-gray-700 text-sm font-bold mb-2">
                                            Shelter Contact Email
                                        </label>
                                        <input
                                            type="email"
                                            name="shelter_contact_email"
                                            value={formData.shelter_contact_email}
                                            onChange={handleChange}
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-gray-700 text-sm font-bold mb-2">
                                            Shelter Contact Phone
                                        </label>
                                        <input
                                            type="tel"
                                            name="shelter_contact_phone"
                                            value={formData.shelter_contact_phone}
                                            onChange={handleChange}
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="mr-4 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
                                    style={{ touchAction: 'manipulation', minWidth: '100px' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-tealcustom hover:bg-teal-700 text-white px-4 py-2 rounded flex items-center justify-center"
                                    style={{ touchAction: 'manipulation', minWidth: '120px' }}
                                >
                                    <Check className="h-5 w-5 mr-2" />
                                    Save Pet
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Pet Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-5xl max-h-screen overflow-y-auto">
                        <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-xl font-bold">Edit Pet: {selectedPet?.name}</h3>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="text-gray-500 hover:text-gray-700 p-2"
                                style={{ touchAction: 'manipulation' }}
                                aria-label="Close modal"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <form onSubmit={handleUpdate} className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Basic Info */}
                                <div>
                                    <h4 className="text-lg font-semibold mb-4">Basic Information</h4>

                                    <div className="mb-4">
                                        <label className="block text-gray-700 text-sm font-bold mb-2">
                                            Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-gray-700 text-sm font-bold mb-2">
                                            Type *
                                        </label>
                                        <select
                                            name="type"
                                            value={formData.type}
                                            onChange={handleChange}
                                            required
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        >
                                            <option value="dog">Dog</option>
                                            <option value="cat">Cat</option>
                                            <option value="bird">Bird</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-gray-700 text-sm font-bold mb-2">
                                            Breed *
                                        </label>
                                        <input
                                            type="text"
                                            name="breed"
                                            value={formData.breed}
                                            onChange={handleChange}
                                            required
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-gray-700 text-sm font-bold mb-2">
                                            Age Category *
                                        </label>
                                        <select
                                            name="age_category"
                                            value={formData.age_category}
                                            onChange={handleChange}
                                            required
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        >
                                            <option value="baby">Baby</option>
                                            <option value="young">Young</option>
                                            <option value="adult">Adult</option>
                                            <option value="senior">Senior</option>
                                        </select>
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-gray-700 text-sm font-bold mb-2">
                                            Gender *
                                        </label>
                                        <select
                                            name="gender"
                                            value={formData.gender}
                                            onChange={handleChange}
                                            required
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        >
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                        </select>
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-gray-700 text-sm font-bold mb-2">
                                            Size *
                                        </label>
                                        <select
                                            name="size"
                                            value={formData.size}
                                            onChange={handleChange}
                                            required
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        >
                                            <option value="small">Small</option>
                                            <option value="medium">Medium</option>
                                            <option value="large">Large</option>
                                            <option value="xlarge">Extra Large</option>
                                        </select>
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-gray-700 text-sm font-bold mb-2">
                                            Color
                                        </label>
                                        <input
                                            type="text"
                                            name="color"
                                            value={formData.color}
                                            onChange={handleChange}
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-gray-700 text-sm font-bold mb-2">
                                            Coat
                                        </label>
                                        <input
                                            type="text"
                                            name="coat"
                                            value={formData.coat}
                                            onChange={handleChange}
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-gray-700 text-sm font-bold mb-2">
                                            Adoption Fee ($)
                                        </label>
                                        <input
                                            type="number"
                                            name="fee"
                                            value={formData.fee}
                                            onChange={handleChange}
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-gray-700 text-sm font-bold mb-2">
                                            Health Status
                                        </label>
                                        <select
                                            name="health_status"
                                            value={formData.health_status}
                                            onChange={handleChange}
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        >
                                            <option value="healthy">Healthy</option>
                                            <option value="minor_issues">Minor Health Issues</option>
                                            <option value="special_needs">Special Needs</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Additional Info */}
                                <div>
                                    <h4 className="text-lg font-semibold mb-4">Additional Information</h4>

                                    <div className="mb-4">
                                        <label className="block text-gray-700 text-sm font-bold mb-2">
                                            Description
                                        </label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleChange}
                                            rows="3"
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        ></textarea>
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-gray-700 text-sm font-bold mb-2">
                                            Story
                                        </label>
                                        <textarea
                                            name="story"
                                            value={formData.story}
                                            onChange={handleChange}
                                            rows="3"
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        ></textarea>
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-gray-700 text-sm font-bold mb-2">
                                            Traits
                                        </label>
                                        <div className="flex">
                                            <input
                                                type="text"
                                                value={trait}
                                                onChange={(e) => setTrait(e.target.value)}
                                                className="shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                                placeholder="Add trait (e.g., friendly, playful)"
                                            />
                                            <button
                                                type="button"
                                                onClick={addTrait}
                                                className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-r flex-shrink-0"
                                                style={{ touchAction: 'manipulation' }}
                                            >
                                                <Plus className="h-5 w-5" />
                                            </button>
                                        </div>
                                        <div className="mt-2 flex flex-wrap">
                                            {formData.traits.map((t, index) => (
                                                <span
                                                    key={index}
                                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800 mr-2 mb-2"
                                                >
                                                    {t}
                                                    <button
                                                        type="button"
                                                        onClick={() => removeTrait(t)}
                                                        className="ml-1 text-teal-500 hover:text-teal-700 p-1"
                                                        style={{ touchAction: 'manipulation' }}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-gray-700 text-sm font-bold mb-2">
                                            Current Photos
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {currentPetPhotos.length === 0 ? (
                                                <p className="text-gray-500 italic">No photos provided</p>
                                            ) : (
                                                currentPetPhotos.map((photo) => (
                                                    <div key={photo.id} className="relative group">
                                                        <img
                                                            src={getPhotoUrl(photo.id)}
                                                            alt={photo.photo_name || 'Pet photo'}
                                                            className={`h-20 w-20 object-cover rounded border-2 ${photo.is_primary ? 'border-yellow-400' : 'border-transparent'}`}
                                                            onError={(e) => e.target.src = '/api/placeholder/80/80'}
                                                        />
                                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                            {!photo.is_primary && (
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setPrimaryPhoto(selectedPet.id, photo.id);
                                                                    }}
                                                                    className="text-yellow-400 hover:text-yellow-300 mx-1 p-2"
                                                                    style={{ touchAction: 'manipulation' }}
                                                                    title="Set as primary photo"
                                                                >
                                                                    <Star className="h-5 w-5" />
                                                                </button>
                                                            )}
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    deletePhoto(selectedPet.id, photo.id);
                                                                }}
                                                                className="text-red-400 hover:text-red-300 mx-1 p-2"
                                                                style={{ touchAction: 'manipulation' }}
                                                                title="Delete photo"
                                                            >
                                                                <Trash2 className="h-5 w-5" />
                                                            </button>
                                                        </div>
                                                        {photo.is_primary && (
                                                            <span className="absolute top-0 right-0 bg-yellow-400 text-white text-xs px-1 rounded-bl">
                                                                Primary
                                                            </span>
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-gray-700 text-sm font-bold mb-2">
                                            Add New Photo
                                        </label>
                                        <div className="flex items-center">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handlePhotoChange}
                                                className="hidden"
                                                id="photo-upload-edit"
                                            />
                                            <label
                                                htmlFor="photo-upload-edit"
                                                className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded flex items-center"
                                                style={{ touchAction: 'manipulation' }}
                                            >
                                                <Camera className="h-5 w-5 mr-2" />
                                                Select Photo
                                            </label>

                                            {photoPreview && (
                                                <div className="ml-4">
                                                    <img
                                                        src={photoPreview}
                                                        alt="Preview"
                                                        className="h-16 w-16 object-cover rounded"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <h4 className="text-lg font-semibold mb-4 mt-6">Location Information</h4>

                                    <div className="mb-4">
                                        <label className="block text-gray-700 text-sm font-bold mb-2">
                                            Address
                                        </label>
                                        <input
                                            type="text"
                                            name="location_address"
                                            value={formData.location_address}
                                            onChange={handleChange}
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-gray-700 text-sm font-bold mb-2">
                                            City *
                                        </label>
                                        <input
                                            type="text"
                                            name="location_city"
                                            value={formData.location_city}
                                            onChange={handleChange}
                                            required
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-gray-700 text-sm font-bold mb-2">
                                            Country *
                                        </label>
                                        <input
                                            type="text"
                                            name="location_country"
                                            value={formData.location_country}
                                            onChange={handleChange}
                                            required
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-gray-700 text-sm font-bold mb-2">
                                            Zip Code *
                                        </label>
                                        <input
                                            type="text"
                                            name="zip_code"
                                            value={formData.zip_code}
                                            onChange={handleChange}
                                            required
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-gray-700 text-sm font-bold mb-2">
                                            Shelter Contact Email
                                        </label>
                                        <input
                                            type="email"
                                            name="shelter_contact_email"
                                            value={formData.shelter_contact_email}
                                            onChange={handleChange}
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-gray-700 text-sm font-bold mb-2">
                                            Shelter Contact Phone
                                        </label>
                                        <input
                                            type="tel"
                                            name="shelter_contact_phone"
                                            value={formData.shelter_contact_phone}
                                            onChange={handleChange}
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="mr-4 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
                                    style={{ touchAction: 'manipulation', minWidth: '100px' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-tealcustom hover:bg-teal-700 text-white px-4 py-2 rounded flex items-center justify-center"
                                    style={{ touchAction: 'manipulation', minWidth: '120px' }}
                                >
                                    <Check className="h-5 w-5 mr-2" />
                                    Update Pet
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <h3 className="text-xl font-bold mb-4">Delete Pet</h3>
                        <p className="mb-6">
                            Are you sure you want to delete {selectedPet?.name}? This action cannot be undone.
                        </p>
                        <div className="flex justify-end">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="mr-4 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
                                style={{ touchAction: 'manipulation', minWidth: '100px' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center justify-center"
                                style={{ touchAction: 'manipulation', minWidth: '120px' }}
                            >
                                <Trash2 className="h-5 w-5 mr-2" />
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Users and Donations Section */}
            <div className="mt-12">
                <div className="flex flex-wrap justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold mb-4 sm:mb-0 flex items-center">
                        <Users className="h-6 w-6 mr-2" />
                        Manage Users & Donations
                    </h2>
                    <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
                        <div className="relative w-full sm:w-auto">
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={userSearchTerm}
                                onChange={(e) => setUserSearchTerm(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 w-full"
                            />
                            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        </div>
                        <button
                            onClick={fetchUsers}
                            className="bg-tealcustom hover:bg-teal-700 text-white px-4 py-2 rounded-md flex items-center w-full sm:w-auto justify-center"
                        >
                            <RefreshCw className="h-5 w-5 mr-1" />
                            Refresh Users
                        </button>
                    </div>
                </div>

                {/* User Error Display */}
                {userError && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {userError}
                    </div>
                )}

                {/* Users & Donations Container */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Users List with Scrollbar */}
                    <div className="bg-white shadow-md rounded-lg overflow-hidden">
                        <div className="p-4 bg-gray-50 border-b border-gray-200 font-semibold flex justify-between">
                            <span>Users</span>
                            <span className="text-sm text-gray-500">{filteredUsers.length} total</span>
                        </div>
                        <div className="overflow-y-auto" style={{ height: '500px' }}>
                            {isLoadingUsers ? (
                                <div className="p-6 text-center">Loading users...</div>
                            ) : filteredUsers.length === 0 ? (
                                <div className="p-6 text-center">No users found</div>
                            ) : (
                                <ul className="divide-y divide-gray-200">
                                    {filteredUsers.map(user => (
                                        <li
                                            key={user._id}
                                            onClick={() => handleUserSelect(user)}
                                            className={`p-4 hover:bg-gray-50 cursor-pointer ${selectedUser?._id === user._id ? 'bg-teal-50 border-l-4 border-tealcustom' : ''}`}
                                        >
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0">
                                                    <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center">
                                                        <span className="text-tealcustom font-semibold">{user.name?.charAt(0) || user.email?.charAt(0) || '?'}</span>
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="font-medium text-gray-900">{user.name || 'Unnamed User'}</div>
                                                    <div className="text-sm text-gray-500">{user.email}</div>
                                                </div>
                                                <div className="ml-auto text-xs bg-gray-100 px-2 py-1 rounded">
                                                    {user.isAdmin ? 'Admin' : 'User'}
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* Donations Panel with Scrollbar */}
                    <div className="lg:col-span-2 bg-white shadow-md rounded-lg overflow-hidden">
                        <div className="p-4 bg-gray-50 border-b border-gray-200 font-semibold flex justify-between items-center">
                            <div>
                                {selectedUser ? (
                                    <div className="flex items-center">
                                        <span>{`Donations for ${selectedUser.name || selectedUser.email}`}</span>
                                        <span className="ml-2 text-sm text-gray-500">
                            {getFilteredDonations().length} total
                        </span>
                                    </div>
                                ) : (
                                    'Donations'
                                )}
                            </div>
                            <button
                                onClick={() => setShowDonationFilters(!showDonationFilters)}
                                className="text-gray-500 hover:text-tealcustom"
                            >
                                <Filter className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Filter Panel */}
                        {showDonationFilters && (
                            <div className="p-4 bg-gray-50 border-b border-gray-200">
                                <div className="text-sm font-medium mb-2">Filter Donations</div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-gray-700 text-xs font-medium mb-1">Status</label>
                                        <select
                                            name="status"
                                            value={donationFilters.status}
                                            onChange={handleFilterChange}
                                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                        >
                                            <option value="all">All</option>
                                            <option value="completed">Completed</option>
                                            <option value="pending">Pending</option>
                                            <option value="canceled">Canceled</option>
                                            <option value="failed">Failed</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-gray-700 text-xs font-medium mb-1">Date Range</label>
                                        <select
                                            name="dateRange"
                                            value={donationFilters.dateRange}
                                            onChange={handleFilterChange}
                                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                        >
                                            <option value="all">All Time</option>
                                            <option value="today">Today</option>
                                            <option value="week">Last 7 Days</option>
                                            <option value="month">Last 30 Days</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-gray-700 text-xs font-medium mb-1">Min Amount (€)</label>
                                        <input
                                            type="number"
                                            name="minAmount"
                                            value={donationFilters.minAmount}
                                            onChange={handleFilterChange}
                                            placeholder="Min"
                                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-700 text-xs font-medium mb-1">Max Amount (€)</label>
                                        <input
                                            type="number"
                                            name="maxAmount"
                                            value={donationFilters.maxAmount}
                                            onChange={handleFilterChange}
                                            placeholder="Max"
                                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="mt-3 flex justify-end">
                                    <button
                                        onClick={resetFilters}
                                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm px-3 py-1 rounded-md"
                                    >
                                        Reset Filters
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Donation Error Display */}
                        {donationError && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 m-4 rounded">
                                {donationError}
                            </div>
                        )}

                        {/* Donations Content */}
                        <div className="overflow-hidden">
                            {!selectedUser ? (
                                <div className="p-8 text-center text-gray-500">
                                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                    <p>Select a user to view their donations</p>
                                </div>
                            ) : isLoadingDonations ? (
                                <div className="p-6 text-center">Loading donations...</div>
                            ) : (
                                <div>
                                    {getFilteredDonations().length === 0 ? (
                                        <div className="p-6 text-center text-gray-500">
                                            <Banknote className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                            <p>No donations found with the current filters</p>
                                        </div>
                                    ) : (
                                        <div className="overflow-y-auto" style={{ height: '500px' }}>
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50 sticky top-0 z-10">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session ID</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                                </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                {getFilteredDonations().map(donation => (
                                                    <tr
                                                        key={donation._id}
                                                        className="hover:bg-gray-50 cursor-pointer"
                                                        onClick={() => handleDonationEditClick(donation)}
                                                    >
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                                                                <span className="text-sm text-gray-900">{formatDate(donation.createdAt)}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <Banknote className="h-4 w-4 text-gray-400 mr-1" />
                                                                <span className="text-sm font-medium text-gray-900">€{donation.amount.toFixed(2)}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                donation.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                    donation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                        donation.status === 'canceled' ? 'bg-gray-100 text-gray-800' :
                                                            'bg-red-100 text-red-800'
                                            }`}>
                                                {donation.status}
                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <div className="text-sm text-gray-500 max-w-xs truncate mr-2" title={donation.stripeSessionId}>
                                                                    {donation.stripeSessionId}
                                                                </div>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation(); // Prevent row click
                                                                        copyToClipboard(donation.stripeSessionId);
                                                                    }}
                                                                    className={`${copiedSessionId === donation.stripeSessionId ? 'text-green-500' : 'text-gray-400 hover:text-tealcustom'} p-1 rounded transition-colors duration-300`}
                                                                    title="Copy Session ID"
                                                                >
                                                                    {copiedSessionId === donation.stripeSessionId ? (
                                                                        <Check className="h-4 w-4" />
                                                                    ) : (
                                                                        <Copy className="h-4 w-4" />
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex space-x-2">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation(); // Prevent row click
                                                                        handleDonationEditClick(donation);
                                                                    }}
                                                                    className="text-indigo-600 hover:text-indigo-900 p-1"
                                                                    title="Edit Donation"
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation(); // Prevent row click
                                                                        handleDonationDeleteClick(donation);
                                                                    }}
                                                                    className="text-red-600 hover:text-red-900 p-1"
                                                                    title="Delete Donation"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Copy Toast Notification */}
                {showCopyToast && (
                    <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-md shadow-lg flex items-center animate-fade-in-out">
                        <Check className="h-4 w-4 text-green-400 mr-2" />
                        <span>Session ID copied to clipboard</span>
                    </div>
                )}

                {/* Edit Donation Modal */}
                {showDonationEditModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg max-w-md w-full p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold">Edit Donation</h3>
                                <button
                                    onClick={() => setShowDonationEditModal(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                    aria-label="Close modal"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <form onSubmit={(e) => { e.preventDefault(); updateDonation(); }}>
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">
                                        Amount (€)
                                    </label>
                                    <input
                                        type="number"
                                        name="amount"
                                        value={donationFormData.amount}
                                        onChange={handleDonationFormChange}
                                        step="0.01"
                                        required
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">
                                        Status
                                    </label>
                                    <select
                                        name="status"
                                        value={donationFormData.status}
                                        onChange={handleDonationFormChange}
                                        required
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    >
                                        <option value="completed">Completed</option>
                                        <option value="pending">Pending</option>
                                        <option value="canceled">Canceled</option>
                                        <option value="failed">Failed</option>
                                    </select>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">
                                        Date
                                    </label>
                                    <input
                                        type="datetime-local"
                                        name="date"
                                        value={donationFormData.date}
                                        onChange={handleDonationFormChange}
                                        required
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    />
                                </div>

                                <div className="flex justify-end mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowDonationEditModal(false)}
                                        className="mr-4 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="bg-tealcustom hover:bg-teal-700 text-white px-4 py-2 rounded flex items-center justify-center"
                                    >
                                        <Check className="h-5 w-5 mr-2" />
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Delete Donation Confirmation Modal */}
                {showDonationDeleteModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg max-w-md w-full p-6">
                            <h3 className="text-xl font-bold mb-4">Delete Donation</h3>
                            <p className="mb-6">
                                Are you sure you want to delete this donation of €{selectedDonation?.amount.toFixed(2)}? This action cannot be undone.
                            </p>
                            <div className="flex justify-end">
                                <button
                                    onClick={() => setShowDonationDeleteModal(false)}
                                    className="mr-4 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={deleteDonation}
                                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center justify-center"
                                >
                                    <Trash2 className="h-5 w-5 mr-2" />
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

        {/* Inbox section */}

        </div>
    );
};

export default AdminPetDashboard;