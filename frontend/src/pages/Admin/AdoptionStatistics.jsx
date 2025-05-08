import React, { useMemo } from 'react';
import { BarChart3, CheckCircle, Clock, AlertTriangle, XCircle, ArrowUp, ArrowDown } from 'lucide-react';

const AdoptionStatistics = ({ adoptions }) => {
    // Calculate statistics from adoptions data
    const stats = useMemo(() => {
        if (!adoptions || !adoptions.length) {
            return {
                total: 0,
                pending: 0,
                inReview: 0,
                approved: 0,
                rejected: 0,
                petTypes: {},
                pendingRate: 0,
                approvalRate: 0,
                recentTrend: 0
            };
        }

        // Count by status
        const pending = adoptions.filter(a => a.status === 'pending').length;
        const inReview = adoptions.filter(a => a.status === 'in_review').length;
        const approved = adoptions.filter(a => a.status === 'approved').length;
        const rejected = adoptions.filter(a => a.status === 'rejected').length;

        // Count by pet type
        const petTypes = {};
        adoptions.forEach(a => {
            const type = a.petType || 'unknown';
            petTypes[type] = (petTypes[type] || 0) + 1;
        });

        // Calculate rates
        const processedCount = approved + rejected;
        const approvalRate = processedCount > 0 ? Math.round((approved / processedCount) * 100) : 0;
        const pendingRate = adoptions.length > 0 ? Math.round(((pending + inReview) / adoptions.length) * 100) : 0;

        // Calculate trend (simplified - comparing last 30 days to previous 30 days)
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

        const recentAdoptions = adoptions.filter(a => new Date(a.createdAt) >= thirtyDaysAgo);
        const previousAdoptions = adoptions.filter(a => {
            const date = new Date(a.createdAt);
            return date >= sixtyDaysAgo && date < thirtyDaysAgo;
        });

        const recentTrend = previousAdoptions.length > 0
            ? Math.round(((recentAdoptions.length - previousAdoptions.length) / previousAdoptions.length) * 100)
            : (recentAdoptions.length > 0 ? 100 : 0);

        return {
            total: adoptions.length,
            pending,
            inReview,
            approved,
            rejected,
            petTypes,
            pendingRate,
            approvalRate,
            recentTrend
        };
    }, [adoptions]);

    // Format pet types for display - get top 4 and sum others
    const formattedPetTypes = useMemo(() => {
        if (!stats.petTypes || Object.keys(stats.petTypes).length === 0) {
            return [];
        }

        // Sort pet types by count
        const sortedTypes = Object.entries(stats.petTypes)
            .sort((a, b) => b[1] - a[1]);

        // Take top 4
        const topTypes = sortedTypes.slice(0, 4);

        // Sum others
        const otherCount = sortedTypes.slice(4).reduce((sum, [_, count]) => sum + count, 0);

        // Format results
        const result = topTypes.map(([type, count]) => ({
            name: type.charAt(0).toUpperCase() + type.slice(1),
            count,
            percentage: Math.round((count / stats.total) * 100)
        }));

        // Add others if any
        if (otherCount > 0) {
            result.push({
                name: 'Other',
                count: otherCount,
                percentage: Math.round((otherCount / stats.total) * 100)
            });
        }

        return result;
    }, [stats.petTypes, stats.total]);

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-tealcustom" />
                Adoption Statistics
            </h3>

            {/* Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-blue-500 font-semibold">{stats.total}</div>
                    <div className="text-sm text-gray-600">Total Applications</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="text-yellow-500 font-semibold">{stats.pending + stats.inReview}</div>
                    <div className="text-sm text-gray-600">Pending</div>
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

            {/* Detailed Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h4 className="text-sm font-medium text-gray-500 uppercase mb-3">Applications by Status</h4>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium flex items-center">
                                    <Clock className="h-4 w-4 mr-1 text-yellow-500" />
                                    Pending
                                </span>
                                <span className="text-sm text-gray-500">{stats.pending} ({Math.round((stats.pending / stats.total) * 100) || 0}%)</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-yellow-500 h-2 rounded-full"
                                    style={{ width: `${Math.round((stats.pending / stats.total) * 100) || 0}%` }}
                                ></div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium flex items-center">
                                    <AlertTriangle className="h-4 w-4 mr-1 text-blue-500" />
                                    In Review
                                </span>
                                <span className="text-sm text-gray-500">{stats.inReview} ({Math.round((stats.inReview / stats.total) * 100) || 0}%)</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-blue-500 h-2 rounded-full"
                                    style={{ width: `${Math.round((stats.inReview / stats.total) * 100) || 0}%` }}
                                ></div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium flex items-center">
                                    <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                                    Approved
                                </span>
                                <span className="text-sm text-gray-500">{stats.approved} ({Math.round((stats.approved / stats.total) * 100) || 0}%)</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-green-500 h-2 rounded-full"
                                    style={{ width: `${Math.round((stats.approved / stats.total) * 100) || 0}%` }}
                                ></div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium flex items-center">
                                    <XCircle className="h-4 w-4 mr-1 text-red-500" />
                                    Rejected
                                </span>
                                <span className="text-sm text-gray-500">{stats.rejected} ({Math.round((stats.rejected / stats.total) * 100) || 0}%)</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-red-500 h-2 rounded-full"
                                    style={{ width: `${Math.round((stats.rejected / stats.total) * 100) || 0}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <h4 className="text-sm font-medium text-gray-500 uppercase mb-3">Applications by Pet Type</h4>
                    {formattedPetTypes.length > 0 ? (
                        <div className="space-y-4">
                            {formattedPetTypes.map((type, index) => (
                                <div key={index}>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-sm font-medium">{type.name}</span>
                                        <span className="text-sm text-gray-500">{type.count} ({type.percentage}%)</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-tealcustom h-2 rounded-full"
                                            style={{ width: `${type.percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 py-4">No data available</div>
                    )}
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t">
                <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">Pending Rate</div>
                    <div className="text-xl font-semibold">{stats.pendingRate}%</div>
                    <div className="text-xs text-gray-500">Applications awaiting decision</div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">Approval Rate</div>
                    <div className="text-xl font-semibold">{stats.approvalRate}%</div>
                    <div className="text-xs text-gray-500">Of processed applications</div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">30-Day Trend</div>
                    <div className={`text-xl font-semibold flex items-center ${
                        stats.recentTrend > 0 ? 'text-green-500' :
                            stats.recentTrend < 0 ? 'text-red-500' : 'text-gray-500'
                    }`}>
                        {stats.recentTrend > 0 ? (
                            <ArrowUp className="h-4 w-4 mr-1" />
                        ) : stats.recentTrend < 0 ? (
                            <ArrowDown className="h-4 w-4 mr-1" />
                        ) : null}
                        {Math.abs(stats.recentTrend)}%
                    </div>
                    <div className="text-xs text-gray-500">
                        {stats.recentTrend > 0 ? 'Increase' : stats.recentTrend < 0 ? 'Decrease' : 'No change'} from previous period
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdoptionStatistics;