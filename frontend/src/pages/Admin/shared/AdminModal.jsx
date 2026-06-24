import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const sizeMap = {
    sm: '440px',
    md: '672px',
    lg: '960px',
    xl: '1200px',
};

const AdminModal = ({ isOpen, onClose, title, children, size = 'lg' }) => {
    useEffect(() => {
        const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
        if (isOpen) document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 50,
                backgroundColor: 'rgba(45,31,20,0.45)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '16px',
            }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div style={{
                backgroundColor: '#FFFAF7',
                border: '1px solid rgba(45,31,20,0.1)',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(45,31,20,0.12)',
                width: '100%',
                maxWidth: sizeMap[size] || sizeMap.lg,
                maxHeight: '90vh',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
            }}>
                {/* Header */}
                <div style={{
                    position: 'sticky', top: 0,
                    backgroundColor: '#FFFAF7',
                    borderBottom: '1px solid rgba(45,31,20,0.1)',
                    padding: '16px 20px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    zIndex: 1,
                }}>
                    <h3 style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: '20px',
                        fontWeight: 600,
                        color: '#2D1F14',
                        margin: 0,
                    }}>
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        aria-label="Close modal"
                        style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: '#B09880', padding: '4px', borderRadius: '4px',
                            display: 'flex', alignItems: 'center',
                            transition: 'color 0.12s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#2D1F14'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#B09880'; }}
                    >
                        <X style={{ width: '18px', height: '18px' }} />
                    </button>
                </div>

                {children}
            </div>
        </div>
    );
};

export default AdminModal;
