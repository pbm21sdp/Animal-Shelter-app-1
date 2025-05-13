// components/MessageDetailsModal.jsx
import React from 'react';
import { X } from 'lucide-react';

const MessageDetailsModal = ({ message, userInfo, onClose }) => {
    if (!message) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                <div className="border-b px-6 py-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold">Message Details</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="text-sm font-medium text-gray-500">From</label>
                            <p className="text-gray-900">{message.name || userInfo?.name || 'You'}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">To</label>
                            <p className="text-gray-900">Animal Shelter Staff</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">Email</label>
                            <p className="text-gray-900">{message.email}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">Date</label>
                            <p className="text-gray-900">
                                {new Date(message.createdAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="text-sm font-medium text-gray-500">Status</label>
                        <div className="mt-1">
              <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                  message.read
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
              }`}>
                {message.read ? 'Read by staff' : 'Pending review'}
              </span>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-500">Message</label>
                        <div className="mt-1 bg-gray-50 rounded-lg p-4">
                            <p className="text-gray-900 whitespace-pre-wrap">{message.message}</p>
                        </div>
                    </div>
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

export default MessageDetailsModal;