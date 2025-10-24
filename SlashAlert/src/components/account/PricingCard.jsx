import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Star, ArrowRight, ArrowDown, Loader2, DollarSign } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { StripeService } from '../stripe/StripeService';
import { User } from '@/api/entities';

export default function PricingCard({ plan, currentPlan, user }) {
  const navigate = useNavigate();
  const [isChanging, setIsChanging] = useState(false);
  const [changeError, setChangeError] = useState(null);
  
  const isCurrentPlan = plan.id === currentPlan;
  const isPremium = plan.id === 'premium';
  const isUpgrade = !isCurrentPlan && isPremium;
  const isDowngrade = !isCurrentPlan && !isPremium && currentPlan === 'premium';

  const handlePlanChange = async () => {
    if (isCurrentPlan) return;
    
    if (isUpgrade) {
      // Redirect to checkout for upgrades
      navigate(createPageUrl(`Checkout?plan=${plan.id}`));
    } else if (isDowngrade) {
      // Handle downgrade with prorated refund
      await handleDowngrade();
    }
  };

  const handleDowngrade = async () => {
    setIsChanging(true);
    setChangeError(null);

    try {
      const result = await StripeService.changeSubscription(
        user.stripe_subscription_id,
        'free',
        user.id
      );

      if (result.success) {
        // Update user subscription
        await User.updateMyUserData({
          subscription_plan: 'free',
          subscription_status: 'active'
        });

        // Show success message with refund info
        const refundAmount = result.proratedAmount;
        alert(`Successfully downgraded! ${refundAmount > 0 ? `You'll receive a prorated refund of $${refundAmount.toFixed(2)} within 5-10 business days.` : ''}`);
        
        // Refresh page to update user data
        window.location.reload();
      } else {
        setChangeError('Failed to downgrade. Please try again.');
      }
    } catch (error) {
      console.error('Downgrade error:', error);
      setChangeError('An error occurred. Please try again.');
    }

    setIsChanging(false);
  };

  const getButtonText = () => {
    if (isCurrentPlan) return "Current Plan";
    if (isChanging) return "Processing...";
    if (isUpgrade) return "Upgrade to Premium";
    if (isDowngrade) return "Downgrade to Free";
    return "Select Plan";
  };

  const getButtonIcon = () => {
    if (isChanging) return <Loader2 className="w-4 h-4 mr-2 animate-spin" />;
    if (isUpgrade) return <ArrowRight className="w-4 h-4 mr-2" />;
    if (isDowngrade) return <ArrowDown className="w-4 h-4 mr-2" />;
    return null;
  };

  return (
    <Card className={`flex flex-col h-full transition-all duration-300 transform hover:scale-105 ${
      isPremium 
        ? 'border-2 border-purple-300 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 shadow-xl hover:shadow-2xl' 
        : 'bg-gradient-to-br from-gray-50 to-green-50 hover:shadow-lg border-2 border-green-200'
    }`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className={`text-2xl font-bold ${
            isPremium 
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent' 
              : 'text-green-600'
          }`}>
            {plan.name}
          </CardTitle>
          {isPremium && <Star className="w-6 h-6 text-yellow-400 animate-pulse" />}
          {isCurrentPlan && (
            <div className="bg-gradient-to-r from-green-400 to-blue-500 text-white px-3 py-1 rounded-full text-sm font-bold">
              ✨ Active
            </div>
          )}
        </div>
        <CardDescription className="text-gray-600">{plan.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="mb-6">
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-extrabold ${
              isPremium 
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent' 
                : 'text-green-600'
            }`}>
              ${plan.price}
            </span>
            <span className="text-neutral-500">/month</span>
            {plan.price === 0 && <span className="ml-2 text-green-600 font-bold">🎉 FREE!</span>}
          </div>
          {isDowngrade && (
            <p className="text-sm text-orange-600 mt-2 font-medium">
              <DollarSign className="w-4 h-4 inline mr-1" />
              Prorated refund will be processed to your card
            </p>
          )}
        </div>
        <ul className="space-y-3">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span className="text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        {changeError && (
          <div className="w-full mb-3 p-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {changeError}
          </div>
        )}
        <Button 
          onClick={handlePlanChange}
          disabled={isCurrentPlan || isChanging} 
          className={`w-full transition-all duration-300 ${
            isPremium && !isCurrentPlan 
              ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105' 
              : isDowngrade
              ? 'bg-gradient-to-r from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600 text-white'
              : 'bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white'
          } ${isCurrentPlan ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          {getButtonIcon()}
          {getButtonText()}
        </Button>
      </CardFooter>
    </Card>
  );
}