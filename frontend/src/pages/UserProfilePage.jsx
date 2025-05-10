import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  PawPrint,
  MessageSquare,
  Heart,
  Edit2,
  Check,
  X,
  Camera,
  AlertCircle,
  Calendar,
  Inbox, 
  LogOut
} from 'lucide-react';
import MeetingsTab from '../components/MeetingsTab';
import InboxTab from '../components/InboxTab';
import { useMeetingStore } from '../store/meetingStore';
import { useNavigate, Link } from 'react-router-dom';
import DynamicSearch from '../components/DynamicSearch';

const API_URL = 'http://localhost:5000/api';
const BASE_URL = 'http://localhost:5000';

const UserProfilePage = () => {
  const {
    user,
    error: authError,
    uploadAvatar,
    updateProfile,
    isLoading: authLoading
  } = useAuthStore();

  const { userMeetings, getUserMeetings } = useMeetingStore();
  const pendingMeetingsCount = userMeetings.filter(m => m.status === 'pending').length;

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [avatarKey, setAvatarKey] = useState(Date.now()); // Key to force re-rendering
  const navigate = useNavigate();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // State for messages and adoption requests
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const tabParam = queryParams.get('tab');

  const [messages, setMessages] = useState([]);
  const [adoptionRequests, setAdoptionRequests] = useState([]);
  const [activeTab, setActiveTab] = useState(tabParam || 'profile');
  const { logout } = useAuthStore();

  // State for editable fields
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    avatar: user?.avatar || ''
  });

  // Update formData when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        avatar: user.avatar || ''
      });

      // Load data based on active tab
      if (activeTab === 'messages') {
        fetchMessages();
      } else if (activeTab === 'adoptions') {
        fetchAdoptionRequests();
      } else if (activeTab === 'inbox' || activeTab === 'meetings') {
        getUserMeetings();
      }
    }
  }, [user, activeTab, getUserMeetings]);

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [location.search]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const dropdownElement = document.getElementById('profile-dropdown');
      if (showProfileDropdown && dropdownElement && !dropdownElement.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileDropdown]);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`${API_URL}/messages/user`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to load messages');
    }
  };

  const fetchAdoptionRequests = async () => {
    try {
      const response = await fetch(`${API_URL}/adoptions/user`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch adoption requests');
      }

      const data = await response.json();
      setAdoptionRequests(data.adoptions || []);
    } catch (error) {
      console.error('Error fetching adoption requests:', error);
      setError('Failed to load adoption requests');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // File type validation
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // File size validation (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size should be less than 5MB');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Use uploadAvatar method from authStore
      const result = await uploadAvatar(file);

      if (result && result.avatarUrl) {
        console.log("Avatar uploaded successfully:", result.avatarUrl);

        // Force re-rendering of the image by updating the key
        setAvatarKey(Date.now());

        setSuccess('Avatar updated successfully');
      } else {
        throw new Error("Avatar upload failed");
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setError('Failed to upload avatar: ' + (error.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError('');

      // Use updateProfile method from authStore
      await updateProfile({
        name: formData.name,
        email: formData.email
      });

      setSuccess('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCancelEdit = () => {
    // Reset formData to values from user
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      avatar: user?.avatar || ''
    });
    setIsEditing(false);
    setError('');
  };

  // Add a query parameter to avoid caching
  const getAvatarUrl = (url) => {
    if (!url) return '/default-avatar.png';

    // Check if the URL is already absolute or starts with http
    if (url.startsWith('http')) {
      return url;
    }

    // Ensure the URL starts with a slash
    const formattedUrl = url.startsWith('/') ? url : `/${url}`;

    // Add timestamp to prevent caching
    const timestamp = `?t=${avatarKey}`;

    // Return the full URL by prepending the BASE_URL
    return `${BASE_URL}${formattedUrl}${timestamp}`;
  };

  return (
      <div className="min-h-screen w-full bg-gray-50">
        {/* Header/Navigation */}
        <header className="container mx-auto px-4 py-4 grid grid-cols-3 items-center relative">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <PawPrint className="text-tealcustom h-6 w-6"/>
            <span className="ml-2 text-xl font-bold">Paws</span>
          </div>
        </div>
        
        <nav className="hidden md:flex space-x-6 items-center justify-center">
          <a href="/" className="text-gray-500 hover:text-gray-900">Home</a>
          <a href="/pet-search" className="text-gray-500 hover:text-gray-900">Pet search</a>
          <a href="/adoption-process" className="text-gray-500 hover:text-gray-900">Adoption process</a>
          <a href="/adoption-requirements" className="text-gray-900 border-b-2 border-gray-900">Requirements</a>
          <a href="/adoption-faq" className="text-gray-500 hover:text-gray-900">FAQ</a>
        </nav>
        
        <div className="flex justify-end items-center space-x-4">
          {/* Profile button with dropdown */}
          <div className="relative">
            <motion.button
              whileHover={{scale: 1.05}}
              whileTap={{scale: 0.95}}
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="p-2 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 flex items-center justify-center z-50"
            >
              {user && user.avatar ? (
                <img
                  src={getAvatarUrl(user.avatar)}
                  alt="Profile"
                  className="h-5 w-5 rounded-full object-cover"
                  onError={(e) => {
                    console.log("Avatar load error, using fallback");
                    e.target.onerror = null;
                    e.target.src = '/default-avatar.png';
                  }}
                />
              ) : (
                <User className="h-5 w-5" />
              )}
            </motion.button>
            
            {/* Dropdown Menu */}
            {showProfileDropdown && (
              <div 
                id="profile-dropdown"
                className="absolute top-full right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50"
              >
                <Link 
                  to="/profile?tab=profile" 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowProfileDropdown(false);
                  }}
                >
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </div>
                </Link>
                <Link 
                  to="/profile?tab=messages" 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowProfileDropdown(false);
                  }}
                >
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    Messages
                  </div>
                </Link>
                <Link 
                  to="/profile?tab=adoptions" 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowProfileDropdown(false);
                  }}
                >
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    Requests
                  </div>
                </Link>
              </div>
            )}
          </div>

          {/* Logout button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="flex items-center text-gray-500 hover:text-gray-900 transition-colors"
          >
            <LogOut className="h-5 w-5 mr-2" />
            <span>Logout</span>
          </motion.button>
        </div>
      </header>
      
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <PawPrint className="h-8 w-8 text-teal-600" />
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          </div>

          {/* Navigation Tabs */}
          <div className="flex mb-6 bg-white rounded-t-xl shadow-md relative z-10 border-b border-gray-200 overflow-x-auto">
            <button
                onClick={() => setActiveTab('profile')}
                className={`px-6 py-3 font-medium rounded-tl-xl transition-colors ${
                    activeTab === 'profile'
                        ? 'bg-white text-teal-600 border-t-2 border-teal-600'
                        : 'text-gray-500 hover:text-teal-600 hover:bg-gray-50'
                }`}
            >
              Profile
            </button>
            <button
                onClick={() => setActiveTab('inbox')}
                className={`px-6 py-3 font-medium transition-colors flex items-center ${
                    activeTab === 'inbox'
                        ? 'bg-white text-teal-600 border-t-2 border-teal-600'
                        : 'text-gray-500 hover:text-teal-600 hover:bg-gray-50'
                }`}
            >
              Inbox
              {pendingMeetingsCount > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                {pendingMeetingsCount}
              </span>
              )}
            </button>
            <button
                onClick={() => setActiveTab('meetings')}
                className={`px-6 py-3 font-medium transition-colors ${
                    activeTab === 'meetings'
                        ? 'bg-white text-teal-600 border-t-2 border-teal-600'
                        : 'text-gray-500 hover:text-teal-600 hover:bg-gray-50'
                }`}
            >
              Meetings
            </button>
            <button
                onClick={() => setActiveTab('messages')}
                className={`px-6 py-3 font-medium transition-colors ${
                    activeTab === 'messages'
                        ? 'bg-white text-teal-600 border-t-2 border-teal-600'
                        : 'text-gray-500 hover:text-teal-600 hover:bg-gray-50'
                }`}
            >
              Messages
            </button>
            <button
                onClick={() => setActiveTab('adoptions')}
                className={`px-6 py-3 font-medium transition-colors ${
                    activeTab === 'adoptions'
                        ? 'bg-white text-teal-600 border-t-2 border-teal-600'
                        : 'text-gray-500 hover:text-teal-600 hover:bg-gray-50'
                }`}
            >
              Adoption Requests
            </button>
          </div>

          {/* Content */}
          {activeTab === 'profile' && (
              <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-teal-600 relative z-10"
              >
                {/* Alert Messages */}
                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600">
                      <AlertCircle className="h-5 w-5" />
                      {error}
                    </div>
                )}

                {success && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-600">
                      <Check className="h-5 w-5" />
                      {success}
                    </div>
                )}

                <div className="flex flex-col md:flex-row gap-8">
                  {/* Avatar Section */}
                  <div className="flex flex-col items-center">
                    <div className="relative">
                      {/* Use key to force re-rendering */}
                      <img
                          key={avatarKey}
                          src={getAvatarUrl(user?.avatar)}
                          alt="Profile"
                          className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                          onError={(e) => {
                            console.log("Image loading error, falling back to default");
                            e.target.onerror = null; // Prevent infinite loop
                            e.target.src = '/default-avatar.png'; // Fallback image
                          }}
                      />
                      {/* Add a loading indicator */}
                      {loading && (
                          <div className="absolute inset-0 bg-black bg-opacity-30 rounded-full flex items-center justify-center">
                            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                          </div>
                      )}
                      <label className="absolute bottom-0 right-0 bg-teal-600 p-2 rounded-full cursor-pointer hover:bg-teal-700 transition-colors">
                        <Camera className="h-5 w-5 text-white" />
                        <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={loading}
                        />
                      </label>
                    </div>
                    {/* Debug information */}
                    <div className="mt-2 text-xs text-gray-400 max-w-xs overflow-hidden text-ellipsis">
                      {user?.avatar ? (
                          <>
                            <div>Avatar path: {user.avatar}</div>
                            <div>Full URL: {getAvatarUrl(user.avatar)}</div>
                          </>
                      ) : (
                          'No avatar set'
                      )}
                    </div>
                  </div>

                  {/* Profile Information */}
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-semibold">Profile Information</h2>
                      {!isEditing ? (
                          <button
                              onClick={() => setIsEditing(true)}
                              className="flex items-center gap-2 text-teal-600 hover:text-teal-700"
                          >
                            <Edit2 className="h-5 w-5" />
                            Edit Profile
                          </button>
                      ) : (
                          <div className="flex gap-2">
                            <button
                                onClick={handleCancelEdit}
                                className="flex items-center gap-2 text-gray-600 hover:text-gray-700"
                                disabled={loading}
                            >
                              <X className="h-5 w-5" />
                              Cancel
                            </button>
                            <button
                                onClick={handleUpdateProfile}
                                className="flex items-center gap-2 text-green-600 hover:text-green-700"
                                disabled={loading}
                            >
                              <Check className="h-5 w-5" />
                              Save
                            </button>
                          </div>
                      )}
                    </div>

                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Name
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            disabled={!isEditing || loading}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            disabled={!isEditing || loading}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Member Since
                        </label>
                        <p className="text-gray-600">
                          {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Loading...'}
                        </p>
                      </div>
                    </form>
                  </div>
                </div>
              </motion.div>
          )}

          {activeTab === 'inbox' && (
              <InboxTab />
          )}

          {activeTab === 'meetings' && (
              <MeetingsTab />
          )}

          {activeTab === 'messages' && (
              <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-teal-600 relative z-10"
              >
                <h2 className="text-2xl font-semibold mb-6">Your Messages</h2>

                {messages.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No messages yet</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                      {messages.map((message) => (
                          <div
                              key={message._id || message.id} // Add key here, using _id or id
                              className="border border-gray-200 rounded-lg p-4 hover:border-teal-300 transition-colors"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-semibold">{message.subject}</h3>
                                <p className="text-sm text-gray-500">
                                  To: {message.recipient}
                                </p>
                              </div>
                              <span className="text-sm text-gray-500">
                        {new Date(message.createdAt).toLocaleDateString()}
                      </span>
                            </div>
                            <p className="text-gray-700">{message.content}</p>
                            {message.response && (
                                <div className="mt-4 pl-4 border-l-2 border-teal-300">
                                  <p className="text-sm font-medium text-teal-600">Response:</p>
                                  <p className="text-gray-700">{message.response}</p>
                                </div>
                            )}
                          </div>
                      ))}
                    </div>
                )}
              </motion.div>
          )}

          {activeTab === 'adoptions' && (
              <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-teal-600 relative z-10"
              >
                <h2 className="text-2xl font-semibold mb-6">Adoption Requests</h2>

                {adoptionRequests.length === 0 ? (
                    <div className="text-center py-12">
                      <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No adoption requests yet</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                      {adoptionRequests.map((request) => (
                          <div
                              key={request._id || request.id} // Add key here, using _id or id
                              className="border border-gray-200 rounded-lg p-4 hover:border-teal-300 transition-colors"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-semibold">
                                  {request.petName} - {request.petBreed}
                                </h3>
                                <p className="text-sm text-gray-500">
                                  Status: <span className={`font-medium ${
                                    request.status === 'approved' ? 'text-green-600' :
                                        request.status === 'rejected' ? 'text-red-600' :
                                            request.status === 'in_review' ? 'text-blue-600' :
                                                'text-yellow-600'
                                }`}>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1).replace('_', ' ')}
                          </span>
                                </p>
                              </div>
                              <span className="text-sm text-gray-500">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </span>
                            </div>
                            {request.notes && (
                                <p className="text-gray-700 mb-2">{request.notes}</p>
                            )}
                            {request.adminNotes && (
                                <div className="mt-4 pl-4 border-l-2 border-teal-300">
                                  <p className="text-sm font-medium text-teal-600">Shelter Notes:</p>
                                  <p className="text-gray-700">{request.adminNotes}</p>
                                </div>
                            )}
                          </div>
                      ))}
                    </div>
                )}
              </motion.div>
          )}
        </div>
      </div>
  );
};

export default UserProfilePage;