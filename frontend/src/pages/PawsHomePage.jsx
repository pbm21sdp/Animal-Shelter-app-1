// PawsHomePage.jsx
import React, {useRef, useEffect, useState} from 'react';
import { Search, Heart, ArrowRight, PawPrint, Facebook, Twitter, Instagram, Linkedin, Send, X } from 'lucide-react';
import { motion } from "framer-motion";
import Blob from "../components/Blob";
import { useAuthStore } from "../store/authStore";
import { usePetStore } from "../store/petStore";
import { useDonationStore } from "../store/donationStore.js";
import { useNavigate } from 'react-router-dom';
import { Link } from "react-router-dom";

// Images imports
import info1 from "../assets/PawHomePage/req.jpg"
import info2 from "../assets/PawHomePage/info2.jpg"
import info3 from "../assets/PawHomePage/info3.jpg"
import person from "../assets/PawHomePage/person.png"
import maindog from "../assets/PawHomePage/maindog.png"
import leash from "../assets/PawHomePage/leash.png"

import DogIcon from "../components/icons/DogIcon";
import CatIcon from "../components/icons/CatIcon";
import ParrotIcon from "../components/icons/ParrotIcon.jsx";
import RabbitIcon from "../components/icons/RabbitIcon.jsx";
import DonationModal from "../components/DonationModal.jsx";

const stepImages = import.meta.glob('../assets/PawHomePage/step*.png', { eager: true });
const steps = Object.values(stepImages).map((mod) => mod.default);

