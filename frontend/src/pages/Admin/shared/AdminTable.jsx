// components/Admin/shared/AdminTable.jsx
import React from 'react';

const AdminTable = ({
                        columns,
                        data,
                        isLoading = false,
                        emptyMessage = 'No data found',
                        onRowClick = null,
                        rowClassName = ''
                    }) => {
    return (
        <div className="bg-white shadow-md rounded-lg overflow-hidden w-full">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                <tr>
                    {columns.map((column, index) => (
                        <th
                            key={index}
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            style={column.width ? { width: column.width } : {}}
                        >
                            {column.header}
                        </th>
                    ))}
                </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                    <tr>
                        <td colSpan={columns.length} className="px-6 py-4 text-center">
                            Loading...
                        </td>
                    </tr>
                ) : data.length === 0 ? (
                    <tr>
                        <td colSpan={columns.length} className="px-6 py-4 text-center">
                            {emptyMessage}
                        </td>
                    </tr>
                ) : (
                    data.map((item, rowIndex) => (
                        <tr
                            key={rowIndex}
                            className={`hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''} ${rowClassName}`}
                            onClick={onRowClick ? () => onRowClick(item) : undefined}
                        >
                            {columns.map((column, colIndex) => (
                                <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                                    {column.render ? column.render(item) : item[column.accessor]}
                                </td>
                            ))}
                        </tr>
                    ))
                )}
                </tbody>
            </table>
        </div>
    );
};

export default AdminTable;