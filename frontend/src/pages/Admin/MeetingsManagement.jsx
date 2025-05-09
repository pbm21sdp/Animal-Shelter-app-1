// components/Admin/MeetingsManagement.jsx
import React, { useState, useEffect } from 'react';
import { useMeetingStore } from '../../store/meetingStore';
import {
    Calendar,
    Clock,
    MapPin,
    Eye,
    Edit,
    Trash2,
    Search,
    Filter,
    RefreshCw,
    Check,
    X,
    CheckCircle,
    XCircle,
    AlertTriangle,
    AlertCircle
} from 'lucide-react';
import AdminTable from './shared/AdminTable';
import AdminPagination from './shared/AdminPagination';
import AdminModal from './shared/AdminModal';
import AdminSearchBar from './shared/AdminSearchBar';

const MeetingsManagement = () => {
    const {
        meetings,
        selectedMeeting,
        isLoading,
        error,
        success,
        getAllMeetings,
        getMeetingDetails,
        updateMeeting,
        deleteMeeting,
        clearSelectedMeeting,
        clearNotifications
    } = useMeetingStore();

    // State
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredMeetings, setFilteredMeetings] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [meetingsPerPage] = useState(10);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        status: 'all',
    });
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [editForm, setEditForm] = useState({
        scheduledDate: '',
        scheduledTime: '',
        location: '',
        notes: '',
        adminMessage: '',
        status: ''
    });

    // Fetch meetings on component mount
    useEffect(() => {
        getAllMeetings(filters);
    }, [getAllMeetings, filters]);

    // Filter meetings when search term or meetings change
    useEffect(() => {
        if (meetings && meetings.length > 0) {
            setFilteredMeetings(
                meetings.filter(meeting => {
                    const userInfo = meeting.userId || {};

                    return (
                        meeting.petName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        meeting.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        userInfo.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        userInfo.email?.toLowerCase().includes(searchTerm.toLowerCase())
                    );
                })
            );
        } else {
            setFilteredMeetings([]);
        }
    }, [searchTerm, meetings]);

    // Reset pagination when filtered meetings change
    useEffect(() => {
        setCurrentPage(1);
    }, [filteredMeetings]);

    // Format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Format time
    const formatTime = (timeString) => {
        return timeString || 'Not specified';
    };

    // Handle filter changes
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Apply filters
    const applyFilters = () => {
        getAllMeetings(filters);
        setShowFilters(false);
    };

    // Reset filters
    const resetFilters = () => {
        setFilters({
            status: 'all'
        });
        getAllMeetings({ status: 'all' });
        setShowFilters(false);
    };

    // Handle row click to view details
    const handleRowClick = async (meeting) => {
        await getMeetingDetails(meeting._id);
        setShowDetailsModal(true);
    };

    // Handle edit click
    const handleEditClick = async (meeting, e) => {
        if (e) e.stopPropagation();

        const details = await getMeetingDetails(meeting._id);

        if (details && details.meeting) {
            const meetingData = details.meeting;
            // Format date for input type="date"
            const formattedDate = meetingData.scheduledDate
                ? new Date(meetingData.scheduledDate).toISOString().split('T')[0]
                : '';

            setEditForm({
                scheduledDate: formattedDate,
                scheduledTime: meetingData.scheduledTime || '',
                location: meetingData.location || '',
                notes: meetingData.notes || '',
                adminMessage: meetingData.adminMessage || '',
                status: meetingData.status || 'pending'
            });

            setShowEditModal(true);
        }
    };

    // Handle delete click
    const handleDeleteClick = async (meeting, e) => {
        if (e) e.stopPropagation();
        await getMeetingDetails(meeting._id);
        setShowDeleteModal(true);
    };

    // Handle edit form change
    const handleEditFormChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Update meeting
    const handleUpdateMeeting = async (e) => {
        e.preventDefault();

        if (selectedMeeting) {
            const result = await updateMeeting(selectedMeeting._id, editForm);

            if (result.success) {
                setShowEditModal(false);
                await getAllMeetings(filters);
            }
        }
    };

    // Delete meeting
    const handleDeleteMeeting = async () => {
        if (selectedMeeting) {
            const result = await deleteMeeting(selectedMeeting._id);

            if (result.success) {
                setShowDeleteModal(false);
                await getAllMeetings(filters);
            }
        }
    };

    // Status badge component
    const StatusBadge = ({ status }) => {
        const statusColors = {
            pending: 'bg-yellow-100 text-yellow-800',
            accepted: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800'
        };

        const statusText = {
            pending: 'Pending',
            accepted: 'Accepted',
            rejected: 'Rejected'
        };

        const statusIcons = {
            pending: <AlertTriangle className="h-4 w-4 mr-1" />,
            accepted: <CheckCircle className="h-4 w-4 mr-1" />,
            rejected: <XCircle className="h-4 w-4 mr-1" />
        };

        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {statusIcons[status]}
                {statusText[status] || status}
      </span>
        );
    };

    // Pagination logic
    const indexOfLastMeeting = currentPage * meetingsPerPage;
    const indexOfFirstMeeting = indexOfLastMeeting - meetingsPerPage;
    const currentMeetings = filteredMeetings.slice(indexOfFirstMeeting, indexOfLastMeeting);

    // Table columns
    const columns = [
        {
            header: 'Date',
            accessor: 'scheduledDate',
            render: (meeting) => (
                <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-500 mr-1" />
                    <span className="text-sm text-gray-900">{formatDate(meeting.scheduledDate)}</span>
                </div>
            )
        },
        {
            header: 'Time',
            accessor: 'scheduledTime',
            render: (meeting) => (
                <div className="flex items-center">
                    <Clock className="h-4 w-4 text-gray-500 mr-1" />
                    <span className="text-sm text-gray-900">{formatTime(meeting.scheduledTime)}</span>
                </div>
            )
        },
        {
            header: 'Pet',
            accessor: 'petName',
            render: (meeting) => (
                <div className="text-sm font-medium text-gray-900">{meeting.petName}</div>
            )
        },
        {
            header: 'Applicant',
            accessor: 'userId',
            render: (meeting) => (
                <div>
                    <div className="text-sm font-medium text-gray-900">
                        {meeting.userId?.name || 'Unknown'}
                    </div>
                    <div className="text-xs text-gray-500">
                        {meeting.userId?.email || ''}
                    </div>
                </div>
            )
        },
        {
            header: 'Location',
            accessor: 'location',
            render: (meeting) => (
                <div className="flex items-center">
                    <MapPin className="h-4 w-4 text-gray-500 mr-1" />
                    <span className="text-sm text-gray-900 truncate max-w-[150px]">{meeting.location}</span>
                </div>
            )
        },
        {
            header: 'Status',
            accessor: 'status',
            render: (meeting) => <StatusBadge status={meeting.status} />
        },
        {
            header: 'Actions',
            accessor: 'actions',
            render: (meeting) => (
                <div className="flex space-x-2">
                    <button
                        onClick={(e) => handleEditClick(meeting, e)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="Edit Meeting"
                    >
                        <Edit className="h-4 w-4" />
                    </button>
                    <button
                        onClick={(e) => handleDeleteClick(meeting, e)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="Delete Meeting"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="container mx-auto px-4 py-6">
            <div className="flex flex-wrap justify-between items-center mb-6">
                <h2 className="text-2xl font-bold mb-4 sm:mb-0">Manage Scheduled Meetings</h2>
                <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
                    <AdminSearchBar
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search meetings..."
                    />
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md flex items-center w-full sm:w-auto justify-center"
                    >
                        <Filter className="h-5 w-5 mr-1" />
                        Filters
                    </button>
                    <button
                        onClick={() => getAllMeetings(filters)}
                        className="bg-tealcustom hover:bg-teal-700 text-white px-4 py-2 rounded-md flex items-center w-full sm:w-auto justify-center"
                    >
                        <RefreshCw className="h-5 w-5 mr-1" />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Notifications */}
            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600">
                    <AlertCircle className="h-5 w-5" />
                    {error}
                    <button
                        onClick={clearNotifications}
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
                        onClick={clearNotifications}
                        className="ml-auto text-green-500 hover:text-green-700"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* Filter Panel */}
            {showFilters && (
                <div className="bg-white shadow-md rounded-lg p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-gray-700 text-sm font-medium mb-1">Status</label>
                            <select
                                name="status"
                                value={filters.status}
                                onChange={handleFilterChange}
                                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                            >
                                <option value="all">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="accepted">Accepted</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end space-x-3">
                        <button
                            onClick={resetFilters}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md text-sm"
                        >
                            Reset
                        </button>
                        <button
                            onClick={applyFilters}
                            className="px-4 py-2 bg-tealcustom hover:bg-teal-700 text-white rounded-md text-sm"
                        >
                            Apply Filters
                        </button>
                    </div>
                </div>
            )}

            {/* Meetings Table */}
            <AdminTable
                columns={columns}
                data={currentMeetings}
                isLoading={isLoading}
                emptyMessage="No meetings found"
                onRowClick={handleRowClick}
            />

            {/* Pagination */}
            <AdminPagination
                itemsPerPage={meetingsPerPage}
                totalItems={filteredMeetings.length}
                currentPage={currentPage}
                paginate={setCurrentPage}
            />

            {/* Meeting Details Modal */}
            <AdminModal
                isOpen={showDetailsModal}
                onClose={() => {
                    setShowDetailsModal(false);
                    clearSelectedMeeting();
                }}
                title="Meeting Details"
                size="lg"
            >
                {selectedMeeting ? (
                    <div className="p-6">
                        {/* Status Banner */}
                        <div className={`mb-6 px-4 py-2 rounded-md flex justify-between items-center ${
                            selectedMeeting.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                selectedMeeting.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                    'bg-red-100 text-red-800'
                        }`}>
                            <div className="flex items-center">
                <span className="font-medium flex items-center">
                  {selectedMeeting.status === 'pending' ? <AlertTriangle className="h-4 w-4 mr-1" /> :
                      selectedMeeting.status === 'accepted' ? <CheckCircle className="h-4 w-4 mr-1" /> :
                          <XCircle className="h-4 w-4 mr-1" />}
                    Status: {selectedMeeting.status === 'pending' ? 'Pending' :
                    selectedMeeting.status === 'accepted' ? 'Accepted' : 'Rejected'}
                </span>
                            </div>
                            <div className="text-sm">
                                Created: {formatDate(selectedMeeting.createdAt)}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <h3 className="text-lg font-semibold mb-3">Meeting Information</h3>
                                <div className="bg-gray-50 rounded-md p-4 space-y-3">
                                    <div className="flex items-start">
                                        <Calendar className="h-5 w-5 text-teal-600 mr-2 mt-0.5" />
                                        <div>
                                            <div className="text-sm font-medium text-gray-700">Date</div>
                                            <div className="text-gray-900">{formatDate(selectedMeeting.scheduledDate)}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-start">
                                        <Clock className="h-5 w-5 text-teal-600 mr-2 mt-0.5" />
                                        <div>
                                            <div className="text-sm font-medium text-gray-700">Time</div>
                                            <div className="text-gray-900">{formatTime(selectedMeeting.scheduledTime)}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-start">
                                        <MapPin className="h-5 w-5 text-teal-600 mr-2 mt-0.5" />
                                        <div>
                                            <div className="text-sm font-medium text-gray-700">Location</div>
                                            <div className="text-gray-900">{selectedMeeting.location}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold mb-3">Applicant Information</h3>
                                <div className="bg-gray-50 rounded-md p-4">
                                    <div className="mb-2">
                                        <span className="text-gray-600 text-sm">Name:</span>
                                        <span className="ml-2 text-gray-900">
                      {selectedMeeting.userId?.name || 'Unknown'}
                    </span>
                                    </div>
                                    <div className="mb-2">
                                        <span className="text-gray-600 text-sm">Email:</span>
                                        <span className="ml-2 text-gray-900">
                      {selectedMeeting.userId?.email || 'Unknown'}
                    </span>
                                    </div>
                                    <div className="mb-2">
                                        <span className="text-gray-600 text-sm">Pet:</span>
                                        <span className="ml-2 text-gray-900">{selectedMeeting.petName}</span>
                                    </div>
                                    <div className="mb-2">
                                        <span className="text-gray-600 text-sm">Response:</span>
                                        <span className="ml-2">
                      {selectedMeeting.status === 'pending' ? (
                          <span className="text-yellow-600">Awaiting response</span>
                      ) : selectedMeeting.status === 'accepted' ? (
                          <span className="text-green-600">Accepted on {formatDate(selectedMeeting.responseDate)}</span>
                      ) : (
                          <span className="text-red-600">Declined on {formatDate(selectedMeeting.responseDate)}</span>
                      )}
                    </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-3">Message to Applicant</h3>
                            <div className="bg-gray-50 rounded-md p-4">
                                <p className="text-gray-900">{selectedMeeting.adminMessage || 'No message provided'}</p>
                            </div>
                        </div>

                        {selectedMeeting.notes && (
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold mb-3">Admin Notes</h3>
                                <div className="bg-gray-50 rounded-md p-4">
                                    <p className="text-gray-900">{selectedMeeting.notes}</p>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowDetailsModal(false);
                                    clearSelectedMeeting();
                                }}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => {
                                    setShowDetailsModal(false);
                                    handleEditClick(selectedMeeting);
                                }}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center"
                            >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="p-6 text-center">
                        <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <p>Loading meeting details...</p>
                    </div>
                )}
            </AdminModal>

            {/* Edit Meeting Modal */}
            <AdminModal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    clearSelectedMeeting();
                }}
                title="Edit Meeting"
                size="md"
            >
                {selectedMeeting ? (
                    <form onSubmit={handleUpdateMeeting} className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Date
                                </label>
                                <input
                                    type="date"
                                    name="scheduledDate"
                                    value={editForm.scheduledDate}
                                    onChange={handleEditFormChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Time
                                </label>
                                <input
                                    type="time"
                                    name="scheduledTime"
                                    value={editForm.scheduledTime}
                                    onChange={handleEditFormChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                                />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Location
                            </label>
                            <input
                                type="text"
                                name="location"
                                value={editForm.location}
                                onChange={handleEditFormChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Message to Applicant
                            </label>
                            <textarea
                                name="adminMessage"
                                value={editForm.adminMessage}
                                onChange={handleEditFormChange}
                                rows="3"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                            ></textarea>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Admin Notes
                            </label>
                            <textarea
                                name="notes"
                                value={editForm.notes}
                                onChange={handleEditFormChange}
                                rows="2"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                            ></textarea>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Status
                            </label>
                            <select
                                name="status"
                                value={editForm.status}
                                onChange={handleEditFormChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                            >
                                <option value="pending">Pending</option>
                                <option value="accepted">Accepted</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowEditModal(false);
                                    clearSelectedMeeting();
                                }}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Updating...' : (
                                    <>
                                        <Check className="h-4 w-4 mr-2" />
                                        Update Meeting
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="p-6 text-center">
                        <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <p>Loading meeting details...</p>
                    </div>
                )}
            </AdminModal>

            {/* Delete Confirmation Modal */}
            <AdminModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    clearSelectedMeeting();
                }}
                title="Delete Meeting"
                size="sm"
            >
                {selectedMeeting ? (
                    <div className="p-6">
                        <div className="mb-6">
                            <AlertCircle className="h-12 w-12 mx-auto text-red-400 mb-4" />
                            <p className="text-center text-gray-700">
                                Are you sure you want to delete the meeting for <span className="font-semibold">{selectedMeeting.petName}</span>?
                            </p>
                            <p className="text-center text-gray-500 text-sm mt-2">
                                This action cannot be undone.
                            </p>
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    clearSelectedMeeting();
                                }}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteMeeting}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md flex items-center"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Deleting...' : (
                                    <>
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="p-6 text-center">
                        <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <p>Loading meeting details...</p>
                    </div>
                )}
            </AdminModal>
        </div>
    );
};

export default MeetingsManagement