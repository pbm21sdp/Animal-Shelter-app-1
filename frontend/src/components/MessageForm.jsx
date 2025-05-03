import React, { useState, useEffect } from 'react';
import { Send } from 'lucide-react';
import { useMessageStore } from '../store/messageStore';
import { useAuthStore } from '../store/authStore';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const MessageForm = () => {
    const { user } = useAuthStore();
    const { sendMessage, isLoading, error, success, clearNotifications } = useMessageStore();

    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [charCount, setCharCount] = useState(0);
    const maxChars = 1800;

    // Set email from user if logged in
    useEffect(() => {
        if (user && user.email) {
            setEmail(user.email);
        }
    }, [user]);

    // Handle notifications
    useEffect(() => {
        if (error) {
            toast.error(error);
            clearNotifications();
        }

        if (success) {
            toast.success(success);
            clearNotifications();
            // Reset form after successful submission
            setMessage('');
            setCharCount(0);
            // Don't reset email if it came from logged in user
            if (!user || !user.email) {
                setEmail('');
            }
        }
    }, [error, success, clearNotifications, user]);

    const handleMessageChange = (e) => {
        const newMessage = e.target.value;

        // Only update if under character limit
        if (newMessage.length <= maxChars) {
            setMessage(newMessage);
            setCharCount(newMessage.length);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email || !message) {
            toast.error('Email and message are required');
            return;
        }

        // Check email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            toast.error('Please enter a valid email address');
            return;
        }

        await sendMessage(email, message);
    };

    return (
        <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
                <label htmlFor="email" className="block text-sm mb-1">Email</label>
                <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Your email"
                    disabled={user && user.email}
                    readOnly={user && user.email}
                />
                {user && user.email && (
                    <p className="text-xs text-gray-500 mt-1">Using your account email</p>
                )}
            </div>

            <div>
                <label htmlFor="message" className="block text-sm mb-1">Message</label>
                <textarea
                    id="message"
                    rows="4"
                    value={message}
                    onChange={handleMessageChange}
                    className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Your message"
                ></textarea>
                <div className="text-xs text-gray-500 flex justify-between mt-1">
                    <span>{charCount > 0 ? `${charCount} characters` : ''}</span>
                    <span>{maxChars - charCount} characters remaining</span>
                </div>
            </div>

            <motion.button
                type="submit"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={isLoading}
                className={`bg-tealcustom hover:bg-teal-800 text-white px-6 py-2 rounded-md flex items-center transition duration-200 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
                <span className="mr-2">{isLoading ? 'Sending...' : 'Send'}</span>
                <Send className="h-4 w-4" />
            </motion.button>
        </form>
    );
};

export default MessageForm;