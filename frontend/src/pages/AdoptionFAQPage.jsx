import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ChevronLeft, PawPrint, Heart, ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";

const AdoptionFAQPage = () => {
  const [openFAQ, setOpenFAQ] = useState(null);
  
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

  const toggleFAQ = (index) => {
    if (openFAQ === index) {
      setOpenFAQ(null);
    } else {
      setOpenFAQ(index);
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
              Pet Adoption FAQs
            </h1>
            <div className="w-20 opacity-0">
              {/* Empty div for spacing */}
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <main className="w-full bg-white pt-12 pb-16" style={{ width: "100vw", maxWidth: "100%" }}>
        <div className="px-4 sm:px-8 max-w-3xl mx-auto w-full">
          {/* Feature Image */}
          <div className="text-center mb-12">
            <motion.h2 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-3xl sm:text-4xl font-bold mt-8 mb-4 text-indigo-700 text-center"
              style={{ letterSpacing: "-0.5px" }}
            >
              Pet Adoption FAQs
            </motion.h2>
            <motion.p
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-gray-700 max-w-2xl mx-auto text-center mb-12"
            >
              Got any questions? See if you can find your answer here.
            </motion.p>
          </div>
          
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
                  <h3 className="font-semibold text-lg text-indigo-900">{item.question}</h3>
                  <div className="text-indigo-500">
                    {openFAQ === index ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </button>
                
                {openFAQ === index && (
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
          
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="text-center mt-12"
          >
            <Link
              to="/adoption-process"
              className="inline-flex items-center bg-gradient-to-r from-purple-400 to-purple-500 text-white px-8 py-4 rounded-full text-lg font-medium transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 mr-4"
              style={{ letterSpacing: "-0.3px" }}
            >
              <PawPrint className="mr-2 h-5 w-5" />
              Adoption Process
            </Link>
            <Link
              to="/adoption-requirements"
              className="inline-flex items-center bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-8 py-4 rounded-full text-lg font-medium transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105"
              style={{ letterSpacing: "-0.3px" }}
            >
              View Requirements
            </Link>
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

export default AdoptionFAQPage;