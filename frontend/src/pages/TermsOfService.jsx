import React, { useState, useEffect } from 'react';
import { PawPrint, Shield, FileText, AlertCircle, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from "../store/authStore";
import Footer from "../components/page/Footer.jsx";

const TermsOfService = () => {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
            <h1 className="text-4xl font-bold ml-2">Terms of Service</h1>
          </div>
          <p className="text-xl mx-auto max-w-3xl">
            Please read these terms and conditions carefully before using our website and services. These terms outline your rights and responsibilities when using the Paws adoption platform.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto bg-yellow-100 rounded-lg shadow-md p-8">
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <FileText className="text-tealcustom h-6 w-6 mr-2" />
              <h2 className="text-2xl text-tealcustom font-bold">Introduction</h2>
            </div>
            <p className="mb-4">
              Welcome to Paws ("we," "our," or "us"). By accessing or using our website, mobile application, and services, you agree to be bound by these Terms of Service and our Privacy Policy.
            </p>
            <p>
              These Terms of Service govern your access to and use of our pet adoption platform, including any content, functionality, and services offered through our website or mobile application.
            </p>
          </div>

          <div className="mb-8">
            <div className="flex items-center mb-4">
              <Shield className="text-tealcustom h-6 w-6 mr-2" />
              <h2 className="text-2xl text-tealcustom font-bold">User Accounts</h2>
            </div>
            <p className="mb-4">
              To use certain features of our platform, you may need to register for an account. When you register, you agree to provide accurate, current, and complete information about yourself.
            </p>
            <p className="mb-4">
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
            </p>
            <p>
              We reserve the right to suspend or terminate your account if we determine, in our sole discretion, that you have violated these Terms of Service.
            </p>
          </div>

          <div className="mb-8">
            <div className="flex items-center mb-4">
              <AlertCircle className="text-tealcustom h-6 w-6 mr-2" />
              <h2 className="text-2xl text-tealcustom font-bold">Adoption Process and Services</h2>
            </div>
            <h3 className="text-xl text-tealcustom font-semibold mb-2">2.1 Adoption Applications</h3>
            <p className="mb-4">
              By submitting an adoption application through our platform, you represent and warrant that all information provided is accurate, complete, and truthful. Submitting an application does not guarantee approval or placement of any pet.
            </p>
            
            <h3 className="text-xl text-tealcustom font-semibold mb-2">2.2 Adoption Fees</h3>
            <p className="mb-4">
              Adoption fees vary depending on the type and age of the pet. All adoption fees are non-refundable once an adoption is finalized, unless otherwise stated in a specific adoption agreement.
            </p>
            
            <h3 className="text-xl text-tealcustom font-semibold mb-2">2.3 Post-Adoption Services</h3>
            <p>
              We may offer post-adoption support services. These services are provided on an "as available" basis and may be modified or discontinued at any time without prior notice.
            </p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl text-tealcustom font-bold mb-4">User Conduct</h2>
            <p className="mb-4">
              When using our platform, you agree not to:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Violate any applicable laws or regulations;</li>
              <li>Use the service for any illegal or unauthorized purpose;</li>
              <li>Attempt to gain unauthorized access to other user accounts;</li>
              <li>Post false, misleading, or deceptive information;</li>
              <li>Harass, abuse, or harm another person or animal;</li>
              <li>Submit adoption applications with false information;</li>
              <li>Use our platform to re-home pets without going through our proper channels;</li>
              <li>Interfere with or disrupt the service or servers;</li>
              <li>Transmit any viruses, malware, or other harmful code.</li>
            </ul>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl text-tealcustom font-bold mb-4">Intellectual Property</h2>
            <p className="mb-4">
              Our platform and its original content, features, and functionality are owned by Paws and are protected by international copyright, trademark, and other intellectual property laws.
            </p>
            <p>
              You may not reproduce, distribute, modify, create derivative works of, publicly display, publicly perform, republish, download, store, or transmit any materials from our platform without our prior written consent, except for temporary viewing on a personal computer or mobile device.
            </p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl text-tealcustom font-bold mb-4">Privacy and Data Protection</h2>
            <p className="mb-4">
              We collect and process personal data in accordance with our Privacy Policy. By using our platform, you consent to our data practices as described in our Privacy Policy.
            </p>
            <p>
              You have certain rights regarding your personal data, including the right to access, correct, and delete your personal information. Please refer to our Privacy Policy for more information on how to exercise these rights.
            </p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl text-tealcustom font-bold mb-4">Limitation of Liability</h2>
            <p className="mb-4">
              To the maximum extent permitted by law, Paws and its officers, directors, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or use, arising out of or in connection with your use of our platform.
            </p>
            <p>
              We do not guarantee that pets adopted through our platform will be free from health issues or behavioral problems. We provide information about each pet based on available knowledge, but cannot guarantee the accuracy or completeness of all pet details.
            </p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl text-tealcustom font-bold mb-4">Modifications to Terms</h2>
            <p className="mb-4">
              We reserve the right to modify these Terms of Service at any time. When we make changes, we will update the "Last Modified" date at the bottom of this page and notify you through the platform or via email.
            </p>
            <p>
              Your continued use of our platform after any changes to these Terms of Service constitutes your acceptance of the revised terms.
            </p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl text-tealcustom font-bold mb-4">Termination</h2>
            <p className="mb-4">
              We may terminate or suspend your account and access to our platform at any time, without prior notice or liability, for any reason, including if you violate these Terms of Service.
            </p>
            <p>
              Upon termination, your right to use our platform will immediately cease. All provisions of these Terms of Service that by their nature should survive termination shall survive termination.
            </p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl text-tealcustom font-bold mb-4">Governing Law</h2>
            <p>
              These Terms of Service shall be governed by and construed in accordance with the laws of Romania, without regard to its conflict of law provisions. Any legal action or proceeding arising out of or relating to these Terms of Service shall be brought exclusively in the courts of Timișoara, Romania.
            </p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl text-tealcustom font-bold mb-4">Contact Us</h2>
            <p className="mb-4">
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <address className="not-italic">
              <p>Paws Adoption</p>
              <p>Bd. Vasile Pârvan</p>
              <p>Timișoara, 300223</p>
              <p>România</p>
              <p>Email: legal@pawsadoption.com</p>
            </address>
          </div>

          <div className="text-sm text-gray-600 mt-8 pt-4 border-t border-gray-200">
            <p>Last Modified: May 5, 2025</p>
          </div>
        </div>

        {/* Bottom navigation */}
        <div className="max-w-4xl mt-8 flex w-full">
          <Link to="/team" className="text-tealcustom hover:text-teal-900 text-lg font-bold">
            ← Team
          </Link>
          <Link to="/partnerships" className="text-tealcustom hover:text-teal-900 text-lg font-bold">
            Partnerships →
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default TermsOfService;