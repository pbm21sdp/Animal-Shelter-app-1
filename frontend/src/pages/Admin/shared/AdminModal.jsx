// components/Admin/shared/AdminModal.jsx
import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const AdminModal = ({ isOpen, onClose, title, children, size = 'lg' }) => {
    // Close modal on escape key
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEsc);
        }

        return () => {
            document.removeEventListener('keydown', handleEsc);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const modalSizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-2xl',
        lg: 'max-w-5xl',
        xl: 'max-w-7xl',
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`bg-white rounded-lg w-full ${modalSizeClasses[size] || modalSizeClasses.lg} max-h-screen overflow-y-auto`}>
                <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-xl font-bold">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 p-2"
                        style={{ touchAction: 'manipulation' }}
                        aria-label="Close modal"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
};

export default AdminModal;