export default function PawsHomepage() {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const { pets, isLoading, error, getAllPets } = usePetStore();
    const { createDonation, isLoading: donationLoading, error: donationError } = useDonationStore();
    const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);

    useEffect(() => {
        // Fetch only 3 pets for the homepage
        getAllPets({ limit: 3 });
    }, [getAllPets]);

    const handleLogout = () => {
        logout();
    };

    const inputRef = useRef(null);
    const handleSearchClick = () => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    const openDonationModal = () => {
        console.log('Donate button clicked');
        if (!user || !user._id) {
            console.log('No user logged in, redirecting to login');
            navigate('/login');
            return;
        }
        console.log('Opening donation modal');
        setIsDonationModalOpen(true);
    };


    const closeDonationModal = () => {
        setIsDonationModalOpen(false);
    };

    const handleDonate = async (amountInCents) => {
        console.log('Handling donation with amount (cents):', amountInCents);

        if (!user || !user._id) {
            console.log('No user logged in, redirecting to login');
            navigate('/login');
            return;
        }

        try {
            console.log('Calling createDonation with:', user._id, user.email, amountInCents);
            const success = await createDonation(user._id, user.email, amountInCents);

            console.log('Donation creation result:', success);

            if (!success) {
                console.log('Donation failed, closing modal');
                setIsDonationModalOpen(false);
            }
            // If successful, the user will be redirected to Stripe
        } catch (error) {
            console.error('Error in handleDonate:', error);
            setIsDonationModalOpen(false);
        }
    };

    return (
        <div className="min-h-screen w-full font-sans">
            {/* Header/Navigation */}
            <header className="container mx-auto px-4 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                        <PawPrint className="text-tealcustom h-6 w-6"/>
                        <span className="ml-2 text-xl font-bold">Paws</span>
                    </div>

                    {user?.isAdmin && (
                        <motion.button
                            whileHover={{scale: 1.05}}
                            whileTap={{scale: 0.95}}
                            onClick={() => navigate('/admin/pets')}
                            className="px-4 py-2 text-sm bg-tealcustom text-white rounded-md hover:bg-teal-700">
                            Admin Dashboard
                        </motion.button>
                    )}
                </div>

                <nav className="hidden md:flex space-x-6 items-center">
                    <a href="/" className="text-gray-900 border-b-2 border-gray-900">Home</a>
                    <a href="/pet-search" className="text-gray-500 hover:text-gray-900">Pet search</a>
                    <a href="/adoption-process" className="text-gray-500 hover:text-gray-900">Adoption process</a>
                    <a href="/adoption-faq" className="text-gray-500 hover:text-gray-900">FAQ</a>

                    {/* Search Icon */}
                    <div className="relative flex items-center">
                        <button
                            onClick={handleSearchClick}
                            className="text-gray-500 hover:text-gray-900"
                        >
                            <Search className="h-5 w-5"/>
                        </button>

                        {/* Search Input */}
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Search..."
                            className="ml-2 p-2 border border-gray-200 rounded-full"
                        />
                    </div>
                </nav>

                <div className="flex items-center space-x-4">
                    <div className="flex space-x-4">
                        <motion.button
                            whileHover={{scale: 1.05}}
                            whileTap={{scale: 0.95}}
                            onClick={handleLogout}
                            className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900">Logout
                        </motion.button>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="container mx-auto px-4 py-8 md:py-16 flex flex-col md:flex-row items-center">
                <div className="w-full md:w-1/2 mb-8 md:mb-0 pl-16">
                    <div className="mb-6 relative">
                        <span className="absolute -left-6 -top-8 text-pink-200">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"
                                 strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2z"/>
                            </svg>
                        </span>
                        <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                            Adopt your <span className="text-teal-600">forever</span><br/>best friend
                        </h1>
                    </div>
                    <p className="text-lg mb-8">Give a pet in need a happy home, and<br/>a carefree life!</p>
                    <button
                        onClick={() => navigate('/pet-search')}
                        className="flex items-center bg-tealcustom hover:bg-teal-800 text-white px-6 py-3 rounded-md transition duration-200">
                        <span className="mr-2 pl-6 pr-6">Find your best friend</span>
                        <Search className="h-5 w-5"/>
                    </button>
                </div>

                <div className="w-full md:w-1/2 relative">
                    <div className="bg-yellow-300 rounded-full p-4 aspect-square w-4/5 md:w-5/6 mx-auto relative -mt-16">
                        <img
                            src={person}
                            alt="person"
                            className="absolute bottom-0 right-0 h-full transform translate-y-[-70px]"
                        />
                        <img
                            src={maindog}
                            alt="maindog"
                            className="absolute bottom-0 right-0 h-4/3 transform translate-x-[-220px] translate-y-[40px]"
                        />
                        <img
                            src={leash}
                            alt="leash"
                            className="absolute bottom-0 right-0 h-1/2 transform translate-x-[-250px] translate-y-[-250px]"
                        />
                        <span className="absolute top-1/4 left-1/4">
                            <Heart className="text-pink-400 h-8 w-8"/>
                        </span>
                        <span className="absolute top-1/3 right-1/4">
                            <Heart className="text-teal-700 h-6 w-6"/>
                        </span>
                    </div>
                </div>
            </section>

            {/* Animal Categories */}
            <section className="container mx-auto px-4 py-8 md:py-16">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                    {/* Dog Category */}
                    <div className="flex flex-col items-center justify-center">
                        <Blob type="dog" className="w-full aspect-square flex items-center justify-center">
                            <div className="flex flex-col items-center justify-center">
                                <div className="mb-4">
                                    <DogIcon className="w-32 h-32"/>
                                </div>
                                <span className="text-lg font-medium">Dogs</span>
                            </div>
                        </Blob>
                    </div>

                    {/* Cat Category */}
                    <div className="flex flex-col items-center justify-center">
                        <Blob type="cat" className="w-full aspect-square flex items-center justify-center">
                            <div className="flex flex-col items-center justify-center">
                                <div className="mb-4">
                                    <CatIcon className="w-32 h-32"/>
                                </div>
                                <span className="text-lg font-medium">Cats</span>
                            </div>
                        </Blob>
                    </div>

                    {/* Bird Category */}
                    <div className="flex flex-col items-center justify-center">
                        <Blob type="bird" className="w-full aspect-square flex items-center justify-center">
                            <div className="flex flex-col items-center justify-center">
                                <div className="mb-4">
                                    <ParrotIcon className="w-32 h-32"/>
                                </div>
                                <span className="text-lg font-medium">Birds</span>
                            </div>
                        </Blob>
                    </div>

                    {/* Other Animals Category */}
                    <div className="flex flex-col items-center justify-center">
                        <Blob type="other" className="w-full aspect-square flex items-center justify-center">
                            <div className="flex flex-col items-center justify-center">
                                <div className="mb-4">
                                    <RabbitIcon className="w-32 h-32"/>
                                </div>
                                <span className="text-lg font-medium">Other Animals</span>
                            </div>
                        </Blob>
                    </div>
                </div>
            </section>

            {/* Adoption Process */}
            <section className="container mx-auto px-4 py-8 md:py-16 bg-tealcustom text-white rounded-xl">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
                    <div className="text-center">
                        <img src={steps[0]} alt="Find your pet" className="mx-auto mb-4 rounded-lg"/>
                        <p className="text-sm">Find your pet</p>
                    </div>

                    <div className="text-center">
                        <img src={steps[1]} alt="Apply for adoption" className="mx-auto mb-4 rounded-lg"/>
                        <p className="text-sm">Apply for adoption</p>
                    </div>

                    <div className="text-center">
                        <img src={steps[2]} alt="Schedule a meeting" className="mx-auto mb-4 rounded-lg"/>
                        <p className="text-sm">Schedule a meeting</p>
                    </div>

                    <div className="text-center">
                        <img src={steps[3]} alt="Complete the adoption" className="mx-auto mb-4 rounded-lg"/>
                        <p className="text-sm">Complete the adoption</p>
                    </div>

                    <div className="text-center">
                        <img src={steps[4]} alt="Take your best friend home" className="mx-auto mb-4 rounded-lg"/>
                        <p className="text-sm">Take your best friend home</p>
                    </div>
                </div>
            </section>

            {/* Pets Near You */}
            <section className="container mx-auto px-4 py-8 md:py-16">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold">Pets near you</h2>
                    <span className="text-yellow-500">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2z"/>
                    </svg>
                </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {isLoading ? (
                        <div className="col-span-4 text-center py-10">Loading pets...</div>
                    ) : error ? (
                        <div className="col-span-4 text-center py-10 text-red-500">{error}</div>
                    ) : pets.length > 0 ? (
                        <>
                            {pets.slice(0, 3).map((pet) => (
                                <div key={pet.id} className="bg-white rounded-xl overflow-hidden shadow-md">
                                    <div className="h-48 overflow-hidden">
                                        <img
                                            src={
                                            pet.photos?.[0]?.id
                                                ? `http://localhost:5000/api/pets/photos/${pet.photos[0].id}`
                                                : '/images/pet-placeholder.png'
                                        }
                                            alt={`${pet.name} - ${pet.breed}`}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                            e.target.src = '/images/pet-placeholder.png';
                                        }}
                                            />
                                    </div>
                                    <div className="p-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <h3 className="text-xl font-bold">{pet.name}</h3>
                                            <span className={`text-sm ${pet.gender === 'male' ? 'text-blue-500' : 'text-pink-500'}`}>
                                            {pet.gender === 'male' ? '♂' : '♀'} {pet.gender}
                                        </span>
                                        </div>
                                        <div className="flex justify-between text-sm text-gray-600">
                                            <span>{pet.age_category}</span>
                                            <span>{pet.breed}</span>
                                        </div>
                                        <div className="mt-4 flex justify-end">
                                            <button
                                                onClick={() => navigate(`/pet/${pet.id}`)}
                                                className="hover:text-teal-700"
                                            >
                                                <ArrowRight className="h-5 w-5 text-teal-700"/>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <div className="bg-tealcustom rounded-xl overflow-hidden shadow-md text-white flex flex-col justify-center items-center p-8">
                                <div className="mb-4">
                                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1">
                                        <path d="M12 20a8 8 0 100-16 8 8 0 000 16z"/>
                                        <path d="M8 9a1 1 0 100-2 1 1 0 000 2z"/>
                                        <path d="M12 9a1 1 0 100-2 1 1 0 000 2z"/>
                                        <path d="M16 9a1 1 0 100-2 1 1 0 000 2z"/>
                                        <path d="M8 14a1 1 0 100-2 1 1 0 000 2z"/>
                                        <path d="M12 14a1 1 0 100-2 1 1 0 000 2z"/>
                                        <path d="M16 14a1 1 0 100-2 1 1 0 000 2z"/>
                                        <path d="M6 14a6 6 0 0012 0 6 6 0 00-12 0z"/>
                                    </svg>
                                </div>
                                <p className="text-center text-lg font-medium">
                                    {isLoading
                                        ? 'Searching for pets...'
                                        : error
                                            ? `Error: ${error}`
                                            : pets.length > 0
                                                ? `${pets.length} pets are waiting for you`
                                                : 'No pets available at the moment.'}
                                </p>
                                <div className="mt-4 flex justify-end">
                                    <button onClick={() => navigate('/pet-search')}>
                                        <ArrowRight className="h-5 w-5"/>
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="col-span-4 text-center py-10">No pets available at the moment.</div>
                    )}
                </div>
            </section>

            {/* Info Sections */}
            <section className="container mx-auto px-4 py-8 md:py-16">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="text-center">
                        <div className="rounded-full bg-white p-4 shadow-md inline-block mb-4">
                            <img src={info1} alt="Adoption process" className="rounded-full w-96 h-64"/>
                        </div>
                        <h3 className="text-xl font-bold mb-4">Adoption process</h3>
                        <p className="text-gray-600 mb-6">Get familiar with the details about the pet adoption process
                            for all each type of our little friends</p>
                            <Link to="/adoption-process">
                                <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="bg-red-200 hover:bg-red-300 text-gray-800 px-6 py-2 rounded-md flex items-center justify-center mx-auto transition duration-200"
                                >
                                <span>Learn more</span>
                                <ArrowRight className="h-4 w-4 ml-2"/>
                                </motion.button>
                            </Link>
                    </div>

                    <div className="text-center">
                        <div className="rounded-full bg-white p-4 shadow-md inline-block mb-4">
                            <img src={info2} alt="Requirements" className="rounded-full w-96 h-64 object-contain"/>
                        </div>
                        <h3 className="text-xl font-bold mb-4">Requirements</h3>
                        <p className="text-gray-600 mb-6">Make sure you meet all necessary requirements to complete the
                            adoption process</p>
                            <Link to="/adoption-requirements">
                                <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="bg-red-200 hover:bg-red-300 text-gray-800 px-6 py-2 rounded-md flex items-center justify-center mx-auto transition duration-200"
                                >
                                <span>Requirements</span>
                                <ArrowRight className="h-4 w-4 ml-2"/>
                                </motion.button>
                            </Link>
                    </div>

                    <div className="text-center">
                        <div className="rounded-full bg-white p-4 shadow-md inline-block mb-4">
                            <img src={info3} alt="Pet Adoption FAQs" className="rounded-full w-96 h-64"/>
                        </div>
                        <h3 className="text-xl font-bold mb-4">Pet Adoption FAQs</h3>
                        <p className="text-gray-600 mb-6">Got any questions? Make sure to check the pet adoption FAQ
                            page</p>
                            <Link to="/adoption-faq">
                                <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="bg-red-200 hover:bg-red-300 text-gray-800 px-6 py-2 rounded-md flex items-center justify-center mx-auto transition duration-200"
                                >
                                <span>FAQs</span>
                                <ArrowRight className="h-4 w-4 ml-2"/>
                                </motion.button>
                            </Link>
                    </div>
                </div>
            </section>

            {/* Footer with donation button */}
            <footer className="bg-yellow-200 py-8 md:py-16">
                <div className="container mx-auto px-4">
                    <div className="flex items-center mb-6 ">
                        <PawPrint className="text-teal-700 h-6 w-6"/>
                        <span className="ml-2 text-xl font-bold">Paws</span>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between mb-8">
                        <div className="mb-8 md:mb-0">
                            <h3 className="text-lg font-bold mb-4">About us</h3>
                            <ul className="space-y-2">
                                <li><a href="#" className="text-gray-700 hover:text-gray-900">Team</a></li>
                                <li><a href="#" className="text-gray-700 hover:text-gray-900">Partnerships</a></li>
                                <li><a href="#" className="text-gray-700 hover:text-gray-900">Terms of service</a></li>
                            </ul>
                        </div>

                        <div className="mb-8 md:mb-0">
                            <h3 className="text-lg font-bold mb-4">Pet Adoption</h3>
                            <ul className="space-y-2">
                                <li><a href="#" className="text-gray-700 hover:text-gray-900">Dog Adoption</a></li>
                                <li><a href="#" className="text-gray-700 hover:text-gray-900">Cat Adoption</a></li>
                                <li><a href="#" className="text-gray-700 hover:text-gray-900">Bird Adoption</a></li>
                                <li><a href="#" className="text-gray-700 hover:text-gray-900">Other Pets Adoption</a></li>
                                <li><a href="#" className="text-gray-700 hover:text-gray-900">Adoption Process</a></li>
                                <li><a href="#" className="text-gray-700 hover:text-gray-900">FAQs</a></li>
                            </ul>
                        </div>

                        <div className="mb-8 md:mb-0">
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

                            {/* New Donation Section */}
                            <div className="mt-6">
                                <h3 className="text-lg font-bold mb-4">Support Our Cause</h3>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={openDonationModal}
                                    className="bg-tealcustom hover:bg-teal-800 text-white px-6 py-2 rounded-md flex items-center transition duration-200"
                                >
                                    <span className="mr-2">Donate Now</span>
                                    <Heart className="h-4 w-4"/>
                                </motion.button>
                            </div>

                            <DonationModal
                                isOpen={isDonationModalOpen}
                                onClose={closeDonationModal}
                                onDonate={handleDonate}
                            />
                        </div>

                        <div>
                            <h3 className="text-lg font-bold mb-4">Have a question?</h3>
                            <form className="space-y-4">
                                <div>
                                    <label htmlFor="email" className="block text-sm mb-1">Email</label>
                                    <input
                                        type="email"
                                        id="email"
                                        className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                                        placeholder="Your email"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="message" className="block text-sm mb-1">Message</label>
                                    <textarea
                                        id="message"
                                        rows="4"
                                        className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                                        placeholder="Your message"
                                    ></textarea>
                                </div>
                                <button
                                    type="submit"
                                    className="bg-tealcustom hover:bg-teal-800 text-white px-6 py-2 rounded-md flex items-center transition duration-200"
                                >
                                    <span className="mr-2">Send</span>
                                    <Send className="h-4 w-4"/>
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </footer>

        </div>
    );
}