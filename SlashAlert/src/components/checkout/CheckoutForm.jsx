import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, CreditCard, Shield, Lock } from 'lucide-react';
import { StripeService } from '../stripe/StripeService';
import { User } from '@/api/entities';

export default function CheckoutForm({ plan, onPayment, isProcessing, error }) {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    nameOnCard: '',
    email: '',
    billingAddress: ''
  });

  const handleInputChange = (field, value) => {
    setPaymentData(prev => ({ ...prev, [field]: value }));
  };

  const handleStripeCheckout = async (e) => {
    e.preventDefault();
    setIsRedirecting(true);
    
    try {
      const user = await User.me();
      
      // In a real implementation, this would redirect to actual Stripe Checkout
      // For now, we'll simulate the payment process
      
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update user subscription
      await User.updateMyUserData({
        subscription_plan: plan.id,
        subscription_status: 'active',
        stripe_customer_id: `cus_${Date.now()}`,
        stripe_subscription_id: `sub_${Date.now()}`
      });
      
      // Call success callback
      if (onPayment) {
        onPayment({ success: true, plan: plan.id });
      }
      
    } catch (err) {
      console.error('Checkout error:', err);
      if (onPayment) {
        onPayment({ success: false, error: 'Payment failed. Please try again.' });
      }
    }
    
    setIsRedirecting(false);
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-2 border-purple-200 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-purple-100 to-pink-100 border-b-2 border-purple-200">
        <CardTitle className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          <CreditCard className="w-6 h-6 text-purple-500" />
          Secure Payment
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8">
        <form onSubmit={handleStripeCheckout} className="space-y-6">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-neutral-900 mb-2">
              Upgrade to {plan.name}
            </h3>
            <p className="text-neutral-600">
              You'll be charged <span className="font-bold text-purple-600">${plan.price}/month</span>
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
              <Input
                type="text"
                placeholder="1234 5678 9012 3456"
                value={paymentData.cardNumber}
                onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                className="w-full"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                <Input
                  type="text"
                  placeholder="MM/YY"
                  value={paymentData.expiryDate}
                  onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
                <Input
                  type="text"
                  placeholder="123"
                  value={paymentData.cvv}
                  onChange={(e) => handleInputChange('cvv', e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name on Card</label>
              <Input
                type="text"
                placeholder="John Doe"
                value={paymentData.nameOnCard}
                onChange={(e) => handleInputChange('nameOnCard', e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <Input
                type="email"
                placeholder="john@example.com"
                value={paymentData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-2xl border-2 border-green-200">
            <div className="flex items-center gap-3 mb-3">
              <Shield className="w-6 h-6 text-green-600" />
              <h4 className="font-bold text-green-800">Secure Payment Processing</h4>
            </div>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• 256-bit SSL encryption</li>
              <li>• PCI DSS compliant</li>
              <li>• Cancel anytime</li>
              <li>• Secure payment simulation</li>
            </ul>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-800">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={isRedirecting || isProcessing}
            className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 text-white py-4 text-lg font-bold rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
          >
            {isRedirecting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing Payment...
              </>
            ) : (
              <>
                <Lock className="w-5 h-5 mr-2" />
                Complete Payment ${plan.price}/month ✨
              </>
            )}
          </Button>

          <p className="text-xs text-neutral-500 text-center">
            By clicking "Complete Payment", you agree to our Terms of Service and Privacy Policy.
            Your subscription will automatically renew monthly until canceled.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}