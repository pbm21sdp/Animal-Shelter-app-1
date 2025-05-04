// components/Admin/shared/AdminPagination.jsx
import React from 'react';

const AdminPagination = ({ itemsPerPage, totalItems, currentPage, paginate }) => {
    const pageNumbers = [];

    for (let i = 1; i <= Math.ceil(totalItems / itemsPerPage); i++) {
        pageNumbers.push(i);
    }

    // Only show 5 page numbers max with current page in the middle when possible
    let visiblePages = pageNumbers;
    if (pageNumbers.length > 5) {
        const startIndex = Math.max(0, currentPage - 3);
        const endIndex = Math.min(pageNumbers.length, currentPage + 2);
        visiblePages = pageNumbers.slice(startIndex, endIndex);

        // Always show first and last page
        if (!visiblePages.includes(1)) {
            visiblePages.unshift(1);
            if (visiblePages[1] > 2) visiblePages.splice(1, 0, '...');
        }
        if (!visiblePages.includes(pageNumbers.length)) {
            if (visiblePages[visiblePages.length - 1] < pageNumbers.length - 1) {
                visiblePages.push('...');
            }
            visiblePages.push(pageNumbers.length);
        }
    }

    if (pageNumbers.length <= 1) return null;

    return (
        <nav className="flex justify-center mt-4 mb-6">
            <ul className="flex">
                <li className={`mx-1 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <button
                        onClick={() => currentPage > 1 && paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border rounded bg-gray-100 hover:bg-gray-200"
                    >
                        Prev
                    </button>
                </li>

                {visiblePages.map((number, index) => (
                    <li key={index} className="mx-1">
                        {number === '...' ? (
                            <span className="px-3 py-1">...</span>
                        ) : (
                            <button
                                onClick={() => paginate(number)}
                                className={`px-3 py-1 border rounded ${
                                    currentPage === number
                                        ? 'bg-tealcustom text-white'
                                        : 'bg-gray-100 hover:bg-gray-200'
                                }`}
                            >
                                {number}
                            </button>
                        )}
                    </li>
                ))}

                <li className={`mx-1 ${currentPage === pageNumbers.length ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <button
                        onClick={() => currentPage < pageNumbers.length && paginate(currentPage + 1)}
                        disabled={currentPage === pageNumbers.length}
                        className="px-3 py-1 border rounded bg-gray-100 hover:bg-gray-200"
                    >
                        Next
                    </button>
                </li>
            </ul>
        </nav>
    );
};

export default AdminPagination;