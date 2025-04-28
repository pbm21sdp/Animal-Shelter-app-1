// pages/PetDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PawPrint, Search, ArrowRight, Check, MapPin, Mail, Phone, Twitter, Instagram, Facebook } from 'lucide-react';
import { usePetStore } from '../store/petStore';

export function PetDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const {
        selectedPet: pet,
        similarPets,
        isLoading,
        error,
        getPetById,
        getSimilarPets,
        clearSelectedPet
    } = usePetStore();

    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

    useEffect(() => {
        getPetById(id);
        getSimilarPets(id);

        // Cleanup when component unmounts
        return () => {
            clearSelectedPet();
        };
    }, [id, getPetById, getSimilarPets, clearSelectedPet]);

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (error || !pet) {
        return <div className="min-h-screen flex items-center justify-center text-red-500">{error || 'PetModel not found'}</div>;
    }

    return (
        <div className="min-h-screen bg-white font-sans">
            {/* Header */}
            <header className="container mx-auto px-4 py-4 flex items-center justify-between">
                <div className="flex items-center">
                    <PawPrint className="text-tealcustom h-6 w-6"/>
                    <span className="ml-2 text-xl font-bold">Paws</span>
                </div>

                <nav className="hidden md:flex space-x-6 items-center">
                    <a href="/" className="text-gray-500 hover:text-gray-900">Home</a>
                    <a href="/pet-search" className="text-gray-900 border-b-2 border-gray-900">Pet search</a>
                    <a href="#" className="text-gray-500 hover:text-gray-900">Adoption process</a>
                    <a href="#" className="text-gray-500 hover:text-gray-900">FAQ</a>
                    <Search className="h-5 w-5 text-gray-500"/>
                </nav>

                <div className="flex items-center space-x-4">
                    <button className="text-gray-700 hover:text-gray-900">Sign up</button>
                    <button className="text-gray-700 hover:text-gray-900">Log in</button>
                </div>
            </header>

            {/* Breadcrumb */}
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center text-gray-600">
                    <a href="/" className="hover:text-gray-900">Home</a>
                    <span className="mx-2">›</span>
                    <a href="/pet-search" className="hover:text-gray-900">Pet search</a>
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
                            <button className="bg-tealcustom text-white px-6 py-3 rounded-md flex items-center">
                                Adopt me
                                <PawPrint className="ml-2 h-5 w-5" />
                            </button>
                            <button className="bg-red-100 text-gray-800 px-6 py-3 rounded-md">
                                Ask about me ?
                            </button>
                        </div>
                    </div>

                    {/* Right Column - Photos */}
                    <div className="relative">
                        <div className="bg-purple-100 rounded-3xl overflow-hidden p-8">
                            <div className="relative aspect-square rounded-2xl overflow-hidden">
                                <img
                                    src={pet.photos?.[currentPhotoIndex]?.photo_url || '/api/placeholder/400/400'}
                                    alt={pet.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            {pet.photos?.length > 1 && (
                                <button
                                    onClick={() => setCurrentPhotoIndex((currentPhotoIndex + 1) % pet.photos.length)}
                                    className="absolute right-1/2 top-1/2 transform translate-x-full -translate-y-1/2 bg-tealcustom text-white rounded-full p-3"
                                >
                                    <ArrowRight className="h-6 w-6" />
                                </button>
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
                    <div className="bg-gray-50 rounded-xl p-6">
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
                            <button className="bg-tealcustom text-white px-6 py-3 rounded-md flex items-center">
                                Adopt me
                                <PawPrint className="ml-2 h-5 w-5" />
                            </button>
                            <button className="bg-red-100 text-gray-800 px-6 py-3 rounded-md">
                                Ask about me ?
                            </button>
                        </div>
                    </div>
                </div>

                {/* Similar Pets Section */}
                {similarPets && similarPets.length > 0 && (
                    <div className="mt-16">
                        <h2 className="text-2xl font-bold mb-8">Other pets like {pet.name}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            {similarPets.map((similarPet) => (
                                <div key={similarPet.id} className="bg-white rounded-xl overflow-hidden shadow-md">
                                    <div className="h-48 overflow-hidden">
                                        <img
                                            src={similarPet.photos?.[0]?.photo_url || '/api/placeholder/300/200'}
                                            alt={`${similarPet.name} - ${similarPet.breed}`}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="p-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <h3 className="text-xl font-bold">{similarPet.name}</h3>
                                            <span className={`text-sm ${similarPet.gender === 'male' ? 'text-blue-500' : 'text-pink-500'}`}>
                                                {similarPet.gender === 'male' ? '♂' : '♀'} {similarPet.gender}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm text-gray-600">
                                            <span>{similarPet.age_category}</span>
                                            <span>{similarPet.breed}</span>
                                        </div>
                                        <div className="mt-4 flex justify-end">
                                            <button
                                                onClick={() => navigate(`/pet/${similarPet.id}`)}
                                                className="hover:text-teal-700"
                                            >
                                                <ArrowRight className="h-5 w-5 text-teal-700"/>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {similarPets.length === 3 && (
                                <div className="bg-tealcustom rounded-xl overflow-hidden shadow-md text-white flex flex-col justify-center items-center p-8">
                                    <div className="mb-4">
                                        <PawPrint className="h-16 w-16" />
                                    </div>
                                    <p className="text-center text-lg font-medium">78 more pets are waiting for you</p>
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

            {/* Footer */}
            <footer className="bg-yellow-100 py-8 md:py-16 mt-16">
                <div className="container mx-auto px-4">
                    <div className="flex items-center mb-6">
                        <PawPrint className="text-teal-700 h-6 w-6"/>
                        <span className="ml-2 text-xl font-bold">Paws</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div>
                            <h3 className="text-lg font-bold mb-4">About us</h3>
                            <ul className="space-y-2">
                                <li><a href="#" className="text-gray-700 hover:text-gray-900">Team</a></li>
                                <li><a href="#" className="text-gray-700 hover:text-gray-900">Partnerships</a></li>
                                <li><a href="#" className="text-gray-700 hover:text-gray-900">Terms of service</a></li>
                                <li><a href="#" className="text-gray-700 hover:text-gray-900">Mobile App</a></li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold mb-4">Pet Adoption</h3>
                            <ul className="space-y-2">
                                <li><a href="#" className="text-gray-700 hover:text-gray-900">Dog Adoption</a></li>
                                <li><a href="#" className="text-gray-700 hover:text-gray-900">Cat Adoption</a></li>
                                <li><a href="#" className="text-gray-700 hover:text-gray-900">Bird Adoption</a></li>
                                <li><a href="#" className="text-gray-700 hover:text-gray-900">Other Pets Adoption</a></li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold mb-4">Social Media</h3>
                            <ul className="space-y-2">
                                <li>
                                    <a href="#" className="flex items-center text-gray-700 hover:text-gray-900">
                                        <Facebook className="h-5 w-5 mr-2"/>
                                        <span>Facebook</span>
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="flex items-center text-gray-700 hover:text-gray-900">
                                        <Twitter className="h-5 w-5 mr-2"/>
                                        <span>Twitter</span>
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="flex items-center text-gray-700 hover:text-gray-900">
                                        <Instagram className="h-5 w-5 mr-2"/>
                                        <span>Instagram</span>
                                    </a>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold mb-4">Have a question?</h3>
                            <form className="space-y-4">
                                <div>
                                    <label htmlFor="email" className="block text-sm mb-1">Email</label>
                                    <input
                                        type="email"
                                        id="email"
                                        className="w-full px-4 py-2 rounded-md border border-gray-300"
                                        placeholder="Your email"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="message" className="block text-sm mb-1">Message</label>
                                    <textarea
                                        id="message"
                                        rows="3"
                                        className="w-full px-4 py-2 rounded-md border border-gray-300"
                                        placeholder="Your message"
                                    ></textarea>
                                </div>
                                <button
                                    type="submit"
                                    className="bg-tealcustom text-white px-6 py-2 rounded-md"
                                >
                                    Send
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default PetDetailPage;