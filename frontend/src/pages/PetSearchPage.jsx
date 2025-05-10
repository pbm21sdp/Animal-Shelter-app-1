import React, {useState, useEffect, useRef} from 'react';
import { User, Search, PawPrint, LogOut, ChevronDown } from 'lucide-react';
import { useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import { usePetStore } from '../store/petStore';
import {motion} from "framer-motion";
import {useAuthStore} from "../store/authStore.js";

import PetCard from '../components/PetCard';
import DynamicSearch from '../components/DynamicSearch';

function PetSearchPage() {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const { pets, isLoading, error, searchPets } = usePetStore();
    const [searchParams, setSearchParams] = useSearchParams();
    const location = useLocation();
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);

    // State for more filters toggle
    const [showMoreFilters, setShowMoreFilters] = useState(false);

    const typeFromUrl = searchParams.get('type');
    const termFromUrl = searchParams.get('term');

    const [filters, setFilters] = useState({
        type: typeFromUrl || 'any',
        radius: '',
        zipCode: '',
        sortBy: 'nearest',
        term: termFromUrl || '',
        // Additional filter fields
        gender: 'any',
        ageCategory: 'any',
        size: 'any',
        color: '',
        breed: ''
    });

    useEffect(() => {
        if (typeFromUrl) {
            setFilters(prev => ({
                ...prev,
                type: typeFromUrl
            }));
        }

        if (termFromUrl) {
            setFilters(prev => ({
                ...prev,
                term: termFromUrl
            }));
        }
    }, [typeFromUrl, termFromUrl]);

    useEffect(() => {
        searchPets(filters);
    }, [filters, searchPets]);

    useEffect(() => {
        const handleClickOutside = (event) => {
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

    const handleSearchChange = (term) => {
        // Make sure empty strings are treated as empty values
        const sanitizedTerm = term && term.trim() !== "" ? term.trim() : "";

        setFilters(prev => ({ ...prev, term: sanitizedTerm }));

        // Update URL
        const newSearchParams = new URLSearchParams(searchParams);
        if (sanitizedTerm) {
            newSearchParams.set('term', sanitizedTerm);
        } else {
            newSearchParams.delete('term');
        }
        setSearchParams(newSearchParams);
    };

    const handleFilterChange = (key, value) => {
        // Special handling for term to ensure empty strings become empty values
        if (key === 'term') {
            const sanitizedValue = value && value.trim() !== "" ? value.trim() : "";
            setFilters(prev => ({ ...prev, [key]: sanitizedValue }));

            const newSearchParams = new URLSearchParams(searchParams);
            if (sanitizedValue) {
                newSearchParams.set('term', sanitizedValue);
            } else {
                newSearchParams.delete('term');
            }
            setSearchParams(newSearchParams);
            return;
        }

        // Regular handling for other filters
        setFilters(prev => ({ ...prev, [key]: value }));

        if (key === 'type') {
            const newSearchParams = new URLSearchParams(searchParams);
            if (value && value !== 'any') {
                newSearchParams.set('type', value);
            } else {
                newSearchParams.delete('type');
            }
            setSearchParams(newSearchParams);
        }
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

    const handleResetFilters = () => {
        setFilters({
            type: 'any',
            radius: '',
            zipCode: '',
            sortBy: 'nearest',
            term: '',
            gender: 'any',
            ageCategory: 'any',
            size: 'any',
            color: '',
            breed: ''
        });

        // Reset URL params
        setSearchParams({});
    };

    const getAvatarUrl = (url) => {
        if (!url) return '/default-avatar.png';
    
        // Check if the URL is already absolute or starts with http
        if (url.startsWith('http')) {
            return url;
        }
    
        // Ensure the URL starts with a slash
        const formattedUrl = url.startsWith('/') ? url : `/${url}`;
    
        // Add timestamp to prevent caching
        const timestamp = `?t=${Date.now()}`;
    
        // Return the full URL by prepending the BASE_URL
        return `http://localhost:5000${formattedUrl}${timestamp}`;
    };

    return (
        <div className="min-h-screen w-full font-sans flex flex-col overflow-x-hidden">
            {/* Header */}
            <header className="container mx-auto px-4 py-4 flex items-center justify-between relative z-50">
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
                    <a href="/adoption-requirements" className="text-gray-500 hover:text-gray-900">Requirements</a>
                    <a href="/adoption-faq" className="text-gray-500 hover:text-gray-900">FAQ</a>

                    {/* Search Icon */}
                    <DynamicSearch onSearch={handleSearchChange} redirectOnSelect={false} />
                </nav>

                <div className="flex items-center space-x-4">
                    <div className="flex space-x-4 relative">
                        {/* Profile button with dropdown */}
                        <motion.button
                            whileHover={{scale: 1.05}}
                            whileTap={{scale: 0.95}}
                            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                            className="p-2 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 flex items-center justify-center z-50">
                            {user && user.avatar ? (
                                <img
                                    src={getAvatarUrl(user.avatar)}
                                    alt="Profile"
                                    className="h-5 w-5 rounded-full object-cover"
                                    onError={(e) => {
                                        console.log("Avatar load error, using fallback");
                                        e.target.onerror = null;
                                        e.target.src = '/default-avatar.png';
                                    }}
                                />
                            ) : (
                                <User className="h-5 w-5" />
                            )}
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
                    </div>
                </div>
            </header>

            {/* Main Content - Flexible Height */}
            <main className="flex-1 container mx-auto px-4 py-4 z-10">
                {/* Search Section */}
                <div className="mb-8">
                    {/* Search Filters */}
                    <div className="bg-tealcustom rounded-xl p-6 flex flex-wrap items-center justify-between gap-4 mb-6">
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
                                    className="bg-tealcustom text-white border-none outline-none text-lg cursor-pointer appearance-none pr-8 w-full"
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

                            <div className="flex flex-col">
                                <label className="text-white text-sm mb-1">Search Term</label>
                                <input
                                    type="text"
                                    value={filters.term || ''}
                                    onChange={(e) => handleFilterChange('term', e.target.value)}
                                    placeholder="Search by name or breed"
                                    className="bg-transparent text-white border-b border-white outline-none text-lg w-32 placeholder-gray-300"
                                />
                            </div>
                        </div>

                        <button
                            onClick={() => searchPets(filters)}
                            className="bg-yellow-200 hover:bg-yellow-100 text-tealcustom px-6 py-3 rounded-md flex items-center transition duration-200"
                        >
                            Find your best match
                            <Search className="ml-2 h-5 w-5"/>
                        </button>
                    </div>

                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setShowMoreFilters(!showMoreFilters)}
                                className="text-tealcustom flex items-center"
                            >
                                {showMoreFilters ? 'Less Filters' : 'More Filters'}
                                <ChevronDown className={`ml-1 h-4 w-4 transform transition-transform ${showMoreFilters ? 'rotate-180' : ''}`}/>
                            </button>

                            {(filters.gender !== 'any' || filters.ageCategory !== 'any' ||
                                filters.size !== 'any' || filters.color || filters.breed) && (
                                <button
                                    onClick={handleResetFilters}
                                    className="text-red-500 text-sm hover:text-red-700"
                                >
                                    Reset All Filters
                                </button>
                            )}
                        </div>

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

                    {/* Additional filters panel - shown when 'More Filters' is clicked */}
                    {showMoreFilters && (
                        <div className="bg-tealcustom rounded-xl p-6 flex flex-wrap items-center gap-6 mb-6 transition-all duration-300">
                            <div className="flex flex-col">
                                <label className="text-white text-sm mb-1">Gender</label>
                                <select
                                    value={filters.gender}
                                    onChange={(e) => handleFilterChange('gender', e.target.value)}
                                    className="bg-white border border-gray-300 rounded p-2 text-sm w-full"
                                >
                                    <option value="any">Any</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                </select>
                            </div>

                            <div className="flex flex-col">
                                <label className="text-white text-sm mb-1">Age</label>
                                <select
                                    value={filters.ageCategory}
                                    onChange={(e) => handleFilterChange('ageCategory', e.target.value)}
                                    className="bg-white border border-gray-300 rounded p-2 text-sm w-full"
                                >
                                    <option value="any">Any</option>
                                    <option value="baby">Baby</option>
                                    <option value="young">Young</option>
                                    <option value="adult">Adult</option>
                                    <option value="senior">Senior</option>
                                </select>
                            </div>

                            <div className="flex flex-col">
                                <label className="text-white text-sm mb-1">Size</label>
                                <select
                                    value={filters.size}
                                    onChange={(e) => handleFilterChange('size', e.target.value)}
                                    className="bg-white border border-gray-300 rounded p-2 text-sm w-full"
                                >
                                    <option value="any">Any</option>
                                    <option value="small">Small</option>
                                    <option value="medium">Medium</option>
                                    <option value="large">Large</option>
                                    <option value="extra_large">Extra Large</option>
                                </select>
                            </div>

                            <div className="flex flex-col">
                                <label className="text-white text-sm mb-1">Color</label>
                                <input
                                    type="text"
                                    value={filters.color}
                                    onChange={(e) => handleFilterChange('color', e.target.value)}
                                    placeholder="Pet color"
                                    className="bg-white border border-gray-300 rounded p-2 text-sm w-full"
                                />
                            </div>

                            <div className="flex flex-col">
                                <label className="text-white text-sm mb-1">Breed</label>
                                <input
                                    type="text"
                                    value={filters.breed}
                                    onChange={(e) => handleFilterChange('breed', e.target.value)}
                                    placeholder="Pet breed"
                                    className="bg-white border border-gray-300 rounded p-2 text-sm w-full"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Active Filters Display */}
                {(filters.gender !== 'any' || filters.ageCategory !== 'any' ||
                    filters.size !== 'any' || filters.color || filters.breed ||
                    filters.type !== 'any' || (filters.term && filters.term.trim() !== '')) && (
                    <div className="flex flex-wrap gap-2 mb-6">
                        <span className="text-gray-600">Active filters:</span>

                        {filters.type !== 'any' && (
                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs flex items-center">
                                Type: {filters.type}
                                <button
                                    onClick={() => handleFilterChange('type', 'any')}
                                    className="ml-2 text-blue-800"
                                >
                                    ×
                                </button>
                            </span>
                        )}

                        {filters.term && filters.term.trim() !== '' && (
                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs flex items-center">
                            Search: {filters.term}
                            <button
                                onClick={() => handleFilterChange('term', '')}
                                className="ml-2 text-blue-800"
                            >
                                ×
                            </button>
                             </span>
                        )}

                        {filters.gender !== 'any' && (
                            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs flex items-center">
                                Gender: {filters.gender}
                                <button
                                    onClick={() => handleFilterChange('gender', 'any')}
                                    className="ml-2 text-green-800"
                                >
                                    ×
                                </button>
                            </span>
                        )}

                        {filters.ageCategory !== 'any' && (
                            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs flex items-center">
                                Age: {filters.ageCategory}
                                <button
                                    onClick={() => handleFilterChange('ageCategory', 'any')}
                                    className="ml-2 text-yellow-800"
                                >
                                    ×
                                </button>
                            </span>
                        )}

                        {filters.size !== 'any' && (
                            <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs flex items-center">
                                Size: {filters.size}
                                <button
                                    onClick={() => handleFilterChange('size', 'any')}
                                    className="ml-2 text-purple-800"
                                >
                                    ×
                                </button>
                            </span>
                        )}

                        {filters.color && (
                            <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs flex items-center">
                                Color: {filters.color}
                                <button
                                    onClick={() => handleFilterChange('color', '')}
                                    className="ml-2 text-red-800"
                                >
                                    ×
                                </button>
                            </span>
                        )}

                        {filters.breed && (
                            <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-xs flex items-center">
                                Breed: {filters.breed}
                                <button
                                    onClick={() => handleFilterChange('breed', '')}
                                    className="ml-2 text-indigo-800"
                                >
                                    ×
                                </button>
                            </span>
                        )}
                    </div>
                )}

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
                                <PetCard key={pet.id} pet={pet} showArrow={true} />
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