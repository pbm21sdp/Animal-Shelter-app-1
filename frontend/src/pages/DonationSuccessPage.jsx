// pages/DonationSuccessPage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PawPrint, Heart, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDonationStore } from '../store/donationStore';

export default function DonationSuccessPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [donationDetails, setDonationDetails] = useState(null);
    const { verifyDonation, isLoading } = useDonationStore();


    useEffect(() => {
        const fetchDonationDetails = async () => {
            // Get session ID from URL
            const params = new URLSearchParams(location.search);
            const sessionId = params.get('session_id');

            if (sessionId) {
                // Verify the donation with backend
                const result = await verifyDonation(sessionId);
                if (result && result.success) {
                    setDonationDetails(result.donation);
                }
            } else {
                navigate('/');
            }
        };

        fetchDonationDetails();
    }, [location, navigate, verifyDonation]);

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center px-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 mb-4">
                <div className="flex items-center justify-center mb-6">
                    <PawPrint className="text-teal-600 h-10 w-10" />
                </div>

                <div className="text-center">
                    <div className="mb-6 flex justify-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.5 }}
                            className="bg-pink-100 rounded-full p-4"
                        >
                            <Heart className="text-red-500 h-12 w-12" />
                        </motion.div>
                    </div>

                    <h1 className="text-2xl font-bold mb-2">Thank You for Your Donation!</h1>
                    <p className="text-gray-600 mb-6">
                        Your contribution will help animals find their forever homes. We greatly appreciate your support!
                    </p>

                    {isLoading ? (
                        <div className="flex justify-center mb-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-600"></div>
                        </div>
                    ) : donationDetails ? (
                        <div className="my-6 p-4 bg-yellow-50 rounded-lg">
                            <p className="text-gray-700">Your donation of {donationDetails.amount} € was successful!</p>
                            <p className="text-sm text-gray-500 mt-2">
                                A confirmation email has been sent to your email address.
                            </p>
                        </div>
                    ) : (
                        <div className="my-6 p-4 bg-yellow-50 rounded-lg">
                            <p className="text-gray-700">Your donation was processed.</p>
                            <p className="text-sm text-gray-500 mt-2">
                                Thank you for your support!
                            </p>
                        </div>
                    )}

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/')}
                        className="flex items-center justify-center mx-auto bg-tealcustom hover:bg-teal-700 text-white px-6 py-3 rounded-md transition duration-200"
                    >
                        <ArrowLeft className="h-5 w-5 mr-2" />
                        <span>Return Home</span>
                    </motion.button>
                </div>
            </div>
        </div>
    );
}