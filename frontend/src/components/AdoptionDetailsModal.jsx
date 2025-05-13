// Create components/AdoptionDetailsModal.jsx
import React from 'react';
import { X, Check, XCircle, Clock, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdoptionDetailsModal = ({ adoption, onClose }) => {
    const navigate = useNavigate();

    if (!adoption) return null;

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'bg-green-100 text-green-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            case 'in_review': return 'bg-blue-100 text-blue-800';
            default: return 'bg-yellow-100 text-yellow-800';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'approved': return <CheckCircle className="h-5 w-5" />;
            case 'rejected': return <XCircle className="h-5 w-5" />;
            case 'in_review': return <AlertTriangle className="h-5 w-5" />;
            default: return <Clock className="h-5 w-5" />;
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'approved': return 'Approved';
            case 'rejected': return 'Rejected';
            case 'in_review': return 'In Review';
            default: return 'Pending';
        }
    };

    const handleViewPet = () => {
        navigate(`/pet/${adoption.petId}`);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                <div className="border-b px-6 py-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold">Adoption Application Details</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="p-6">
                    {/* Status Banner */}
                    <div className={`mb-6 px-4 py-3 rounded-lg ${getStatusColor(adoption.status)}`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                {getStatusIcon(adoption.status)}
                                <span className="ml-2 font-medium">
                                    Status: {getStatusText(adoption.status)}
                                </span>
                            </div>
                            <span className="text-sm">
                                Applied: {new Date(adoption.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                    </div>

                    {/* Pet Information */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-3">Pet Information</h3>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-gray-600 text-sm">Name:</span>
                                    <span className="ml-2 text-gray-900 font-medium">{adoption.petName}</span>
                                </div>
                                <div>
                                    <span className="text-gray-600 text-sm">Type:</span>
                                    <span className="ml-2 text-gray-900">{adoption.petType}</span>
                                </div>
                                {adoption.petBreed && (
                                    <div>
                                        <span className="text-gray-600 text-sm">Breed:</span>
                                        <span className="ml-2 text-gray-900">{adoption.petBreed}</span>
                                    </div>
                                )}
                                <div>
                                    <span className="text-gray-600 text-sm">ID:</span>
                                    <span className="ml-2 text-gray-900">{adoption.petId}</span>
                                </div>
                            </div>
                            <button
                                onClick={handleViewPet}
                                className="mt-3 bg-tealcustom hover:bg-teal-700 text-white px-4 py-2 rounded-md flex items-center text-sm"
                            >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                View Pet Details
                            </button>
                        </div>
                    </div>

                    {/* Application Details */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-3">Application Details</h3>
                        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                            {adoption.livingArrangement && (
                                <div>
                                    <span className="text-gray-600 text-sm">Living Arrangement:</span>
                                    <span className="ml-2 text-gray-900">{adoption.livingArrangement}</span>
                                </div>
                            )}
                            {adoption.adoptionReason && (
                                <div>
                                    <span className="text-gray-600 text-sm">Reason for Adoption:</span>
                                    <p className="mt-1 text-gray-900">{adoption.adoptionReason}</p>
                                </div>
                            )}
                            {adoption.notes && (
                                <div>
                                    <span className="text-gray-600 text-sm">Additional Notes:</span>
                                    <p className="mt-1 text-gray-900">{adoption.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Rejection Reason */}
                    {adoption.status === 'rejected' && adoption.adminNotes && (
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-3 text-red-700">Rejection Reason</h3>
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <p className="text-red-900">{adoption.adminNotes}</p>
                            </div>
                        </div>
                    )}

                    {/* Admin Notes for other statuses */}
                    {adoption.status !== 'rejected' && adoption.adminNotes && (
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-3">Admin Notes</h3>
                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-gray-900">{adoption.adminNotes}</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="border-t px-6 py-4 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdoptionDetailsModal;