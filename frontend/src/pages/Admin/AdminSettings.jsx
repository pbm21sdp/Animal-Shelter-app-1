// components/Admin/AdminSettings.jsx
import React, { useState, useEffect } from 'react';
import { Settings, Save, RefreshCw, Check } from 'lucide-react';
import axios from 'axios';

const AdminSettings = () => {
    // Settings state
    const [settings, setSettings] = useState({
        siteName: '',
        contactEmail: '',
        donationFees: {
            enabled: false,
            percentage: 0
        },
        notificationEmails: {
            newPet: true,
            newDonation: true,
            newMessage: true
        },
        maintenanceMode: false
    });

    // UI state
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    // Fetch settings
    const fetchSettings = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.get('http://localhost:5000/api/settings/admin', { withCredentials: true });
            if (response.data.success) {
                setSettings(response.data.settings);
            } else {
                setError('Failed to fetch settings');
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
            setError(error.response?.data?.message || 'Error fetching settings');
        } finally {
            setIsLoading(false);
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchSettings();
    }, []);

    // Handle input change
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name.includes('.')) {
            // Handle nested properties
            const [parent, child] = name.split('.');
            setSettings(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: type === 'checkbox' ? checked : value
                }
            }));
        } else {
            // Handle top-level properties
            setSettings(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    // Save settings
    const saveSettings = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);
        setSuccessMessage('');

        try {
            const response = await axios.put(
                'http://localhost:5000/api/settings/admin',
                { settings },
                { withCredentials: true }
            );

            if (response.data.success) {
                setSuccessMessage('Settings saved successfully!');
                // Hide success message after 3 seconds
                setTimeout(() => {
                    setSuccessMessage('');
                }, 3000);
            } else {
                setError('Failed to save settings');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            setError(error.response?.data?.message || 'Error saving settings');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <RefreshCw className="h-8 w-8 text-tealcustom animate-spin" />
                <span className="ml-2 text-lg">Loading settings...</span>
            </div>
        );
    }

    return (
        <div>
            <div className="flex flex-wrap justify-between items-center mb-6">
                <h2 className="text-2xl font-bold mb-4 sm:mb-0 flex items-center">
                    <Settings className="h-6 w-6 mr-2" />
                    Admin Settings
                </h2>
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {/* Success Message */}
            {successMessage && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 flex items-center">
                    <Check className="h-5 w-5 mr-2" />
                    {successMessage}
                </div>
            )}

            <div className="bg-white shadow-md rounded-lg p-6">
                <form onSubmit={saveSettings}>
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200">General Settings</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="siteName">
                                    Site Name
                                </label>
                                <input
                                    id="siteName"
                                    name="siteName"
                                    type="text"
                                    value={settings.siteName}
                                    onChange={handleChange}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="contactEmail">
                                    Contact Email
                                </label>
                                <input
                                    id="contactEmail"
                                    name="contactEmail"
                                    type="email"
                                    value={settings.contactEmail}
                                    onChange={handleChange}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                />
                            </div>
                        </div>

                        <div className="mt-4">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="maintenanceMode"
                                    checked={settings.maintenanceMode}
                                    onChange={handleChange}
                                    className="h-4 w-4 text-tealcustom focus:ring-teal-500 border-gray-300 rounded"
                                />
                                <span className="ml-2 text-gray-700">Enable Maintenance Mode</span>
                                <span className="ml-2 text-xs text-gray-500">(Only admins can access the site)</span>
                            </label>
                        </div>
                    </div>

                    <div className="mb-8">
                        <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200">Donation Settings</h3>

                        <div>
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="donationFees.enabled"
                                    checked={settings.donationFees.enabled}
                                    onChange={handleChange}
                                    className="h-4 w-4 text-tealcustom focus:ring-teal-500 border-gray-300 rounded"
                                />
                                <span className="ml-2 text-gray-700">Enable Platform Fee</span>
                            </label>
                        </div>

                        <div className="mt-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="donationFeesPercentage">
                                Platform Fee Percentage
                            </label>
                            <input
                                id="donationFeesPercentage"
                                name="donationFees.percentage"
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={settings.donationFees.percentage}
                                onChange={handleChange}
                                disabled={!settings.donationFees.enabled}
                                className={`shadow appearance-none border rounded w-32 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${!settings.donationFees.enabled && 'opacity-50 cursor-not-allowed'}`}
                            />
                            <span className="ml-2">%</span>
                        </div>
                    </div>

                    <div className="mb-8">
                        <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200">Notification Settings</h3>

                        <div className="space-y-2">
                            <div>
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="notificationEmails.newPet"
                                        checked={settings.notificationEmails.newPet}
                                        onChange={handleChange}
                                        className="h-4 w-4 text-tealcustom focus:ring-teal-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-2 text-gray-700">Email when new pet is added</span>
                                </label>
                            </div>

                            <div>
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="notificationEmails.newDonation"
                                        checked={settings.notificationEmails.newDonation}
                                        onChange={handleChange}
                                        className="h-4 w-4 text-tealcustom focus:ring-teal-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-2 text-gray-700">Email when new donation is received</span>
                                </label>
                            </div>

                            <div>
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="notificationEmails.newMessage"
                                        checked={settings.notificationEmails.newMessage}
                                        onChange={handleChange}
                                        className="h-4 w-4 text-tealcustom focus:ring-teal-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-2 text-gray-700">Email when new message is received</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={fetchSettings}
                            className="mr-4 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded flex items-center"
                        >
                            <RefreshCw className="h-5 w-5 mr-2" />
                            Reset
                        </button>
                        <button
                            type="submit"
                            className="bg-tealcustom hover:bg-teal-700 text-white px-4 py-2 rounded flex items-center"
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                            ) : (
                                <Save className="h-5 w-5 mr-2" />
                            )}
                            Save Settings
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminSettings;