import React, { useState } from 'react';
import { Heart, X } from 'lucide-react';

const DonationModal = ({ isOpen, onClose, onDonate }) => {
    const [selectedAmount, setSelectedAmount] = useState(10);
    const [customAmount, setCustomAmount] = useState('');
    const [isCustom, setIsCustom] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const donationOptions = [1, 5, 10, 25, 50, 100];

    const handleAmountSelect = (amount) => {
        setSelectedAmount(amount);
        setIsCustom(false);
    };

    const handleCustomSelect = () => {
        setIsCustom(true);
        setSelectedAmount(0);
    };

    const handleCustomAmountChange = (e) => {
        const value = e.target.value.replace(/[^0-9.]/g, '');
        if (value.split('.').length > 2) return;
        setCustomAmount(value);
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            const amountToCharge = isCustom ? parseFloat(customAmount) : selectedAmount;
            if (!amountToCharge || amountToCharge <= 0) {
                alert('Please enter a valid donation amount');
                setIsLoading(false);
                return;
            }
            await onDonate(Math.round(amountToCharge * 100));
        } catch (error) {
            console.error('Donation error:', error);
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                        <Heart className="text-red-500 mr-2 h-6 w-6" />
                        Support Our Cause
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <p className="text-gray-600 mb-6">
                    Your generosity helps us provide care for animals in need and find them loving homes.
                </p>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Donation Amount (EUR)
                    </label>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                        {donationOptions.map((amount) => (
                            <button
                                key={amount}
                                onClick={() => handleAmountSelect(amount)}
                                className={`py-3 px-4 rounded-md transition-colors ${
                                    selectedAmount === amount && !isCustom
                                        ? 'bg-teal-600 text-white'
                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                                }`}
                            >
                                €{amount}
                            </button>
                        ))}
                    </div>

                    <div
                        className={`flex items-center p-3 rounded-md cursor-pointer mb-4 ${
                            isCustom ? 'bg-teal-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                        }`}
                        onClick={handleCustomSelect}
                    >
                        <span className="flex-1">Custom Amount</span>
                        {isCustom && (
                            <input
                                type="text"
                                value={customAmount}
                                onChange={handleCustomAmountChange}
                                placeholder="0.00"
                                className="ml-2 p-1 w-24 rounded bg-white text-gray-800 border border-gray-300 focus:outline-none focus:border-teal-500"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                            />
                        )}
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={onClose}
                        className="py-2.5 px-5 me-2 text-sm font-medium text-gray-900 bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:outline-none disabled:opacity-50"
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="py-2.5 px-5 text-sm font-medium text-white bg-tealcustom rounded-lg border border-tealcustom hover:bg-teal-700 focus:z-10 focus:ring-4 focus:outline-none focus:ring-teal-300 inline-flex items-center disabled:opacity-70"
                    >
                        {isLoading ? (
                            <>
                                <svg aria-hidden="true" role="status" className="inline w-4 h-4 me-3 text-white animate-spin" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                                    <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="#FFFFFF"/>
                                </svg>
                                Processing...
                            </>
                        ) : (
                            <>
                                <span className="mr-2">Donate</span>
                                <Heart className="h-4 w-4" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DonationModal;