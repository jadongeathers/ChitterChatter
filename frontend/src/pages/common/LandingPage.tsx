import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import "./LandingPage.css"; // Import the CSS file with the animations

const LandingPage = () => {
  // Add smooth scrolling functionality
  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const targetElement = document.getElementById(targetId);
    
    if (targetElement) {
      window.scrollTo({
        top: targetElement.offsetTop,
        behavior: "smooth"
      });
    }
  };
  
  // Add smooth scrolling CSS globally
  useEffect(() => {
    // Add scroll-behavior to HTML element
    document.documentElement.style.scrollBehavior = "smooth";
    
    // Clean up when component unmounts
    return () => {
      document.documentElement.style.scrollBehavior = "";
    };
  }, []);
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section with White Background and Color Splashes */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden bg-white">
        {/* Colorful Paint Splashes Background - Repositioned to avoid text */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-0 w-1/4 h-1/4 rounded-bl-[100%] opacity-15 bg-red-500"></div>
          <div className="absolute bottom-0 left-0 w-1/5 h-1/5 rounded-tr-[100%] opacity-15 bg-yellow-400"></div>
          <div className="absolute top-1/5 left-[5%] w-12 h-12 rounded-full opacity-10 bg-green-400"></div>
          <div className="absolute bottom-1/3 right-[10%] w-16 h-16 rounded-full opacity-10 bg-blue-400"></div>
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="paint-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <circle cx="10" cy="10" r="3" fill="rgba(250, 90, 90, 0.12)" />
                <circle cx="30" cy="40" r="4" fill="rgba(255, 213, 79, 0.12)" />
                <circle cx="70" cy="30" r="2.5" fill="rgba(66, 186, 84, 0.12)" />
                <circle cx="90" cy="60" r="3.5" fill="rgba(79, 148, 255, 0.12)" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#paint-pattern)" />
          </svg>
        </div>

        {/* Hero Content */}
        <div className="container mx-auto px-4 z-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.img
              src="/images/logo2.png"
              alt="ChitterChatter Logo"
              className="mx-auto mb-6 w-auto h-32"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
            <h1 className="font-logo text-5xl md:text-6xl font-bold mb-4 text-gray-800">
              ChitterChatter
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-gray-600">
            Transform foreign language classroom concepts into authentic, spoken conversations with virtual practice partners
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-red-500 hover:bg-red-600 text-white font-medium px-8"
              >
                <Link to="/login">Login</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-yellow-500 text-yellow-600 hover:bg-yellow-50 bg-white"
              >
                <Link to="/register">Register</Link>
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Clickable Scroll indicator with smooth scrolling */}
        <a 
          href="#features"
          onClick={(e) => handleSmoothScroll(e, "features")}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 cursor-pointer transition-transform hover:translate-y-1"
          aria-label="Scroll down to features"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              ></path>
            </svg>
          </motion.div>
        </a>
      </section>

      {/* Features Section - Removed border */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">How ChitterChatter Works</h2>
          <p className="text-center text-gray-600 max-w-3xl mx-auto mb-16">
            Our virtual practice partner uses advanced language models to create authentic 
            conversations that help you become comfortable speaking your target language.
          </p>
          
          <div className="grid md:grid-cols-3 gap-12">
            {/* Feature 1 - Enhanced shadow */}
            <motion.div
              className="flex flex-col items-center text-center bg-white rounded-xl shadow-md p-8 border border-gray-200 hover:shadow-lg transition-shadow relative overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-100 rounded-bl-full opacity-40"></div>
              <div className="bg-white p-4 rounded-full mb-6 text-red-500 shadow-sm border border-gray-100 z-10">
                <svg
                  className="w-10 h-10"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800 z-10">Interactive Conversations</h3>
              <p className="text-gray-600 z-10">
                Practice speaking in any foreign language with a responsive virtual partner that adapts 
                to your proficiency level
              </p>
            </motion.div>

            {/* Feature 2 - Enhanced shadow */}
            <motion.div
              className="flex flex-col items-center text-center bg-white rounded-xl shadow-md p-8 border border-gray-200 hover:shadow-lg transition-shadow relative overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-100 rounded-bl-full opacity-40"></div>
              <div className="bg-white p-4 rounded-full mb-6 text-yellow-500 shadow-sm border border-gray-100 z-10">
                <svg
                  className="w-10 h-10"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800 z-10">Curriculum-Aligned Practice</h3>
              <p className="text-gray-600 z-10">
                Reinforce classroom learning with conversations that build on concepts and 
                vocabulary from your lessons
              </p>
            </motion.div>

            {/* Feature 3 - Enhanced shadow */}
            <motion.div
              className="flex flex-col items-center text-center bg-white rounded-xl shadow-md p-8 border border-gray-200 hover:shadow-lg transition-shadow relative overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-100 rounded-bl-full opacity-40"></div>
              <div className="bg-white p-4 rounded-full mb-6 text-green-500 shadow-sm border border-gray-100 z-10">
                <svg
                  className="w-10 h-10"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800 z-10">Personalized Feedback</h3>
              <p className="text-gray-600 z-10">
                Receive detailed feedback on your speaking practice to help you gain confidence and build fluency
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* About/Research Section - Removed border */}
      <section className="py-20 relative overflow-hidden">
        {/* Paint-like background */}
        <div className="absolute inset-0 bg-gray-50">
          <div className="absolute top-0 left-0 w-1/4 h-1/4 rounded-br-[100%] opacity-10 bg-red-300"></div>
          <div className="absolute bottom-0 right-0 w-1/5 h-1/5 rounded-tl-[100%] opacity-10 bg-yellow-300"></div>
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="research-pattern" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
                <circle cx="10" cy="30" r="4" fill="rgba(250, 90, 90, 0.1)" />
                <circle cx="40" cy="80" r="6" fill="rgba(255, 213, 79, 0.1)" />
                <circle cx="90" cy="40" r="3" fill="rgba(66, 186, 84, 0.1)" />
                <circle cx="110" cy="90" r="5" fill="rgba(79, 148, 255, 0.1)" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#research-pattern)" />
          </svg>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-center mb-10"
            >
              <h2 className="text-3xl font-bold mb-4 text-gray-800">About Our Research</h2>
              <div className="h-1 w-20 bg-red-400 mx-auto mb-8"></div>
            </motion.div>
            
            <div className="bg-white rounded-lg shadow-md p-8 border border-gray-200">
              <p className="text-gray-700 mb-4">
                ChitterChatter develops a <span className="font-semibold">virtual practice partner</span> for language learning, using large language models with speech-to-speech capabilities to create an interactive, classroom-integrated platform.
              </p>
              <p className="text-gray-700 mb-4">
                The system provides students with engaging speaking practice in their target language while aligning with instructor-configured curricula. Instructors can easily incorporate the system by sharing their existing lesson plans, which automatically adapt the practice partner's behavior.
              </p>
              <p className="text-gray-700">
                Through responsive and contextually relevant conversations, ChitterChatter aims to help students become more comfortable speaking their target language while building confidence and proficiency.
              </p>
            </div>
              
            <div className="text-center mt-8">
              <Button
                asChild
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                <Link to="/research-team">Learn More About Our Research</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* "For Who" Section - Removed border */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">Who ChitterChatter Is For</h2>
          <div className="h-1 w-20 bg-yellow-400 mx-auto mb-16"></div>
          
          <div className="grid md:grid-cols-2 gap-16">
            {/* For Students - Enhanced shadow */}
            <motion.div
              className="bg-white rounded-lg shadow-md p-8 border border-gray-200 relative overflow-hidden hover:shadow-lg transition-shadow"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-red-50 rounded-bl-full"></div>
              <div className="flex items-center mb-6 relative z-10">
                <div className="bg-white p-3 rounded-full mr-4 shadow-sm border border-red-100">
                  <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-800">For Language Students</h3>
              </div>
              
              <ul className="space-y-4 text-gray-600 relative z-10">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-red-500 mt-1 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Practice speaking at any time, from anywhere</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-red-500 mt-1 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Build confidence in a judgment-free environment</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-red-500 mt-1 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Reinforce vocabulary and grammar from your lessons</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-red-500 mt-1 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Explore different conversation scenarios</span>
                </li>
              </ul>
              
              <Button
                asChild
                className="mt-8 bg-red-500 hover:bg-red-600 text-white w-full"
              >
                <Link to="/register">Register as a Student</Link>
              </Button>
            </motion.div>
            
            {/* For Instructors - Enhanced shadow */}
            <motion.div
              className="bg-white rounded-lg shadow-md p-8 border border-gray-200 relative overflow-hidden hover:shadow-lg transition-shadow"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-yellow-50 rounded-bl-full"></div>
              <div className="flex items-center mb-6 relative z-10">
                <div className="bg-white p-3 rounded-full mr-4 shadow-sm border border-yellow-100">
                  <svg className="w-8 h-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1M19 20a2 2 0 002-2V8a2 2 0 00-2-2h-5a2 2 0 00-2 2v12a1 1 0 001 1h8zm-3-5v-3a1 1 0 10-2 0v3a1 1 0 102 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-800">For Language Instructors</h3>
              </div>
              
              <ul className="space-y-4 text-gray-600 relative z-10">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-yellow-500 mt-1 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Easily integrate with your existing curriculum</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-yellow-500 mt-1 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Provide students with additional speaking practice</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-yellow-500 mt-1 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Track student progress and identify areas for improvement</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-yellow-500 mt-1 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>No extensive prep work — just share your lesson plans</span>
                </li>
              </ul>
              
              <Button
                asChild
                className="mt-8 bg-yellow-500 hover:bg-yellow-600 text-white w-full"
              >
                <Link to="/register">Register as an Instructor</Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer - Kept only necessary border */}
      <footer className="bg-gray-100 text-gray-800 py-12 border-t border-gray-200">
        <div className="container mx-auto px-4 text-center">
          <div className="flex flex-col items-center justify-center mb-6">
            <img
              src="/images/logo2.png"
              alt="ChitterChatter Logo"
              className="h-16 w-auto mb-2"
            />
            <h3 className="font-logo text-xl text-gray-800">ChitterChatter</h3>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8 my-6">
            <Link to="/login" className="text-gray-800 hover:text-red-600 transition-colors">
              Login
            </Link>
            <Link to="/register" className="text-gray-800 hover:text-yellow-600 transition-colors">
              Register
            </Link>
            <Link to="/research-team" className="text-gray-800 hover:text-red-600 transition-colors">
              Research Team
            </Link>
            <a
              href="mailto:jag569@cornell.edu"
              className="text-gray-800 hover:text-yellow-600 transition-colors"
            >
              Contact Us
            </a>
          </div>
          
          <div className="pt-6 border-t border-gray-200 text-center text-gray-600 text-sm">
            <p>
              © {new Date().getFullYear()} ChitterChatter. A Cornell University Research Project.
              All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;