import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ChevronLeft, PawPrint, Heart, FileText, Phone, Users, Home, Search, ArrowRight } from "lucide-react";
import { useEffect } from "react";

const AdoptionProcessPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
  
  return (
    <div className="min-h-screen w-screen bg-white">
      {/* Header */}
      <header className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <PawPrint className="text-teal-700 h-6 w-6"/>
          <span className="ml-2 text-xl font-bold">Paws</span>
        </div>
        
        <nav className="hidden md:flex space-x-6 items-center">
          <Link to="/" className="text-gray-500 hover:text-gray-900">Home</Link>
          <Link to="/pet-search" className="text-gray-500 hover:text-gray-900">Pet search</Link>
          <Link to="/adoption-process" className="text-gray-900 border-b-2 border-gray-900">Adoption process</Link>
          <Link to="/adoption-faq" className="text-gray-500 hover:text-gray-900">FAQ</Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="bg-teal-700 text-white py-16">
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
      <main className="container mx-auto px-4 py-16">
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
                <div className="absolute -top-4 -right-4 bg-teal-700 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg">
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
            className="inline-flex items-center bg-teal-700 hover:bg-teal-800 text-white px-8 py-4 rounded-full text-lg font-medium transition-all duration-200"
          >
            <span className="mr-2">View Available Pets</span>
            <ArrowRight className="h-5 w-5" />
          </Link>
        </motion.div>

        {/* Decorative Elements */}
        <div className="absolute right-0 top-1/4 opacity-5 transform rotate-12">
          <PawPrint className="h-40 w-40 text-teal-600" />
        </div>
        <div className="absolute left-0 bottom-1/3 opacity-5 transform -rotate-12">
          <PawPrint className="h-32 w-32 text-pink-300" />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-yellow-200 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center mb-6">
              <PawPrint className="text-teal-700 h-8 w-8 mr-2"/>
              <span className="text-2xl font-bold">Paws</span>
            </div>
            <p className="text-gray-700 mb-8">Make a difference. Adopt, don't shop.</p>
            <div className="border-t border-gray-300 pt-8">
              <p className="text-sm text-gray-600">© 2025 Paws. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AdoptionProcessPage;