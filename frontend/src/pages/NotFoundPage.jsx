import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
    return (
        <div className="min-h-screen w-screen bg-white flex items-center justify-center px-4">

            <div className="text-center max-w-2xl w-full">

                {/* 404 Text */}
                <div className="relative h-full flex items-center justify-center py-10">
                    <h1 className="text-7xl sm:text-8xl font-bold text-tealcustom drop-shadow-2xl">404</h1>
                </div>

                {/* 404 Section with Background */}
                <div
                    className="relative h-80 sm:h-96 bg-cover bg-center bg-no-repeat rounded-2xl mb-12 overflow-hidden"
                    style={{
                        backgroundImage: 'url(https://cdn.dribbble.com/users/285475/screenshots/2083086/dribbble_1.gif)'
                    }}
                >
                </div>

                {/* Content Section */}
                <div>
                    <h2 className="text-3xl font-semibold text-gray-800 mb-4">
                        Page Not Found
                    </h2>
                    <p className="text-gray-600 mb-8 text-lg">
                        The page you are looking for might have been removed,
                        had its name changed, or is temporarily unavailable.
                    </p>
                    <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
                        <Link
                            to="/"
                            className="bg-tealcustom hover:bg-teal-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 inline-block"
                        >
                            Go to Homepage
                        </Link>
                        <button
                            onClick={() => window.history.back()}
                            className="border border-tealcustom text-tealcustom hover:bg-tealcustom hover:text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 inline-block"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotFoundPage;