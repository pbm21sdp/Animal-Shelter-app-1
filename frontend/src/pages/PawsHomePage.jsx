// PawsHomePage.jsx
import React, {useRef, useEffect, useState } from 'react';
import { Search, Heart, ArrowRight, PawPrint, User } from 'lucide-react';
import { motion } from "framer-motion";

// Components
import Blob from "../components/Blob";
import { useAuthStore } from "../store/authStore";
import { usePetStore } from "../store/petStore";
import { useNavigate } from 'react-router-dom';
import { Link } from "react-router-dom";
import Footer from "../components/page/Footer"; 
import PetCard from '../components/PetCard';
import DynamicSearch from '../components/DynamicSearch';

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

const stepImages = import.meta.glob('../assets/PawHomePage/step*.png', { eager: true });
const steps = Object.values(stepImages).map((mod) => mod.default);

export default function PawsHomepage() {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const { pets, isLoading, error, getAllPets, totalPets } = usePetStore();
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);

    useEffect(() => {
        // Fetch only 3 pets for the homepage
        getAllPets({ limit: 3 });
    }, [getAllPets]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            // Verificăm dacă click-ul a fost în afara dropdown-ului și nu pe un link
            const dropdownElement = document.getElementById('profile-dropdown');
            if (showProfileDropdown && dropdownElement && !dropdownElement.contains(event.target)) {
                setShowProfileDropdown(false);
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showProfileDropdown]);

    const handleLogout = () => {
        logout();
    };

    const inputRef = useRef(null);
    const handleSearchClick = () => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };


    return (
        <div className="min-h-screen w-full font-sans">
            {/* Header/Navigation */}
            <header className="container mx-auto px-4 py-4 flex items-center justify-between z-50">
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
                    <DynamicSearch redirectOnSelect={true} />
                </nav>

                <div className="flex items-center space-x-4">
                    <div className="flex space-x-4 relative">
                        {/* Profile button with dropdown */}
                        <motion.button
                            whileHover={{scale: 1.05}}
                            whileTap={{scale: 0.95}}
                            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                            className="p-2 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 flex items-center justify-center z-50">
                            <User className="h-5 w-5" />
                        </motion.button>
                        
                        {/* Dropdown Menu */}
                        {showProfileDropdown && (
                            <div 
                                id="profile-dropdown"
                                className="absolute top-full right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50"
                            >
                                <Link 
                                    to="/profile?tab=profile" 
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    onClick={(e) => {
                                        // Previne închiderea dropdown-ului înainte de navigare
                                        e.stopPropagation();
                                        setShowProfileDropdown(false);
                                    }}
                                >
                                    <div className="flex items-center">
                                        <User className="h-4 w-4 mr-2" />
                                        Profile
                                    </div>
                                </Link>
                                <Link 
                                    to="/profile?tab=messages" 
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowProfileDropdown(false);
                                    }}
                                >
                                    <div className="flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                        </svg>
                                        Messages
                                    </div>
                                </Link>
                                <Link 
                                    to="/profile?tab=adoptions" 
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowProfileDropdown(false);
                                    }}
                                >
                                    <div className="flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                            <line x1="16" y1="2" x2="16" y2="6" />
                                            <line x1="8" y1="2" x2="8" y2="6" />
                                            <line x1="3" y1="10" x2="21" y2="10" />
                                        </svg>
                                        Requests
                                    </div>
                                </Link>
                            </div>
                        )}
                        
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
                    <motion.div className="flex flex-col items-center justify-center cursor-pointer"
                         onClick={() => navigate('/pet-search?type=dog')}

                         whileHover={{
                            scale: 1.05,
                            transition: { duration: 0.2 }
                        }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Blob type="dog" className="w-full aspect-square flex items-center justify-center transition-all duration-200 hover:brightness-110">
                            <div className="flex flex-col items-center justify-center">
                                <div className="mb-4">
                                    <DogIcon className="w-32 h-32"/>
                                </div>
                                <span className="text-lg font-medium">Dogs</span>
                            </div>
                        </Blob>
                    </motion.div>

                    {/* Cat Category */}
                    <motion.div className="flex flex-col items-center justify-center cursor-pointer"
                         onClick={() => navigate('/pet-search?type=cat')}

                         whileHover={{
                            scale: 1.05,
                            transition: { duration: 0.2 }
                        }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Blob type="cat" className="w-full aspect-square flex items-center justify-center transition-all duration-200 hover:brightness-110">
                            <div className="flex flex-col items-center justify-center">
                                <div className="mb-4">
                                    <CatIcon className="w-32 h-32"/>
                                </div>
                                <span className="text-lg font-medium">Cats</span>
                            </div>
                        </Blob>
                    </motion.div>

                    {/* Bird Category */}
                    <motion.div className="flex flex-col items-center justify-center cursor-pointer"
                         onClick={() => navigate('/pet-search?type=bird')}

                         whileHover={{
                            scale: 1.05,
                            transition: { duration: 0.2 }
                        }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Blob type="bird" className="w-full aspect-square flex items-center justify-center transition-all duration-200 hover:brightness-110">
                            <div className="flex flex-col items-center justify-center">
                                <div className="mb-4">
                                    <ParrotIcon className="w-32 h-32"/>
                                </div>
                                <span className="text-lg font-medium">Birds</span>
                            </div>
                        </Blob>
                    </motion.div>

                    {/* Other Animals Category */}
                    <motion.div className="flex flex-col items-center justify-center cursor-pointer"
                         onClick={() => navigate('/pet-search?type=other')}

                         whileHover={{
                            scale: 1.05,
                            transition: { duration: 0.2 }
                        }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Blob type="other" className="w-full aspect-square flex items-center justify-center transition-all duration-200 hover:brightness-110">
                            <div className="flex flex-col items-center justify-center">
                                <div className="mb-4">
                                    <RabbitIcon className="w-32 h-32"/>
                                </div>
                                <span className="text-lg font-medium">Other Animals</span>
                            </div>
                        </Blob>
                    </motion.div>
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
                            <PetCard key={pet.id} pet={pet} showArrow={true} />
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
                                            : totalPets > 3
                                                ? `${totalPets - 3} more pets are waiting for you`
                                                : totalPets === 3
                                                    ? '3 pets are waiting for you'
                                                    : `${totalPets} pets are waiting for you`}
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
                        <p className="text-gray-600 mb-6">Got any questions? Make sure to check the pet adoption FAQ to find your answer!
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

            {/* Use the Footer component instead of inline footer code */}
            <Footer />
        </div>
    );
}