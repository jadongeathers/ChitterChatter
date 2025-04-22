import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import "./LandingPage.css"; // Import the same CSS file for consistency

const ResearchTeam = () => {
  // Updated research team members with accurate information
  const teamMembers = [
    {
      name: "Jadon Geathers",
      role: "Lead Researcher",
      description: "Ph.D. Student, Information Science\nCornell University, Future of Learning Lab",
      image: "/images/team/jadon-geathers.jpg"
    },
    {
      name: "AJ Alvero",
      role: "Project Advisor",
      description: "Computational Sociologist\nCornell University Center for Data Science for Enterprise and Society",
      image: "/images/team/aj-alvero.jpg"
    },
    {
      name: "Rene Kizilcec",
      role: "Faculty Advisor",
      description: "Associate Professor of Information Science\nDirector, Future of Learning Lab\nCornell University",
      image: "/images/team/rene-kizilcec.jpg"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with white background and subtle shadow */}
      <header className="bg-white shadow-md py-6">
        <div className="container mx-auto px-4">
          <nav className="flex justify-between items-center">
            <Link to="/" className="flex items-center gap-2">
              <img
                src="/images/logo2.png"
                alt="ChitterChatter Logo"
                className="h-10 w-auto"
              />
              <span className="font-logo text-xl font-bold text-gray-800">ChitterChatter</span>
            </Link>
            <div className="flex gap-4">
              <Button
                asChild
                variant="ghost"
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                <Link to="/login">Login</Link>
              </Button>
              <Button
                asChild
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                <Link to="/register">Register</Link>
              </Button>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {/* Hero Section with Paint Splashes */}
        <section className="relative py-20 overflow-hidden">
          {/* Paint background similar to landing page */}
          <div className="absolute inset-0 bg-gray-50">
            <div className="absolute top-0 right-0 w-1/4 h-1/4 rounded-bl-[100%] opacity-15 bg-red-500"></div>
            <div className="absolute bottom-0 left-0 w-1/5 h-1/5 rounded-tr-[100%] opacity-15 bg-yellow-400"></div>
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

          <div className="container mx-auto px-4 relative z-10 text-center">
            <motion.h1 
              className="text-4xl md:text-5xl font-bold mb-6 text-gray-800"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Our Research Team
            </motion.h1>
            <div className="h-1 w-20 bg-red-400 mx-auto mb-8"></div>
            <motion.p 
              className="text-xl text-gray-700 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Meet the dedicated researchers behind ChitterChatter who are
              transforming foreign language classroom concepts into authentic, spoken conversations.
            </motion.p>
          </div>
        </section>

        {/* Team Section - Updated styling */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">Meet Our Team</h2>
            <div className="h-1 w-20 bg-yellow-400 mx-auto mb-16"></div>
            
            <div className="grid md:grid-cols-3 gap-12">
              {teamMembers.map((member, index) => (
                <motion.div
                  key={member.name}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="aspect-square bg-gray-200 cursor-pointer overflow-hidden">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      onError={(e) => {
                        // Fallback for missing images with initials
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          member.name
                        )}&background=f3f4f6&color=111827&size=256`;
                      }}
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-1 text-gray-800">{member.name}</h3>
                    <p className="text-red-500 font-medium mb-2">{member.role}</p>
                    <p className="text-gray-600 whitespace-pre-line text-sm">{member.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Research Overview - Updated styling */}
        <section className="py-20 relative overflow-hidden">
          {/* Paint-like background */}
          <div className="absolute inset-0 bg-gray-50">
            <div className="absolute top-0 left-0 w-1/4 h-1/4 rounded-br-[100%] opacity-10 bg-red-300"></div>
            <div className="absolute bottom-0 right-0 w-1/5 h-1/5 rounded-tl-[100%] opacity-10 bg-yellow-300"></div>
            <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="research-pattern-2" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
                  <circle cx="10" cy="30" r="4" fill="rgba(250, 90, 90, 0.1)" />
                  <circle cx="40" cy="80" r="6" fill="rgba(255, 213, 79, 0.1)" />
                  <circle cx="90" cy="40" r="3" fill="rgba(66, 186, 84, 0.1)" />
                  <circle cx="110" cy="90" r="5" fill="rgba(79, 148, 255, 0.1)" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#research-pattern-2)" />
            </svg>
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">Our Research</h2>
            <div className="h-1 w-20 bg-red-400 mx-auto mb-16"></div>
            
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-2xl font-bold mb-4 text-gray-800">Research Focus</h3>
                  <p className="text-gray-700 mb-4">
                    Our team is investigating the transformative potential of virtual practice partners in language education through several key research dimensions:
                  </p>
                  <ul className="space-y-4">
                    <li className="flex items-start">
                      <svg
                        className="w-6 h-6 text-red-500 mt-0.5 mr-2 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="text-gray-700">
                        <span className="font-semibold">Student Experience:</span> We examine how virtual conversation practice affects student confidence, motivation, anxiety reduction, and overall language proficiency development
                      </span>
                    </li>
                    <li className="flex items-start">
                      <svg
                        className="w-6 h-6 text-yellow-500 mt-0.5 mr-2 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="text-gray-700">
                        <span className="font-semibold">Classroom Integration:</span> Our work explores how instructors can effectively align virtual practice partners with their existing curricula, lesson plans, and pedagogical approaches
                      </span>
                    </li>
                    <li className="flex items-start">
                      <svg
                        className="w-6 h-6 text-red-500 mt-0.5 mr-2 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="text-gray-700">
                        <span className="font-semibold">Accessibility:</span> We investigate how virtual practice partners can provide speaking opportunities to students who might have limited access to native speakers or conversation partners
                      </span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-2xl font-bold mb-4 text-gray-800">System Design</h3>
                  <p className="text-gray-700 mb-4">
                    Our research explores optimal design elements for effective language learning systems:
                  </p>
                  <ul className="space-y-3 text-gray-700 mb-4">
                    <li className="flex items-start">
                      <svg
                        className="w-5 h-5 text-yellow-500 mt-0.5 mr-2 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span>
                        <span className="font-semibold">Interaction Models:</span> Investigating optimal conversation flow, turn-taking mechanisms, and pacing for different proficiency levels
                      </span>
                    </li>
                    <li className="flex items-start">
                      <svg
                        className="w-5 h-5 text-red-500 mt-0.5 mr-2 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span>
                        <span className="font-semibold">Feedback Mechanisms:</span> Exploring different approaches to error correction, pronunciation guidance, and performance assessment
                      </span>
                    </li>
                    <li className="flex items-start">
                      <svg
                        className="w-5 h-5 text-yellow-500 mt-0.5 mr-2 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span>
                        <span className="font-semibold">Cultural Context:</span> Developing approaches to represent cultural norms and pragmatics in conversation practice
                      </span>
                    </li>
                  </ul>
                  
                  <h3 className="text-xl font-bold mb-3 text-gray-800">Methodology</h3>
                  <p className="text-gray-700">
                    We use a mixed-methods approach combining quantitative metrics with qualitative assessments through surveys, interviews, and conversation analysis to provide a comprehensive understanding of virtual practice partner effectiveness.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Future Research Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">Ongoing Research</h2>
            <div className="h-1 w-20 bg-yellow-400 mx-auto mb-8"></div>
            
            <div className="max-w-3xl mx-auto">
              <motion.div
                className="p-8 bg-white rounded-lg shadow-md"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <p className="text-gray-700 mb-4">
                  Our research team is currently conducting studies on the effectiveness of virtual practice partners 
                  in foreign language learning environments. We are exploring how AI-driven conversation practice 
                  affects student confidence, fluency, and overall learning outcomes.
                </p>
                <p className="text-gray-700">
                  Through our work with ChitterChatter, we aim to develop best practices for integrating 
                  conversational AI technology into language education and establish methodologies for measuring 
                  the impact of these tools on student learning experiences.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Contact Section - Updated styling */}
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gray-50">
            <div className="absolute top-0 right-0 w-1/3 h-1/3 rounded-bl-[100%] opacity-15 bg-red-500"></div>
            <div className="absolute bottom-0 left-0 w-1/4 h-1/4 rounded-tr-[100%] opacity-15 bg-yellow-400"></div>
          </div>
          <div className="container mx-auto px-4 text-center relative z-10">
            <h2 className="text-3xl font-bold mb-6 text-gray-800">Contact Our Research Team</h2>
            <div className="h-1 w-20 bg-red-400 mx-auto mb-8"></div>
            <p className="text-xl mb-8 max-w-2xl mx-auto text-gray-700">
              Interested in learning more about our research or participating in our studies? 
              We're currently looking for language instructors and students to help us test and refine ChitterChatter.
            </p>
            <Button
              asChild
              size="lg"
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              <a href="mailto:jag569@cornell.edu">Email Us</a>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer - Updated to match landing page */}
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
            <Link to="/" className="text-gray-800 hover:text-red-600 transition-colors">
              Home
            </Link>
            <Link to="/login" className="text-gray-800 hover:text-red-600 transition-colors">
              Login
            </Link>
            <Link to="/register" className="text-gray-800 hover:text-yellow-600 transition-colors">
              Register
            </Link>
            <a
              href="mailto:jag569@cornell.edu"
              className="text-gray-800 hover:text-red-600 transition-colors"
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

export default ResearchTeam;