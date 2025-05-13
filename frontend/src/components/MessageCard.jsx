// components/MessageCard.jsx
import React from 'react';

const MessageCard = ({ message, userInfo, onClick }) => {
    return (
        <div
            className="border border-gray-200 rounded-lg p-4 hover:border-teal-300 transition-colors cursor-pointer"
            onClick={() => onClick(message)}
        >
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h3 className="font-semibold">Message to Animal Shelter Staff</h3>
                    <p className="text-sm text-gray-500">
                        From: {message.name || userInfo?.name || 'You'}
                    </p>
                </div>
                <span className="text-sm text-gray-500">
          {new Date(message.createdAt).toLocaleDateString()}
        </span>
            </div>
            <p className="text-gray-700 truncate">
                {message.message.length > 100
                    ? `${message.message.substring(0, 100)}...`
                    : message.message}
            </p>
            <div className="flex justify-between items-center mt-2">
        <span className={`text-xs px-2 py-1 rounded ${
            message.read ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
        }`}>
          {message.read ? 'Read by staff' : 'Pending'}
        </span>
                <span className="text-xs text-gray-400">Click to view details</span>
            </div>
        </div>
    );
};

export default MessageCard;