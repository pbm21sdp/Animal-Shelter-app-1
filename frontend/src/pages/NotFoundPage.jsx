// NotFoundPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="text-center">
                <h1 className="text-6xl font-bold text-tealcustom mb-4">404</h1>
                <h2 className="text-3xl font-semibold mb-6">Page Not Found</h2>
                <p className="text-gray-600 mb-8">
                    The page you are looking for might have been removed,
                    had its name changed, or is temporarily unavailable.
                </p>
                <Link
                    to="/"
                    className="bg-tealcustom hover:bg-teal-700 text-white font-bold py-2 px-4 rounded"
                >
                    Go to Homepage
                </Link>
            </div>
        </div>
    );
};

export default NotFoundPage;