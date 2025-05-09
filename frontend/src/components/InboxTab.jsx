// components/InboxTab.jsx
import React, { useState, useEffect } from 'react';
import { useMeetingStore } from '../store/meetingStore';
import { useMessageStore } from '../store/messageStore';
import {
    Clock,
    MessageCircle,
    Calendar,
    MapPin,
    Bell,
    ChevronRight,
    Loader,
    Check,
    X,
    AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

const InboxTab = () => {
    const {
        userMeetings,
        getUserMeetings,
        respondToMeeting,
        isLoading: meetingsLoading,
        error: meetingsError,
        success: meetingsSuccess,
        clearNotifications: clearMeetingNotifications
    } = useMeetingStore();

    // Add the message store for any system messages or admin communications
    const {
        error: messagesError,
        success: messagesSuccess,
        clearNotifications: clearMessageNotifications
    } = useMessageStore();

    // State for selected message and confirmation dialog
    const [selectedMeeting, setSelectedMeeting] = useState(null);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [responseType, setResponseType] = useState(null);
    const [expandedMeetingId, setExpandedMeetingId] = useState(null);

    // Get user's meetings on component mount
    useEffect(() => {
        getUserMeetings();
    }, [getUserMeetings]);

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Format time
    const formatTime = (timeString) => {
        return timeString || 'Time not specified';
    };

    // Toggle message expansion
    const toggleMessageExpansion = (id) => {
        if (expandedMeetingId === id) {
            setExpandedMeetingId(null);
        } else {
            setExpandedMeetingId(id);
        }
    };

    // Handle meeting response
    const handleRespond = (meeting, response) => {
        setSelectedMeeting(meeting);
        setResponseType(response);
        setShowConfirmation(true);
    };

    // Confirm response
    const confirmResponse = async () => {
        if (!selectedMeeting || !responseType) return;

        await respondToMeeting(selectedMeeting._id, responseType);
        setShowConfirmation(false);
        setSelectedMeeting(null);
        setResponseType(null);
        setExpandedMeetingId(null);
    };

    // Filter to show only pending meetings
    const pendingMeetings = userMeetings.filter(meeting => meeting.status === 'pending');

    // Errors and success messages
    const error = meetingsError || messagesError;
    const success = meetingsSuccess || messagesSuccess;

    // Clear all notifications
    const clearAllNotifications = () => {
        clearMeetingNotifications();
        clearMessageNotifications();
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-teal-600 relative z-10"
        >
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Inbox</h2>
                {pendingMeetings.length > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center">
            <Bell className="h-3 w-3 mr-1" />
                        {pendingMeetings.length} New
          </span>
                )}
            </div>

            {/* Alert Messages */}
            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600">
                    <AlertCircle className="h-5 w-5" />
                    {error}
                    <button
                        onClick={clearAllNotifications}
                        className="ml-auto text-red-500 hover:text-red-700"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-600">
                    <Check className="h-5 w-5" />
                    {success}
                    <button
                        onClick={clearAllNotifications}
                        className="ml-auto text-green-500 hover:text-green-700"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* Loading State */}
            {meetingsLoading ? (
                <div className="flex justify-center items-center py-8">
                    <Loader className="h-8 w-8 text-teal-600 animate-spin" />
                </div>
            ) : pendingMeetings.length === 0 ? (
                <div className="text-center py-12">
                    <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Your inbox is empty</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {pendingMeetings.map((meeting) => (
                        <div
                            key={meeting._id}
                            className={`border rounded-lg transition-all duration-200 ${
                                expandedMeetingId === meeting._id
                                    ? 'border-teal-300 bg-teal-50'
                                    : 'border-yellow-300 bg-yellow-50 hover:border-yellow-400'
                            }`}
                        >
                            {/* Message Header - Always Visible */}
                            <div
                                className="p-4 cursor-pointer flex justify-between items-center"
                                onClick={() => toggleMessageExpansion(meeting._id)}
                            >
                                <div className="flex items-center">
                                    <div className="bg-teal-100 rounded-full p-2 mr-3">
                                        <Calendar className="h-5 w-5 text-teal-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-900">
                                            Meeting Request for {meeting.petName}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            {formatDate(meeting.scheduledDate)} at {formatTime(meeting.scheduledTime)}
                                        </p>
                                    </div>
                                </div>
                                <ChevronRight
                                    className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
                                        expandedMeetingId === meeting._id ? 'transform rotate-90' : ''
                                    }`}
                                />
                            </div>

                            {/* Expanded Content */}
                            {expandedMeetingId === meeting._id && (
                                <div className="px-4 pb-4 pt-2 border-t border-gray-200">
                                    <div className="space-y-4 mb-4">
                                        <div className="flex items-start">
                                            <MapPin className="h-5 w-5 text-teal-600 mr-2 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <div className="text-sm font-medium text-gray-700">Location</div>
                                                <div className="text-gray-900">{meeting.location}</div>
                                            </div>
                                        </div>

                                        {meeting.adminMessage && (
                                            <div className="bg-white rounded-lg p-3 border border-gray-200">
                                                <div className="text-sm font-medium text-gray-700 mb-1">Message</div>
                                                <p className="text-gray-900">{meeting.adminMessage}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-yellow-100 p-3 rounded-lg mb-4">
                                        <p className="text-sm text-yellow-800">
                                            <AlertCircle className="h-4 w-4 inline mr-1" />
                                            Please respond to this meeting request. Accepting will move your adoption status to "In Review".
                                            Declining will cancel your adoption application.
                                        </p>
                                    </div>

                                    <div className="flex gap-2 justify-end">
                                        <button
                                            onClick={() => handleRespond(meeting, 'rejected')}
                                            className="px-4 py-2 bg-white border border-red-500 text-red-600 rounded-md hover:bg-red-50 text-sm font-medium flex items-center"
                                        >
                                            <X className="h-4 w-4 mr-1" />
                                            Decline
                                        </button>
                                        <button
                                            onClick={() => handleRespond(meeting, 'accepted')}
                                            className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 text-sm font-medium flex items-center"
                                        >
                                            <Check className="h-4 w-4 mr-1" />
                                            Accept
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Confirmation Dialog */}
            {showConfirmation && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
                        <h3 className="text-lg font-semibold mb-4">
                            {responseType === 'accepted' ? 'Accept Meeting' : 'Decline Meeting'}
                        </h3>
                        <p className="text-gray-700 mb-6">
                            {responseType === 'accepted'
                                ? `Are you sure you want to accept the meeting for ${selectedMeeting?.petName}? This will move your adoption application status to "In Review".`
                                : `Are you sure you want to decline the meeting for ${selectedMeeting?.petName}? This will cancel your adoption application.`}
                        </p>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowConfirmation(false)}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmResponse}
                                className={`px-4 py-2 rounded-md text-white text-sm ${
                                    responseType === 'accepted'
                                        ? 'bg-teal-600 hover:bg-teal-700'
                                        : 'bg-red-600 hover:bg-red-700'
                                }`}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default InboxTab;