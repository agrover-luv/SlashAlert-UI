import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { User } from '@/api/entities';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock } from 'lucide-react';

import CheckoutForm from '../components/checkout/CheckoutForm';
import OrderSummary from '../components/checkout/OrderSummary';
import { Button } from '@/components/ui/button';

const plans = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    price: 9.99,
  }
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const planId = searchParams.get('plan');
  const plan = plans[planId] || null;

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handlePayment = async (paymentResult) => {
    setIsProcessing(true);
    setError(null);

    if (paymentResult.success) {
      // Navigate to success page
      navigate(createPageUrl(`CheckoutSuccess?plan=${plan.id}`));
    } else {
      setError(paymentResult.error || "Payment failed. Please try again.");
    }
    
    setIsProcessing(false);
  };

  if (!plan || plan.id === 'free') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-50 flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Invalid subscription plan selected.</h1>
          <Button onClick={() => navigate(createPageUrl('Account'))} className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            Go to Account Page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl('Account'))}
            className="mb-4 text-neutral-600 hover:text-neutral-900 hover:scale-105 transition-all"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Account
          </Button>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
            Secure Checkout ✨
          </h1>
          <p className="text-neutral-600 mt-2">
            You're upgrading to the <span className="font-bold text-purple-600">{plan.name}</span> plan.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <CheckoutForm 
              plan={plan}
              onPayment={handlePayment} 
              isProcessing={isProcessing}
              error={error}
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <OrderSummary plan={plan} />
            <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
              <Lock className="w-8 h-8 text-green-600" />
              <div>
                <h4 className="font-semibold text-green-800">Secure Payment Simulation</h4>
                <p className="text-sm text-green-700">
                  This demonstrates the checkout flow. In production, this would process real payments.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}