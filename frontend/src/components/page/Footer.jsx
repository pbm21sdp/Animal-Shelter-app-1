// Footer.jsx
import React, { useState, useRef } from 'react';
import { Heart, PawPrint, Facebook, Twitter, Instagram, ArrowRight } from 'lucide-react';
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from "../../store/authStore";
import { useDonationStore } from "../../store/donationStore";
import DonationModal from "../DonationModal";
import MessageForm from "../MessageForm";

const Footer = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const { createDonation } = useDonationStore();
    const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);

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

                        {/* Donation Section */}
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
                        <MessageForm />
                    </div>
                </div>
                <div className="text-center">
                    <aside>
                        <p>Copyright © {new Date().getFullYear()} - All right reserved by Paws</p>
                    </aside>
                </div>
            </div>
        </footer>
    );
};

export default Footer;