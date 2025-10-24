import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import authService from '@/services/authService';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { BarChart, Bell, Search, DollarSign, Zap, Star, CheckCircle } from 'lucide-react';

const FeatureCard = ({ icon, title, description }) => (
  <motion.div 
    className="bg-white/50 backdrop-blur-lg p-6 rounded-2xl border border-purple-100 shadow-lg"
    whileHover={{ y: -5, boxShadow: "0px 10px 20px rgba(0,0,0,0.1)" }}
  >
    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 mb-4">
      {React.cloneElement(icon, { className: "w-6 h-6 text-purple-600" })}
    </div>
    <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </motion.div>
);

const Step = ({ number, title, description }) => (
  <div className="flex items-start gap-4">
    <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-lg shadow-md">
      {number}
    </div>
    <div>
      <h3 className="text-xl font-bold text-gray-800 mb-1">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  </div>
);


export default function HomePage() {
  const googleButtonRef = useRef(null);

  useEffect(() => {
    // Initialize Google Sign-In button when component mounts
    const initializeGoogleButton = async () => {
      await authService.initializeGoogle();
      
      // Render Google Sign-In button in header
      if (googleButtonRef.current) {
        authService.renderSignInButton(googleButtonRef.current, {
          theme: 'outline',
          size: 'large',
          text: 'sign_in_with',
          shape: 'rectangular'
        });
      }
    };

    initializeGoogleButton();

    // Listen for authentication state changes
    const handleAuthStateChanged = (event) => {
      if (event.detail.isAuthenticated) {
        // User is authenticated, redirect to dashboard
        window.location.href = createPageUrl("Dashboard");
      }
    };

    window.addEventListener('authStateChanged', handleAuthStateChanged);

    // Cleanup
    return () => {
      window.removeEventListener('authStateChanged', handleAuthStateChanged);
    };
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      await authService.signIn();
    } catch (error) {
      console.error('Google Sign-In failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 text-gray-700 font-sans">
      <style>{`
          :root {
            --primary-blue: #4f46e5;
            --primary-purple: #7c3aed;
            --accent-pink: #ec4899;
          }
        `}</style>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-purple-100">
        <div className="container mx-auto px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img 
              src="/logo.svg" 
              alt="SlashAlert Icon" 
              className="w-10 h-10"
            />
            <span className="font-bold text-xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              SlashAlert
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div ref={googleButtonRef}></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {/* Hero Section */}
        <section className="py-20 md:py-32 text-center">
          <div className="container mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl md:text-6xl font-extrabold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-4">
                Stop Overpaying. Start Saving.
              </h1>
              <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                SlashAlert is your personal shopping assistant that automatically tracks prices for products you love, ensuring you always buy at the best price.
              </p>
              <Button size="lg" onClick={handleGoogleSignIn} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <Zap className="w-5 h-5 mr-2" />
                Start Tracking for Free
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-white">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800">Why You'll Love SlashAlert</h2>
              <p className="text-lg text-gray-600 mt-2">Everything you need for smart shopping.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard 
                icon={<Bell />}
                title="Instant Price Alerts"
                description="Get notified by email or SMS the moment a price drops on a product you're tracking. Never miss a deal again."
              />
              <FeatureCard 
                icon={<Search />}
                title="Automated Tracking"
                description="Just add a product URL. We handle the rest, checking prices automatically so you don't have to."
              />
              <FeatureCard 
                icon={<BarChart />}
                title="Price History Charts"
                description="Visualize price trends over time to make informed decisions on when to buy."
              />
              <FeatureCard 
                icon={<DollarSign />}
                title="Price Drop Guarantee"
                description="Track items you've already bought. We'll alert you if the price drops within the store's guarantee period."
              />
               <FeatureCard 
                icon={<Star />}
                title="Cross-Retailer Comparison"
                description="Our AI finds the same or similar products on other sites to ensure you're getting the absolute best deal available online."
              />
              <FeatureCard 
                icon={<CheckCircle />}
                title="Simple & Intuitive"
                description="A clean, user-friendly dashboard makes it effortless to manage your tracked products and savings."
              />
            </div>
          </div>
        </section>
        
        {/* How It Works Section */}
        <section className="py-20">
           <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800">Get Started in 3 Simple Steps</h2>
            </div>
            <div className="max-w-3xl mx-auto space-y-12">
              <Step 
                number="1"
                title="Add a Product"
                description="Simply paste the URL of the product you want to track from any major online retailer, or use our smart receipt scanner."
              />
              <Step 
                number="2"
                title="Set Your Target"
                description="Tell us your desired price. We'll monitor it 24/7 and notify you when the price hits your target or drops significantly."
              />
              <Step 
                number="3"
                title="Save Money"
                description="Receive an alert, buy with confidence, and enjoy your savings! Watch your lifetime savings grow on your dashboard."
              />
            </div>
           </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-purple-100">
        <div className="container mx-auto px-6 py-8 text-center text-gray-600">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img 
              src="/logo.svg" 
              alt="SlashAlert Icon" 
              className="w-8 h-8"
            />
            <span className="font-bold text-lg text-gray-800">
              SlashAlert
            </span>
          </div>
          <p>&copy; {new Date().getFullYear()} SlashAlert. Track smarter, save more.</p>
        </div>
      </footer>
    </div>
  );
}