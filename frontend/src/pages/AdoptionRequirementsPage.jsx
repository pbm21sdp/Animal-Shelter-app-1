import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { PawPrint, CheckCircle, Shield, HomeIcon, DollarSign, Clock, Heart, X, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuthStore } from "../store/authStore";
import Footer from "../components/page/Footer.jsx";

const AdoptionRequirementsPage = () => {
  // State for managing the modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequirements, setSelectedRequirements] = useState([]);
  const [showError, setShowError] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  
  // Ensure page starts at the top when loaded
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Toggle a requirement selection
  const toggleRequirement = (index) => {
    setSelectedRequirements(prev => {
      if (prev.includes(index)) {
        return prev.filter(item => item !== index);
      } else {
        return [...prev, index];
      }
    });
  };
  
  // Check if all requirements are met and continue or show error
  const handleSubmit = () => {
    if (selectedRequirements.length === requirements.length) {
      // All requirements met, navigate to available pets
      navigate('/pet-search');
    } else {
      // Not all requirements met, show error message
      setShowError(true);
    }
  };

  const requirements = [
    {
      icon: <CheckCircle className="h-6 w-6 text-teal-600" />,
      title: "Age Requirement",
      content: "Adopters must be at least 18 years old and provide valid ID verification."
    },
    {
      icon: <Shield className="h-6 w-6 text-teal-600" />,
      title: "Home Stability",
      content: "We need proof of residence and landlord permission if you're renting."
    },
    {
      icon: <HomeIcon className="h-6 w-6 text-teal-600" />,
      title: "Living Conditions",
      content: "Your home must have adequate space and a safe environment for the pet."
    },
    {
      icon: <DollarSign className="h-6 w-6 text-teal-600" />,
      title: "Adoption Fee",
      content: "A modest adoption fee helps cover vaccinations, microchipping, and spay/neuter."
    },
    {
      icon: <Clock className="h-6 w-6 text-teal-600" />,
      title: "Time Commitment",
      content: "You should have adequate time to spend with your new pet for bonding and care."
    },
    {
      icon: <Heart className="h-6 w-6 text-teal-600" />,
      title: "Commitment to Care",
      content: "Ability to provide veterinary care, proper nutrition, and love for the animal's life."
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
  
  return (
    <div className="min-h-screen w-screen bg-white">
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
          <a href="/adoption-process" className="text-gray-500 hover:text-gray-900">Adoption process</a>
          <a href="/adoption-requirements" className="text-gray-900 border-b-2 border-gray-900">Requirements</a>
          <a href="/adoption-faq" className="text-gray-500 hover:text-gray-900">FAQ</a>
        </nav>
        
        <div className="flex justify-end">
          <button 
            onClick={handleLogout}
            className="flex items-center text-gray-500 hover:text-gray-900 transition-colors"
          >
            <LogOut className="h-5 w-5 mr-2" />
            <span>Logout</span>
          </button>
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="bg-tealcustom text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Adoption Requirements
            </h1>
            <p className="text-xl mb-8 text-gray-100">
              Make sure you meet all necessary requirements to complete the adoption process.
            </p>
          </div>
        </div>
      </section>
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {requirements.map((requirement, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden p-6"
              >
                <div className="flex items-start space-x-4">
                  <div className="bg-teal-50 p-3 rounded-lg">
                    {requirement.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-teal-900 mb-2">
                      {requirement.title}
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      {requirement.content}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
          
          <div className="text-center mt-12">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center bg-tealcustom hover:bg-teal-800 text-white px-8 py-4 rounded-full text-lg font-medium transition-all duration-200"
            >
              <CheckCircle className="mr-2 h-5 w-5" />
              Check requirements
            </button>
          </div>
        </div>
      </main>
      
      {/* Requirement Check Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-teal-900">Confirm Requirements</h3>
                <button 
                  onClick={() => {
                    setIsModalOpen(false);
                    setShowError(false);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              
              {showError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg text-red-600">
                  <p className="font-medium">Sorry, you don't meet all requirements yet</p>
                  <p className="text-sm mt-1">Please check all requirements to proceed with adoption.</p>
                </div>
              )}
              
              <p className="text-gray-600 mb-6">Please check all requirements that you meet:</p>
              
              <div className="space-y-4 mb-8">
                {requirements.map((req, index) => (
                  <div 
                    key={index}
                    onClick={() => toggleRequirement(index)}
                    className={`flex items-center p-4 rounded-lg cursor-pointer transition-colors ${
                      selectedRequirements.includes(index) 
                        ? 'bg-teal-50 border border-teal-200' 
                        : 'bg-gray-50 border border-gray-100 hover:bg-gray-100'
                    }`}
                  >
                    <div className={`mr-4 rounded-full p-1 ${
                      selectedRequirements.includes(index) ? 'bg-tealcustom text-white' : 'bg-gray-200'
                    }`}>
                      <CheckCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">{req.title}</h4>
                      <p className="text-sm text-gray-600">{req.content}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-center">
                <button
                  onClick={handleSubmit}
                  className="px-6 py-3 bg-tealcustom text-white rounded-full font-medium hover:bg-teal-800 transition-colors"
                >
                  {selectedRequirements.length === requirements.length ? 'Continue to Available Pets' : 'Check Requirements'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default AdoptionRequirementsPage;