// pages/PetDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    PawPrint,
    Search,
    ArrowRight,
    Check,
    MapPin,
    Mail,
    Phone,
    Twitter,
    Instagram,
    Facebook,
    ArrowLeft,
    X,
    LogOut,
    Home,
    MessageSquare,
    MessageCircle
} from 'lucide-react';

import { usePetStore } from '../store/petStore';
import Footer from "../components/page/Footer.jsx";
import DynamicSearch from "../components/DynamicSearch.jsx";
import UserAdoptionForm from "../components/UserAdoptionForm";
import PetCard from '../components/PetCard';

import {useAuthStore} from "../store/authStore.js";
import NotFoundPage from './NotFoundPage'; // Make sure you have this component

export function PetDetailPage() {

    const { id } = useParams();
    const navigate = useNavigate();
    const {user, logout} = useAuthStore();
    const [setNotFound] = useState(false);
    const [adoptionSuccess, setAdoptionSuccess] = useState(false); // New state for success message
    const {
        selectedPet: pet,
        similarPets,
        isLoading,
        error,
        notFound,
        getPetById,
        getSimilarPets,
        clearSelectedPet,
        resetNotFound,
        totalPets
    } = usePetStore();

    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const [showAdoptionForm, setShowAdoptionForm] = useState(false);
    const [showQuestionForm, setShowQuestionForm] = useState(false);
    const [questionFormData, setQuestionFormData] = useState({
        name: '',
        email: '',
        questionType: '',
        question: ''
    });
    const [questionFormErrors, setQuestionFormErrors] = useState({});
    const [questionSubmitStatus, setQuestionSubmitStatus] = useState('');

    useEffect(() => {
        // Reset notFound state when component mounts
        resetNotFound();

        // Get pet data and pass the current user for access control
        const loadPetDetails = async () => {
            const result = await getPetById(id);

            // If pet was found and access is allowed, load similar pets
            if (result && result.success) {
                getSimilarPets(id);
            }
        };

        loadPetDetails();

        // Cleanup when component unmounts
        return () => {
            clearSelectedPet();
        };
    }, [id, user, getPetById, getSimilarPets, clearSelectedPet, resetNotFound]);


    const handleLogout = () => {
        logout();
    };

    const handleQuestionInputChange = (e) => {
        const { name, value } = e.target;
        setQuestionFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user starts typing
        if (questionFormErrors[name]) {
            setQuestionFormErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateQuestionForm = () => {
        const errors = {};

        if (!questionFormData.name.trim()) errors.name = 'Name is required';
        if (!questionFormData.email.trim()) {
            errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(questionFormData.email)) {
            errors.email = 'Invalid email format';
        }
        if (!questionFormData.question.trim()) errors.question = 'Please enter your question';

        setQuestionFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleQuestionSubmit = async (e) => {
        e.preventDefault();

        if (!validateQuestionForm()) {
            return;
        }

        setQuestionSubmitStatus('submitting');

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Simulate successful submission
            setQuestionSubmitStatus('success');

            // Reset form after 3 seconds
            setTimeout(() => {
                setShowQuestionForm(false);
                setQuestionFormData({
                    name: '',
                    email: '',
                    questionType: '',
                    question: ''
                });
                setQuestionSubmitStatus('');
            }, 3000);

        } catch (error) {
            setQuestionSubmitStatus('error');
        }
    };

    if (notFound) {
        return <NotFoundPage />;
    }

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (error || !pet) {
        return <div className="min-h-screen flex items-center justify-center text-red-500">{error || 'Pet not found'}</div>;
    }

    return (
        <div className="min-h-screen w-full bg-white font-sans">
            {/* Header */}
            <header className="container mx-auto px-4 py-4 flex items-center justify-between">
                <div className="flex items-center">
                    <PawPrint className="text-tealcustom h-6 w-6"/>
                    <span className="ml-2 text-xl font-bold">Paws</span>
                </div>

                <nav className="hidden md:flex space-x-6 items-center">
                    <Link to="/" className="text-gray-500 hover:text-gray-900">Home</Link>
                    <Link to="/pet-search" className="text-gray-900 border-b-2 border-gray-900">Pet search</Link>
                    <Link to="/adoption-process" className="text-gray-500 hover:text-gray-900">Adoption process</Link>
                    <Link to="/adoption-faq" className="text-gray-500 hover:text-gray-900">FAQ</Link>
                    <DynamicSearch redirectOnSelect={true}/>
                </nav>

                <div className="flex justify-end">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleLogout}
                        className="flex items-center text-gray-500 hover:text-gray-900 transition-colors"
                    >
                        <LogOut className="h-5 w-5 mr-2" />
                        <span>Logout</span>
                    </motion.button>
                </div>
            </header>

            {/* Breadcrumb */}
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center text-gray-600">
                    <Link to="/" className="hover:text-gray-900">Home</Link>
                    <span className="mx-2">›</span>
                    <Link to="/pet-search" className="hover:text-gray-900">Pet search</Link>
                    <span className="mx-2">›</span>
                    <span className="text-gray-900">Pet Details</span>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column - PetModel Info */}
                    <div>
                        <h1 className="text-4xl font-bold mb-8">Hi! I'm {pet.name}</h1>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div>
                                <span className="font-bold">Breed:</span>
                                <span className="ml-2">{pet.breed}</span>
                            </div>
                            <div>
                                <span className="font-bold">Color:</span>
                                <span className="ml-2">{pet.color}</span>
                            </div>
                            <div>
                                <span className="font-bold">Age:</span>
                                <span className="ml-2">{pet.age_category}</span>
                            </div>
                            <div>
                                <span className="font-bold">Coat:</span>
                                <span className="ml-2">{pet.coat}</span>
                            </div>
                            <div>
                                <span className="font-bold">Sex:</span>
                                <span className="ml-2">{pet.gender}</span>
                            </div>
                            <div>
                                <span className="font-bold">Pet ID:</span>
                                <span className="ml-2">{pet.id}</span>
                            </div>
                            <div>
                                <span className="font-bold">Size:</span>
                                <span className="ml-2">{pet.size}</span>
                            </div>
                            <div>
                                <span className="font-bold">Fee:</span>
                                <span className="ml-2">€{pet.fee}</span>
                            </div>
                        </div>

                        {pet.traits && pet.traits.length > 0 && (
                            <div className="mb-8">
                                <h2 className="text-xl font-bold mb-4">I am ...</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    {pet.traits.map((trait, index) => (
                                        <div key={index} className="flex items-center">
                                            <Check className="text-green-500 h-5 w-5 mr-2" />
                                            <span>{trait}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex gap-4 mb-8">
                            <button
                                onClick={() => setShowAdoptionForm(true)}
                                className="bg-tealcustom hover:bg-teal-600 text-white px-6 py-3 rounded-md flex items-center"
                                disabled={pet.adoption_status !== 'available'}
                            >
                                {pet.adoption_status === 'available'
                                    ? 'Adopt me'
                                    : pet.adoption_status === 'adopted'
                                        ? 'Pet adopted'
                                        : 'Currently in adoption process'}
                                <PawPrint className="ml-2 h-5 w-5" />
                            </button>
                            <button
                                onClick={() => setShowQuestionForm(true)}
                                className="bg-yellow-200 hover:bg-yellow-100 text-tealcustom px-6 py-3 rounded-md flex items-center"
                            >
                                Ask about me ?
                                <MessageCircle className="ml-2 h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Right Column - Photos */}
                    <div className="relative">
                        <div className="bg-purple-100 rounded-3xl overflow-hidden p-8">
                            {/* Image container with centered crop */}
                            <div className="relative aspect-square rounded-2xl overflow-hidden">
                                <img
                                    src={
                                        pet.photos?.[currentPhotoIndex]?.id
                                            ? `http://localhost:5000/api/pets/photos/${pet.photos[currentPhotoIndex].id}`
                                            : '/images/pet-placeholder.png'
                                    }
                                    alt={pet.name}
                                    className="w-full h-full object-cover object-center" // Key changes here
                                    onError={(e) => {
                                        e.target.src = '/images/pet-placeholder.png';
                                    }}
                                />
                            </div>

                            {/* Next photo button (only shown if multiple photos exist) */}
                            {pet.photos?.length > 1 && (
                                <button
                                    onClick={() => setCurrentPhotoIndex((currentPhotoIndex - 1 + pet.photos.length) % pet.photos.length)}
                                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-tealcustom text-white rounded-full p-3 shadow-lg hover:bg-teal-700 transition-colors"
                                >
                                    <ArrowLeft className="h-6 w-6" />
                                </button>
                            )}

                            {/* Next photo button */}
                            {pet.photos?.length > 1 && (
                                <button
                                    onClick={() => setCurrentPhotoIndex((currentPhotoIndex + 1) % pet.photos.length)}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-tealcustom text-white rounded-full p-3 shadow-lg hover:bg-teal-700 transition-colors"
                                >
                                    <ArrowRight className="h-6 w-6" />
                                </button>
                            )}

                            {pet.photos?.length > 1 && (
                                <div className="flex justify-center mt-4 space-x-2">
                                    {pet.photos.map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setCurrentPhotoIndex(index)}
                                            className={`w-3 h-3 rounded-full transition-colors ${
                                                index === currentPhotoIndex ? 'bg-tealcustom' : 'bg-gray-300'
                                            }`}
                                            aria-label={`Go to image ${index + 1}`}
                                        />
                                    ))}
                                </div>
                            )}

                        </div>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16">
                    {/* Health and Story */}
                    <div>
                        <h2 className="text-xl font-bold mb-4">About my health</h2>
                        <p className="text-gray-600 mb-8">
                            {pet.health_status || "I am a healthy, happy pet. All my vaccinations are up to date. I need only standard routine checks with veterinarian once a year."}
                        </p>

                        <h2 className="text-xl font-bold mb-4">This is my story ...</h2>
                        <p className="text-gray-600 mb-6">
                            {pet.story || pet.description || `${pet.name} is a ${pet.age_category}, happy ${pet.type}. Looking for a loving forever home with someone who will give lots of love and care.`}
                        </p>

                        <div className="flex items-center gap-4">
                            <span className="font-bold">Help me find home!</span>
                            <span>Share my story:</span>
                            <div className="flex gap-2">
                                <button className="p-2 border rounded-full">
                                    <Instagram className="h-5 w-5" />
                                </button>
                                <button className="p-2 border rounded-full">
                                    <Twitter className="h-5 w-5" />
                                </button>
                                <button className="p-2 border rounded-full">
                                    <Facebook className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className="bg-gray-50 rounded-xl p-6 z-10">
                        <div className="mb-6">
                            <h3 className="text-lg font-bold mb-2">I am staying at:</h3>
                            <p>{pet.location_address || `${pet.location_city}, ${pet.location_country}`}</p>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-lg font-bold mb-2">Contact:</h3>
                            <div className="flex items-center mb-2">
                                <Mail className="h-5 w-5 mr-2 text-gray-500" />
                                <span>{pet.shelter_contact_email || 'petshelter@example.com'}</span>
                            </div>
                            <div className="flex items-center">
                                <Phone className="h-5 w-5 mr-2 text-gray-500" />
                                <span>{pet.shelter_contact_phone || '041 891 7329'}</span>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowAdoptionForm(true)}
                                className={`bg-tealcustom text-white px-6 py-3 rounded-md flex items-center ${
                                    pet.adoption_status !== 'available' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-teal-700'
                                }`}
                                disabled={pet.adoption_status !== 'available'}
                            >
                                {pet.adoption_status === 'available'
                                ? 'Adopt me'
                                : pet.adoption_status === 'adopted'
                                ? 'Pet adopted'
                                : 'Currently in adoption process'}
                                <PawPrint className="ml-2 h-5 w-5" />
                            </button>
                            <button
                                onClick={() => setShowQuestionForm(true)}
                                className="bg-red-100 text-gray-800 px-6 py-3 rounded-md flex items-center"
                            >
                                Ask about me ?
                                <MessageCircle className="ml-2 h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Similar Pets Section */}
                    {similarPets && similarPets.length > 0 && (
                        <div className="mt-16">
                            <h2 className="text-2xl font-bold mb-8">Other pets like {pet.name}</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {similarPets.map((similarPet) => (
                                    <PetCard
                                        key={similarPet.id}
                                        pet={similarPet}
                                        showArrow={true}
                                    />
                                ))}

                                {similarPets.length === 3 && (
                                    <div className="bg-tealcustom rounded-xl overflow-hidden shadow-md text-white flex flex-col justify-center items-center p-8">
                                        <div className="mb-4">
                                            <PawPrint className="h-16 w-16" />
                                        </div>
                                        <p className="text-center text-lg font-medium">
                                            {totalPets > similarPets.length 
                                                ? `${totalPets - similarPets.length} more pets are waiting for you`
                                                : 'More pets are waiting for you'}
                                        </p>
                                        <div className="mt-4 flex justify-end">
                                            <button onClick={() => navigate('/pet-search')}>
                                                <ArrowRight className="h-5 w-5"/>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
            </div>

            {/* Adoption Form Modal */}
            {showAdoptionForm && (
                <UserAdoptionForm
                    pet={pet}
                    onClose={() => setShowAdoptionForm(false)}
                    onSuccess={(adoption) => {
                        setShowAdoptionForm(false);
                        setAdoptionSuccess(true);
                        setTimeout(() => {
                            setAdoptionSuccess(false);
                            navigate('/pet-search');
                        }, 1000); 
                    }}
                />
            )}

            {/* Success Message Toast */}
            {adoptionSuccess && (
                <div className="fixed inset-0 flex items-center justify-center z-50">
                    <div className="bg-black bg-opacity-40 absolute inset-0 backdrop-blur-sm"></div>
                    <div className="bg-green-100 border border-green-200 text-green-800 px-8 py-6 rounded-xl shadow-lg z-50 max-w-md mx-auto animate-fade-in-out">
                        <div className="flex items-center">
                            <Check className="h-6 w-6 mr-3 text-green-600" />
                            <p className="text-lg font-medium">Your application has been submitted successfully!</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Question Form Modal */}
            {showQuestionForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full">
                        <div className="border-b px-6 py-4 flex justify-between items-center">
                            <h2 className="text-2xl font-bold">Ask about {pet.name}</h2>
                            <button
                                onClick={() => setShowQuestionForm(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={handleQuestionSubmit} className="p-6">
                            {/* Success/Error Messages */}
                            {questionSubmitStatus === 'success' && (
                                <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-lg">
                                    Thank you for your question! We'll get back to you soon.
                                </div>
                            )}

                            {questionSubmitStatus === 'error' && (
                                <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
                                    There was an error submitting your question. Please try again.
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Your Name *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={questionFormData.name}
                                        onChange={handleQuestionInputChange}
                                        className={`w-full px-4 py-2 border rounded-md ${
                                            questionFormErrors.name ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        placeholder="Enter your name"
                                    />
                                    {questionFormErrors.name && (
                                        <p className="text-red-500 text-sm mt-1">{questionFormErrors.name}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Email *</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={questionFormData.email}
                                        onChange={handleQuestionInputChange}
                                        className={`w-full px-4 py-2 border rounded-md ${
                                            questionFormErrors.email ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        placeholder="Enter your email"
                                    />
                                    {questionFormErrors.email && (
                                        <p className="text-red-500 text-sm mt-1">{questionFormErrors.email}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Question Type</label>
                                    <select
                                        name="questionType"
                                        value={questionFormData.questionType}
                                        onChange={handleQuestionInputChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md"
                                    >
                                        <option value="">Select a topic</option>
                                        <option value="health">Health & Medical</option>
                                        <option value="behavior">Behavior & Personality</option>
                                        <option value="history">Background & History</option>
                                        <option value="care">Care Requirements</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Your Question *</label>
                                    <textarea
                                        name="question"
                                        value={questionFormData.question}
                                        onChange={handleQuestionInputChange}
                                        rows="4"
                                        className={`w-full px-4 py-2 border rounded-md ${
                                            questionFormErrors.question ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        placeholder="What would you like to know about this pet?"
                                    />
                                    {questionFormErrors.question && (
                                        <p className="text-red-500 text-sm mt-1">{questionFormErrors.question}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end space-x-4 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowQuestionForm(false)}
                                    className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={questionSubmitStatus === 'submitting'}
                                    className={`px-6 py-2 bg-tealcustom text-white rounded-md flex items-center ${
                                        questionSubmitStatus === 'submitting' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-teal-700'
                                    }`}
                                >
                                    {questionSubmitStatus === 'submitting' ? (
                                        <>Sending...</>
                                    ) : (
                                        <>
                                            Send Question
                                            <MessageCircle className="ml-2 h-4 w-4" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Footer */}
            <Footer />
        </div>
    );
}

export default PetDetailPage;