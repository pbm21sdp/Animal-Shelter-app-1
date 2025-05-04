// components/Admin/shared/AdminSearchBar.jsx
import React from 'react';
import { Search } from 'lucide-react';

const AdminSearchBar = ({ value, onChange, placeholder = 'Search...', className = '' }) => {
    return (
        <div className={`relative w-full sm:w-auto ${className}`}>
            <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                className="px-4 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 w-full"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        </div>
    );
};

export default AdminSearchBar;