// components/Admin/MessagesInbox.jsx
import React, { useState, useEffect } from 'react';
import { MessageSquare, Calendar, ArrowLeft, Trash2, RefreshCw, Send } from 'lucide-react';
import axios from 'axios';
import AdminTable from './shared/AdminTable';
import AdminSearchBar from './shared/AdminSearchBar';
import AdminPagination from './shared/AdminPagination';
import AdminModal from './shared/AdminModal';

const MessagesInbox = () => {
    // State variables
    const [messages, setMessages] = useState([]);
    const [filteredMessages, setFilteredMessages] = useState([]);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [replyMessage, setReplyMessage] = useState('');
    const [isSubmittingReply, setIsSubmittingReply] = useState(false);
    const [showDeleteMessageModal, setShowDeleteMessageModal] = useState(false);
    const [messageToDelete, setMessageToDelete] = useState(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [messagesPerPage] = useState(10);

    // Fetch all messages
    const fetchMessages = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.get('http://localhost:5000/api/messages/admin', { withCredentials: true });
            if (response.data.success) {
                setMessages(response.data.messages);
                setFilteredMessages(response.data.messages);
            } else {
                setError('Failed to fetch messages');
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
            setError(error.response?.data?.message || 'Error fetching messages');
        } finally {
            setIsLoading(false);
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchMessages();
    }, []);

    // Filter messages based on search term
    useEffect(() => {
        if (messages.length > 0) {
            setFilteredMessages(
                messages.filter((message) =>
                    message.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    message.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    message.message?.toLowerCase().includes(searchTerm.toLowerCase())
                )
            );
        }
    }, [searchTerm, messages]);

    // Pagination logic
    const indexOfLastMessage = currentPage * messagesPerPage;
    const indexOfFirstMessage = indexOfLastMessage - messagesPerPage;
    const getCurrentMessages = () => {
        return filteredMessages.slice(indexOfFirstMessage, indexOfLastMessage);
    };

    // Format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Handle message selection
    const handleMessageSelect = (message) => {
        setSelectedMessage(message);
        setReplyMessage('');
    };

    // Handle message deletion
    const handleDeleteClick = (message, e) => {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        setMessageToDelete(message._id);
        setShowDeleteMessageModal(true);
    };

    // Confirm message deletion
    const confirmDeleteMessage = async () => {
        setIsLoading(true);
        try {
            await axios.delete(`http://localhost:5000/api/messages/admin/${messageToDelete}`,
                { withCredentials: true }
            );

            // Remove the message from our state
            setMessages(prevMessages =>
                prevMessages.filter(m => m._id !== messageToDelete)
            );

            // Clear selected message if it was deleted
            if (selectedMessage && selectedMessage._id === messageToDelete) {
                setSelectedMessage(null);
            }

            setShowDeleteMessageModal(false);
        } catch (error) {
            console.error('Error deleting message:', error);
            setError(error.response?.data?.message || 'Error deleting message');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle reply submission
    const handleReplySubmit = async (e) => {
        e.preventDefault();

        if (!selectedMessage || !replyMessage.trim()) {
            return;
        }

        setIsSubmittingReply(true);
        try {
            // Send the reply email
            const response = await axios.post(
                'http://localhost:5000/api/messages/admin/reply',
                {
                    messageId: selectedMessage._id,
                    email: selectedMessage.email,
                    replyText: replyMessage
                },
                { withCredentials: true }
            );

            if (response.data.success) {
                // Clear the reply form
                setReplyMessage('');

                // Mark the message as responded if not already
                if (!selectedMessage.read) {
                    await axios.put(
                        `http://localhost:5000/api/messages/admin/${selectedMessage._id}/mark-read`,
                        {},
                        { withCredentials: true }
                    );

                    // Update the message in our state
                    setMessages(prevMessages =>
                        prevMessages.map(m =>
                            m._id === selectedMessage._id ? { ...m, read: true } : m
                        )
                    );

                    // Update the selected message
                    setSelectedMessage(prev => ({ ...prev, read: true }));
                }

                // Show success message
                alert('Reply sent successfully!');
            }
        } catch (error) {
            console.error('Error sending reply:', error);
            setError(error.response?.data?.message || 'Error sending reply');
        } finally {
            setIsSubmittingReply(false);
        }
    };

    // Table columns definition
    const columns = [
        {
            header: 'Date',
            accessor: 'createdAt',
            render: (message) => (
                <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">{formatDate(message.createdAt)}</span>
                </div>
            )
        },
        {
            header: 'From',
            accessor: 'email',
            render: (message) => (
                <div>
                    <div className="font-medium text-gray-900">{message.name || 'Anonymous'}</div>
                    <div className="text-sm text-gray-500">{message.email}</div>
                </div>
            )
        },
        {
            header: 'Message',
            accessor: 'message',
            render: (message) => (
                <div className="text-sm text-gray-900 truncate max-w-xs">
                    {message.message.length > 60
                        ? `${message.message.substring(0, 60)}...`
                        : message.message}
                </div>
            )
        },
        {
            header: 'Status',
            accessor: 'read',
            render: (message) => (
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    message.read ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                    {message.read ? 'Responded' : 'Unresponded'}
                </span>
            )
        },
        {
            header: 'Actions',
            accessor: 'actions',
            render: (message) => (
                <div className="flex space-x-2">
                    <button
                        onClick={(e) => handleDeleteClick(message, e)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="Delete Message"
                    >
                        <Trash2 className="h-4 w-4" />
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
                    <MessageSquare className="h-6 w-6 mr-2" />
                    Messages Inbox
                </h2>
                <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
                    <AdminSearchBar
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search messages..."
                    />
                    <button
                        onClick={fetchMessages}
                        className="bg-tealcustom hover:bg-teal-700 text-white px-4 py-2 rounded-md flex items-center w-full sm:w-auto justify-center"
                    >
                        <RefreshCw className="h-5 w-5 mr-1" />
                        Refresh Messages
                    </button>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {selectedMessage ? (
                // Message Detail View
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    {/* Message Header */}
                    <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                        <button
                            onClick={() => setSelectedMessage(null)}
                            className="text-tealcustom hover:text-teal-700 flex items-center"
                        >
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            Back to inbox
                        </button>
                        <button
                            onClick={() => handleDeleteClick(selectedMessage)}
                            className="text-red-600 hover:text-red-800 flex items-center"
                        >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                        </button>
                    </div>

                    {/* Message Content */}
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-2">
                            <div>
                                <span className="font-semibold">From:</span> {selectedMessage.name || 'Anonymous'} ({selectedMessage.email})
                            </div>
                            <div className="text-sm text-gray-500">
                                {formatDate(selectedMessage.createdAt)}
                            </div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap break-words">
                            {selectedMessage.message}
                        </div>

                        {/* Reply Form */}
                        <form onSubmit={handleReplySubmit} className="mt-8">
                            <div className="mb-4">
                                <label htmlFor="reply" className="block text-sm font-medium text-gray-700 mb-1">
                                    Your Reply
                                </label>
                                <textarea
                                    id="reply"
                                    name="reply"
                                    rows="5"
                                    value={replyMessage}
                                    onChange={(e) => setReplyMessage(e.target.value)}
                                    className="shadow-sm focus:ring-teal-500 focus:border-teal-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                    placeholder="Type your response here..."
                                ></textarea>
                            </div>
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={isSubmittingReply || !replyMessage.trim()}
                                    className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-tealcustom hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 ${
                                        isSubmittingReply || !replyMessage.trim() ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                >
                                    {isSubmittingReply ? (
                                        <>
                                            <span className="mr-2">Sending...</span>
                                            <RefreshCw className="h-4 w-4 animate-spin" />
                                        </>
                                    ) : (
                                        <>
                                            <span className="mr-2">Send Reply</span>
                                            <Send className="h-4 w-4" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : (
                // Messages Table
                <>
                    <AdminTable
                        columns={columns}
                        data={getCurrentMessages()}
                        isLoading={isLoading}
                        emptyMessage="No messages found"
                        onRowClick={handleMessageSelect}
                    />

                    {/* Pagination */}
                    <AdminPagination
                        itemsPerPage={messagesPerPage}
                        totalItems={filteredMessages.length}
                        currentPage={currentPage}
                        paginate={setCurrentPage}
                    />
                </>
            )}

            {/* Delete Message Confirmation Modal */}
            <AdminModal
                isOpen={showDeleteMessageModal}
                onClose={() => setShowDeleteMessageModal(false)}
                title="Delete Message"
                size="sm"
            >
                <div className="p-6">
                    <p className="mb-6">
                        Are you sure you want to delete this message? This action cannot be undone.
                    </p>
                    <div className="flex justify-end">
                        <button
                            onClick={() => setShowDeleteMessageModal(false)}
                            className="mr-4 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmDeleteMessage}
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

export default MessagesInbox;