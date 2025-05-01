import React, {useState, useEffect, useRef} from 'react';
import { Search, PawPrint, ArrowRight, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePetStore } from '../store/petStore';
import {motion} from "framer-motion";
import {useAuthStore} from "../store/authStore.js";

function PetSearchPage() {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const { pets, isLoading, error, searchPets } = usePetStore();

    const [filters, setFilters] = useState({
        type: 'any',
        radius: '',
        zipCode: '',
        sortBy: 'nearest'
    });

    useEffect(() => {
        searchPets(filters);
    }, [filters, searchPets]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

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
        <div className="min-h-screen w-full font-sans flex flex-col">
            {/* Header - Fixed Height */}
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
                    <a href="/" className="text-gray-500 hover:text-gray-900">Home</a>
                    <a href="/pet-search" className="text-gray-900 border-b-2 border-gray-900">Pet search</a>
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

            {/* Main Content - Flexible Height */}
            <main className="flex-1 container mx-auto px-4 py-4">
                {/* Search Section */}
                <div className="mb-8">
                    <div className="flex justify-between items-end mb-8">
                        <div className="flex items-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mr-4">
                                <svg viewBox="0 0 24 24" className="w-10 h-10 text-gray-400">
                                    <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6 0 1.01.25 1.97.7 2.8L12 10l5.3 4.8c.45-.83.7-1.79.7-2.8 0-3.31-2.69-6-6-6z"/>
                                </svg>
                            </div>
                        </div>
                        <div className="hidden md:block">
                            <img src="/images/pet-placeholder.png" alt="Dog and cat" className="w-48 h-48 object-contain"/>
                        </div>
                    </div>

                    {/* Search Filters */}
                    <div className="bg-teal-700 rounded-xl p-6 flex flex-wrap items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-4 flex-1">
                            <div className="text-white">
                                <svg viewBox="0 0 24 24" className="w-10 h-10">
                                    <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                                </svg>
                            </div>

                            <div className="flex flex-col relative">
                                <label className="text-white text-sm mb-1">Pet type</label>
                                <select
                                    value={filters.type}
                                    onChange={(e) => handleFilterChange('type', e.target.value)}
                                    className="bg-teal-700 text-white border-none outline-none text-lg cursor-pointer appearance-none pr-8 w-full"
                                >
                                    <option value="any">Any</option>
                                    <option value="dog">Dogs</option>
                                    <option value="cat">Cats</option>
                                    <option value="bird">Birds</option>
                                    <option value="other">Other</option>
                                </select>
                                <ChevronDown className="absolute right-2 top-8 h-5 w-5 text-white pointer-events-none" />
                            </div>

                            <div className="flex flex-col">
                                <label className="text-white text-sm mb-1">Distance Radius (km)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={filters.radius}
                                        onChange={(e) => handleFilterChange('radius', e.target.value)}
                                        placeholder="Enter distance"
                                        className="remove-arrow bg-transparent text-white border-b border-white outline-none text-lg w-32 placeholder-gray-300"
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col">
                                <label className="text-white text-sm mb-1">Zip Code</label>
                                <input
                                    type="text"
                                    value={filters.zipCode}
                                    onChange={(e) => handleFilterChange('zipCode', e.target.value)}
                                    placeholder="Enter zip code"
                                    className="bg-transparent text-white border-b border-white outline-none text-lg w-32 placeholder-gray-300"
                                />
                            </div>
                        </div>

                        <button
                            onClick={() => searchPets(filters)}
                            className="bg-red-200 hover:bg-red-300 text-gray-800 px-6 py-3 rounded-md flex items-center transition duration-200"
                        >
                            Find your best match
                            <Search className="ml-2 h-5 w-5"/>
                        </button>
                    </div>

                    <div className="flex justify-between items-center">
                        <button className="text-teal-700 flex items-center">
                            More Filters
                            <ChevronDown className="ml-1 h-4 w-4"/>
                        </button>
                        <div className="flex items-center">
                            <span className="text-gray-600 mr-2">Sort by:</span>
                            <select
                                value={filters.sortBy}
                                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                                className="border-none outline-none bg-transparent"
                            >
                                <option value="nearest">Nearest</option>
                                <option value="newest">Newest</option>
                                <option value="oldest">Oldest</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Results Section - Will grow/shrink with content */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold mb-8">{pets.length} Pets are waiting for you!</h2>

                    {isLoading ? (
                        <div className="text-center py-10">Searching for pets...</div>
                    ) : error ? (
                        <div className="text-center py-10 text-red-500">{error}</div>
                    ) : pets.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {pets.map((pet) => (
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
                                                {pet.gender === 'male' ? '♂' : '♀'} {pet.gender?.charAt(0).toUpperCase() + pet.gender?.slice(1)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm text-gray-600">
                                            <span>{pet.age_category?.charAt(0).toUpperCase() + pet.age_category?.slice(1)}</span>
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
                        </div>
                    ) : (
                        <div className="text-center py-10">No pets found</div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default PetSearchPage;