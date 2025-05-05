// DynamicSearch.jsx with Emag-style suggestions and clickable search icon
import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const DynamicSearch = ({ onSearch, redirectOnSelect = true }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [predictions, setPredictions] = useState([]);
    const [showPredictions, setShowPredictions] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const searchRef = useRef(null);
    const inputRef = useRef(null); // Add input ref for focusing
    const navigate = useNavigate();

    // Function to fetch predictions as user types
    const fetchPredictions = async (term) => {
        if (!term || term.length < 1) {
            setPredictions([]);
            return;
        }

        setIsLoading(true);
        try {
            // Fetch pets that match the search term
            const response = await axios.get(`http://localhost:5000/api/pets/suggestions?term=${term}`);

            if (response.data && response.data.success) {
                setPredictions(response.data.suggestions.slice(0, 8)); // Limit to 8 suggestions
            } else {
                // Fallback if the endpoint doesn't work properly
                setPredictions([{ text: term, category: 'Search' }]);
            }
        } catch (error) {
            console.error('Error fetching predictions:', error);
            // Fallback suggestions if the endpoint fails
            setPredictions([{ text: term, category: 'Search' }]);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle search icon click to focus the input
    const handleSearchIconClick = () => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    // Handle input changes
    const handleInputChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);

        // If we have an onSearch callback and we're in PetSearchPage (not redirecting)
        if (onSearch && !redirectOnSelect) {
            if (value.trim().length > 0) {
                // Regular case - call with the trimmed value
                onSearch(value.trim());
            } else {
                // Empty input case - explicitly call with empty string
                onSearch('');
            }
        }
    };

    // Handle search submission (when user presses Enter)
    const handleSearch = (e) => {
        if (e.key === 'Enter' && searchTerm.trim()) {
            if (redirectOnSelect) {
                // In HomePage, navigate to search page
                navigate(`/pet-search?term=${encodeURIComponent(searchTerm.trim())}`);
            } else {
                // In PetSearchPage, just update the search
                if (onSearch) {
                    onSearch(searchTerm.trim());
                }
            }
            setShowPredictions(false);
        }
    };

    // Handle prediction click
    const handlePredictionClick = (prediction) => {
        // If prediction is an object with text property (new format)
        const searchText = typeof prediction === 'object' ? prediction.text : prediction;

        setSearchTerm(searchText);

        if (redirectOnSelect) {
            // In HomePage, navigate to search page with both term and maybe type
            if (typeof prediction === 'object' && prediction.category &&
                ['Dog', 'Cat', 'Bird', 'Other'].includes(prediction.category)) {
                navigate(`/pet-search?term=${encodeURIComponent(searchText)}&type=${prediction.category.toLowerCase()}`);
            } else {
                navigate(`/pet-search?term=${encodeURIComponent(searchText)}`);
            }
        } else {
            // In PetSearchPage, just update the search
            if (onSearch) {
                onSearch(searchText);
            }
        }

        setShowPredictions(false);
    };

    // Close predictions when clicking outside
    const handleClickOutside = (e) => {
        if (searchRef.current && !searchRef.current.contains(e.target)) {
            setShowPredictions(false);
        }
    };

    // Add event listener for clicks outside
    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Fetch predictions when search term changes
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchTerm) {
                fetchPredictions(searchTerm);
            } else {
                setPredictions([]);
            }
        }, 300); // Debounce for 300ms

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    return (
        <div ref={searchRef} className="relative">
            <div className="flex items-center">
                <button
                    onClick={handleSearchIconClick}
                    className="text-gray-500 hover:text-gray-900 cursor-pointer"
                >
                    <Search className="h-5 w-5" />
                </button>

                <input
                    ref={inputRef}
                    type="text"
                    value={searchTerm}
                    onChange={handleInputChange}
                    onKeyDown={handleSearch}
                    onFocus={() => setShowPredictions(true)}
                    placeholder="Search pets..."
                    className="ml-2 p-2 border border-gray-200 rounded-full focus:outline-none focus:border-tealcustom"
                />
            </div>

            {/* Predictions dropdown */}
            {showPredictions && searchTerm.length >= 1 && (
                <div className="absolute z-10 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200">
                    {isLoading ? (
                        <div className="p-3 text-gray-500 text-center">Loading...</div>
                    ) : predictions.length > 0 ? (
                        <ul>
                            {predictions.map((prediction, index) => {
                                // Check if prediction is an object (new format) or string (old format)
                                const text = typeof prediction === 'object' ? prediction.text : prediction;
                                const category = typeof prediction === 'object' ? prediction.category : null;

                                return (
                                    <li
                                        key={index}
                                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                                        onClick={() => handlePredictionClick(prediction)}
                                    >
                                        <Search className="h-4 w-4 text-gray-400 mr-2" />
                                        <div className="flex items-center justify-between w-full">
                                            <span>{text}</span>
                                            {category && (
                                                <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded ml-2">
                                                    {category}
                                                </span>
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : searchTerm.length >= 1 ? (
                        <div className="p-3 text-gray-500">No results found</div>
                    ) : null}
                </div>
            )}
        </div>
    );
};

export default DynamicSearch;