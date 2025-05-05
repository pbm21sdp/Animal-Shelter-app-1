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
  AlertCircle
} from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

const UserProfilePage = () => {
  const { 
    user, 
    error: authError, 
    uploadAvatar, 
    updateProfile,
    isLoading: authLoading 
  } = useAuthStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [avatarKey, setAvatarKey] = useState(Date.now()); // Cheie pentru a forța re-renderizarea

  // State for messages and adoption requests
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const tabParam = queryParams.get('tab');

  const [messages, setMessages] = useState([]);
  const [adoptionRequests, setAdoptionRequests] = useState([]);
  const [activeTab, setActiveTab] = useState(tabParam || 'profile');

  // State for editable fields
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    avatar: user?.avatar || ''
  });

  // Actualizează formData când user se schimbă
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        avatar: user.avatar || ''
      });
      
      if (activeTab === 'messages') {
        fetchMessages();
      } else if (activeTab === 'adoptions') {
        fetchAdoptionRequests();
      }
    }
  }, [user, activeTab]);

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

    try {
      setLoading(true);
      setError('');
      
      // Folosește metoda uploadAvatar din authStore
      const result = await uploadAvatar(file);
      
      // Generează o nouă cheie pentru a forța re-renderizarea imaginii
      setAvatarKey(Date.now());
      
      setSuccess('Avatar updated successfully');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setError('Failed to upload avatar');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      // Folosește metoda updateProfile din authStore
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

  const handleCancelEdit = () => {
    // Resetează formData la valorile din user
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      avatar: user?.avatar || ''
    });
    setIsEditing(false);
    setError('');
  };

  // Adaugă un query parameter pentru a evita cache-ul
  const getAvatarUrl = (url) => {
    if (!url) return '/default-avatar.png';
    
    // Adaugă un parametru timestamp pentru a preveni caching
    const hasParams = url.includes('?');
    const separator = hasParams ? '&' : '?';
    return `${url}${separator}t=${avatarKey}`;
  };

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <PawPrint className="h-8 w-8 text-teal-600" />
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        </div>

        {/* Navigation Tabs */}
          <div className="flex mb-6 bg-white rounded-t-xl shadow-md relative z-10 border-b border-gray-200">
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
                  {/* Folosim key pentru a forța re-renderizarea */}
                  <img
                    key={avatarKey}
                    src={getAvatarUrl(user?.avatar)}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                  />
                  {/* Adaugă un indicator de loading */}
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
                {/* Adaugă un text de debug pentru a vedea URL-ul imaginii */}
                <div className="mt-2 text-xs text-gray-400 max-w-xs overflow-hidden text-ellipsis">
                  {user?.avatar ? 'Avatar loaded' : 'No avatar set'}
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
                    key={message.id}
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
                    key={request.id}
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
                            'text-yellow-600'
                          }`}>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
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
                    {request.response && (
                      <div className="mt-4 pl-4 border-l-2 border-teal-300">
                        <p className="text-sm font-medium text-teal-600">Shelter Response:</p>
                        <p className="text-gray-700">{request.response}</p>
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