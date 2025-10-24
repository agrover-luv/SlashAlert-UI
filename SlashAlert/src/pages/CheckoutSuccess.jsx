import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { User } from '@/api/entities';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { CheckCircle, Sparkles, Star, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StripeService } from '../components/stripe/StripeService';

export default function CheckoutSuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const planId = searchParams.get('plan');
  
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionDetails, setSubscriptionDetails] = useState(null);

  useEffect(() => {
    // Simulate payment verification
    verifyPayment();
  }, []);

  const verifyPayment = async () => {
    try {
      // In a real implementation, this would verify the actual Stripe session
      const mockSessionId = `cs_${Date.now()}_${planId}`;
      const data = await StripeService.verifySession(mockSessionId);
      
      if (data.success) {
        setSubscriptionDetails(data.subscription);
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-50 flex items-center justify-center p-6">
        <Card className="p-8 bg-white/90 backdrop-blur-sm shadow-xl">
          <CardContent className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Verifying your payment...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-50 flex items-center justify-center p-6">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, type: "spring" }}
        >
          <Card className="bg-white/90 backdrop-blur-sm shadow-2xl border-2 border-green-200">
            <CardContent className="p-12 text-center">
              {/* Success Animation */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-24 h-24 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl"
              >
                <CheckCircle className="w-12 h-12 text-white" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-4 flex items-center justify-center gap-2">
                  Payment Successful!
                  <Sparkles className="w-8 h-8 text-yellow-500" />
                </h1>
                
                <p className="text-xl text-gray-600 mb-8">
                  Welcome to PriceTracker Premium! 🎉
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-gradient-to-r from-purple-50 to-pink-50 p-8 rounded-2xl border-2 border-purple-200 mb-8"
              >
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Star className="w-6 h-6 text-yellow-500" />
                  <h2 className="text-2xl font-bold text-purple-600">You now have access to:</h2>
                  <Star className="w-6 h-6 text-yellow-500" />
                </div>
                <ul className="text-left space-y-3 text-gray-700">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Unlimited product tracking</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Hourly price checks</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Instant "Check Price Now" feature</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>SMS alerts and notifications</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Priority customer support</span>
                  </li>
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="space-y-4"
              >
                <Button
                  onClick={() => navigate(createPageUrl('Dashboard'))}
                  className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 text-white px-8 py-4 text-lg font-bold rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                >
                  Start Tracking Products
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                
                <div className="flex gap-4 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => navigate(createPageUrl('Account'))}
                    className="border-2 border-purple-300 text-purple-600 hover:bg-purple-50"
                  >
                    View Account Settings
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate(createPageUrl('AddProduct'))}
                    className="border-2 border-green-300 text-green-600 hover:bg-green-50"
                  >
                    Add Your First Product
                  </Button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl"
              >
                <p className="text-sm text-blue-700">
                  <strong>Simulation Complete:</strong> Your subscription has been updated successfully. In a production environment, you would receive a confirmation email with your receipt.
                </p>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}