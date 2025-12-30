// frontend/src/pages/Admin/StatisticsManagement.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAdoptionStore } from '../../store/adoptionStore';
import { useDonationStore } from '../../store/donationStore';
import { Edit, Trash2, Copy, Check } from 'lucide-react';


import AdminTable from './shared/AdminTable';
import AdminPagination from './shared/AdminPagination';
import AdminModal from './shared/AdminModal';
import AdminSearchBar from './shared/AdminSearchBar';

import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    Calendar,
    Filter,
    RefreshCw,
    AlertCircle,
    Info,
    Banknote,
    PawPrint,
    Users,
    ArrowUp,
    ArrowDown
} from 'lucide-react';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Area,
    AreaChart,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import axios from 'axios';

const StatisticsManagement = () => {
    const { adoptions, getAllAdoptions, isLoading: adoptionsLoading } = useAdoptionStore();

    // State
    const [predictionDays, setPredictionDays] = useState(90);
    const [selectedPetType, setSelectedPetType] = useState('all');
    const [viewMode, setViewMode] = useState('combined'); // 'combined', 'adoptions', 'donations'
    const [error, setError] = useState(null);

    // Add these state variables after your existing state
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [currentUserPage, setCurrentUserPage] = useState(1);
    const [usersPerPage] = useState(10);

    // Add copy functionality state
    const [copiedSessionId, setCopiedSessionId] = useState(null);
    const [showCopyToast, setShowCopyToast] = useState(false);

    // Add edit modal form state
    const [donationFormData, setDonationFormData] = useState({
        amount: '',
        status: '',
        date: ''
    });
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Donations state
    const {
        donations,
        isLoading: donationsLoading,
        pagination,
        getAllDonations,
        updateDonation,
        deleteDonation
    } = useDonationStore();

    const [donationFilters, setDonationFilters] = useState({
        page: 1,
        limit: 10,
        status: 'all'
    });
    const [selectedDonation, setSelectedDonation] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Fetch data on mount
    useEffect(() => {
        getAllAdoptions({ status: 'all' });
        getAllDonations(donationFilters); // This will re-run when donationFilters changes
        fetchUsers();
    }, [getAllAdoptions, getAllDonations, donationFilters]); // donationFilters in dependency array

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

    // Fetch donations
    const fetchDonations = async () => {
        await getAllDonations(donationFilters);
    };

    // Add this function after your fetchDonations function
    const fetchUsers = async () => {
        setIsLoadingUsers(true);
        try {
            const response = await axios.get('http://localhost:5000/api/users/admin', {
                withCredentials: true
            });
            if (response.data.success) {
                setUsers(response.data.users);
                setFilteredUsers(response.data.users);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setIsLoadingUsers(false);
        }
    };

    const handleUserSelect = (user) => {
        setSelectedUser(user);

        if (user) {
            // Fetch donations for specific user
            setDonationFilters({
                page: 1,
                limit: 10,
                status: 'all',
                userId: user._id
            });
        } else {
            // Fetch all donations
            setDonationFilters({
                page: 1,
                limit: 10,
                status: 'all',
                userId: null
            });
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text)
            .then(() => {
                setCopiedSessionId(text);
                setShowCopyToast(true);
                setTimeout(() => {
                    setShowCopyToast(false);
                    setTimeout(() => setCopiedSessionId(null), 300);
                }, 2000);
            })
            .catch(err => console.error('Failed to copy:', err));
    };

    const handleDeleteDonation = async (id) => {
        if (window.confirm('Are you sure you want to delete this donation?')) {
            const result = await deleteDonation(id);
            if (result.success) {
                getAllDonations(donationFilters);
            }
        }
    };

    const handleDonationEditClick = (donation) => {
        setSelectedDonation(donation);
        const donationDate = new Date(donation.createdAt);
        const formattedDate = donationDate.toISOString().slice(0, 16);

        setDonationFormData({
            amount: donation.amount,
            status: donation.status,
            date: formattedDate
        });
        setIsEditModalOpen(true);
    };

    const handleDonationFormChange = (e) => {
        const { name, value } = e.target;
        setDonationFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleUpdateDonation = async () => {
        if (!selectedDonation) return;

        const result = await updateDonation(selectedDonation._id, {
            amount: parseFloat(donationFormData.amount),
            status: donationFormData.status,
            createdAt: new Date(donationFormData.date).toISOString()
        });

        if (result.success) {
            getAllDonations(donationFilters);
            setIsEditModalOpen(false);
        }
    };

    // Calculate donation statistics
    const donationStats = useMemo(() => {
        if (!donations.length) return {
            total: 0,
            count: 0,
            completed: 0,
            pending: 0,
            recent: 0,
            averageAmount: 0
        };

        const total = donations.reduce((sum, d) => sum + d.amount, 0);
        const completed = donations.filter(d => d.status === 'completed');
        const pending = donations.filter(d => d.status === 'pending');

        // Last 7 days
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const recentDonations = donations.filter(d => new Date(d.createdAt) > weekAgo);

        return {
            total: total,
            count: donations.length,
            completed: completed.length,
            pending: pending.length,
            recent: recentDonations.length,
            averageAmount: total / donations.length
        };
    }, [donations]);

    // Calculate adoption statistics
    const adoptionStats = useMemo(() => {
        if (!adoptions || adoptions.length === 0) {
            return {
                total: 0,
                pending: 0,
                approved: 0,
                rejected: 0,
                approvalRate: 0
            };
        }

        const total = adoptions.length;
        const pending = adoptions.filter(a => a.status === 'pending').length;
        const approved = adoptions.filter(a => a.status === 'approved').length;
        const rejected = adoptions.filter(a => a.status === 'rejected').length;
        const processed = approved + rejected;

        return {
            total,
            pending,
            approved,
            rejected,
            approvalRate: processed > 0 ? Math.round((approved / processed) * 100) : 0
        };
    }, [adoptions]);

    // Generate predictions
    const [predictionData, setPredictionData] = useState(null);
    const [isPredictionLoading, setIsPredictionLoading] = useState(false);
    const [predictionViewMode, setPredictionViewMode] = useState('daily'); // 'daily', 'weekly', 'monthly'

// Fetch predictions from backend
    const fetchPredictions = async () => {
        if (!adoptions || adoptions.length === 0) {
            setPredictionData(null);
            return;
        }

        setIsPredictionLoading(true);
        setError(null);

        try {
            // ✅ FIXED: Don't send adoptions array - backend fetches them
            const response = await axios.post(
                'http://localhost:5000/api/predictions/adoptions',
                {
                    viewMode: predictionViewMode,  // Only send view mode
                    petType: selectedPetType       // And pet type filter
                },
                { withCredentials: true }
            );

            if (response.data.success) {
                const data = response.data.data;

                // Prepare chart data
                const chartData = [];

                // Add historical data
                data.historicalDates.forEach((date, index) => {
                    chartData.push({
                        date: date,
                        actual: data.historical[index],
                        predicted: null,
                        type: 'historical'
                    });
                });

                // Add prediction data
                data.predictionDates.forEach((date, index) => {
                    chartData.push({
                        date: date,
                        actual: null,
                        predicted: data.predictions[index], // Already rounded in Python
                        type: 'prediction'
                    });
                });

                setPredictionData({
                    chartData,
                    statistics: data.statistics,
                    raw: data
                });
            }
        } catch (error) {
            const backendError = error.response?.data?.message || error.response?.data?.error;
            console.error('Error fetching predictions:', backendError || error.message);

            setPredictionData(null);
            setError(
                backendError
                    ? `${backendError}`
                    : 'Failed to generate predictions. Make sure Python ML service is running.'
            );
        } finally {
            setIsPredictionLoading(false);
        }
    };

// Call fetchPredictions when dependencies change
    useEffect(() => {
        if (adoptions && adoptions.length > 0) {
            fetchPredictions();
        }
    }, [adoptions, selectedPetType, predictionViewMode]); // ADD predictionViewMode

    // Get available pet types
    const availablePetTypes = useMemo(() => {
        if (!adoptions) return [];
        const types = new Set(adoptions.map(a => a.petType).filter(Boolean));
        return Array.from(types);
    }, [adoptions]);

    // Prepare pet type distribution data
    const petTypeDistribution = useMemo(() => {
        if (!adoptions || adoptions.length === 0) return [];

        const distribution = adoptions.reduce((acc, adoption) => {
            if (adoption.status === 'approved') {
                const type = adoption.petType || 'unknown';
                acc[type] = (acc[type] || 0) + 1;
            }
            return acc;
        }, {});

        return Object.entries(distribution).map(([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value
        }));
    }, [adoptions]);

    const COLORS = ['#14b8a6', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    // Custom tooltip for the prediction chart
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
                    <p className="font-semibold mb-2">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} style={{ color: entry.color }}>
                            {entry.name}: {entry.value?.toFixed(1)} adoptions
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    const isLoading = adoptionsLoading || donationsLoading;

    if (isLoading && (!adoptions || !donations)) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-tealcustom"></div>
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-center mb-6">
                <h2 className="text-2xl font-bold mb-4 sm:mb-0 flex items-center">
                    <BarChart3 className="h-6 w-6 mr-2 text-tealcustom" />
                    Statistics & Predictions
                </h2>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => {
                            getAllAdoptions({ status: 'all' });
                            getAllDonations(donationFilters);
                        }}
                        className="bg-tealcustom hover:bg-teal-700 text-white px-4 py-2 rounded-md flex items-center"
                    >
                        <RefreshCw className="h-5 w-5 mr-1" />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2 text-yellow-800">
                    <AlertCircle className="h-5 w-5 mt-0.5" />
                    <div>
                        <p className="font-medium">Predictions Unavailable</p>
                        <p className="text-sm mt-1">{error}</p>
                        {error.includes('minimum 7') && (
                            <p className="text-sm mt-2">
                                <strong>How to fix:</strong> Go to the Adoptions section and approve at least 7 applications.
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Total Adoptions */}
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-teal-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 text-sm font-medium mb-1">Total Adoptions</p>
                            <p className="text-3xl font-bold text-gray-900">{adoptionStats.total}</p>
                            <p className="text-sm text-gray-500 mt-1">
                                {adoptionStats.approved} approved
                            </p>
                        </div>
                        <div className="bg-teal-100 p-3 rounded-full">
                            <PawPrint className="h-6 w-6 text-teal-600" />
                        </div>
                    </div>
                </div>

                {/* Approval Rate */}
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 text-sm font-medium mb-1">Approval Rate</p>
                            <p className="text-3xl font-bold text-gray-900">{adoptionStats.approvalRate}%</p>
                            <p className="text-sm text-gray-500 mt-1">
                                of processed applications
                            </p>
                        </div>
                        <div className="bg-green-100 p-3 rounded-full">
                            <TrendingUp className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                </div>

                {/* Total Donations */}
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 text-sm font-medium mb-1">Total Donations</p>
                            <p className="text-3xl font-bold text-gray-900">€{donationStats.total.toFixed(2)}</p>
                            <p className="text-sm text-gray-500 mt-1">
                                {donationStats.count} donations
                            </p>
                        </div>
                        <div className="bg-blue-100 p-3 rounded-full">
                            <Banknote className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                {/* Pending Applications */}
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 text-sm font-medium mb-1">Pending Applications</p>
                            <p className="text-3xl font-bold text-gray-900">{adoptionStats.pending}</p>
                            <p className="text-sm text-gray-500 mt-1">
                                awaiting review
                            </p>
                        </div>
                        <div className="bg-yellow-100 p-3 rounded-full">
                            <Calendar className="h-6 w-6 text-yellow-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Prediction Section */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex flex-wrap justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold flex items-center">
                        <TrendingUp className="h-5 w-5 mr-2 text-tealcustom" />
                        Adoption Predictions
                    </h3>

                    {/* Controls - Always Visible */}
                    <div className="flex flex-wrap items-center gap-4 mt-4 sm:mt-0">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                View Mode
                            </label>
                            <select
                                value={predictionViewMode}
                                onChange={(e) => setPredictionViewMode(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                                disabled={isPredictionLoading}
                            >
                                <option value="daily">Daily (30 days ahead)</option>
                                <option value="weekly">Weekly (12 weeks ahead)</option>
                                <option value="monthly">Monthly (3 months ahead)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Pet Type
                            </label>
                            <select
                                value={selectedPetType}
                                onChange={(e) => setSelectedPetType(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                                disabled={isPredictionLoading}
                            >
                                <option value="all">All Types</option>
                                {availablePetTypes.map(type => (
                                    <option key={type} value={type}>
                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {isPredictionLoading && (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-tealcustom"></div>
                    </div>
                )}

                {/* Error State - Show but keep controls visible */}
                {!isPredictionLoading && error && (
                    <div className="p-8 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-6 w-6 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <div className="w-full">
                                <p className="font-medium text-yellow-900 mb-2">Predictions Not Available</p>
                                <p className="text-sm text-yellow-800 mb-3">{error}</p>

                                {(error.includes('Not enough time periods') || error.includes('Not enough data')) && (
                                    <div className="bg-white p-4 rounded border border-yellow-300 mt-3">
                                        <p className="text-sm font-medium text-gray-900 mb-2">💡 How to Fix:</p>
                                        <ul className="text-sm text-gray-700 space-y-2 ml-4 list-disc">
                                            <li>
                                                <strong>For Daily predictions:</strong> Need at least 2 weeks of approved adoptions
                                                <br />
                                                <span className="text-gray-600">Currently works best with 1+ month of data</span>
                                            </li>
                                            <li>
                                                <strong>For Weekly predictions:</strong> Need at least 8 weeks (2 months) of approved adoptions
                                                <br />
                                                <span className="text-gray-600">Currently works best with 3+ months of data</span>
                                            </li>
                                            <li>
                                                <strong>For Monthly predictions:</strong> Need at least 3 months of approved adoptions
                                                <br />
                                                <span className="text-gray-600">Currently works best with 6+ months of data</span>
                                            </li>
                                            <li className="mt-3 pt-3 border-t border-gray-200">
                                                <strong>Quick fix:</strong> Run the seed script to generate 6 months of test data
                                                <br />
                                                <code className="bg-gray-100 px-2 py-1 rounded text-xs mt-1 inline-block">
                                                    npm run seed:adoptions
                                                </code>
                                            </li>
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Success State - Show Predictions */}
                {!isPredictionLoading && !error && predictionData && (
                    <>

                    {/* Prediction Statistics */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="text-sm font-medium text-gray-600 mb-1">Current Average</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {predictionData.statistics.averageHistorical}
                            </p>
                            <p className="text-xs text-gray-500">
                                adoptions/{predictionViewMode === 'daily' ? 'day' : predictionViewMode === 'weekly' ? 'week' : 'month'}
                            </p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg">
                            <p className="text-sm font-medium text-gray-600 mb-1">Predicted Average</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {predictionData.statistics.averagePredicted}
                            </p>
                            <p className="text-xs text-gray-500">
                                adoptions/{predictionViewMode === 'daily' ? 'day' : predictionViewMode === 'weekly' ? 'week' : 'month'}
                            </p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                            <p className="text-sm font-medium text-gray-600 mb-1">Expected Total</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {predictionData.statistics.totalPredicted}
                            </p>
                            <p className="text-xs text-gray-500">
                                in next {predictionViewMode === 'daily' ? '30 days' : predictionViewMode === 'weekly' ? '12 weeks' : '3 months'}
                            </p>
                        </div>
                        <div className={`${predictionData.statistics.trend === 'increasing' ? 'bg-green-50' : 'bg-red-50'} p-4 rounded-lg`}>
                            <p className="text-sm font-medium text-gray-600 mb-1">Trend</p>
                            <div className="flex items-center">
                                <p className="text-2xl font-bold text-gray-900">
                                    {Math.abs(predictionData.statistics.trendPercentage)}%
                                </p>
                                {predictionData.statistics.trend === 'increasing' ? (
                                    <ArrowUp className="h-5 w-5 text-green-600 ml-2" />
                                ) : (
                                    <ArrowDown className="h-5 w-5 text-red-600 ml-2" />
                                )}
                            </div>
                            <p className="text-xs text-gray-500">{predictionData.statistics.trend}</p>
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                        <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-blue-800">
                            <p className="font-medium mb-1">About This Prediction</p>
                            <p>
                                This AI model uses SARIMA (Seasonal AutoRegressive Integrated Moving Average) to predict future adoption patterns.
                                The <span className="font-medium text-blue-600">blue line</span> shows actual historical data,
                                while the <span className="font-medium text-red-600">red dashed line</span> shows predicted adoptions
                                {predictionViewMode === 'daily' && ' for the next 30 days'}
                                {predictionViewMode === 'weekly' && ' for the next 12 weeks'}
                                {predictionViewMode === 'monthly' && ' for the next 3 months'}.
                            </p>
                        </div>
                    </div>

                    {/* Main Prediction Chart */}
                        {/* Main Prediction Chart */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="text-sm font-medium text-gray-700 mb-4">Adoption Timeline & Predictions</h4>
                            <ResponsiveContainer width="100%" height={400}>
                                <LineChart data={predictionData.chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 12 }}
                                        tickFormatter={(value) => {
                                            const date = new Date(value);
                                            if (predictionViewMode === 'monthly') {
                                                return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                                            }
                                            return `${date.getMonth() + 1}/${date.getDate()}`;
                                        }}
                                    />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="actual"
                                        stroke="#3b82f6"
                                        strokeWidth={3}
                                        name="Actual Adoptions"
                                        dot={{ fill: '#3b82f6', r: 4 }}
                                        connectNulls={false}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="predicted"
                                        stroke="#ef4444"
                                        strokeWidth={3}
                                        strokeDasharray="5 5"
                                        name="Predicted Adoptions"
                                        dot={{ fill: '#ef4444', r: 4 }}
                                        connectNulls={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </>
                )}
            </div>


            {/* Pet Type Distribution */}
            {petTypeDistribution.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-xl font-semibold mb-4 flex items-center">
                            <PawPrint className="h-5 w-5 mr-2 text-tealcustom" />
                            Adoption Distribution by Pet Type
                        </h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={petTypeDistribution}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={true}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {petTypeDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Donations Chart */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-xl font-semibold mb-4 flex items-center">
                            <Banknote className="h-5 w-5 mr-2 text-tealcustom" />
                            Donation Statistics
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-gray-600">Total Donations</span>
                                <span className="font-bold text-xl">€{donationStats.total.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-gray-600">Number of Donations</span>
                                <span className="font-bold text-xl">{donationStats.count}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-gray-600">Average Donation</span>
                                <span className="font-bold text-xl">€{donationStats.averageAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                                <span className="text-gray-600">Completed</span>
                                <span className="font-bold text-xl text-green-600">{donationStats.completed}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                                <span className="text-gray-600">Pending</span>
                                <span className="font-bold text-xl text-yellow-600">{donationStats.pending}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                                <span className="text-gray-600">Last 7 Days</span>
                                <span className="font-bold text-xl text-blue-600">{donationStats.recent}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Donations Management Section - 2 Column Layout */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold flex items-center">
                        <Banknote className="h-5 w-5 mr-2 text-tealcustom" />
                        Donations Management
                    </h3>
                </div>

                {/* 2-Column Grid: Users | Donations */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* LEFT: Users List */}
                    <div className="lg:col-span-1 border rounded-lg">
                        <div className="p-4 bg-gray-50 border-b font-semibold flex justify-between">
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

                        <div className="overflow-y-auto" style={{ maxHeight: '600px' }}>
                            {isLoadingUsers ? (
                                <div className="p-6 text-center">Loading users...</div>
                            ) : (
                                <ul className="divide-y divide-gray-200">
                                    {/* "All Users" Option */}
                                    <li
                                        className={`p-4 hover:bg-gray-50 cursor-pointer ${!selectedUser ? 'bg-teal-50 border-l-4 border-tealcustom' : ''}`}
                                        onClick={() => handleUserSelect(null)}
                                    >
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                                                <Users className="h-6 w-6 text-gray-500" />
                                            </div>
                                            <div className="ml-4">
                                                <div className="font-medium text-gray-900">All Users</div>
                                                <div className="text-sm text-gray-500">View all donations</div>
                                            </div>
                                        </div>
                                    </li>

                                    {/* User List */}
                                    {filteredUsers
                                        .slice((currentUserPage - 1) * usersPerPage, currentUserPage * usersPerPage)
                                        .map(user => (
                                            <li
                                                key={user._id}
                                                onClick={() => handleUserSelect(user)}
                                                className={`p-4 hover:bg-gray-50 cursor-pointer ${selectedUser?._id === user._id ? 'bg-teal-50 border-l-4 border-tealcustom' : ''}`}
                                            >
                                                <div className="flex items-center">
                                                    <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center">
                                            <span className="text-tealcustom font-semibold">
                                                {user.name?.charAt(0) || user.email?.charAt(0) || '?'}
                                            </span>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="font-medium text-gray-900">{user.name || 'Unnamed'}</div>
                                                        <div className="text-sm text-gray-500">{user.email}</div>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                </ul>
                            )}
                        </div>

                        {filteredUsers.length > usersPerPage && (
                            <div className="border-t p-3">
                                <AdminPagination
                                    itemsPerPage={usersPerPage}
                                    totalItems={filteredUsers.length}
                                    currentPage={currentUserPage}
                                    paginate={setCurrentUserPage}
                                />
                            </div>
                        )}
                    </div>

                    {/* RIGHT: Donations Table */}
                    <div className="lg:col-span-3">
                        <div className="mb-4 flex justify-between items-center">
                            <div>
                                {selectedUser ? (
                                    <span className="text-lg font-medium">
                            Donations for {selectedUser.name || selectedUser.email}
                        </span>
                                ) : (
                                    <span className="text-lg font-medium">All Donations</span>
                                )}
                            </div>
                            <select
                                value={donationFilters.status}
                                onChange={(e) => setDonationFilters(prev => ({
                                    ...prev,
                                    status: e.target.value,
                                    page: 1
                                }))}
                                className="px-3 py-2 border rounded"
                            >
                                <option value="all">All Status</option>
                                <option value="completed">Completed</option>
                                <option value="pending">Pending</option>
                                <option value="canceled">Canceled</option>
                            </select>
                        </div>

                        <AdminTable
                            columns={[
                                {
                                    header: 'Date',
                                    render: (donation) => (
                                        <div className="flex items-center">
                                            <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                                            <span className="text-sm">{new Date(donation.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    )
                                },
                                {
                                    header: 'Amount',
                                    render: (donation) => (
                                        <div className="flex items-center">
                                            <Banknote className="h-4 w-4 text-gray-400 mr-1" />
                                            <span className="font-medium">€{donation.amount.toFixed(2)}</span>
                                        </div>
                                    )
                                },
                                {
                                    header: 'Status',
                                    render: (donation) => (
                                        <span className={`px-2 py-1 rounded text-xs ${
                                            donation.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                donation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-gray-100 text-gray-800'
                                        }`}>
                                {donation.status}
                            </span>
                                    )
                                },
                                ...(!selectedUser ? [{
                                    header: 'User',
                                    render: (donation) => (
                                        <div>
                                            <div className="font-medium">{donation.userName}</div>
                                            <div className="text-sm text-gray-500">{donation.userEmail}</div>
                                        </div>
                                    )
                                }] : []),
                                {
                                    header: 'Session ID',
                                    render: (donation) => (
                                        <div className="flex items-center">
                                            <div className="text-sm text-gray-500 max-w-xs truncate mr-2">
                                                {donation.stripeSessionId}
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    copyToClipboard(donation.stripeSessionId);
                                                }}
                                                className={`${copiedSessionId === donation.stripeSessionId ? 'text-green-500' : 'text-gray-400 hover:text-tealcustom'} p-1`}
                                            >
                                                {copiedSessionId === donation.stripeSessionId ?
                                                    <Check className="h-4 w-4" /> :
                                                    <Copy className="h-4 w-4" />
                                                }
                                            </button>
                                        </div>
                                    )
                                },
                                {
                                    header: 'Actions',
                                    render: (donation) => (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDonationEditClick(donation);
                                                }}
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteDonation(donation._id);
                                                }}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    )
                                }
                            ]}
                            data={donations}
                            isLoading={donationsLoading}
                            emptyMessage="No donations found"
                        />

                        <AdminPagination
                            currentPage={pagination.currentPage}
                            totalItems={pagination.totalItems}
                            itemsPerPage={pagination.itemsPerPage}
                            paginate={(page) => setDonationFilters(prev => ({ ...prev, page }))}
                        />
                    </div>
                </div>
            </div>

            {/* Copy Toast */}
            {showCopyToast && (
                <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-md shadow-lg flex items-center">
                    <Check className="h-4 w-4 text-green-400 mr-2" />
                    <span>Session ID copied to clipboard</span>
                </div>
            )}
        </div>
    );
};

export default StatisticsManagement;