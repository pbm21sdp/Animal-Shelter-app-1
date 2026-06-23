import React from 'react';
import { Search } from 'lucide-react';

const AdminSearchBar = ({ value, onChange, placeholder = 'Search...' }) => {
    return (
        <div style={{ position: 'relative', flexShrink: 0 }}>
            <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                style={{
                    padding: '6px 12px 6px 30px',
                    border: '1px solid rgba(45,31,20,0.15)',
                    borderRadius: '100px',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '12px',
                    color: '#7A5C44',
                    backgroundColor: '#FAF7F4',
                    outline: 'none',
                    width: '190px',
                    transition: 'border-color 0.15s',
                }}
                onFocus={e => { e.target.style.borderColor = '#C07A4A'; }}
                onBlur={e  => { e.target.style.borderColor = 'rgba(45,31,20,0.15)'; }}
            />
            <Search style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '13px',
                height: '13px',
                color: '#B09880',
                pointerEvents: 'none',
            }} />
        </div>
    );
};

export default AdminSearchBar;
