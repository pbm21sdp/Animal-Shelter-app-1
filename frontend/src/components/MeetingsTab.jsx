// components/MeetingsTab.jsx
import React, { useState, useEffect } from 'react';
import { useMeetingStore } from '../store/meetingStore';
import {
    Calendar,
    Clock,
    CheckCircle,
    XCircle,
    MapPin,
    AlertTriangle,
    MessageSquare,
    Loader,
    Search,
    Filter,
    AlertCircle,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { motion } from 'framer-motion';

const MeetingsTab = () => {
    const {
        userMeetings,
        getUserMeetings,
        isLoading,
        error,
        clearNotifications
    } = useMeetingStore();

    const [searchTerm, setSearchTerm] = useState('');
    const [filteredMeetings, setFilteredMeetings] = useState([]);
    const [activeFilter, setActiveFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState('desc'); // desc = newest first
    const [expandedMeetingId, setExpandedMeetingId] = useState(null);

    // Fetch meetings on component mount
    useEffect(() => {
        getUserMeetings();
    }, [getUserMeetings]);

    // Filter and sort meetings
    useEffect(() => {
        if (userMeetings.length > 0) {
            // First filter by search term
            let filtered = userMeetings.filter(meeting =>
                meeting.petName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                meeting.location.toLowerCase().includes(searchTerm.toLowerCase())
            );

            // Then filter by status
            if (activeFilter !== 'all') {
                filtered = filtered.filter(meeting => meeting.status === activeFilter);
            }

            // Then sort by date
            filtered = [...filtered].sort((a, b) => {
                const dateA = new Date(a.scheduledDate);
                const dateB = new Date(b.scheduledDate);
                return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
            });

            setFilteredMeetings(filtered);
        } else {
            setFilteredMeetings([]);
        }
    }, [userMeetings, searchTerm, activeFilter, sortOrder]);

    // Format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (timeString) => {
        return timeString || 'Time not specified';
    };

    // Toggle meeting expansion
    const toggleMeetingExpansion = (id) => {
        if (expandedMeetingId === id) {
            setExpandedMeetingId(null);
        } else {
            setExpandedMeetingId(id);
        }
    };

    // Count meetings by status
    const statusCounts = userMeetings.reduce((acc, meeting) => {
        const status = meeting.status;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {});

    // Get status badge
    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending':
                return (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium flex items-center">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Pending
          </span>
                );
            case 'accepted':
                return (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center">
            <CheckCircle className="h-3 w-3 mr-1" />
            Accepted
          </span>
                );
            case 'rejected':
                return (
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium flex items-center">
            <XCircle className="h-3 w-3 mr-1" />
            Declined
          </span>
                );
            default:
                return (
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
            {status}
          </span>
                );
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-teal-600 relative z-10"
        >
            <h2 className="text-2xl font-semibold mb-6">Your Meetings</h2>

            {/* Alert Messages */}
            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600">
                    <AlertCircle className="h-5 w-5" />
                    {error}
                    <button
                        onClick={clearNotifications}
                        className="ml-auto text-red-500 hover:text-red-700"
                    >
                        <ChevronUp className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* Filters and Search */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search meetings..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                </div>

                <div className="flex items-center space-x-2">
                    <div className="flex items-center">
                        <Filter className="h-5 w-5 text-gray-500 mr-2" />
                        <span className="mr-2 text-sm text-gray-700">Status:</span>
                    </div>
                    <div className="flex space-x-1">
                        <button
                            onClick={() => setActiveFilter('all')}
                            className={`px-3 py-1 text-sm rounded-md ${
                                activeFilter === 'all'
                                    ? 'bg-teal-600 text-white'
                                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                            }`}
                        >
                            All ({userMeetings.length})
                        </button>
                        <button
                            onClick={() => setActiveFilter('pending')}
                            className={`px-3 py-1 text-sm rounded-md flex items-center ${
                                activeFilter === 'pending'
                                    ? 'bg-yellow-500 text-white'
                                    : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                            }`}
                        >
                            Pending ({statusCounts.pending || 0})
                        </button>
                        <button
                            onClick={() => setActiveFilter('accepted')}
                            className={`px-3 py-1 text-sm rounded-md flex items-center ${
                                activeFilter === 'accepted'
                                    ? 'bg-green-600 text-white'
                                    : 'bg-green-100 text-green-800 hover:bg-green-200'
                            }`}
                        >
                            Accepted ({statusCounts.accepted || 0})
                        </button>
                        <button
                            onClick={() => setActiveFilter('rejected')}
                            className={`px-3 py-1 text-sm rounded-md flex items-center ${
                                activeFilter === 'rejected'
                                    ? 'bg-red-600 text-white'
                                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                            }`}
                        >
                            Declined ({statusCounts.rejected || 0})
                        </button>
                    </div>
                </div>

                <button
                    onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md text-sm flex items-center whitespace-nowrap"
                >
                    {sortOrder === 'desc' ? (
                        <>
                            <ChevronDown className="h-4 w-4 mr-1" />
                            Newest First
                        </>
                    ) : (
                        <>
                            <ChevronUp className="h-4 w-4 mr-1" />
                            Oldest First
                        </>
                    )}
                </button>
            </div>

            {/* Meetings List */}
            {isLoading ? (
                <div className="flex justify-center items-center py-8">
                    <Loader className="h-8 w-8 text-teal-600 animate-spin" />
                </div>
            ) : filteredMeetings.length === 0 ? (
                <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">
                        {userMeetings.length === 0
                            ? "No scheduled meetings found"
                            : "No meetings match your search"}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredMeetings.map((meeting) => (
                        <div
                            key={meeting._id}
                            className={`border rounded-lg overflow-hidden transition-all duration-200 ${
                                meeting.status === 'pending'
                                    ? 'border-yellow-300 bg-yellow-50'
                                    : meeting.status === 'accepted'
                                        ? 'border-green-300 bg-green-50'
                                        : 'border-red-300 bg-red-50'
                            }`}
                        >
                            {/* Meeting Header - Always Visible */}
                            <div
                                onClick={() => toggleMeetingExpansion(meeting._id)}
                                className="p-4 cursor-pointer"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center">
                                        <Calendar className="h-5 w-5 text-teal-600 mr-2" />
                                        <h3 className="font-semibold text-gray-900">
                                            Meeting for {meeting.petName}
                                        </h3>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {getStatusBadge(meeting.status)}
                                        {expandedMeetingId === meeting._id ? (
                                            <ChevronUp className="h-5 w-5 text-gray-500" />
                                        ) : (
                                            <ChevronDown className="h-5 w-5 text-gray-500" />
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
                                    <div className="flex items-center">
                                        <Clock className="h-4 w-4 text-gray-500 mr-1" />
                                        <span>{formatDate(meeting.scheduledDate)}, {formatTime(meeting.scheduledTime)}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <MapPin className="h-4 w-4 text-gray-500 mr-1" />
                                        <span className="truncate max-w-[200px]">{meeting.location}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Meeting Details */}
                            {expandedMeetingId === meeting._id && (
                                <div className="bg-white p-4 border-t border-gray-200">
                                    {meeting.adminMessage && (
                                        <div className="mb-4">
                                            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                                                <MessageSquare className="h-4 w-4 mr-1 text-teal-600" />
                                                Message
                                            </h4>
                                            <div className="bg-gray-50 p-3 rounded-md text-gray-700">
                                                {meeting.adminMessage}
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Meeting Details</h4>
                                            <ul className="space-y-2 text-sm text-gray-600">
                                                <li className="flex items-start">
                                                    <span className="font-medium w-24">Pet:</span>
                                                    <span>{meeting.petName}</span>
                                                </li>
                                                <li className="flex items-start">
                                                    <span className="font-medium w-24">Date:</span>
                                                    <span>{formatDate(meeting.scheduledDate)}</span>
                                                </li>
                                                <li className="flex items-start">
                                                    <span className="font-medium w-24">Time:</span>
                                                    <span>{formatTime(meeting.scheduledTime)}</span>
                                                </li>
                                                <li className="flex items-start">
                                                    <span className="font-medium w-24">Location:</span>
                                                    <span>{meeting.location}</span>
                                                </li>
                                            </ul>
                                        </div>

                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Status Information</h4>
                                            <ul className="space-y-2 text-sm text-gray-600">
                                                <li className="flex items-start">
                                                    <span className="font-medium w-24">Status:</span>
                                                    <span>{getStatusBadge(meeting.status)}</span>
                                                </li>
                                                <li className="flex items-start">
                                                    <span className="font-medium w-24">Created:</span>
                                                    <span>{formatDate(meeting.createdAt)}</span>
                                                </li>
                                                {meeting.responseDate && (
                                                    <li className="flex items-start">
                                                        <span className="font-medium w-24">Responded:</span>
                                                        <span>{formatDate(meeting.responseDate)}</span>
                                                    </li>
                                                )}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </motion.div>
    );
};

export default MeetingsTab;