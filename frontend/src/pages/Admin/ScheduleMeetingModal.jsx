// Update the ScheduleMeetingModal.jsx

import React, { useState, useEffect } from 'react';
import { useMeetingStore } from '../../store/meetingStore';
import { Calendar, Clock, MapPin, MessageSquare, X, Check, AlertCircle } from 'lucide-react';

const ScheduleMeetingModal = ({ isOpen, onClose, adoption }) => {
    const { scheduleMeeting, isLoading, error } = useMeetingStore();

    // Set initial form data
    const [formData, setFormData] = useState({
        adoptionId: '',
        scheduledDate: '',
        scheduledTime: '',
        location: '',
        notes: '',
        adminMessage: ''
    });

    // Update form data when adoption changes
    useEffect(() => {
        if (adoption && adoption._id) {
            setFormData(prev => ({
                ...prev,
                adoptionId: adoption._id
            }));
        }
    }, [adoption]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!adoption || !adoption._id) {
            console.error("Adoption data is not available");
            return;
        }

        // Make sure adoptionId is set correctly
        const meetingData = {
            ...formData,
            adoptionId: adoption._id
        };

        const result = await scheduleMeeting(meetingData);

        if (result.success) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full shadow-xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">Schedule Adoption Meeting</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600">
                        <AlertCircle className="h-5 w-5" />
                        {error}
                    </div>
                )}

                <div className="mb-6">
                    <p className="text-gray-700">
                        Scheduling a meeting for <span className="font-semibold">{adoption?.petName}</span> with{' '}
                        <span className="font-semibold">
                            {adoption?.user?.name || (typeof adoption?.user === 'string' ? 'User ID: ' + adoption?.user : 'Unknown User')}
                        </span>
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Calendar className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="date"
                                    name="scheduledDate"
                                    value={formData.scheduledDate}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Time <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Clock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="time"
                                    name="scheduledTime"
                                    value={formData.scheduledTime}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Location <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MapPin className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                required
                                placeholder="e.g., Animal Shelter Main Office, 123 Main St"
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Message to Applicant <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <div className="absolute top-3 left-3 pointer-events-none">
                                <MessageSquare className="h-5 w-5 text-gray-400" />
                            </div>
                            <textarea
                                name="adminMessage"
                                value={formData.adminMessage}
                                onChange={handleChange}
                                required
                                placeholder="Message that will be displayed to the applicant"
                                rows="3"
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                            ></textarea>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Additional Notes (Internal Only)
                        </label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            placeholder="Optional notes - only visible to admins"
                            rows="2"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                        ></textarea>
                    </div>

                    <input
                        type="hidden"
                        name="adoptionId"
                        value={formData.adoptionId}
                    />

                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md"
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md flex items-center"
                            disabled={isLoading || !adoption || !adoption._id}
                        >
                            {isLoading ? (
                                <span className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Scheduling...
                                </span>
                            ) : (
                                <span className="flex items-center">
                                    <Check className="h-4 w-4 mr-2" />
                                    Schedule Meeting
                                </span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ScheduleMeetingModal;