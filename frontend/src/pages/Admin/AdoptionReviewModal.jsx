// Fixes for AdoptionReviewModal.jsx
// This fixes the home visit agreement issue and application reason display

import React, { useState, useEffect } from 'react';
import { useAdoptionStore } from '../../store/adoptionStore';
import axios from 'axios'; // Make sure to import axios
import { Check, X, AlertCircle, ExternalLink, User, PawPrint, Home, MessageSquare, Clock } from 'lucide-react';
import AdminModal from './shared/AdminModal';

const AdoptionReviewModal = ({ adoption, isOpen, onClose, onStatusChange }) => {
    const { updateAdoptionStatus, isLoading, error } = useAdoptionStore();
    const [selectedStatus, setSelectedStatus] = useState(adoption?.status || 'pending');
    const [adminNotes, setAdminNotes] = useState(adoption?.adminNotes || '');
    const [updateSuccess, setUpdateSuccess] = useState(false);
    const [userData, setUserData] = useState(null);

    // Fetch user data if adoption.user is just an ID string
    useEffect(() => {
        // Only fetch if adoption exists and user is a string ID
        if (adoption && typeof adoption.user === 'string') {
            const fetchUserData = async () => {
                try {
                    const response = await axios.get(`http://localhost:5000/api/users/admin/${adoption.user}`, {
                        withCredentials: true
                    });

                    if (response.data.success) {
                        setUserData(response.data.user);
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                }
            };

            fetchUserData();
        }
    }, [adoption]);

    // If no adoption is provided, don't render
    if (!adoption) return null;

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

    // Get user information, either from populated object or fetched data
    const getUserName = () => {
        if (typeof adoption.user === 'object' && adoption.user?.name) {
            return adoption.user.name;
        } else if (userData?.name) {
            return userData.name;
        } else if (adoption.fullName) {
            return adoption.fullName;
        }
        return 'Unknown';
    };

    const getUserEmail = () => {
        if (typeof adoption.user === 'object' && adoption.user?.email) {
            return adoption.user.email;
        } else if (userData?.email) {
            return userData.email;
        } else if (adoption.email) {
            return adoption.email;
        }
        return 'Not available';
    };

    // Handle status update
    const handleStatusUpdate = async () => {
        try {
            const result = await updateAdoptionStatus(adoption._id, {
                status: selectedStatus,
                adminNotes: adminNotes
            });

            if (result.success) {
                setUpdateSuccess(true);

                // Reset success message after 2 seconds
                setTimeout(() => {
                    setUpdateSuccess(false);
                }, 2000);

                // Notify parent component about the status change
                if (onStatusChange) {
                    onStatusChange(result.adoption);
                }
            }
        } catch (err) {
            console.error('Error updating adoption status:', err);
        }
    };

    // Status badge styling
    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'in_review':
                return 'bg-blue-100 text-blue-800';
            case 'approved':
                return 'bg-green-100 text-green-800';
            case 'rejected':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    // Status display text
    const getStatusDisplayText = (status) => {
        switch (status) {
            case 'pending':
                return 'Pending';
            case 'in_review':
                return 'In Review';
            case 'approved':
                return 'Approved';
            case 'rejected':
                return 'Rejected';
            default:
                return status;
        }
    };

    return (
        <AdminModal
            isOpen={isOpen}
            onClose={onClose}
            title={`Review Adoption Application #${adoption._id.substring(0, 8)}`}
            size="lg"
        >
            <div className="p-6">
                {/* Status Banner */}
                <div className={`px-4 py-2 mb-6 rounded-md ${getStatusBadgeClass(adoption.status)} flex justify-between items-center`}>
                    <div className="flex items-center">
                        <span className="font-medium">Status: {getStatusDisplayText(adoption.status)}</span>
                    </div>
                    <div className="text-sm">
                        <span>Application Date: {formatDate(adoption.createdAt)}</span>
                    </div>
                </div>

                {/* Success/Error Messages */}
                {updateSuccess && (
                    <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-md flex items-center">
                        <Check className="h-5 w-5 mr-2" />
                        <span>Status updated successfully!</span>
                    </div>
                )}

                {error && (
                    <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md flex items-center">
                        <AlertCircle className="h-5 w-5 mr-2" />
                        <span>{error}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Pet Information */}
                    <div>
                        <h3 className="text-lg font-semibold mb-3 flex items-center">
                            <PawPrint className="h-5 w-5 mr-2 text-tealcustom" />
                            Pet Information
                        </h3>
                        <div className="bg-gray-50 rounded-md p-4">
                            <div className="mb-2">
                                <span className="text-gray-600 text-sm">Pet ID:</span>
                                <span className="ml-2 text-gray-900">{adoption.petId}</span>
                            </div>
                            <div className="mb-2">
                                <span className="text-gray-600 text-sm">Name:</span>
                                <span className="ml-2 text-gray-900">{adoption.petName}</span>
                            </div>
                            <div className="mb-2">
                                <span className="text-gray-600 text-sm">Type:</span>
                                <span className="ml-2 text-gray-900">{adoption.petType}</span>
                            </div>
                            {adoption.petBreed && (
                                <div className="mb-2">
                                    <span className="text-gray-600 text-sm">Breed:</span>
                                    <span className="ml-2 text-gray-900">{adoption.petBreed}</span>
                                </div>
                            )}
                            <div className="mt-3">
                                <button
                                    onClick={() => window.open(`/pet/${adoption.petId}`, '_blank')}
                                    className="text-tealcustom hover:text-teal-700 flex items-center text-sm"
                                >
                                    <ExternalLink className="h-4 w-4 mr-1" />
                                    View Pet Details
                                </button>
                            </div>
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
                                <span className="text-gray-600 text-sm">User ID:</span>
                                <span className="ml-2 text-gray-900">{typeof adoption.user === 'object' ? adoption.user._id : adoption.user}</span>
                            </div>
                            <div className="mb-2">
                                <span className="text-gray-600 text-sm">Name:</span>
                                <span className="ml-2 text-gray-900">{getUserName()}</span>
                            </div>
                            <div className="mb-2">
                                <span className="text-gray-600 text-sm">Email:</span>
                                <span className="ml-2 text-gray-900">{getUserEmail()}</span>
                            </div>
                            <div className="mb-2">
                                <span className="text-gray-600 text-sm">Application Date:</span>
                                <span className="ml-2 text-gray-900">{formatDate(adoption.applicationDate || adoption.createdAt)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Living Situation */}
                <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                        <Home className="h-5 w-5 mr-2 text-tealcustom" />
                        Living Situation
                    </h3>
                    <div className="bg-gray-50 rounded-md p-4">
                        <div className="mb-4">
                            <div className="text-gray-600 text-sm mb-1">Living Arrangement:</div>
                            <p className="text-gray-900">{adoption.livingArrangement || 'Not specified'}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <div className="text-gray-600 text-sm mb-1">Has Children:</div>
                                <p className="text-gray-900">
                                    {adoption.hasChildren === true || adoption.hasChildren === 'true' || adoption.hasChildren === 'yes' ? 'Yes' : 'No'}
                                </p>
                            </div>

                            <div>
                                <div className="text-gray-600 text-sm mb-1">Has Other Pets:</div>
                                <p className="text-gray-900">
                                    {adoption.hasOtherPets === true || adoption.hasOtherPets === 'true' || adoption.hasOtherPets === 'yes' ? 'Yes' : 'No'}
                                </p>
                            </div>
                        </div>

                        {(adoption.hasOtherPets === true || adoption.hasOtherPets === 'true' || adoption.hasOtherPets === 'yes') && adoption.otherPetsDetails && (
                            <div className="mt-3">
                                <div className="text-gray-600 text-sm mb-1">Other Pets Details:</div>
                                <p className="text-gray-900">{adoption.otherPetsDetails}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Availability & Experience */}
                <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                        <Clock className="h-5 w-5 mr-2 text-tealcustom" />
                        Availability & Experience
                    </h3>
                    <div className="bg-gray-50 rounded-md p-4">
                        <div className="mb-4">
                            <div className="text-gray-600 text-sm mb-1">Time Availability:</div>
                            <p className="text-gray-900">{adoption.timeAvailability || 'Not specified'}</p>
                        </div>

                        {adoption.veterinarianInfo && (
                            <div className="mb-4">
                                <div className="text-gray-600 text-sm mb-1">Veterinarian Information:</div>
                                <p className="text-gray-900">{adoption.veterinarianInfo}</p>
                            </div>
                        )}

                        <div className="mb-4">
                            <div className="text-gray-600 text-sm mb-1">Home Visit Agreement:</div>
                            <p className="text-gray-900">
                                {adoption.homeVisitAgreement === true ||
                                adoption.homeVisitAgreement === 'true' ||
                                adoption.homeVisitAgreement === 'yes' ?
                                    'Agreed' : 'Not agreed'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Application Reason */}
                <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                        <MessageSquare className="h-5 w-5 mr-2 text-tealcustom" />
                        Application Reason
                    </h3>
                    <div className="bg-gray-50 rounded-md p-4">
                        <div className="mb-4">
                            <div className="text-gray-600 text-sm mb-1">Adoption Reason:</div>
                            <p className="text-gray-900">{adoption.adoptionReason || adoption.message || 'No reason provided'}</p>
                        </div>

                        {adoption.notes && (
                            <div>
                                <div className="text-gray-600 text-sm mb-1">Additional Notes:</div>
                                <p className="text-gray-900">{adoption.notes}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Administrative Section */}
                <div className="border-t pt-6 mt-6">
                    <h3 className="text-lg font-semibold mb-4">Admin Decision</h3>

                    <div className="mb-4">
                        <label htmlFor="adoptionStatus" className="block text-sm font-medium mb-1">
                            Update Status
                        </label>
                        <select
                            id="adoptionStatus"
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md"
                        >
                            <option value="pending">Pending</option>
                            <option value="in_review">In Review</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>

                    <div className="mb-6">
                        <label htmlFor="adminNotes" className="block text-sm font-medium mb-1">
                            Admin Notes
                        </label>
                        <textarea
                            id="adminNotes"
                            value={adminNotes}
                            onChange={(e) => setAdminNotes(e.target.value)}
                            rows="3"
                            placeholder="Add notes about your decision (will not be shared with applicant)"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md"
                        ></textarea>
                    </div>

                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded"
                        >
                            Close
                        </button>
                        <button
                            type="button"
                            onClick={handleStatusUpdate}
                            disabled={isLoading || selectedStatus === adoption.status && adminNotes === adoption.adminNotes}
                            className={`px-4 py-2 bg-tealcustom hover:bg-teal-700 text-white rounded flex items-center ${
                                isLoading || (selectedStatus === adoption.status && adminNotes === adoption.adminNotes)
                                    ? 'opacity-50 cursor-not-allowed'
                                    : ''
                            }`}
                        >
                            {isLoading ? (
                                <>Processing...</>
                            ) : (
                                <>
                                    <Check className="h-4 w-4 mr-2" />
                                    Update Status
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </AdminModal>
    );
};

export default AdoptionReviewModal;