import React, { useState, useEffect } from 'react';
import { useAdoptionStore } from '../store/adoptionStore';
import { Clock, PawPrint, CheckCircle, XCircle, AlertTriangle, ChevronRight, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UserAdoptionHistoryPanel = () => {
    const { userAdoptions, getUserAdoptions, isLoading, error } = useAdoptionStore();
    const [expandedId, setExpandedId] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        getUserAdoptions();
    }, [getUserAdoptions]);

    // Format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Status badge styling
    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending':
                return {
                    icon: <Clock className="h-4 w-4 mr-1" />,
                    text: 'Pending',
                    bgColor: 'bg-yellow-100',
                    textColor: 'text-yellow-800'
                };
            case 'in_review':
                return {
                    icon: <AlertTriangle className="h-4 w-4 mr-1" />,
                    text: 'In Review',
                    bgColor: 'bg-blue-100',
                    textColor: 'text-blue-800'
                };
            case 'approved':
                return {
                    icon: <CheckCircle className="h-4 w-4 mr-1" />,
                    text: 'Approved',
                    bgColor: 'bg-green-100',
                    textColor: 'text-green-800'
                };
            case 'rejected':
                return {
                    icon: <XCircle className="h-4 w-4 mr-1" />,
                    text: 'Rejected',
                    bgColor: 'bg-red-100',
                    textColor: 'text-red-800'
                };
            default:
                return {
                    icon: <Clock className="h-4 w-4 mr-1" />,
                    text: status,
                    bgColor: 'bg-gray-100',
                    textColor: 'text-gray-800'
                };
        }
    };

    // Toggle expanded adoption
    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    // Navigate to pet details
    const goToPetDetails = (petId) => {
        navigate(`/pet/${petId}`);
    };

    if (isLoading) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                    <PawPrint className="h-5 w-5 mr-2 text-tealcustom" />
                    My Adoption Applications
                </h2>
                <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-tealcustom"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                    <PawPrint className="h-5 w-5 mr-2 text-tealcustom" />
                    My Adoption Applications
                </h2>
                <div className="bg-red-100 text-red-700 p-4 rounded-md">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
                <PawPrint className="h-5 w-5 mr-2 text-tealcustom" />
                My Adoption Applications
            </h2>

            {userAdoptions.length === 0 ? (
                <div className="text-center py-8">
                    <div className="mb-4">
                        <PawPrint className="h-12 w-12 mx-auto text-gray-300" />
                    </div>
                    <p className="text-gray-500 mb-4">You haven't submitted any adoption applications yet.</p>
                    <button
                        onClick={() => navigate('/pet-search')}
                        className="bg-tealcustom hover:bg-teal-700 text-white px-4 py-2 rounded-md flex items-center mx-auto"
                    >
                        <Search className="h-4 w-4 mr-2" />
                        Find a Pet to Adopt
                    </button>
                </div>
            ) : (
                <div className="divide-y divide-gray-200">
                    {userAdoptions.map((adoption) => {
                        const statusBadge = getStatusBadge(adoption.status);
                        const isExpanded = expandedId === adoption._id;

                        return (
                            <div key={adoption._id} className="py-4">
                                <div
                                    className="flex justify-between items-center cursor-pointer"
                                    onClick={() => toggleExpand(adoption._id)}
                                >
                                    <div className="flex items-center">
                                        <div
                                            className={`${statusBadge.bgColor} ${statusBadge.textColor} py-1 px-2 rounded-md flex items-center mr-3`}
                                        >
                                            {statusBadge.icon}
                                            {statusBadge.text}
                                        </div>
                                        <div>
                                            <h3 className="font-medium">{adoption.petName}</h3>
                                            <p className="text-sm text-gray-500">
                                                Applied on {formatDate(adoption.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                    <div>
                                        <ChevronRight
                                            className={`h-5 w-5 text-gray-400 transition-transform ${
                                                isExpanded ? 'transform rotate-90' : ''
                                            }`}
                                        />
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="mt-4 pl-4 border-l-2 border-gray-200">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-500">Pet Information</h4>
                                                <p className="text-sm">
                                                    <span className="font-medium">Type:</span> {adoption.petType}
                                                </p>
                                                {adoption.petBreed && (
                                                    <p className="text-sm">
                                                        <span className="font-medium">Breed:</span> {adoption.petBreed}
                                                    </p>
                                                )}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        goToPetDetails(adoption.petId);
                                                    }}
                                                    className="mt-2 text-tealcustom hover:text-teal-700 text-sm flex items-center"
                                                >
                                                    View Pet Details
                                                    <ChevronRight className="h-4 w-4 ml-1" />
                                                </button>
                                            </div>

                                            <div>
                                                <h4 className="text-sm font-medium text-gray-500">Application Details</h4>
                                                <p className="text-sm">
                                                    <span className="font-medium">Application Date:</span> {formatDate(adoption.createdAt)}
                                                </p>
                                                <p className="text-sm">
                                                    <span className="font-medium">Status:</span> {statusBadge.text}
                                                </p>
                                            </div>
                                        </div>

                                        {adoption.status === 'approved' && (
                                            <div className="bg-green-50 p-4 rounded-md mb-4">
                                                <p className="text-green-800 text-sm font-medium mb-2">
                                                    Congratulations! Your adoption application has been approved.
                                                </p>
                                                <p className="text-green-700 text-sm">
                                                    Our shelter will contact you soon with next steps.
                                                </p>
                                            </div>
                                        )}

                                        {adoption.status === 'rejected' && (
                                            <div className="bg-red-50 p-4 rounded-md mb-4">
                                                <p className="text-red-800 text-sm font-medium mb-2">
                                                    Unfortunately, your adoption application was not approved.
                                                </p>
                                                <p className="text-red-700 text-sm">
                                                    Please check your email for more information, or contact the shelter directly.
                                                </p>
                                            </div>
                                        )}

                                        {(adoption.status === 'pending' || adoption.status === 'in_review') && (
                                            <div className="bg-blue-50 p-4 rounded-md mb-4">
                                                <p className="text-blue-800 text-sm font-medium mb-2">
                                                    Your application is {adoption.status === 'pending' ? 'pending review' : 'being reviewed'}.
                                                </p>
                                                <p className="text-blue-700 text-sm">
                                                    We'll notify you via email when there's an update on your application status.
                                                </p>
                                            </div>
                                        )}

                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500 mb-2">Your Provided Information</h4>

                                            <div className="space-y-2 text-sm text-gray-700">
                                                <div>
                                                    <span className="font-medium">Living Arrangement:</span> {adoption.livingArrangement}
                                                </div>

                                                <div>
                                                    <span className="font-medium">Has Children:</span> {adoption.hasChildren ? 'Yes' : 'No'}
                                                </div>

                                                <div>
                                                    <span className="font-medium">Has Other Pets:</span> {adoption.hasOtherPets ? 'Yes' : 'No'}
                                                </div>

                                                {adoption.hasOtherPets && adoption.otherPetsDetails && (
                                                    <div>
                                                        <span className="font-medium">Other Pets:</span> {adoption.otherPetsDetails}
                                                    </div>
                                                )}

                                                <div>
                                                    <span className="font-medium">Time Availability:</span> {adoption.timeAvailability}
                                                </div>

                                                <div>
                                                    <span className="font-medium">Adoption Reason:</span> {adoption.adoptionReason}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default UserAdoptionHistoryPanel;