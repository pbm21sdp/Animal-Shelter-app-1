import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { PawPrint, Heart, Mail, Phone, MapPin, LogOut, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Footer from "../components/page/Footer.jsx";
import { useAuthStore } from "../store/authStore";
import DonationModal from "../components/DonationModal"; 
import { useDonationStore } from "../store/donationStore";
import MessageForm from "../components/MessageForm"; // Importăm MessageForm

// Modal pentru formularul de mesaje
const MessageModal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative"
      >
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
        >
          <X className="h-6 w-6" />
        </button>
        <h2 className="text-2xl font-bold text-tealcustom mb-4">Send Us a Message</h2>
        {children}
      </motion.div>
    </div>
  );
};

const TeamMember = ({ name, role, image, bio }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-yellow-100 rounded-lg shadow-md overflow-hidden"
    >
      <div className="h-85 overflow-hidden">
        <img src={image} alt={name} className="w-full h-full object-cover" />
      </div>
      <div className="p-6">
        <h3 className="text-xl text-tealcustom font-bold mb-2">{name}</h3>
        <p className="text-tealcustom font-medium mb-4">{role}</p>
        <p className="text-gray-700 mb-4">{bio}</p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="text-tealcustom font-medium flex items-center"
        >
          <Mail className="w-4 h-4 mr-2" />
          Contact
        </motion.button>
      </div>
    </motion.div>
  );
};

