// components/Admin/DonationsStats.jsx
import React, { useState, useEffect } from 'react';
import { BarChart3, Banknote, RefreshCw, Calendar, Filter, Search, Copy, Check, Edit, Trash2, Users } from 'lucide-react';
import axios from 'axios';
import { useDonationStore } from '../../store/donationStore';
import AdminTable from './shared/AdminTable';
import AdminPagination from './shared/AdminPagination';
import AdminModal from './shared/AdminModal';
import AdminSearchBar from './shared/AdminSearchBar';

const DonationsStats = () => {
    // Stats state
    const [stats, setStats] = useState({
        totalDonations: 0,
        totalAmount: 0,
        recentDonations: 0,
        pendingDonations: 0
    });

    // Donations state
    const [donations, setDonations] = useState([]);
    const [filteredDonations, setFilteredDonations] = useState([]);
    const { updateDonationStore, deleteDonationStore } = useDonationStore();

    // Users state
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userDonations, setUserDonations] = useState([]);
    const [userSearchTerm, setUserSearchTerm] = useState('');

    // UI state
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [isLoadingDonations, setIsLoadingDonations] = useState(false);
    const [error, setError] = useState(null);
    const [userError, setUserError] = useState(null);
    const [donationError, setDonationError] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedDonation, setSelectedDonation] = useState(null);
    const [donationFormData, setDonationFormData] = useState({
        amount: '',
        status: '',
        date: ''
    });
    const [filters, setFilters] = useState({
        status: 'all',
        dateRange: 'all',
        minAmount: '',
        maxAmount: ''
    });
    const [copiedSessionId, setCopiedSessionId] = useState(null);
    const [showCopyToast, setShowCopyToast] = useState(false);

    // Dynamic height for scrollable areas
    const [scrollableHeight, setScrollableHeight] = useState(400);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [donationsPerPage] = useState(10);
    const [currentUserPage, setCurrentUserPage] = useState(1);
    const [usersPerPage] = useState(10);

    // Fetch all donations (for stats and overall view)
    const fetchAllDonations = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.get('http://localhost:5000/api/donations/admin', { withCredentials: true });
            if (response.data.success) {
                // Process donations to ensure user information is included
                const processedDonations = await Promise.all(response.data.donations.map(async (donation) => {
                    // If donation already has user info, use it
                    if (donation.userName && donation.userEmail) {
                        return donation;
                    }

                    // If donation has userId but missing user info, fetch it
                    if (donation.userId) {
                        try {
                            // Find user in the existing users array first to avoid extra API calls
                            const existingUser = users.find(user => user._id === donation.userId);

                            if (existingUser) {
                                return {
                                    ...donation,
                                    userName: existingUser.name || 'Anonymous',
                                    userEmail: existingUser.email || 'No email'
                                };
                            } else {
                                // If user not found in local array, get it from API
                                const userResponse = await axios.get(`http://localhost:5000/api/users/admin/${donation.userId}`,
                                    { withCredentials: true }
                                );

                                if (userResponse.data.success && userResponse.data.user) {
                                    return {
                                        ...donation,
                                        userName: userResponse.data.user.name || 'Anonymous',
                                        userEmail: userResponse.data.user.email || 'No email'
                                    };
                                }
                            }
                        } catch (error) {
                            console.error('Error fetching user for donation:', error);
                        }
                    }

                    // Fallback to original donation
                    return {
                        ...donation,
                        userName: donation.userName || 'Anonymous',
                        userEmail: donation.userEmail || 'No email'
                    };
                }));

                setDonations(processedDonations);

                // Calculate stats
                const total = processedDonations.reduce((sum, donation) => sum + donation.amount, 0);
                const recent = processedDonations.filter(
                    d => new Date(d.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                ).length;
                const pending = processedDonations.filter(d => d.status === 'pending').length;

                setStats({
                    totalDonations: processedDonations.length,
                    totalAmount: total,
                    recentDonations: recent,
                    pendingDonations: pending
                });

                // If no user is selected, show all donations in the table
                if (!selectedUser) {
                    setFilteredDonations(processedDonations);
                }
            } else {
                setError('Failed to fetch donations');
            }
        } catch (error) {
            console.error('Error fetching donations:', error);
            setError(error.response?.data?.message || 'Error fetching donations');
        } finally {
            setIsLoading(false);
        }
    };

    // Update heights based on window size
    useEffect(() => {
        const updateHeight = () => {
            // Calculate approximately 60% of viewport height as a good default
            const calculatedHeight = Math.max(400, window.innerHeight * 0.6);
            setScrollableHeight(calculatedHeight);
        };

        updateHeight();
        window.addEventListener('resize', updateHeight);

        return () => window.removeEventListener('resize', updateHeight);
    }, []);

    // Fetch all users
    const fetchUsers = async () => {
        setIsLoadingUsers(true);
        setUserError(null);
        try {
            const response = await axios.get('http://localhost:5000/api/users/admin', { withCredentials: true });
            if (response.data.success) {
                setUsers(response.data.users);
                setFilteredUsers(response.data.users);
            } else {
                setUserError('Failed to fetch users');
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            setUserError(error.response?.data?.message || 'Error fetching users');
        } finally {
            setIsLoadingUsers(false);
        }
    };

    // Fetch donations for a specific user
    const fetchUserDonations = async (userId) => {
        setIsLoadingDonations(true);
        setDonationError(null);
        try {
            const response = await axios.get(`http://localhost:5000/api/donations/admin/user/${userId}`, { withCredentials: true });
            if (response.data.success) {
                setUserDonations(response.data.donations);
                setFilteredDonations(response.data.donations);
            } else {
                setDonationError('Failed to fetch donations');
            }
        } catch (error) {
            console.error('Error fetching donations:', error);
            setDonationError(error.response?.data?.message || 'Error fetching donations');
        } finally {
            setIsLoadingDonations(false);
        }
    };

    // Handle user selection
    const handleUserSelect = (user) => {
        setSelectedUser(user);
        setCurrentPage(1); // Reset pagination when changing user
        if (user) {
            fetchUserDonations(user._id);
        } else {
            // If deselecting user, show all donations
            setFilteredDonations(donations);
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchAllDonations();
        fetchUsers();
    }, []);

    // Filter users based on search term
    useEffect(() => {
        if (users.length) {
            setFilteredUsers(
                users.filter(user =>
                    user.name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                    user.email?.toLowerCase().includes(userSearchTerm.toLowerCase())
                )
            );
        }
    }, [userSearchTerm, users]);

    // Apply filters when they change
    useEffect(() => {
        if (selectedUser && userDonations.length > 0) {
            setFilteredDonations(getFilteredDonations());
        } else if (donations.length > 0 && !selectedUser) {
            setFilteredDonations(donations.filter(donation => applyFilters(donation)));
        }
    }, [filters, userDonations, selectedUser, donations]);

    // Handle filter changes
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Reset filters
    const resetFilters = () => {
        setFilters({
            status: 'all',
            dateRange: 'all',
            minAmount: '',
            maxAmount: ''
        });
    };

    // Apply donation filters
    const applyFilters = (donation) => {
        // Status filter
        if (filters.status !== 'all' && donation.status !== filters.status) {
            return false;
        }

        // Amount filter
        const minAmount = filters.minAmount ? parseFloat(filters.minAmount) : 0;
        const maxAmount = filters.maxAmount ? parseFloat(filters.maxAmount) : Infinity;
        if (donation.amount < minAmount || donation.amount > maxAmount) {
            return false;
        }

        // Date range filter
        if (filters.dateRange !== 'all') {
            const donationDate = new Date(donation.createdAt);

            if (filters.dateRange === 'today') {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (donationDate < today) return false;
            } else if (filters.dateRange === 'week') {
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                if (donationDate < weekAgo) return false;
            } else if (filters.dateRange === 'month') {
                const monthAgo = new Date();
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                if (donationDate < monthAgo) return false;
            }
        }

        return true;
    };

    // Get filtered donations
    const getFilteredDonations = () => {
        if (!userDonations.length) return [];
        return userDonations.filter(donation => applyFilters(donation));
    };

    // Format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Copy to clipboard
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text)
            .then(() => {
                // Visual feedback
                setCopiedSessionId(text);
                setShowCopyToast(true);

                // Hide toast after 2 seconds
                setTimeout(() => {
                    setShowCopyToast(false);
                    setTimeout(() => setCopiedSessionId(null), 300); // Reset after fade animation
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy text: ', err);
            });
    };

    // Handle donation edit click
    const handleDonationEditClick = (donation, e) => {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }

        setSelectedDonation(donation);

        // Format the date for the datetime-local input
        const donationDate = new Date(donation.createdAt);
        const formattedDate = donationDate.toISOString().slice(0, 16); // Format as YYYY-MM-DDTHH:MM

        setDonationFormData({
            amount: donation.amount,
            status: donation.status,
            date: formattedDate
        });

        setShowEditModal(true);
    };

    // Handle donation deletion click
    const handleDonationDeleteClick = (donation, e) => {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }

        setSelectedDonation(donation);
        setShowDeleteModal(true);
    };

    // Handle donation form change
    const handleDonationFormChange = (e) => {
        const { name, value } = e.target;
        setDonationFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Update donation
    const updateDonation = async () => {
        if (!selectedDonation) {
            return;
        }

        const donationId = selectedDonation._id;

        if (!donationId) {
            setError("Cannot update donation - missing ID");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const result = await updateDonationStore(donationId, {
                amount: parseFloat(donationFormData.amount),
                status: donationFormData.status,
                createdAt: new Date(donationFormData.date).toISOString()
            });

            if (result && result.success) {
                // Refresh donations
                if (selectedUser) {
                    fetchUserDonations(selectedUser._id);
                } else {
                    fetchAllDonations();
                }
                setShowEditModal(false);
            } else {
                setError(result?.error || 'Failed to update donation');
            }
        } catch (error) {
            console.error('Error updating donation:', error);
            setError('Error updating donation: ' + (error.message || error));
        } finally {
            setIsLoading(false);
        }
    };

    // Delete donation
    const deleteDonation = async () => {
        if (!selectedDonation) {
            return;
        }

        const donationId = selectedDonation._id;

        if (!donationId) {
            setError("Cannot delete donation - missing ID");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const result = await deleteDonationStore(donationId);

            if (result && result.success) {
                // Refresh donations
                if (selectedUser) {
                    fetchUserDonations(selectedUser._id);
                } else {
                    fetchAllDonations();
                }
                setShowDeleteModal(false);
            } else {
                setError(result?.error || 'Failed to delete donation');
            }
        } catch (error) {
            console.error('Error deleting donation:', error);
            setError('Error deleting donation: ' + (error.message || error));
        } finally {
            setIsLoading(false);
        }
    };

    // Pagination for donations
    const indexOfLastDonation = currentPage * donationsPerPage;
    const indexOfFirstDonation = indexOfLastDonation - donationsPerPage;
    const getCurrentDonations = () => {
        return filteredDonations.slice(indexOfFirstDonation, indexOfLastDonation);
    };

    // Pagination for users
    const indexOfLastUser = currentUserPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const getCurrentUsers = () => {
        return filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
    };

    // Table columns
    const donationColumns = [
        {
            header: 'Date',
            accessor: 'createdAt',
            render: (donation) => (
                <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">{formatDate(donation.createdAt)}</span>
                </div>
            )
        },
        {
            header: 'Amount',
            accessor: 'amount',
            render: (donation) => (
                <div className="flex items-center">
                    <Banknote className="h-4 w-4 text-gray-400 mr-1" />
                    <span className="text-sm font-medium text-gray-900">€{donation.amount.toFixed(2)}</span>
                </div>
            )
        },
        {
            header: 'Status',
            accessor: 'status',
            render: (donation) => (
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    donation.status === 'completed' ? 'bg-green-100 text-green-800' :
                        donation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            donation.status === 'canceled' ? 'bg-gray-100 text-gray-800' :
                                'bg-red-100 text-red-800'
                }`}>
                    {donation.status}
                </span>
            )
        },
        {
            header: 'User',
            accessor: 'userId',
            render: (donation) => (
                <div>
                    <div className="font-medium text-gray-900">{donation.userName || 'Anonymous'}</div>
                    <div className="text-sm text-gray-500">{donation.userEmail || 'No email'}</div>
                </div>
            )
        },
        {
            header: 'Session ID',
            accessor: 'stripeSessionId',
            render: (donation) => (
                <div className="flex items-center">
                    <div className="text-sm text-gray-500 max-w-xs truncate mr-2" title={donation.stripeSessionId}>
                        {donation.stripeSessionId}
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(donation.stripeSessionId);
                        }}
                        className={`${copiedSessionId === donation.stripeSessionId ? 'text-green-500' : 'text-gray-400 hover:text-tealcustom'} p-1 rounded transition-colors duration-300`}
                        title="Copy Session ID"
                    >
                        {copiedSessionId === donation.stripeSessionId ? (
                            <Check className="h-4 w-4" />
                        ) : (
                            <Copy className="h-4 w-4" />
                        )}
                    </button>
                </div>
            )
        },
        {
            header: 'Actions',
            accessor: 'actions',
            render: (donation) => (
                <div className="flex space-x-2">
                    <button
                        onClick={(e) => handleDonationEditClick(donation, e)}
                        className="text-indigo-600 hover:text-indigo-900 p-1"
                        title="Edit Donation"
                    >
                        <Edit className="h-4 w-4" />
                    </button>
                    <button
                        onClick={(e) => handleDonationDeleteClick(donation, e)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="Delete Donation"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className={"w-full"}>
            {/* Header */}
            <div className="flex flex-wrap justify-between items-center mb-6">
                <h2 className="text-2xl font-bold mb-4 sm:mb-0 flex items-center">
                    <BarChart3 className="h-6 w-6 mr-2" />
                    Donations Dashboard
                </h2>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="text-gray-500 hover:text-tealcustom p-2 border rounded-md"
                    >
                        <Filter className="h-5 w-5" />
                    </button>
                    <button
                        onClick={fetchAllDonations}
                        className="bg-tealcustom hover:bg-teal-700 text-white px-4 py-2 rounded-md flex items-center"
                    >
                        <RefreshCw className="h-5 w-5 mr-1" />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow-md">
                    <h3 className="text-gray-500 text-sm font-medium mb-1">Total Donations</h3>
                    <div className="flex items-center">
                        <span className="text-2xl font-bold text-gray-900">{stats.totalDonations}</span>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-md">
                    <h3 className="text-gray-500 text-sm font-medium mb-1">Total Amount</h3>
                    <div className="flex items-center">
                        <span className="text-2xl font-bold text-gray-900">€{stats.totalAmount.toFixed(2)}</span>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-md">
                    <h3 className="text-gray-500 text-sm font-medium mb-1">Last 7 Days</h3>
                    <div className="flex items-center">
                        <span className="text-2xl font-bold text-gray-900">{stats.recentDonations}</span>
                        <span className="text-sm text-gray-500 ml-2">donations</span>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-md">
                    <h3 className="text-gray-500 text-sm font-medium mb-1">Pending</h3>
                    <div className="flex items-center">
                        <span className="text-2xl font-bold text-gray-900">{stats.pendingDonations}</span>
                        <span className="text-sm text-gray-500 ml-2">donations</span>
                    </div>
                </div>
            </div>

            {/* Filters */}
            {showFilters && (
                <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">Filter Donations</h3>
                        <button
                            onClick={resetFilters}
                            className="text-sm text-tealcustom hover:text-teal-700"
                        >
                            Reset Filters
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-gray-700 text-sm font-medium mb-1">Status</label>
                            <select
                                name="status"
                                value={filters.status}
                                onChange={handleFilterChange}
                                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                            >
                                <option value="all">All</option>
                                <option value="completed">Completed</option>
                                <option value="pending">Pending</option>
                                <option value="canceled">Canceled</option>
                                <option value="failed">Failed</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-gray-700 text-sm font-medium mb-1">Date Range</label>
                            <select
                                name="dateRange"
                                value={filters.dateRange}
                                onChange={handleFilterChange}
                                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                            >
                                <option value="all">All Time</option>
                                <option value="today">Today</option>
                                <option value="week">Last 7 Days</option>
                                <option value="month">Last 30 Days</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-gray-700 text-sm font-medium mb-1">Min Amount (€)</label>
                            <input
                                type="number"
                                name="minAmount"
                                value={filters.minAmount}
                                onChange={handleFilterChange}
                                placeholder="Min"
                                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 text-sm font-medium mb-1">Max Amount (€)</label>
                            <input
                                type="number"
                                name="maxAmount"
                                value={filters.maxAmount}
                                onChange={handleFilterChange}
                                placeholder="Max"
                                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {/* Users & Donations Container */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 w-full">
                {/* Users List with Scrollbar */}
                <div className="bg-white shadow-md rounded-lg overflow-hidden lg:col-span-1">
                    <div className="p-4 bg-gray-50 border-b border-gray-200 font-semibold flex justify-between">
                        <span>Users</span>
                        <span className="text-sm text-gray-500">{filteredUsers.length} total</span>
                    </div>
                    <div className="p-4">
                        <AdminSearchBar
                            value={userSearchTerm}
                            onChange={(e) => setUserSearchTerm(e.target.value)}
                            placeholder="Search users..."
                        />
                    </div>
                    <div className="overflow-y-auto" style={{ height: `${scrollableHeight}px` }}>
                        {isLoadingUsers ? (
                            <div className="p-6 text-center">Loading users...</div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="p-6 text-center">No users found</div>
                        ) : (
                            <ul className="divide-y divide-gray-200">
                                <li
                                    className={`p-4 hover:bg-gray-50 cursor-pointer ${!selectedUser ? 'bg-teal-50 border-l-4 border-tealcustom' : ''}`}
                                    onClick={() => handleUserSelect(null)}
                                >
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                                                <Users className="h-6 w-6 text-gray-500" />
                                            </div>
                                        </div>
                                        <div className="ml-4">
                                            <div className="font-medium text-gray-900">All Users</div>
                                            <div className="text-sm text-gray-500">View all donations</div>
                                        </div>
                                    </div>
                                </li>
                                {getCurrentUsers().map(user => (
                                    <li
                                        key={user._id}
                                        onClick={() => handleUserSelect(user)}
                                        className={`p-4 hover:bg-gray-50 cursor-pointer ${selectedUser?._id === user._id ? 'bg-teal-50 border-l-4 border-tealcustom' : ''}`}
                                    >
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0">
                                                <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center">
                                                    <span className="text-tealcustom font-semibold">{user.name?.charAt(0) || user.email?.charAt(0) || '?'}</span>
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <div className="font-medium text-gray-900">{user.name || 'Unnamed User'}</div>
                                                <div className="text-sm text-gray-500">{user.email}</div>
                                            </div>
                                            <div className="ml-auto text-xs bg-gray-100 px-2 py-1 rounded">
                                                {user.isAdmin ? 'Admin' : 'User'}
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    {/* Pagination for Users */}
                    {filteredUsers.length > usersPerPage && (
                        <div className="border-t border-gray-200 p-3">
                            <AdminPagination
                                itemsPerPage={usersPerPage}
                                totalItems={filteredUsers.length}
                                currentPage={currentUserPage}
                                paginate={setCurrentUserPage}
                            />
                        </div>
                    )}
                </div>

                {/* Donations Panel with Table */}
                <div className="lg:col-span-3 bg-white shadow-md rounded-lg overflow-hidden">
                    <div className="p-4 bg-gray-50 border-b border-gray-200 font-semibold flex justify-between items-center">
                        <div>
                            {selectedUser ? (
                                <div className="flex items-center">
                                    <span>{`Donations for ${selectedUser.name || selectedUser.email}`}</span>
                                    <span className="ml-2 text-sm text-gray-500">
                                        {filteredDonations.length} total
                                    </span>
                                </div>
                            ) : (
                                <div className="flex items-center">
                                    <span>All Donations</span>
                                    <span className="ml-2 text-sm text-gray-500">
                                        {filteredDonations.length} total
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Donations Content */}
                    <div className="overflow-hidden">
                        {isLoading || isLoadingDonations ? (
                            <div className="p-6 text-center">Loading donations...</div>
                        ) : (
                            <div>
                                {filteredDonations.length === 0 ? (
                                    <div className="p-6 text-center text-gray-500">
                                        <Banknote className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                        <p>No donations found with the current filters</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="overflow-y-auto w-full" style={{ maxHeight: `${scrollableHeight}px` }}>
                                            <table className="w-full divide-y divide-gray-200 table-fixed">
                                                <thead className="bg-gray-50 sticky top-0 z-10">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                    {!selectedUser && (
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                                    )}
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session ID</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                                </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                {getCurrentDonations().map(donation => (
                                                    <tr
                                                        key={donation._id}
                                                        className="hover:bg-gray-50 cursor-pointer"
                                                        onClick={() => handleDonationEditClick(donation)}
                                                    >
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                                                                <span className="text-sm text-gray-900">{formatDate(donation.createdAt)}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <Banknote className="h-4 w-4 text-gray-400 mr-1" />
                                                                <span className="text-sm font-medium text-gray-900">€{donation.amount.toFixed(2)}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                                    donation.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                                        donation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                                            donation.status === 'canceled' ? 'bg-gray-100 text-gray-800' :
                                                                                'bg-red-100 text-red-800'
                                                                }`}>
                                                                    {donation.status}
                                                                </span>
                                                        </td>
                                                        {!selectedUser && (
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div>
                                                                    <div className="font-medium text-gray-900">{donation.userName || 'Anonymous'}</div>
                                                                    <div className="text-sm text-gray-500">{donation.userEmail || 'No email'}</div>
                                                                </div>
                                                            </td>
                                                        )}
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <div className="text-sm text-gray-500 max-w-xs truncate mr-2" title={donation.stripeSessionId}>
                                                                    {donation.stripeSessionId}
                                                                </div>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation(); // Prevent row click
                                                                        copyToClipboard(donation.stripeSessionId);
                                                                    }}
                                                                    className={`${copiedSessionId === donation.stripeSessionId ? 'text-green-500' : 'text-gray-400 hover:text-tealcustom'} p-1 rounded transition-colors duration-300`}
                                                                    title="Copy Session ID"
                                                                >
                                                                    {copiedSessionId === donation.stripeSessionId ? (
                                                                        <Check className="h-4 w-4" />
                                                                    ) : (
                                                                        <Copy className="h-4 w-4" />
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex space-x-2">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation(); // Prevent row click
                                                                        handleDonationEditClick(donation, e);
                                                                    }}
                                                                    className="text-indigo-600 hover:text-indigo-900 p-1"
                                                                    title="Edit Donation"
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation(); // Prevent row click
                                                                        handleDonationDeleteClick(donation, e);
                                                                    }}
                                                                    className="text-red-600 hover:text-red-900 p-1"
                                                                    title="Delete Donation"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Pagination for Donations */}
                                        <div className="border-t border-gray-200 p-3">
                                            <AdminPagination
                                                itemsPerPage={donationsPerPage}
                                                totalItems={filteredDonations.length}
                                                currentPage={currentPage}
                                                paginate={setCurrentPage}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Copy Toast Notification */}
            {showCopyToast && (
                <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-md shadow-lg flex items-center animate-fade-in-out">
                    <Check className="h-4 w-4 text-green-400 mr-2" />
                    <span>Session ID copied to clipboard</span>
                </div>
            )}

            {/* Edit Donation Modal */}
            <AdminModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                title="Edit Donation"
                size="md"
            >
                <div className="p-6">
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        updateDonation();
                    }}>
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                Amount (€)
                            </label>
                            <input
                                type="number"
                                name="amount"
                                value={donationFormData.amount}
                                onChange={handleDonationFormChange}
                                step="0.01"
                                required
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                Status
                            </label>
                            <select
                                name="status"
                                value={donationFormData.status}
                                onChange={handleDonationFormChange}
                                required
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            >
                                <option value="completed">Completed</option>
                                <option value="pending">Pending</option>
                                <option value="canceled">Canceled</option>
                                <option value="failed">Failed</option>
                            </select>
                        </div>

                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                Date
                            </label>
                            <input
                                type="datetime-local"
                                name="date"
                                value={donationFormData.date}
                                onChange={handleDonationFormChange}
                                required
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            />
                        </div>

                        <div className="flex justify-end mt-6">
                            <button
                                type="button"
                                onClick={() => setShowEditModal(false)}
                                className="mr-4 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="bg-tealcustom hover:bg-teal-700 text-white px-4 py-2 rounded flex items-center justify-center"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                                ) : (
                                    <Check className="h-5 w-5 mr-2" />
                                )}
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </AdminModal>

            {/* Delete Donation Confirmation Modal */}
            <AdminModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Delete Donation"
                size="sm"
            >
                <div className="p-6">
                    <p className="mb-6">
                        Are you sure you want to delete this donation of €{selectedDonation?.amount.toFixed(2)}? This action cannot be undone.
                    </p>
                    <div className="flex justify-end">
                        <button
                            onClick={() => setShowDeleteModal(false)}
                            className="mr-4 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={deleteDonation}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center justify-center"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                            ) : (
                                <Trash2 className="h-5 w-5 mr-2" />
                            )}
                            Delete
                        </button>
                    </div>
                </div>
            </AdminModal>
        </div>
    );
};

export default DonationsStats;