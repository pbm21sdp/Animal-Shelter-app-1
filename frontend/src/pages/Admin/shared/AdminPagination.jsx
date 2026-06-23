import React from 'react';

const sans = "'DM Sans', sans-serif";

const btnBase = {
    fontFamily: sans,
    fontSize: '12px',
    padding: '5px 10px',
    border: '1px solid rgba(45,31,20,0.15)',
    borderRadius: '6px',
    cursor: 'pointer',
    background: 'transparent',
    color: '#7A5C44',
    transition: 'background-color 0.12s, color 0.12s',
    lineHeight: 1.4,
};

const btnActive = {
    ...btnBase,
    backgroundColor: '#C07A4A',
    borderColor: '#C07A4A',
    color: '#FAF7F4',
    fontWeight: 500,
    cursor: 'default',
};

const AdminPagination = ({ itemsPerPage, totalItems, currentPage, paginate }) => {
    const pageNumbers = [];
    for (let i = 1; i <= Math.ceil(totalItems / itemsPerPage); i++) {
        pageNumbers.push(i);
    }

    let visiblePages = pageNumbers;
    if (pageNumbers.length > 5) {
        const startIndex = Math.max(0, currentPage - 3);
        const endIndex   = Math.min(pageNumbers.length, currentPage + 2);
        visiblePages = pageNumbers.slice(startIndex, endIndex);

        if (!visiblePages.includes(1)) {
            visiblePages.unshift(1);
            if (visiblePages[1] > 2) visiblePages.splice(1, 0, '...');
        }
        if (!visiblePages.includes(pageNumbers.length)) {
            if (visiblePages[visiblePages.length - 1] < pageNumbers.length - 1) visiblePages.push('...');
            visiblePages.push(pageNumbers.length);
        }
    }

    if (pageNumbers.length <= 1) return null;

    const hoverOn  = e => { if (e.currentTarget.dataset.active !== 'true') { e.currentTarget.style.backgroundColor = 'rgba(192,122,74,0.08)'; e.currentTarget.style.color = '#2D1F14'; }};
    const hoverOff = e => { if (e.currentTarget.dataset.active !== 'true') { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#7A5C44'; }};

    return (
        <nav style={{ display: 'flex', justifyContent: 'center', marginTop: '16px', marginBottom: '24px' }}>
            <ul style={{ display: 'flex', gap: '4px', listStyle: 'none', margin: 0, padding: 0, alignItems: 'center' }}>

                <li>
                    <button
                        onClick={() => currentPage > 1 && paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                        style={{ ...btnBase, opacity: currentPage === 1 ? 0.4 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                        onMouseEnter={hoverOn}
                        onMouseLeave={hoverOff}
                    >
                        ← Prev
                    </button>
                </li>

                {visiblePages.map((number, index) => (
                    <li key={index}>
                        {number === '...' ? (
                            <span style={{ padding: '5px 6px', fontSize: '12px', color: '#B09880', fontFamily: sans }}>…</span>
                        ) : (
                            <button
                                onClick={() => paginate(number)}
                                data-active={currentPage === number ? 'true' : 'false'}
                                style={currentPage === number ? btnActive : btnBase}
                                onMouseEnter={hoverOn}
                                onMouseLeave={hoverOff}
                            >
                                {number}
                            </button>
                        )}
                    </li>
                ))}

                <li>
                    <button
                        onClick={() => currentPage < pageNumbers.length && paginate(currentPage + 1)}
                        disabled={currentPage === pageNumbers.length}
                        style={{ ...btnBase, opacity: currentPage === pageNumbers.length ? 0.4 : 1, cursor: currentPage === pageNumbers.length ? 'not-allowed' : 'pointer' }}
                        onMouseEnter={hoverOn}
                        onMouseLeave={hoverOff}
                    >
                        Next →
                    </button>
                </li>

            </ul>
        </nav>
    );
};

export default AdminPagination;
