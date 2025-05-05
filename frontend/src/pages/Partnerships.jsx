import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PawPrint, Building, ThumbsUp, Gift, ShieldCheck, Globe, LogOut, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Footer from "../components/page/Footer.jsx";
import { useAuthStore } from "../store/authStore";
import MessageForm from "../components/MessageForm"; 

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

const PartnerCard = ({ name, logo, description, type }) => {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-yellow-100 rounded-lg shadow-md overflow-hidden"
    >
      <div className="h-85 bg-gray-100 flex items-center justify-center p-4">
        <img src={logo} alt={name} className="max-h-full max-w-full object-contain" />
      </div>
      <div className="p-6">
        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-3 
          ${type === 'Sponsor' ? 'bg-pink-100 text-pink-800' : 
            type === 'Veterinary' ? 'bg-teal-100 text-teal-800' : 
            'bg-purple-100 text-purple-800'}`}
        >
          {type}
        </span>
        <h3 className="text-xl text-tealcustom font-bold mb-2">{name}</h3>
        <p className="text-gray-700">{description}</p>
      </div>
    </motion.div>
  );
};

const BenefitItem = ({ title, description, icon: Icon }) => {
  return (
    <div className="flex">
      <div className="flex-shrink-0">
        <div className="flex items-center justify-center h-12 w-12 rounded-md bg-tealcustom text-white">
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <div className="ml-4">
        <h3 className="text-lg font-medium mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </div>
  );
};

const Partnerships = () => {
  const partners = [
    {
      name: "PetCure Clinic",
      logo: "/images/petcure.jpeg",
      description: "Providing free veterinary care for all our rescued animals before adoption.",
      type: "Veterinary"
    },
    {
      name: "Purina",
      logo: "/images/purina.png",
      description: "Donating premium pet food to help keep our animals healthy and well-fed.",
      type: "Sponsor"
    },
    {
      name: "City Animal Hospital",
      logo: "/images/animal_hospital.png",
      description: "Offering discounted medical services and emergency care for our rescued pets.",
      type: "Veterinary"
    },
    {
      name: "Pet Supplies Co.",
      logo: "/images/pet_supply.jpg",
      description: "Providing toys, beds, and other essential supplies for our shelter animals.",
      type: "Sponsor"
    },
    {
      name: "Local University",
      logo: "/images/upt.webp",
      description: "Partnering on educational programs about animal welfare and responsible pet ownership.",
      type: "Educational"
    },
    {
      name: "Local Media Group",
      logo: "/images/tion.jpg",
      description: "Helping spread the word about adoptable pets and our mission through media coverage.",
      type: "Community"
    }
  ];

  const benefits = [
    {
      title: "Brand Visibility",
      description: "Your logo displayed on our website, adoption events, and marketing materials.",
      icon: Building
    },
    {
      title: "Community Impact",
      description: "Make a meaningful difference in animal welfare and community education.",
      icon: Globe
    },
    {
      title: "Social Responsibility",
      description: "Demonstrate your commitment to social causes and animal welfare.",
      icon: ThumbsUp
    },
    {
      title: "Tax Benefits",
      description: "Enjoy potential tax benefits from contributing to our registered non-profit.",
      icon: Gift
    },
    {
      title: "Customer Loyalty",
      description: "Increase customer loyalty by supporting causes they care about.",
      icon: ShieldCheck
    }
  ];

    const { logout } = useAuthStore();
    const navigate = useNavigate();
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
        }, []);

    const handleLogout = () => {
        logout();
        navigate('/login'); 
        };

    const openMessageModal = () => {
        setIsMessageModalOpen(true);
    };

    const closeMessageModal = () => {
        setIsMessageModalOpen(false);
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
            <h1 className="text-4xl font-bold ml-2">Our Partnerships</h1>
          </div>
          <p className="text-xl mx-auto max-w-3xl">
            We collaborate with businesses, veterinarians, and community organizations to provide the best care for our animals and enhance our adoption services. Together, we're making a bigger impact on animal welfare.
          </p>
        </div>
      </div>

      {/* Current Partners Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl text-tealcustom font-bold mb-8 text-center">Our Current Partners</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {partners.map((partner, index) => (
            <PartnerCard key={index} {...partner} />
          ))}
        </div>
      </div>

      {/* Partner With Us Section */}
      <div className="bg-tealcustom text-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">Partner With Us</h2>
          <div className="max-w-3xl mx-auto text-center mb-12">
            <p className="text-xl">
              Join our mission to find loving homes for animals in need. We offer various partnership opportunities that can be tailored to your organization's goals and values.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-yellow-100 rounded-lg shadow-md p-6 text-gray-800">
              <h3 className="text-xl font-bold mb-4 text-tealcustom">Corporate Sponsorship</h3>
              <p className="mb-4">Financial support for our shelter operations and adoption programs.</p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-tealcustom mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Logo placement on our website
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-tealcustom mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Recognition at events
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-teal-700 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Social media mentions
                </li>
              </ul>
            </div>

            <div className="bg-yellow-100 rounded-lg shadow-md p-6 text-gray-800">
              <h3 className="text-xl font-bold mb-4 text-tealcustom">In-Kind Donations</h3>
              <p className="mb-4">Provide products or services that help our shelter animals.</p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-tealcustom mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Pet food and supplies
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-tealcustom mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Veterinary services
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-tealcustom mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Professional services
                </li>
              </ul>
            </div>

            <div className="bg-yellow-100 rounded-lg shadow-md p-6 text-gray-800">
              <h3 className="text-xl font-bold mb-4 text-tealcustom">Event Partnerships</h3>
              <p className="mb-4">Collaborate on adoption events, fundraisers, or educational programs.</p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-tealcustom mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Co-branded events
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-tealcustom mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Venue provision
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-tealcustom mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Community outreach
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl text-tealcustom font-bold mb-12 text-center">Partnership Benefits</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {benefits.map((benefit, index) => (
            <BenefitItem key={index} {...benefit} />
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-tealcustom text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Become a Partner Today</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Ready to make a difference in animal welfare? Contact us to discuss how we can work together to help animals in need.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={openMessageModal}
            className="bg-yellow-200 hover:bg-yellow-100 text-tealcustom font-bold py-3 px-8 rounded-md inline-flex items-center"
          >
            <span>Contact Our Partnership Team</span>
            <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </motion.button>
        </div>
      </div>

      {/* Bottom navigation */}
        <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto flex justify-between">
            <Link to="/team" className="text-tealcustom hover:text-teal-900 font-medium">
            ← Team
            </Link>
            <Link to="/terms" className="text-tealcustom hover:text-teal-900 font-medium">
            Terms of Service →
            </Link>
        </div>
        </div>

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

export default Partnerships;