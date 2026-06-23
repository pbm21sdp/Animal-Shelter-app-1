// components/Admin/PetsManagement.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePetStore } from '../../store/petStore';
import { PawPrint, Plus, X, Edit, Trash2, Check, Camera, Star, Search, Filter, RefreshCw } from 'lucide-react';
import axios from 'axios';
import AdminPagination from './shared/AdminPagination';
import AdminModal from './shared/AdminModal';
import AdminSearchBar from './shared/AdminSearchBar';

const PetsManagement = () => {
    const navigate = useNavigate();
    const { pets, isLoading, error, getAllPets, createPet, updatePet, deletePet } = usePetStore();

    // UI state
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredPets, setFilteredPets] = useState([]);

    // Form state
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
        traits: [],
        is_available: true,
        adoption_status: 'available'
    });

    // Photo state
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [currentPetPhotos, setCurrentPetPhotos] = useState([]);
    const [trait, setTrait] = useState('');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [petsPerPage] = useState(10);

    // Fetch all pets on component mount
    useEffect(() => {
        getAllPets({ isAdminRequest: true });
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
            traits: [],
            is_available: true,
            adoption_status: 'available'
        });
        setPhotoFile(null);
        setPhotoPreview(null);
        setTrait('');
        setCurrentPetPhotos([]);
    };

    // Handle form input changes
    const handleChange = (e) => {
        const { name, value } = e.target;

        // Special handling for boolean values like is_available
        if (name === 'is_available') {
            // Convert string 'true'/'false' to actual boolean
            const boolValue = value === 'true';

            // Update both is_available and adoption_status fields
            setFormData(prev => ({
                ...prev,
                [name]: boolValue,
                // Also update adoption_status based on is_available
                adoption_status: boolValue ? 'available' : 'unavailable'
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
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
            getAllPets({ isAdminRequest: true }); // Refresh the pet list
        } catch (error) {
            console.error('Error creating pet:', error);
        }
    };

    // Handle pet deletion
    const handleDelete = async () => {
        if (selectedPet) {
            try {
                await deletePet(selectedPet.id);
                setShowDeleteConfirm(false);
                setSelectedPet(null);
                getAllPets({ isAdminRequest: true }); // Refresh the pet list
            } catch (error) {
                console.error('Error deleting pet:', error);
            }
        }
    };

    // Navigate to the edit page for this pet
    const handleEditClick = (pet, e) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        navigate(`/pet/${pet.id}/edit`);
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

    // Pagination Logic
    const indexOfLastPet = currentPage * petsPerPage;
    const indexOfFirstPet = indexOfLastPet - petsPerPage;
    const getCurrentPets = () => {
        return filteredPets.slice(indexOfFirstPet, indexOfLastPet);
    };

    // Add Pet Form Content
    const renderAddEditForm = () => (
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

                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Available Pet
                        </label>
                        <select
                            name="is_available"
                            value={String(formData.is_available)} // Convert boolean to string 'true' or 'false'
                            onChange={handleChange}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        >
                            <option value="true">Yes</option>
                            <option value="false">No</option>
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
    );

    return (
        <div>
            {/* Title and Add Pet Button */}
            <div className="flex flex-wrap justify-between items-center mb-6">
                <h2 className="text-2xl font-bold mb-4 sm:mb-0">Manage Pets</h2>
                <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
                    <AdminSearchBar
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search pets..."
                    />
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {/* Pets Table */}
            <div className="bg-white shadow-md rounded-lg overflow-x-auto w-full">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pet</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Breed</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Moderation</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {isLoading ? (
                        <tr>
                            <td colSpan="9" className="px-6 py-4 text-center">Loading...</td>
                        </tr>
                    ) : filteredPets.length === 0 ? (
                        <tr>
                            <td colSpan="9" className="px-6 py-4 text-center">No pets found</td>
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
                                <td className="px-6 py-4">{pet.type}</td>
                                <td className="px-6 py-4">{pet.breed}</td>
                                <td className="px-6 py-4">{pet.age_category}</td>
                                <td className="px-6 py-4">{pet.gender}</td>
                                <td className="px-6 py-4">{pet.location_city}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                        pet.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                                            pet.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                'bg-amber-100 text-amber-800'
                                    }`}>
                                        {pet.status === 'approved' ? 'Approved' :
                                            pet.status === 'rejected' ? 'Rejected' :
                                                'Pending'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                        pet.adoption_status === 'available' ? 'bg-green-100 text-green-800' :
                                            pet.adoption_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                pet.adoption_status === 'adopted' ? 'bg-blue-100 text-blue-800' :
                                                    pet.adoption_status === 'unavailable' ? 'bg-gray-100 text-gray-800' :
                                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                        {pet.adoption_status === 'available' ? 'Available' :
                                            pet.adoption_status === 'pending' ? 'Pending' :
                                                pet.adoption_status === 'adopted' ? 'Adopted' :
                                                    pet.adoption_status === 'unavailable' ? 'Unavailable' :
                                                        pet.adoption_status || 'Unknown'}
                                    </span>
                                </td>
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

            {/* Pagination */}
            <AdminPagination
                itemsPerPage={petsPerPage}
                totalItems={filteredPets.length}
                currentPage={currentPage}
                paginate={setCurrentPage}
            />

            {/* Add Pet Modal */}
            <AdminModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                title="Add New Pet"
            >
                {renderAddEditForm()}
            </AdminModal>

            {/* Delete Confirmation Modal */}
            <AdminModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                title="Delete Pet"
                size="sm"
            >
                <div className="p-6">
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
            </AdminModal>
        </div>
    );
};

export default PetsManagement;