import React, { useState } from 'react';
import { useAdoptionStore } from '../store/adoptionStore';
import { X, PawPrint, User, Home, MessageSquare } from 'lucide-react';

const UserAdoptionForm = ({ pet, onClose, onSuccess }) => {
    const { submitAdoption, isLoading, error } = useAdoptionStore();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        postalCode: '',
        housingType: '',
        hasYard: '',
        otherPets: '',
        children: '',
        previousPetExperience: '',
        message: ''
    });

    const [formErrors, setFormErrors] = useState({});
    const [submitStatus, setSubmitStatus] = useState('');

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user starts typing
        if (formErrors[name]) {
            setFormErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    // Validate form
    const validateForm = () => {
        const errors = {};

        if (!formData.fullName.trim()) errors.fullName = 'Full name is required';
        if (!formData.email.trim()) {
            errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'Invalid email format';
        }
        if (!formData.phone.trim()) errors.phone = 'Phone number is required';
        if (!formData.address.trim()) errors.address = 'Address is required';
        if (!formData.city.trim()) errors.city = 'City is required';
        if (!formData.postalCode.trim()) errors.postalCode = 'Postal code is required';
        if (!formData.housingType) errors.housingType = 'Please select housing type';
        if (!formData.hasYard) errors.hasYard = 'Please specify if you have a yard';
        if (!formData.otherPets) errors.otherPets = 'Please specify if you have other pets';

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setSubmitStatus('submitting');

        try {
            // Prepare submission data
            const submissionData = {
                ...formData,
                petId: pet.id,
                petName: pet.name,
                petType: pet.type,
                petBreed: pet.breed || ''
            };

            // Submit adoption application
            const result = await submitAdoption(submissionData);

            if (result && result.success) {
                setSubmitStatus('success');

                // Call onSuccess after 3 seconds if provided
                if (onSuccess) {
                    setTimeout(() => {
                        onSuccess(result.adoption);
                    }, 3000);
                }
            } else {
                setSubmitStatus('error');
            }
        } catch (err) {
            console.error('Error submitting adoption:', err);
            setSubmitStatus('error');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Adopt {pet.name}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    {/* Success/Error Messages */}
                    {submitStatus === 'success' && (
                        <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-lg">
                            Thank you for your application! We'll contact you soon.
                        </div>
                    )}

                    {submitStatus === 'error' && (
                        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
                            There was an error submitting your application. Please try again.
                        </div>
                    )}

                    {/* Display API error if any */}
                    {error && submitStatus !== 'error' && (
                        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
                            {error}
                        </div>
                    )}

                    {/* Personal Information */}
                    <div className="mb-8">
                        <h3 className="text-xl font-semibold mb-4 flex items-center">
                            <User className="h-5 w-5 mr-2" />
                            Personal Information
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Full Name *</label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-2 border rounded-md ${
                                        formErrors.fullName ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                />
                                {formErrors.fullName && (
                                    <p className="text-red-500 text-sm mt-1">{formErrors.fullName}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Email *</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-2 border rounded-md ${
                                        formErrors.email ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                />
                                {formErrors.email && (
                                    <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Phone *</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-2 border rounded-md ${
                                        formErrors.phone ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                />
                                {formErrors.phone && (
                                    <p className="text-red-500 text-sm mt-1">{formErrors.phone}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Address Information */}
                    <div className="mb-8">
                        <h3 className="text-xl font-semibold mb-4 flex items-center">
                            <Home className="h-5 w-5 mr-2" />
                            Living Situation
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-1">Address *</label>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-2 border rounded-md ${
                                        formErrors.address ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                />
                                {formErrors.address && (
                                    <p className="text-red-500 text-sm mt-1">{formErrors.address}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">City *</label>
                                <input
                                    type="text"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-2 border rounded-md ${
                                        formErrors.city ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                />
                                {formErrors.city && (
                                    <p className="text-red-500 text-sm mt-1">{formErrors.city}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Postal Code *</label>
                                <input
                                    type="text"
                                    name="postalCode"
                                    value={formData.postalCode}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-2 border rounded-md ${
                                        formErrors.postalCode ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                />
                                {formErrors.postalCode && (
                                    <p className="text-red-500 text-sm mt-1">{formErrors.postalCode}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Housing Type *</label>
                                <select
                                    name="housingType"
                                    value={formData.housingType}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-2 border rounded-md ${
                                        formErrors.housingType ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                >
                                    <option value="">Select housing type</option>
                                    <option value="house">House</option>
                                    <option value="apartment">Apartment</option>
                                    <option value="condo">Condo</option>
                                    <option value="other">Other</option>
                                </select>
                                {formErrors.housingType && (
                                    <p className="text-red-500 text-sm mt-1">{formErrors.housingType}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Do you have a yard? *</label>
                                <select
                                    name="hasYard"
                                    value={formData.hasYard}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-2 border rounded-md ${
                                        formErrors.hasYard ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                >
                                    <option value="">Select option</option>
                                    <option value="yes">Yes</option>
                                    <option value="no">No</option>
                                </select>
                                {formErrors.hasYard && (
                                    <p className="text-red-500 text-sm mt-1">{formErrors.hasYard}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Pet Experience */}
                    <div className="mb-8">
                        <h3 className="text-xl font-semibold mb-4 flex items-center">
                            <PawPrint className="h-5 w-5 mr-2" />
                            Pet Experience
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Do you have other pets? *</label>
                                <select
                                    name="otherPets"
                                    value={formData.otherPets}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-2 border rounded-md ${
                                        formErrors.otherPets ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                >
                                    <option value="">Select option</option>
                                    <option value="none">No other pets</option>
                                    <option value="dogs">Dogs</option>
                                    <option value="cats">Cats</option>
                                    <option value="both">Dogs and Cats</option>
                                    <option value="other">Other animals</option>
                                </select>
                                {formErrors.otherPets && (
                                    <p className="text-red-500 text-sm mt-1">{formErrors.otherPets}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Children in household?</label>
                                <select
                                    name="children"
                                    value={formData.children}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                                >
                                    <option value="">Select option</option>
                                    <option value="none">No children</option>
                                    <option value="young">Young children (0-5)</option>
                                    <option value="school">School age (6-12)</option>
                                    <option value="teens">Teenagers (13-17)</option>
                                    <option value="mixed">Mixed ages</option>
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-1">Previous Pet Experience</label>
                                <textarea
                                    name="previousPetExperience"
                                    value={formData.previousPetExperience}
                                    onChange={handleInputChange}
                                    rows="3"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                                    placeholder="Tell us about your experience with pets..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Additional Information */}
                    <div className="mb-8">
                        <h3 className="text-xl font-semibold mb-4 flex items-center">
                            <MessageSquare className="h-5 w-5 mr-2" />
                            Additional Information
                        </h3>

                        <div>
                            <label className="block text-sm font-medium mb-1">Why would you like to adopt {pet.name}?</label>
                            <textarea
                                name="message"
                                value={formData.message}
                                onChange={handleInputChange}
                                rows="4"
                                className="w-full px-4 py-2 border border-gray-300 rounded-md"
                                placeholder="Tell us why you'd be a great match for this pet..."
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitStatus === 'submitting' || isLoading}
                            className={`px-6 py-3 bg-tealcustom text-white rounded-md flex items-center ${
                                submitStatus === 'submitting' || isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-teal-700'
                            }`}
                        >
                            {submitStatus === 'submitting' || isLoading ? (
                                <>Submitting...</>
                            ) : (
                                <>
                                    Submit Application
                                    <PawPrint className="ml-2 h-5 w-5" />
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserAdoptionForm;