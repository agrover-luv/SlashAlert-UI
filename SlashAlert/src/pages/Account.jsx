
import React, { useState, useEffect } from 'react';
import { User } from "@/api/entities";
import PricingCard from "../components/account/PricingCard";
import SecurityInfo from "../components/account/SecurityInfo";
import AlertSettings from "../components/account/AlertSettings";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { User as UserIcon } from 'lucide-react';

const plans = [
  {
    id: 'free',
    name: 'Free',
    description: 'For casual price watchers who want to keep an eye on a few items.',
    price: 0,
    features: [
      'Track up to 5 products',
      //'Daily price checks',
      'Email price alerts',
      //'Basic price history'
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'For serious shoppers who need the fastest updates and unlimited tracking.',
    price: 9.99,
    features: [
      'Track unlimited products',
      'Slash Alerts by eMail',
      'Slash Alerts by Text/SMS',
      //'Hourly price checks',
      //'Instant "Check Now" feature',
      //'Advanced price analytics',
      //'Priority support'
    ]
  }
];

export default function AccountPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);
    } catch (error) {
      console.error("Failed to load user:", error);
    }
    setIsLoading(false);
  };

  const handleAlertSettingsSave = async (settings) => {
    setIsUpdating(true);
    try {
      await User.updateMyUserData(settings);
      await loadUser(); // Refresh user data
    } catch (error) {
      console.error("Failed to save alert settings:", error);
    }
    setIsUpdating(false);
  };
  
  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <Skeleton className="h-10 w-1/3 mb-4" />
        <Skeleton className="h-6 w-2/3 mb-12" />
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold">Please log in to view your account details.</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <UserIcon className="w-10 h-10 text-primary-blue" />
            <div>
              <h1 className="text-4xl font-bold text-neutral-900">
                My Account
              </h1>
              <p className="text-neutral-600">
                Manage your profile, subscription, and notification settings.
              </p>
            </div>
          </div>
        </motion.div>
        
        <div className="grid lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-8">
            <Card className="bg-white/90 backdrop-blur-sm border-2 border-purple-200 shadow-xl">
              <CardHeader className="p-6">
                <h2 className="text-2xl font-semibold text-neutral-800 mb-2">
                  Subscription Plans
                </h2>
                <p className="text-neutral-600">
                  Choose the plan that best fits your needs. Your current plan is{' '}
                  <span className="font-medium text-primary-blue">
                    {(currentUser.subscription_plan || 'free').charAt(0).toUpperCase() +
                      (currentUser.subscription_plan || 'free').slice(1)}
                  </span>
                  .
                </p>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-8 p-6">
                {plans.map((plan) => (
                  <PricingCard
                    key={plan.id}
                    plan={plan}
                    currentPlan={currentUser.subscription_plan || 'free'}
                    user={currentUser}
                  />
                ))}
              </CardContent>
            </Card>

            <AlertSettings
              user={currentUser}
              onSave={handleAlertSettingsSave}
              isSaving={isUpdating}
            />
          </div>

          <div className="space-y-8">
            <SecurityInfo />
          </div>
        </div>
      </div>
    </div>
  );
}
