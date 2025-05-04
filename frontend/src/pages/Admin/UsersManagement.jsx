// components/Admin/UsersManagement.jsx
import React, { useState, useEffect } from 'react';
import { Users, RefreshCw, Filter, Trash2, Edit, Check } from 'lucide-react';
import axios from 'axios';
import AdminTable from './shared/AdminTable';
import AdminSearchBar from './shared/AdminSearchBar';
import AdminPagination from './shared/AdminPagination';
import AdminModal from './shared/AdminModal';

const UsersManagement = () => {
    // State variables
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [usersPerPage] = useState(10);

    // Fetch all users
    const fetchUsers = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.get('http://localhost:5000/api/users/admin', { withCredentials: true });
            if (response.data.success) {
                setUsers(response.data.users);
                setFilteredUsers(response.data.users);
            } else {
                setError('Failed to fetch users');
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            setError(error.response?.data?.message || 'Error fetching users');
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch users on component mount
    useEffect(() => {
        fetchUsers();
    }, []);

    // Update filtered users when search term changes
    useEffect(() => {
        if (users.length) {
            setFilteredUsers(
                users.filter(user =>
                    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
                )
            );
        }
    }, [searchTerm, users]);

    // Pagination logic
    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const getCurrentUsers = () => {
        return filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
    };

    // Handle edit user
    const handleEditClick = (user, e) => {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        setSelectedUser(user);
        setShowEditModal(true);
    };

    // Handle delete user
    const handleDeleteClick = (user, e) => {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        setSelectedUser(user);
        setShowDeleteModal(true);
    };

    // Handle update user
    const handleUpdateUser = async (updatedData) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.put(
                `http://localhost:5000/api/users/admin/${selectedUser._id}`,
                updatedData,
                { withCredentials: true }
            );

            if (response.data.success) {
                // Update the user in the local state
                setUsers(prevUsers =>
                    prevUsers.map(user =>
                        user._id === selectedUser._id ? { ...user, ...updatedData } : user
                    )
                );
                setShowEditModal(false);
                setSelectedUser(null);
            } else {
                setError('Failed to update user');
            }
        } catch (error) {
            console.error('Error updating user:', error);
            setError(error.response?.data?.message || 'Error updating user');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle delete user confirmation
    const handleDeleteUser = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.delete(
                `http://localhost:5000/api/users/admin/${selectedUser._id}`,
                { withCredentials: true }
            );

            if (response.data.success) {
                // Remove the user from the local state
                setUsers(prevUsers =>
                    prevUsers.filter(user => user._id !== selectedUser._id)
                );
                setShowDeleteModal(false);
                setSelectedUser(null);
            } else {
                setError('Failed to delete user');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            setError(error.response?.data?.message || 'Error deleting user');
        } finally {
            setIsLoading(false);
        }
    };

    // Table columns definition
    const columns = [
        {
            header: 'User',
            accessor: 'name',
            render: (user) => (
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center">
                            <span className="text-tealcustom font-semibold">
                                {user.name?.charAt(0) || user.email?.charAt(0) || '?'}
                            </span>
                        </div>
                    </div>
                    <div className="ml-4">
                        <div className="font-medium text-gray-900">{user.name || 'Unnamed User'}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                </div>
            )
        },
        {
            header: 'Role',
            accessor: 'isAdmin',
            render: (user) => (
                <span className="px-2 py-1 text-xs font-medium bg-gray-100 rounded">
                    {user.isAdmin ? 'Admin' : 'User'}
                </span>
            )
        },
        {
            header: 'Sign-Up Date',
            accessor: 'createdAt',
            render: (user) => (
                <span>
                    {new Date(user.createdAt).toLocaleDateString()}
                </span>
            )
        },
        {
            header: 'Actions',
            accessor: 'actions',
            render: (user) => (
                <div className="flex space-x-2">
                    <button
                        onClick={(e) => handleEditClick(user, e)}
                        className="text-indigo-600 hover:text-indigo-900 p-2"
                        aria-label={`Edit ${user.name || 'user'}`}
                    >
                        <Edit className="h-5 w-5" />
                    </button>
                    <button
                        onClick={(e) => handleDeleteClick(user, e)}
                        className="text-red-600 hover:text-red-900 p-2"
                        aria-label={`Delete ${user.name || 'user'}`}
                    >
                        <Trash2 className="h-5 w-5" />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div>
            {/* Header with search and refresh */}
            <div className="flex flex-wrap justify-between items-center mb-6">
                <h2 className="text-2xl font-bold mb-4 sm:mb-0 flex items-center">
                    <Users className="h-6 w-6 mr-2" />
                    Manage Users
                </h2>
                <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
                    <AdminSearchBar
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search users..."
                    />
                    <button
                        onClick={fetchUsers}
                        className="bg-tealcustom hover:bg-teal-700 text-white px-4 py-2 rounded-md flex items-center w-full sm:w-auto justify-center"
                    >
                        <RefreshCw className="h-5 w-5 mr-1" />
                        Refresh Users
                    </button>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {/* Users Table */}
            <AdminTable
                columns={columns}
                data={getCurrentUsers()}
                isLoading={isLoading}
                emptyMessage="No users found"
                onRowClick={(user) => setSelectedUser(user)}
            />

            {/* Pagination */}
            <AdminPagination
                itemsPerPage={usersPerPage}
                totalItems={filteredUsers.length}
                currentPage={currentPage}
                paginate={setCurrentPage}
            />

            {/* Edit User Modal */}
            <AdminModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                title={`Edit User: ${selectedUser?.name || selectedUser?.email || 'User'}`}
                size="md"
            >
                {selectedUser && (
                    <div className="p-6">
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            handleUpdateUser({
                                name: e.target.name.value,
                                email: e.target.email.value,
                                isAdmin: e.target.isAdmin.checked
                            });
                        }}>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                                    Name
                                </label>
                                <input
                                    id="name"
                                    type="text"
                                    defaultValue={selectedUser.name}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    defaultValue={selectedUser.email}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                />
                            </div>

                            <div className="mb-6">
                                <label className="flex items-center">
                                    <input
                                        id="isAdmin"
                                        type="checkbox"
                                        defaultChecked={selectedUser.isAdmin}
                                        className="h-4 w-4 text-tealcustom focus:ring-teal-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-2 text-gray-700">Admin privileges</span>
                                </label>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="mr-4 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-tealcustom hover:bg-teal-700 text-white px-4 py-2 rounded flex items-center"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                                    ) : (
                                        <Check className="h-5 w-5 mr-2" />
                                    )}
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </AdminModal>

            {/* Delete User Confirmation Modal */}
            <AdminModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Delete User"
                size="sm"
            >
                <div className="p-6">
                    <p className="mb-6">
                        Are you sure you want to delete {selectedUser?.name || selectedUser?.email || 'this user'}? This action cannot be undone.
                    </p>
                    <div className="flex justify-end">
                        <button
                            onClick={() => setShowDeleteModal(false)}
                            className="mr-4 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDeleteUser}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                            ) : (
                                <Trash2 className="h-5 w-5 mr-2" />
                            )}
                            Delete
                        </button>
                    </div>
                </div>
            </AdminModal>
        </div>
    );
};

export default UsersManagement;