import React, { useState, useEffect } from 'react';
import { useAdoptionStore } from '../../store/adoptionStore';
import {
    Check, X, Eye, RefreshCw, Filter, Search, Users,
    PawPrint, Edit, Trash2, AlertCircle, User, Home,
    MessageSquare, Clock, ArrowUp, ArrowDown, CheckCircle,
    XCircle, AlertTriangle, ChevronRight, ExternalLink, BarChart3
} from 'lucide-react';
import AdminTable from './shared/AdminTable';
import AdminPagination from './shared/AdminPagination';
import AdminModal from './shared/AdminModal';
import AdminSearchBar from './shared/AdminSearchBar';

const AdoptionsManagement = () => {
    const {
        adoptions,
        selectedAdoption,
        isLoading,
        error,
        getAllAdoptions,
        getAdoptionDetails,
        updateAdoptionStatus,
        deleteAdoption,
        clearSelectedAdoption
    } = useAdoptionStore();

    // State
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredAdoptions, setFilteredAdoptions] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [adoptionsPerPage] = useState(10);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        status: 'all',
        petType: 'all',
        sort: 'newest',
        housingType: 'all'
    });
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [statusToUpdate, setStatusToUpdate] = useState('');
    const [adminNotes, setAdminNotes] = useState('');
    const [showStats, setShowStats] = useState(false);

    // State to hold user details
    const [userDetails, setUserDetails] = useState({});

    // Fetch adoptions on component mount
    useEffect(() => {
        getAllAdoptions(filters);
    }, [getAllAdoptions, filters]);

    // Function to get user details
    const getUserDetails = async (userId) => {
        try {
            const response = await axios.get(`http://localhost:5000/api/users/admin/${userId}`,
                { withCredentials: true }
            );

            if (response.data.success) {
                setUserDetails(prev => ({
                    ...prev,
                    [userId]: response.data.user
                }));

                // Update the selected adoption if this is the user we're looking at
                if (selectedAdoption && selectedAdoption.user === userId) {
                    setSelectedAdoption(prev => ({
                        ...prev,
                        user: {
                            ...response.data.user,
                            _id: userId
                        }
                    }));
                }
            }
        } catch (error) {
            console.error('Error fetching user details:', error);
        }
    };

    // Filter adoptions when search term or adoptions change
    useEffect(() => {
        if (adoptions && adoptions.length > 0) {
            setFilteredAdoptions(
                adoptions.filter(adoption => {
                    // Get user details from our cached state if available
                    const userInfo = typeof adoption.user === 'string' && userDetails[adoption.user]
                        ? userDetails[adoption.user]
                        : adoption.user;

                    return (
                        adoption.petName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        adoption.petType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        adoption.petBreed?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        userInfo?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        userInfo?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        adoption.livingArrangement?.toLowerCase().includes(searchTerm.toLowerCase())
                    );
                })
            );
        } else {
            setFilteredAdoptions([]);
        }
    }, [searchTerm, adoptions, userDetails]);

    // Reset pagination when filtered adoptions change
    useEffect(() => {
        setCurrentPage(1);
    }, [filteredAdoptions]);

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
        getAllAdoptions(filters);
        setShowFilters(false);
    };

    // Reset filters
    const resetFilters = () => {
        setFilters({
            status: 'all',
            petType: 'all',
            sort: 'newest',
            housingType: 'all'
        });
        getAllAdoptions({
            status: 'all',
            petType: 'all',
            sort: 'newest',
            housingType: 'all'
        });
        setShowFilters(false);
    };

    // Format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Handle row click to view details
    const handleRowClick = async (adoption) => {
        await getAdoptionDetails(adoption._id);
        setShowDetailsModal(true);
    };

    // Handle status update click
    const handleStatusUpdateClick = (adoption, e) => {
        if (e) {
            e.stopPropagation();
        }
        getAdoptionDetails(adoption._id).then(() => {
            setStatusToUpdate(adoption.status);
            setAdminNotes(adoption.adminNotes || '');
            setShowStatusModal(true);
        });
    };

    // Handle delete click
    const handleDeleteClick = (adoption, e) => {
        if (e) {
            e.stopPropagation();
        }
        getAdoptionDetails(adoption._id).then(() => {
            setShowDeleteModal(true);
        });
    };

    // Update status
    const handleStatusUpdate = async () => {
        if (selectedAdoption) {
            const result = await updateAdoptionStatus(selectedAdoption._id, {
                status: statusToUpdate,
                adminNotes: adminNotes
            });

            if (result.success) {
                setShowStatusModal(false);
                getAllAdoptions(filters);
            }
        }
    };

    // Delete adoption
    const handleDelete = async () => {
        if (selectedAdoption) {
            const result = await deleteAdoption(selectedAdoption._id);

            if (result.success) {
                setShowDeleteModal(false);
                getAllAdoptions(filters);
                clearSelectedAdoption();
            }
        }
    };

    // Close details modal
    const closeDetailsModal = () => {
        setShowDetailsModal(false);
        clearSelectedAdoption();
    };

    // Close status modal
    const closeStatusModal = () => {
        setShowStatusModal(false);
    };

    // Close delete modal
    const closeDeleteModal = () => {
        setShowDeleteModal(false);
    };

    // Toggle statistics view
    const toggleStats = () => {
        setShowStats(!showStats);
    };

    // Status badge component
    const StatusBadge = ({ status }) => {
        const statusColors = {
            pending: 'bg-yellow-100 text-yellow-800',
            in_review: 'bg-blue-100 text-blue-800',
            approved: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
            unavailable: 'bg-gray-100 text-gray-800' // Add this for unavailable pets
        };

        const statusText = {
            pending: 'Pending',
            in_review: 'In Review',
            approved: 'Approved',
            rejected: 'Rejected',
            unavailable: 'Unavailable' // Add this for unavailable pets
        };

        const statusIcons = {
            pending: <Clock className="h-4 w-4 mr-1" />,
            in_review: <AlertTriangle className="h-4 w-4 mr-1" />,
            approved: <CheckCircle className="h-4 w-4 mr-1" />,
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
    const indexOfLastAdoption = currentPage * adoptionsPerPage;
    const indexOfFirstAdoption = indexOfLastAdoption - adoptionsPerPage;
    const currentAdoptions = filteredAdoptions.slice(indexOfFirstAdoption, indexOfLastAdoption);

    // Calculate statistics
    const stats = {
        total: filteredAdoptions.length,
        pending: filteredAdoptions.filter(a => a.status === 'pending').length,
        inReview: filteredAdoptions.filter(a => a.status === 'in_review').length,
        approved: filteredAdoptions.filter(a => a.status === 'approved').length,
        rejected: filteredAdoptions.filter(a => a.status === 'rejected').length,
        // Count by pet type
        petTypes: filteredAdoptions.reduce((acc, adoption) => {
            const type = adoption.petType || 'unknown';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {}),
        // Count by housing type
        housingTypes: filteredAdoptions.reduce((acc, adoption) => {
            const type = adoption.livingArrangement || 'unknown';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {})
    };

    // Table columns
    const columns = [
        {
            header: 'Application Date',
            accessor: 'applicationDate',
            render: (adoption) => (
                <div className="flex items-center">
                    <span className="text-sm text-gray-900">{formatDate(adoption.createdAt)}</span>
                </div>
            )
        },
        {
            header: 'Pet',
            accessor: 'pet',
            render: (adoption) => (
                <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 bg-teal-100 rounded-full flex items-center justify-center mr-2">
                        <PawPrint className="h-4 w-4 text-tealcustom" />
                    </div>
                    <div>
                        <div className="font-medium text-gray-900">{adoption.petName}</div>
                        <div className="text-xs text-gray-500">{adoption.petType} - {adoption.petBreed || 'Unknown breed'}</div>
                    </div>
                </div>
            )
        },
        {
            header: 'Applicant',
            accessor: 'user',
            render: (adoption) => (
                <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center mr-2">
                        <Users className="h-4 w-4 text-gray-500" />
                    </div>
                    <div>
                        <div className="font-medium text-gray-900">{adoption.user?.name || 'Unknown'}</div>
                        <div className="text-xs text-gray-500">{adoption.user?.email}</div>
                    </div>
                </div>
            )
        },
        {
            header: 'Living Arrangement',
            accessor: 'livingArrangement',
            render: (adoption) => (
                <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center mr-2">
                        <Home className="h-4 w-4 text-gray-500" />
                    </div>
                    <div>
                        <div className="text-sm text-gray-900">{adoption.livingArrangement || 'Not specified'}</div>
                        <div className="text-xs text-gray-500">
                            {adoption.hasChildren ? 'Has children' : 'No children'} •
                            {adoption.hasOtherPets ? ' Has other pets' : ' No other pets'}
                        </div>
                    </div>
                </div>
            )
        },
        {
            header: 'Status',
            accessor: 'status',
            render: (adoption) => <StatusBadge status={adoption.status} />
        },
        {
            header: 'Actions',
            accessor: 'actions',
            render: (adoption) => (
                <div className="flex space-x-2">
                    <button
                        onClick={(e) => handleStatusUpdateClick(adoption, e)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="Update Status"
                    >
                        <Edit className="h-4 w-4" />
                    </button>
                    <button
                        onClick={(e) => handleDeleteClick(adoption, e)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="Delete Application"
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
                <h2 className="text-2xl font-bold mb-4 sm:mb-0">Manage Adoptions</h2>
                <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
                    <AdminSearchBar
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search adoptions..."
                    />
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md flex items-center w-full sm:w-auto justify-center"
                    >
                        <Filter className="h-5 w-5 mr-1" />
                        Filters
                    </button>
                    <button
                        onClick={toggleStats}
                        className="bg-indigo-100 hover:bg-indigo-200 text-indigo-800 px-4 py-2 rounded-md flex items-center w-full sm:w-auto justify-center"
                    >
                        <BarChart3 className="h-5 w-5 mr-1" />
                        {showStats ? 'Hide Stats' : 'Show Stats'}
                    </button>
                    <button
                        onClick={() => getAllAdoptions(filters)}
                        className="bg-tealcustom hover:bg-teal-700 text-white px-4 py-2 rounded-md flex items-center w-full sm:w-auto justify-center"
                    >
                        <RefreshCw className="h-5 w-5 mr-1" />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Statistics Panel */}
            {showStats && (
                <div className="bg-white shadow-md rounded-lg p-4 mb-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <BarChart3 className="h-5 w-5 mr-2 text-tealcustom" />
                        Adoption Statistics
                    </h3>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <div className="text-blue-500 font-semibold">{stats.total}</div>
                            <div className="text-sm text-gray-600">Total Applications</div>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-lg">
                            <div className="text-yellow-500 font-semibold">{stats.pending + stats.inReview}</div>
                            <div className="text-sm text-gray-600">Pending/In Review</div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                            <div className="text-green-500 font-semibold">{stats.approved}</div>
                            <div className="text-sm text-gray-600">Approved</div>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg">
                            <div className="text-red-500 font-semibold">{stats.rejected}</div>
                            <div className="text-sm text-gray-600">Rejected</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Pet Types */}
                        <div>
                            <h4 className="text-sm font-medium text-gray-500 uppercase mb-3">By Pet Type</h4>
                            <div className="space-y-4">
                                {Object.entries(stats.petTypes)
                                    .sort((a, b) => b[1] - a[1])
                                    .slice(0, 4)
                                    .map(([type, count], index) => (
                                        <div key={index}>
                                            <div className="flex justify-between mb-1">
                                                <span className="text-sm font-medium">
                                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                                </span>
                                                <span className="text-sm text-gray-500">
                                                    {count} ({Math.round((count / stats.total) * 100)}%)
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-tealcustom h-2 rounded-full"
                                                    style={{ width: `${Math.round((count / stats.total) * 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>

                        {/* Housing Types */}
                        <div>
                            <h4 className="text-sm font-medium text-gray-500 uppercase mb-3">By Living Arrangement</h4>
                            <div className="space-y-4">
                                {Object.entries(stats.housingTypes)
                                    .sort((a, b) => b[1] - a[1])
                                    .slice(0, 4)
                                    .map(([type, count], index) => (
                                        <div key={index}>
                                            <div className="flex justify-between mb-1">
                                                <span className="text-sm font-medium">
                                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                                </span>
                                                <span className="text-sm text-gray-500">
                                                    {count} ({Math.round((count / stats.total) * 100)}%)
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-indigo-500 h-2 rounded-full"
                                                    style={{ width: `${Math.round((count / stats.total) * 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filter Panel */}
            {showFilters && (
                <div className="bg-white shadow-md rounded-lg p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                                <option value="in_review">In Review</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-700 text-sm font-medium mb-1">Pet Type</label>
                            <select
                                name="petType"
                                value={filters.petType}
                                onChange={handleFilterChange}
                                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                            >
                                <option value="all">All Types</option>
                                <option value="dog">Dogs</option>
                                <option value="cat">Cats</option>
                                <option value="bird">Birds</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-700 text-sm font-medium mb-1">Housing Type</label>
                            <select
                                name="housingType"
                                value={filters.housingType}
                                onChange={handleFilterChange}
                                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                            >
                                <option value="all">All Housing Types</option>
                                <option value="house">House</option>
                                <option value="apartment">Apartment</option>
                                <option value="condo">Condo</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-700 text-sm font-medium mb-1">Sort By</label>
                            <select
                                name="sort"
                                value={filters.sort}
                                onChange={handleFilterChange}
                                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                            >
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="status">By Status</option>
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

            {/* Error Display */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {/* Adoptions Table */}
            <AdminTable
                columns={columns}
                data={currentAdoptions}
                isLoading={isLoading}
                emptyMessage="No adoption applications found"
                onRowClick={handleRowClick}
            />

            {/* Pagination */}
            <AdminPagination
                itemsPerPage={adoptionsPerPage}
                totalItems={filteredAdoptions.length}
                currentPage={currentPage}
                paginate={setCurrentPage}
            />

            {/* Adoption Details Modal */}
            <AdminModal
                isOpen={showDetailsModal}
                onClose={closeDetailsModal}
                title="Adoption Application Details"
                size="lg"
            >
                {selectedAdoption ? (
                    <div className="p-6">
                        {/* Status Banner */}
                        <div className={`mb-6 px-4 py-2 rounded-md flex justify-between items-center ${
                            selectedAdoption.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                selectedAdoption.status === 'in_review' ? 'bg-blue-100 text-blue-800' :
                                    selectedAdoption.status === 'approved' ? 'bg-green-100 text-green-800' :
                                        'bg-red-100 text-red-800'
                        }`}>
                            <div className="flex items-center">
                                <span className="font-medium flex items-center">
                                    {selectedAdoption.status === 'pending' ? <Clock className="h-4 w-4 mr-1" /> :
                                        selectedAdoption.status === 'in_review' ? <AlertTriangle className="h-4 w-4 mr-1" /> :
                                            selectedAdoption.status === 'approved' ? <CheckCircle className="h-4 w-4 mr-1" /> :
                                                <XCircle className="h-4 w-4 mr-1" />}
                                    Status: {selectedAdoption.status === 'pending' ? 'Pending' :
                                    selectedAdoption.status === 'in_review' ? 'In Review' :
                                        selectedAdoption.status === 'approved' ? 'Approved' : 'Rejected'}
                                </span>
                            </div>
                            <div className="text-sm">
                                Application Date: {formatDate(selectedAdoption.createdAt)}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            {/* Pet Information */}
                            <div>
                                <h3 className="text-lg font-semibold mb-3 flex items-center">
                                    <PawPrint className="h-5 w-5 mr-2 text-tealcustom" />
                                    Pet Information
                                </h3>
                                <div className="bg-gray-50 rounded-md p-4">
                                    {selectedAdoption.petId && (
                                        <div className="mb-2">
                                            <span className="text-gray-600 text-sm">Pet ID:</span>
                                            <span className="ml-2 text-gray-900">{selectedAdoption.petId}</span>
                                        </div>
                                    )}
                                    <div className="mb-2">
                                        <span className="text-gray-600 text-sm">Name:</span>
                                        <span className="ml-2 text-gray-900">{selectedAdoption.petName}</span>
                                    </div>
                                    <div className="mb-2">
                                        <span className="text-gray-600 text-sm">Type:</span>
                                        <span className="ml-2 text-gray-900">{selectedAdoption.petType}</span>
                                    </div>
                                    {selectedAdoption.petBreed && (
                                        <div className="mb-2">
                                            <span className="text-gray-600 text-sm">Breed:</span>
                                            <span className="ml-2 text-gray-900">{selectedAdoption.petBreed}</span>
                                        </div>
                                    )}
                                    {selectedAdoption.petId && (
                                        <div className="mt-3">
                                            <button
                                                onClick={() => window.open(`/pet/${selectedAdoption.petId}`, '_blank')}
                                                className="text-tealcustom hover:text-teal-700 flex items-center text-sm"
                                            >
                                                <ExternalLink className="h-4 w-4 mr-1" />
                                                View Pet Details
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Applicant Information */}
                            <div>
                                <h3 className="text-lg font-semibold mb-3 flex items-center">
                                    <User className="h-5 w-5 mr-2 text-tealcustom" />
                                    Applicant Information
                                </h3>
                                <div className="bg-gray-50 rounded-md p-4">
                                    <div className="mb-2">
                                        <span className="text-gray-600 text-sm">Name:</span>
                                        <span className="ml-2 text-gray-900">
                                            {selectedAdoption.user?.name ||
                                                selectedAdoption.fullName ||
                                                (typeof selectedAdoption.user === 'string' ? 'Loading user information...' : 'Unknown')}
                                        </span>
                                    </div>
                                    <div className="mb-2">
                                        <span className="text-gray-600 text-sm">Email:</span>
                                        <span className="ml-2 text-gray-900">
                                            {selectedAdoption.user?.email ||
                                                selectedAdoption.email ||
                                                (typeof selectedAdoption.user === 'string' ? 'Loading user information...' : 'Not provided')}
                                        </span>
                                    </div>
                                    {selectedAdoption.phone && (
                                        <div className="mb-2">
                                            <span className="text-gray-600 text-sm">Phone:</span>
                                            <span className="ml-2 text-gray-900">{selectedAdoption.phone}</span>
                                        </div>
                                    )}
                                    <div className="mb-2">
                                        <span className="text-gray-600 text-sm">Application Date:</span>
                                        <span className="ml-2 text-gray-900">{formatDate(selectedAdoption.applicationDate || selectedAdoption.createdAt)}</span>
                                    </div>
                                    {typeof selectedAdoption.user === 'string' && (
                                        <div className="mt-2 text-sm text-blue-600">
                                            <button
                                                onClick={() => getUserDetails(selectedAdoption.user)}
                                                className="flex items-center"
                                            >
                                                <RefreshCw className="h-4 w-4 mr-1" />
                                                Load complete user information
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-3 flex items-center">
                                <Home className="h-5 w-5 mr-2 text-tealcustom" />
                                Living Situation
                            </h3>
                            <div className="bg-gray-50 rounded-md p-4">
                                {selectedAdoption.livingArrangement && (
                                    <div className="mb-4">
                                        <div className="text-gray-600 text-sm mb-1">Living Arrangement:</div>
                                        <p className="text-gray-900">{selectedAdoption.livingArrangement}</p>
                                    </div>
                                )}

                                {selectedAdoption.housingType && (
                                    <div className="mb-4">
                                        <div className="text-gray-600 text-sm mb-1">Housing Type:</div>
                                        <p className="text-gray-900">{selectedAdoption.housingType}</p>
                                    </div>
                                )}

                                {selectedAdoption.address && (
                                    <div className="mb-4">
                                        <div className="text-gray-600 text-sm mb-1">Address:</div>
                                        <p className="text-gray-900">
                                            {selectedAdoption.address}
                                            {selectedAdoption.city && `, ${selectedAdoption.city}`}
                                            {selectedAdoption.postalCode && ` ${selectedAdoption.postalCode}`}
                                        </p>
                                    </div>
                                )}

                                {selectedAdoption.hasYard !== undefined && (
                                    <div className="mb-4">
                                        <div className="text-gray-600 text-sm mb-1">Has Yard:</div>
                                        <p className="text-gray-900">
                                            {selectedAdoption.hasYard === 'yes' || selectedAdoption.hasYard === true ? 'Yes' : 'No'}
                                        </p>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-gray-600 text-sm mb-1">Has Children:</div>
                                        <p className="text-gray-900">
                                            {selectedAdoption.hasChildren || selectedAdoption.children === 'none' ?
                                                'No' : selectedAdoption.children ?
                                                    `Yes (${selectedAdoption.children})` : 'No'}
                                        </p>
                                    </div>

                                    <div>
                                        <div className="text-gray-600 text-sm mb-1">Has Other Pets:</div>
                                        <p className="text-gray-900">
                                            {selectedAdoption.hasOtherPets ? 'Yes' :
                                                selectedAdoption.otherPets === 'none' ? 'No' :
                                                    selectedAdoption.otherPets ? `Yes (${selectedAdoption.otherPets})` : 'No'}
                                        </p>
                                    </div>
                                </div>

                                {((selectedAdoption.hasOtherPets && selectedAdoption.otherPetsDetails) ||
                                    (selectedAdoption.otherPets && selectedAdoption.otherPets !== 'none')) && (
                                    <div className="mt-3">
                                        <div className="text-gray-600 text-sm mb-1">Other Pets Details:</div>
                                        <p className="text-gray-900">
                                            {selectedAdoption.otherPetsDetails || selectedAdoption.previousPetExperience || selectedAdoption.otherPets}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>


                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-3 flex items-center">
                                <MessageSquare className="h-5 w-5 mr-2 text-tealcustom" />
                                Application Reason
                            </h3>
                            <div className="bg-gray-50 rounded-md p-4">
                                {selectedAdoption.adoptionReason && (
                                    <div className="mb-4">
                                        <div className="text-gray-600 text-sm mb-1">Adoption Reason:</div>
                                        <p className="text-gray-900">{selectedAdoption.adoptionReason}</p>
                                    </div>
                                )}

                                {selectedAdoption.message && (
                                    <div className="mb-4">
                                        <div className="text-gray-600 text-sm mb-1">Applicant Message:</div>
                                        <p className="text-gray-900">{selectedAdoption.message}</p>
                                    </div>
                                )}

                                {selectedAdoption.notes && (
                                    <div>
                                        <div className="text-gray-600 text-sm mb-1">Additional Notes:</div>
                                        <p className="text-gray-900">{selectedAdoption.notes}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {selectedAdoption.adminNotes && (
                            <div className="mb-6">
                                <h4 className="font-medium text-gray-900 mb-2">Admin Notes</h4>
                                <div className="bg-gray-50 rounded-md p-4">
                                    <p className="text-gray-900 text-sm">{selectedAdoption.adminNotes}</p>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={closeDetailsModal}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => {
                                    closeDetailsModal();
                                    handleStatusUpdateClick(selectedAdoption);
                                }}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center"
                            >
                                <Edit className="h-4 w-4 mr-2" />
                                Update Status
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="p-6 text-center">
                        <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <p>Loading application details...</p>
                    </div>
                )}
            </AdminModal>

            {/* Status Update Modal */}
            <AdminModal
                isOpen={showStatusModal}
                onClose={closeStatusModal}
                title="Update Adoption Status"
                size="md"
            >
                {selectedAdoption ? (
                    <div className="p-6">
                        <div className="mb-6">
                            <p className="text-gray-700 mb-2">
                                Update the adoption status for <span className="font-semibold">{selectedAdoption.petName}</span>
                                applied by <span className="font-semibold">{selectedAdoption.user?.name || selectedAdoption.fullName || 'Unknown'}</span>.
                            </p>

                            <div className="mt-4">
                                <label className="block text-gray-700 text-sm font-medium mb-2">
                                    Status
                                </label>
                                <select
                                    value={statusToUpdate}
                                    onChange={(e) => setStatusToUpdate(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                >
                                    <option value="pending">Pending</option>
                                    <option value="in_review">In Review</option>
                                    <option value="approved">Approved</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                            </div>

                            <div className="mt-4">
                                <label className="block text-gray-700 text-sm font-medium mb-2">
                                    Admin Notes
                                </label>
                                <textarea
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    placeholder="Add notes about this decision (optional)"
                                    rows="4"
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                ></textarea>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={closeStatusModal}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleStatusUpdate}
                                className="px-4 py-2 bg-tealcustom hover:bg-teal-700 text-white rounded-md flex items-center"
                            >
                                <Check className="h-4 w-4 mr-2" />
                                Update Status
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="p-6 text-center">
                        <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <p>Loading application details...</p>
                    </div>
                )}
            </AdminModal>

            {/* Delete Confirmation Modal */}
            <AdminModal
                isOpen={showDeleteModal}
                onClose={closeDeleteModal}
                title="Delete Adoption Application"
                size="sm"
            >
                {selectedAdoption ? (
                    <div className="p-6">
                        <div className="mb-6">
                            <AlertCircle className="h-12 w-12 mx-auto text-red-400 mb-4" />
                            <p className="text-center text-gray-700">
                                Are you sure you want to delete the adoption application for <span className="font-semibold">{selectedAdoption.petName}</span>?
                            </p>
                            <p className="text-center text-gray-500 text-sm mt-2">
                                This action cannot be undone. If the application was pending or in review,
                                the pet will be marked as available again.
                            </p>
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={closeDeleteModal}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md flex items-center"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="p-6 text-center">
                        <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <p>Loading application details...</p>
                    </div>
                )}
            </AdminModal>
        </div>
    );
};

export default AdoptionsManagement;