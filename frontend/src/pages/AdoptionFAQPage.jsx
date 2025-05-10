import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { User, PawPrint, Heart, ChevronDown, ChevronUp, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import Footer from "../components/page/Footer.jsx";
import { useAuthStore } from "../store/authStore";

const AdoptionFAQPage = () => {
  const [openFAQ, setOpenFAQ] = useState([]);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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

  const toggleFAQ = (index) => {
    if (openFAQ.includes(index)) {
      setOpenFAQ(openFAQ.filter(item => item !== index));
    } else {
      setOpenFAQ([...openFAQ, index]);
    }
  };

  const faqItems = [
    {
      question: "What is the adoption process like?",
      answer: "Your adoption process begins with browsing available animals, then filling out an application form. After your application is reviewed, we'll schedule an interview and home check. Then you'll meet your potential pet, complete the required documentation, and welcome your new friend home!"
    },
    {
      question: "How much does it cost to adopt a pet?",
      answer: "Adoption fees typically range from $50-$300 depending on the animal's age, type, and medical needs. This fee helps cover vaccinations, spay/neuter procedures, microchipping, and general care while at our shelter. You can find each of our animals' fees in their respective profiles."
    },
    {
      question: "What animals are available for adoption?",
      answer: "We have a variety of animals available including dogs, cats, rabbits, and occasionally other small animals. Each animal has its own profile with their photos, personality, behavior, and medical information to help you find your perfect match."
    },
    {
      question: "Can I adopt if I rent my home?",
      answer: "Yes, but you'll need to provide documentation that pets are allowed in your rental property. This might include a copy of your lease or a written statement from your landlord confirming pet permission."
    },
    {
      question: "Do the animals have medical records?",
      answer: "Yes, all our animals come with detailed medical records including vaccination history, any medical conditions, and information about spay/neuter procedures. We ensure all animals are up-to-date on routine care before adoption."
    },
    {
      question: "What if the pet doesn't work out with my family?",
      answer: "While we do everything possible to ensure good matches, sometimes issues arise. If you're having problems, we offer post-adoption support and resources. If returning is necessary, we accept animals back and ask you to provide detailed information to help with their next placement."
    },
    {
      question: "How long does the adoption process take?",
      answer: "The adoption process typically takes 1-2 weeks from application to bringing your pet home. This allows time for processing your application, conducting interviews, and ensuring the animal is ready to go home."
    },
    {
      question: "Can I adopt a pet as a gift for someone?",
      answer: "We generally don't recommend pet adoptions as surprise gifts. Instead, consider giving a gift certificate for adoption fees and allowing the recipient to choose their own animal. This ensures a good match and proper preparation."
    },
    {
      question: "Are all animals spayed or neutered before adoption?",
      answer: "Yes, all our dogs, cats, and rabbits are spayed or neutered before going to their new homes. This is part of our commitment to responsible pet ownership and preventing pet overpopulation."
    },
    {
      question: "Do you offer any post-adoption support?",
      answer: "Absolutely! We provide post-adoption support including behavioral advice, training resources, and medical guidance. We're committed to ensuring a successful transition and are always available to answer questions or provide assistance."
    },
    {
      question: "Can I meet an animal before deciding to adopt?",
      answer: "Yes, we encourage potential adopters to meet animals before making a decision. We can arrange meet-and-greets with your family (including any current pets) to ensure it's a good match for everyone involved."
    },
    {
      question: "What should I prepare before bringing my new pet home?",
      answer: "Before bringing your new pet home, prepare appropriate food, bedding, toys, and grooming supplies. Set up a quiet space where they can adjust, pet-proof your home, and locate a veterinarian in your area. We provide a detailed checklist during the adoption process."
    },
    {
      question: "Do you offer adoption services for senior citizens or people with disabilities?",
      answer: "Yes, we have special adoption programs designed for seniors and individuals with disabilities. These programs may include reduced adoption fees, assistance with pet selection based on specific needs, and additional post-adoption support."
    },
    {
      question: "What vaccinations do adopted pets receive?",
      answer: "All adopted dogs and cats receive core vaccinations appropriate for their age. Dogs typically receive vaccines for rabies, distemper, parvovirus, and bordetella. Cats receive vaccines for rabies, feline viral rhinotracheitis, calicivirus, and panleukopenia. Additional vaccines may be recommended by your veterinarian."
    },
    {
      question: "Do you accept returns if the adoption doesn't work out?",
      answer: "Yes, we have a return policy if the adoption doesn't work out. We ask that you contact us first so we can try to resolve any issues. If returning is necessary, we request that you provide detailed information about the pet's behavior and needs to help us find a more suitable home."
    },
    {
      question: "Can I adopt if I have never owned a pet before?",
      answer: "Absolutely! First-time pet owners are welcome. We provide extra guidance and resources to help you succeed. During the adoption process, we'll match you with an animal that suits your experience level and lifestyle."
    },
    {
      question: "What should I do if my pet doesn't seem to adapt well?",
      answer: "Some pets take longer to accomodate to a new environment, either because of their past traumas or because of their personality. Don't worry if it takes longer for them to warm up. Some may hide in weird spots or even avoid you. Give them time and make sure you keep reassuring them of your intentions."  
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
    <div className="min-h-screen w-screen bg-white overflow-x-hidden">
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
          <a href="/adoption-requirements" className="text-gray-500 hover:text-gray-900">Requirements</a>
          <a href="/adoption-faq" className="text-gray-900 border-b-2 border-gray-900">FAQ</a>
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
      <section className="bg-tealcustom text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Pet Adoption FAQs
            </h1>
            <p className="text-xl mb-8 text-gray-100">
              Got any questions? See if you can find your answer here.
            </p>
          </div>
        </div>
      </section>
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <motion.div 
            className="space-y-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {faqItems.map((item, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-5 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                >
                  <h3 className="font-semibold text-lg text-teal-900">{item.question}</h3>
                  <div className="text-teal-600">
                    {openFAQ.includes(index) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </button>
                
                {openFAQ.includes(index) && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="px-6 pb-5"
                  >
                    <p className="text-gray-700 leading-relaxed">{item.answer}</p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </motion.div>
          
          <div className="text-center mt-12">
            <Link
              to="/adoption-process"
              className="inline-flex items-center bg-tealcustom hover:bg-teal-800 text-white px-8 py-4 rounded-full text-lg font-medium transition-all duration-200 mr-4"
            >
              <PawPrint className="mr-2 h-5 w-5" />
              Adoption Process
            </Link>
            <Link
              to="/adoption-requirements"
              className="inline-flex items-center bg-tealcustom hover:bg-teal-800 text-white px-8 py-4 rounded-full text-lg font-medium transition-all duration-200 mr-4"
            >
              <PawPrint className="mr-2 h-5 w-5" />
              View Requirements
            </Link>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default AdoptionFAQPage;