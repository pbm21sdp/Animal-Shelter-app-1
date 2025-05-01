import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, PawPrint, CheckCircle, Shield, HomeIcon, DollarSign, Clock, Heart, X } from "lucide-react";
import { useEffect, useState } from "react";

const AdoptionRequirementsPage = () => {
  // State for managing the modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequirements, setSelectedRequirements] = useState([]);
  const [showError, setShowError] = useState(false);
  const navigate = useNavigate();
  
  // Ensure page starts at the top when loaded and remove any margin/padding that might affect full width
  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Ensure full width by temporarily modifying body styles
    const originalBodyStyle = document.body.style.cssText;
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.maxWidth = "100%";
    document.body.style.overflowX = "hidden";
    
    // Add modern font to the page - using Poppins for a more modern look
    const fontLink = document.createElement('link');
    fontLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/poppins/4.0.0/poppins.css';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);
    document.body.style.fontFamily = "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    
    return () => {
      // Restore original body styles when component unmounts
      document.body.style.cssText = originalBodyStyle;
      if (document.head.contains(fontLink)) {
        document.head.removeChild(fontLink);
      }
    };
  }, []);

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
      navigate('/available-pets');
    } else {
      // Not all requirements met, show error message
      setShowError(true);
    }
  };

  const requirements = [
    {
      icon: <CheckCircle className="h-6 w-6 text-indigo-500" />,
      title: "Age Requirement",
      content: "Adopters must be at least 18 years old and provide valid ID verification.",
      color: "from-purple-100 to-purple-200"
    },
    {
      icon: <Shield className="h-6 w-6 text-indigo-500" />,
      title: "Home Stability",
      content: "We need proof of residence and landlord permission if you're renting.",
      color: "from-blue-100 to-blue-200"
    },
    {
      icon: <HomeIcon className="h-6 w-6 text-indigo-500" />,
      title: "Living Conditions",
      content: "Your home must have adequate space and a safe environment for the pet.",
      color: "from-yellow-100 to-yellow-200"
    },
    {
      icon: <DollarSign className="h-6 w-6 text-indigo-500" />,
      title: "Adoption Fee",
      content: "A modest adoption fee helps cover vaccinations, microchipping, and spay/neuter.",
      color: "from-pink-100 to-pink-200"
    },
    {
      icon: <Clock className="h-6 w-6 text-indigo-500" />,
      title: "Time Commitment",
      content: "You should have adequate time to spend with your new pet for bonding and care.",
      color: "from-blue-100 to-blue-200"
    },
    {
      icon: <Heart className="h-6 w-6 text-indigo-500" />,
      title: "Commitment to Care",
      content: "Ability to provide veterinary care, proper nutrition, and love for the animal's life.",
      color: "from-purple-100 to-purple-200"
    }
  ];
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };
  
  return (
    <div className="min-h-screen bg-white w-full m-0 p-0 overflow-hidden" style={{ width: "100vw", maxWidth: "100%" }}>
      {/* Simple Header */}
      <div className="relative overflow-hidden">
        <div className="bg-indigo-600 text-white py-8 w-full" style={{ width: "100vw", maxWidth: "100%" }}>
          <div className="flex items-center px-8 w-full max-w-7xl mx-auto">
            <Link to="/" className="flex items-center hover:text-white/80 transition-colors group">
              <div className="bg-white/20 rounded-full p-2 group-hover:bg-white/30 transition-all">
                <ChevronLeft className="h-5 w-5" />
              </div>
              <span className="ml-2 text-lg font-medium">Back</span>
            </Link>
            <h1 className="text-3xl sm:text-4xl font-bold mx-auto flex items-center" style={{ letterSpacing: "-0.5px" }}>
              <PawPrint className="mr-3 h-8 w-8" />
              Adoption Requirements
            </h1>
            <div className="w-20 opacity-0">
              {/* Empty div for spacing */}
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <main className="w-full bg-white pt-12 pb-16" style={{ width: "100vw", maxWidth: "100%" }}>
        <div className="px-4 sm:px-8 max-w-7xl mx-auto w-full">
          <motion.h2 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-3xl sm:text-4xl font-bold mt-8 mb-4 text-indigo-700 text-center"
            style={{ letterSpacing: "-0.5px" }}
          >
            Requirements
          </motion.h2>
          <motion.p
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-700 max-w-2xl mx-auto text-center mb-12"
          >
            Make sure you meet all necessary requirements to complete the adoption process
          </motion.p>
          
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
                className="relative"
              >
                <div className={`bg-gradient-to-br ${requirement.color} rounded-xl shadow-lg overflow-hidden transition-transform duration-300 hover:translate-y-[-5px] hover:shadow-xl text-center`}>
                  <div className="absolute top-0 right-0 bg-indigo-400/40 p-3 rounded-bl-xl">
                    <span className="font-bold text-xl text-indigo-600">{index + 1}</span>
                  </div>
                  <div className="p-6 pt-12">
                    <div className="flex flex-col items-center mb-4">
                      <div className="bg-white/70 p-3 rounded-full mb-3">
                        {requirement.icon}
                      </div>
                      <h3 className="text-xl font-bold text-indigo-700" style={{ letterSpacing: "-0.3px", fontSize: "1.3rem" }}>
                        {requirement.title}
                      </h3>
                    </div>
                    <p className="text-indigo-900/80 leading-relaxed px-3" style={{ fontSize: "1.05rem", fontWeight: "400" }}>
                      {requirement.content}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
          
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="text-center"
          >
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-8 py-4 rounded-full text-lg font-medium transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105"
              style={{ letterSpacing: "-0.3px" }}
            >
              <CheckCircle className="mr-2 h-5 w-5" />
              Check requirements
            </button>
          </motion.div>
          
          {/* Decorative Paw Prints */}
          <div className="absolute right-0 top-1/4 opacity-5 transform rotate-12">
            <PawPrint className="h-40 w-40 text-indigo-400" />
          </div>
          <div className="absolute left-0 bottom-1/3 opacity-5 transform -rotate-12">
            <PawPrint className="h-32 w-32 text-pink-300" />
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
                <h3 className="text-2xl font-bold text-indigo-700">Confirm Requirements</h3>
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
                        ? 'bg-indigo-50 border border-indigo-200' 
                        : 'bg-gray-50 border border-gray-100 hover:bg-gray-100'
                    }`}
                  >
                    <div className={`mr-4 rounded-full p-1 ${
                      selectedRequirements.includes(index) ? 'bg-indigo-500 text-white' : 'bg-gray-200'
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
                  className="px-6 py-3 bg-indigo-600 text-white rounded-full font-medium hover:bg-indigo-700 transition-colors"
                >
                  {selectedRequirements.length === requirements.length ? 'Continue to Available Pets' : 'Check Requirements'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* Modern Footer */}
      <footer className="bg-indigo-600 py-10 mt-12 w-full text-white" style={{ width: "100vw", maxWidth: "100%" }}>
        <div className="px-8 text-center w-full max-w-7xl mx-auto">
          <p className="text-lg font-light mb-4">Begin your journey to bring a new furry friend into your life today!</p>
          <div className="flex justify-center items-center mb-6">
            <div className="bg-white/20 p-2 rounded-full">
              <Heart className="h-6 w-6 text-pink-300" />
            </div>
            <span className="text-white font-medium ml-3 text-lg" style={{ letterSpacing: "-0.3px" }}>Make a difference. Adopt, don't shop.</span>
          </div>
          <div className="border-t border-white/20 pt-6 mt-6 text-sm text-white/70">
            <p>© 2025 Paws. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AdoptionRequirementsPage;