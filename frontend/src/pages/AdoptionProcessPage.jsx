import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ChevronLeft, PawPrint, Heart, FileText, Phone, Users, Home, Search } from "lucide-react";
import { useEffect } from "react";

const AdoptionProcessPage = () => {
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

  const steps = [
    {
      icon: <Search className="h-6 w-6 text-indigo-500" />,
      title: "Find Your Perfect Match",
      content: "Browse our gallery of animals and choose the companion that's right for you.",
      color: "from-yellow-100 to-yellow-200"
    },
    {
      icon: <FileText className="h-6 w-6 text-indigo-500" />,
      title: "Apply for Adoption",
      content: "Complete our online form to initiate the adoption process.",
      color: "from-blue-100 to-blue-200"
    },
    {
      icon: <Phone className="h-6 w-6 text-indigo-500" />,
      title: "Interview & Verification",
      content: "We'll schedule a phone interview and verify the living conditions for the animal.",
      color: "from-purple-100 to-purple-200"
    },
    {
      icon: <Heart className="h-6 w-6 text-indigo-500" />,
      title: "Meet Your Future Pet",
      content: "We'll arrange a meeting for you to get to know your future companion.",
      color: "from-pink-100 to-pink-200"
    },
    {
      icon: <FileText className="h-6 w-6 text-indigo-500" />,
      title: "Complete Documentation",
      content: "Sign the adoption contract and receive all necessary documents.",
      color: "from-blue-100 to-blue-200"
    },
    {
      icon: <Home className="h-6 w-6 text-indigo-500" />,
      title: "Welcome Home!",
      content: "Take your new family member home and begin your adventure together!",
      color: "from-yellow-100 to-yellow-200"
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
      {/* Modern Header with Fluid Wave */}
      <div className="relative overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-300 to-indigo-400 text-white py-8 w-full" style={{ width: "100vw", maxWidth: "100%" }}>
          <div className="flex items-center px-8 w-full max-w-7xl mx-auto relative z-10">
            <Link to="/" className="flex items-center hover:text-white/80 transition-colors group">
              <div className="bg-white/20 rounded-full p-2 group-hover:bg-white/30 transition-all">
                <ChevronLeft className="h-5 w-5" />
              </div>
              <span className="ml-2 text-lg font-medium">Back</span>
            </Link>
            <h1 className="text-3xl sm:text-4xl font-bold mx-auto flex items-center" style={{ letterSpacing: "-0.5px" }}>
              <PawPrint className="mr-3 h-8 w-8" />
              Adoption Process
            </h1>
            <div className="w-20 opacity-0">
              {/* Empty div for spacing */}
            </div>
          </div>
        </div>
        
        {/* Improved Fluid Wave SVG */}
        <svg className="absolute bottom-0 left-0 w-full fill-white" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25"></path>
          <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5"></path>
          <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"></path>
        </svg>
      </div>
      
      {/* Main Content */}
      <main className="w-full bg-white pt-20 pb-16" style={{ width: "100vw", maxWidth: "100%" }}>
        <div className="px-4 sm:px-8 max-w-7xl mx-auto w-full">
          <motion.h2 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-3xl sm:text-4xl font-bold mb-16 text-indigo-700 text-center"
            style={{ letterSpacing: "-0.5px" }}
          >
            The Adoption Journey in <span className="text-pink-500">6 Simple Steps</span>
          </motion.h2>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
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
                <div className={`bg-gradient-to-br ${step.color} rounded-xl shadow-lg overflow-hidden transition-transform duration-300 hover:translate-y-[-5px] hover:shadow-xl text-center`}>
                  <div className="absolute top-0 right-0 bg-indigo-400/40 p-3 rounded-bl-xl">
                    <span className="font-bold text-xl text-indigo-600">{index + 1}</span>
                  </div>
                  <div className="p-6 pt-12">
                    <div className="flex flex-col items-center mb-4">
                      <div className="bg-white/70 p-3 rounded-full mb-3">
                        {step.icon}
                      </div>
                      <h3 className="text-xl font-bold text-indigo-700" style={{ letterSpacing: "-0.3px" }}>
                        {step.title}
                      </h3>
                    </div>
                    <p className="text-indigo-900/80 leading-relaxed px-3" style={{ fontSize: "0.95rem" }}>
                      {step.content}
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
            className="mt-16 text-center"
          >
            <Link
              to="/available-pets"
              className="inline-flex items-center bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-8 py-4 rounded-full text-lg font-medium transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105"
              style={{ letterSpacing: "-0.3px" }}
            >
              <PawPrint className="mr-2 h-5 w-5" />
              View Available Pets
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
      <footer className="bg-gradient-to-r from-indigo-300 to-indigo-400 py-10 mt-12 w-full text-white" style={{ width: "100vw", maxWidth: "100%" }}>
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

export default AdoptionProcessPage;