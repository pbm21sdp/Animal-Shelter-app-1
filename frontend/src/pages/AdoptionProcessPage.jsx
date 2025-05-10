import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { User, ChevronLeft, PawPrint, Heart, FileText, Phone, Users, Home, Search, ArrowRight, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import Footer from "../components/page/Footer.jsx";
import { useAuthStore } from "../store/authStore";

const AdoptionProcessPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

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

  const steps = [
    {
      icon: <Search className="h-8 w-8 text-teal-700" />,
      title: "Find Your Perfect Match",
      content: "Browse our gallery of animals and choose the companion that's right for you.",
      color: "from-yellow-100 to-yellow-50"
    },
    {
      icon: <FileText className="h-8 w-8 text-teal-700" />,
      title: "Apply for Adoption",
      content: "Complete our online form to initiate the adoption process.",
      color: "from-blue-100 to-blue-50"
    },
    {
      icon: <Phone className="h-8 w-8 text-teal-700" />,
      title: "Interview & Verification",
      content: "We'll schedule a phone interview and verify the living conditions for the animal.",
      color: "from-purple-100 to-purple-50"
    },
    {
      icon: <Heart className="h-8 w-8 text-teal-700" />,
      title: "Meet Your Future Pet",
      content: "We'll arrange a meeting for you to get to know your future companion.",
      color: "from-pink-100 to-pink-50"
    },
    {
      icon: <FileText className="h-8 w-8 text-teal-700" />,
      title: "Complete Documentation",
      content: "Sign the adoption contract and receive all necessary documents.",
      color: "from-green-100 to-green-50"
    },
    {
      icon: <Home className="h-8 w-8 text-teal-700" />,
      title: "Welcome Home!",
      content: "Take your new family member home and begin your adventure together!",
      color: "from-orange-100 to-orange-50"
    }
  ];
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  const handleLogout = () => {
    logout();
    navigate('/login'); 
  };

  const getAvatarUrl = (url) => {
    if (!url) return '/default-avatar.png';

    // Check if the URL is already absolute or starts with http
    if (url.startsWith('http')) {
        return url;
    }

    // Ensure the URL starts with a slash
    const formattedUrl = url.startsWith('/') ? url : `/${url}`;

    // Add timestamp to prevent caching
    const timestamp = `?t=${Date.now()}`;

    // Return the full URL by prepending the BASE_URL
    return `http://localhost:5000${formattedUrl}${timestamp}`;
  };
  
  return (
    <div className="min-h-screen w-screen bg-white overflow-x-hidden z-30">
        {/* Header */}
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
          <a href="/adoption-process" className="text-gray-900 border-b-2 border-gray-900">Adoption process</a>
          <a href="/adoption-requirements" className="text-gray-500 hover:text-gray-900">Requirements</a>
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

      {/* Hero Section */}
      <section className="bg-tealcustom text-white py-16 relative z-10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              The Adoption Journey in <span className="text-yellow-300">6 Simple Steps</span>
            </h1>
            <p className="text-xl mb-8 text-gray-100">
              Follow our simple process to bring your new best friend home
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16 relative z-10">
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {steps.map((step, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="relative"
            >
              <div className={`bg-gradient-to-br ${step.color} rounded-2xl p-8 h-full shadow-sm hover:shadow-md transition-all duration-300`}>
                <div className="absolute -top-4 -right-4 bg-tealcustom text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg">
                  {index + 1}
                </div>
                
                <div className="flex flex-col items-center text-center">
                  <div className="bg-white/80 p-4 rounded-full mb-6">
                    {step.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    {step.title}
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {step.content}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Section */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-20 text-center"
        >
          <h2 className="text-3xl font-bold mb-6">Ready to find your new best friend?</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Browse through our available pets and start your adoption journey today. 
            Each animal is waiting for their forever home.
          </p>
          <Link
            to="/pet-search"
            className="inline-flex items-center bg-tealcustom hover:bg-teal-800 text-white px-8 py-4 rounded-full text-lg font-medium transition-all duration-200 cursor-pointer"
          >
            <span className="mr-2">View Available Pets</span>
            <ArrowRight className="h-5 w-5" />
          </Link>
        </motion.div>

        {/* Decorative Elements */}
      <div className="absolute right-0 top-1/4 opacity-5 transform rotate-12 pointer-events-none">
        <PawPrint className="h-40 w-40 text-teal-600" />
      </div>
      <div className="absolute left-0 bottom-1/3 opacity-5 transform -rotate-12 pointer-events-none">
        <PawPrint className="h-32 w-32 text-pink-300" />
      </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default AdoptionProcessPage;