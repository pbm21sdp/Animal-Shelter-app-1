import React from 'react';
import blobStyles from '../styles/blobStyles';

function Blob({ type, children, className = '' }) {
    const style = {
        ...blobStyles.base,
        ...blobStyles[type],
        position: 'absolute',
        width: '100%',
        height: '100%'
    };

    return (
        <div className={`relative ${className}`}>
            <div style={style}></div>
            {children && <div className="relative z-10">{children}</div>}
        </div>
    );
}

export default Blob;
