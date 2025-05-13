import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
    return (
        <div className="min-h-screen bg-white flex items-center justify-center px-4">
            <div className="text-center max-w-4xl w-full">
                {/* 404 Illustration */}
                <div className="relative mb-8">
                    <div className="w-full h-96 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center relative overflow-hidden">
                        {/* You can replace this with your own 404 illustration */}
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-200 via-blue-200 to-purple-200 opacity-50"></div>
                        <h1 className="text-8xl font-bold text-gray-700 relative z-10">404</h1>
                        {/* Floating elements for visual interest */}
                        <div className="absolute top-10 left-10 w-4 h-4 bg-yellow-400 rounded-full animate-pulse"></div>
                        <div className="absolute top-20 right-16 w-6 h-6 bg-pink-400 rounded-full animate-bounce"></div>
                        <div className="absolute bottom-16 left-20 w-5 h-5 bg-green-400 rounded-full animate-pulse"></div>
                        <div className="absolute bottom-10 right-10 w-3 h-3 bg-blue-400 rounded-full animate-bounce"></div>
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-6">
                    <h2 className="text-3xl font-semibold text-gray-800">
                        Oops! Page Not Found
                    </h2>
                    <p className="text-lg text-gray-600 max-w-md mx-auto">
                        The page you're looking for doesn't exist. It might have been moved, deleted, or you entered the wrong URL.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Link
                            to="/"
                            className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors duration-200 font-medium"
                        >
                            Go Home
                        </Link>
                        <button
                            onClick={() => window.history.back()}
                            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
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