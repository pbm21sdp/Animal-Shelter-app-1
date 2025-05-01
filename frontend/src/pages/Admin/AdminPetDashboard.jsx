// pages/Admin/AdminPetDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePetStore } from '../../store/petStore';
import { useAuthStore } from '../../store/authStore';
import { PawPrint, Plus, X, ArrowLeft, Edit, Trash2, Check, Camera, Star } from 'lucide-react';
import axios from 'axios';

const AdminPetDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { pets, isLoading, error, getAllPets, createPet, updatePet, deletePet } = usePetStore();

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
                            filteredPets.map(pet => (
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
        </div>
    );
};

export default AdminPetDashboard;