const Team = () => { 
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const { createDonation } = useDonationStore();
    const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false); // State pentru modal-ul de mesaje

    useEffect(() => {
        window.scrollTo(0, 0);
      }, []);

      const openDonationModal = () => {
        console.log('Donate button clicked');
        if (!user || !user._id) {
            console.log('No user logged in, redirecting to login');
            navigate('/login');
            return;
        }
        console.log('Opening donation modal');
        setIsDonationModalOpen(true);
    };

    const closeDonationModal = () => {
        setIsDonationModalOpen(false);
    };

    // Funcții pentru modal-ul de mesaje
    const openMessageModal = () => {
        setIsMessageModalOpen(true);
    };

    const closeMessageModal = () => {
        setIsMessageModalOpen(false);
    };

    const handleDonate = async (amountInCents) => {
        console.log('Handling donation with amount (cents):', amountInCents);

        if (!user || !user._id) {
            console.log('No user logged in, redirecting to login');
            navigate('/login');
            return;
        }

        try {
            console.log('Calling createDonation with:', user._id, user.email, amountInCents);
            const success = await createDonation(user._id, user.email, amountInCents);

            console.log('Donation creation result:', success);

            if (!success) {
                console.log('Donation failed, closing modal');
                setIsDonationModalOpen(false);
            }
            // If successful, the user will be redirected to Stripe
        } catch (error) {
            console.error('Error in handleDonate:', error);
            setIsDonationModalOpen(false);
        }
    };

  const teamMembers = [
    {
      name: "Emma Thompson",
      role: "Founder & Director",
      image: "/images/angajat_femeie_4.jpg",
      bio: "Emma has been passionate about animal welfare since childhood. She founded Paws in 2018 after 15 years working with animal shelters across the country."
    },
    {
      name: "David Chen",
      role: "Veterinarian",
      image: "/images/angajat_barbat_2.jpg",
      bio: "With over 10 years of experience, Dr. Chen ensures all our animals receive the best medical care and are healthy before finding their forever homes."
    },
    {
      name: "Maria Rodriguez",
      role: "Adoption Specialist",
      image: "/images/angajat_femeie_3.jpg",
      bio: "Maria works directly with families to match them with the perfect pet. Her intuition for pairing pets with owners has led to countless successful adoptions."
    },
    {
      name: "James Wilson",
      role: "Animal Behaviorist",
      image: "/images/angajat_barbat_3.jpg",
      bio: "James specializes in understanding and addressing behavioral issues, ensuring our animals are ready for their new homes."
    },
    {
      name: "Sophia Patel",
      role: "Community Outreach",
      image: "/images/angajat_femeie_2.png",
      bio: "Sophia organizes our community events, education programs, and fundraising initiatives to spread awareness about pet adoption."
    },
    {
      name: "Alex Johnson",
      role: "Volunteer Coordinator",
      image: "/images/angajat_barbat_1.jpg",
      bio: "Alex manages our wonderful team of volunteers who help with everything from animal care to event organization."
    },
    {
      name: "Briana-Maria Negru",
      role: "Software Engineer",
      image: "/images/briana.jpg",
      bio: "Briana is half of the reason why you can access our cause on-line, at any time."
    },
    {
      name: "Marius-Ionut Nistor",
      role: "Software Engineer",
      image: "/images/marius.jpg",
      bio: "Marius is the other half of the reason why you can access our cause on-line, at any time."
    }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login'); 
  };

  return (
    <div className="bg-yellow-50 w-full min-h-screen">
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
          <a href="/adoption-faq" className="test-gray-900 border-b-2 border-gray-900">FAQ</a>
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
      <div className="bg-tealcustom text-white py-16 items-center justify-center">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center text-center mb-6">
            <PawPrint className="text-yellow-200 h-8 w-8" />
            <h1 className="text-4xl font-bold ml-2">Our Team</h1>
          </div>
          <p className="text-xl mx-auto max-w-3xl">
            Meet the dedicated professionals behind Paws who work tirelessly to rescue, rehabilitate, and rehome animals in need. Our passionate team brings together diverse expertise in veterinary care, animal behavior, and adoption services.
          </p>
        </div>
      </div>

      {/* Team Members Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl text-tealcustom font-bold mb-12 text-center">The People Behind Paws</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {teamMembers.map((member, index) => (
            <TeamMember key={index} {...member} />
          ))}
        </div>
      </div>

      {/* Mission Statement */}
      <div className="bg-tealcustom text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Heart className="h-16 w-16 mx-auto mb-6 text-yellow-200" />
            <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
            <p className="text-xl mb-8">
              At Paws, we believe every animal deserves a loving home. Our mission is to connect abandoned and rescued animals with caring families, reducing the number of homeless pets and enriching people's lives through the joy of pet ownership.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={openDonationModal}
              className="bg-yellow-200 text-tealcustom font-bold py-3 px-8 rounded-md"
            >
              Support Our Cause
            </motion.button>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <div className="bg-tealcustom rounded-lg shadow-md p-8">
           <h2 className="text-3xl font-bold mb-8 text-center text-white">Get in Touch</h2>
            <div className="flex flex-col md:flex-row gap-8 mb-8">
              <div className="flex-1 text-white">
                <div className="flex items-center mb-4">
                  <Phone className="h-5 w-5 text-white mr-3" />
                  <p className="text-lg">+40 723 456 789</p>
                </div>
                <div className="flex items-center mb-4">
                  <Mail className="h-5 w-5 text-white mr-3" />
                  <p className="text-lg">contact@pawsadoption.com</p>
                </div>
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-white mr-3 mt-1" />
                  <p className="text-lg">
                    Bd. Vasile Pârvan<br />
                    Timișoara, 300223<br />
                    România
                  </p>
                </div>
              </div>
              <div className="flex-1 text-white">
                <h3 className="text-xl font-bold mb-4">Working Hours</h3>
                <p className="mb-2"><span className="font-medium">Monday - Friday:</span> 9:00 AM - 6:00 PM</p>
                <p className="mb-2"><span className="font-medium">Saturday:</span> 10:00 AM - 4:00 PM</p>
                <p><span className="font-medium">Sunday:</span> Closed</p>
              </div>
            </div>
            {/* Butonul modificat pentru a deschide modal-ul cu formular */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={openMessageModal} // Adăugăm handler-ul pentru deschiderea modal-ului
              className="w-full bg-yellow-200 text-tealcustom font-bold py-3 rounded-md"
            >
              Send Us a Message
            </motion.button>
          </div>
        </div>
      </div>

      {/* Modal-ul pentru donații */}
      <DonationModal
        isOpen={isDonationModalOpen}
        onClose={closeDonationModal}
        onDonate={handleDonate}
      /> 

      {/* Modal-ul pentru formular de mesaje */}
      <MessageModal 
        isOpen={isMessageModalOpen} 
        onClose={closeMessageModal}
      >
        <MessageForm />
      </MessageModal>

      <Footer />
    </div>
  );
};

export default Team;