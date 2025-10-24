import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Check } from "lucide-react";

const premiumFeatures = [
  'Track unlimited products',
  'Slash Alerts by eMail',
  'Slash Alerts by Text/SMS',
  //'Hourly price checks',
  //'Instant "Check Now" feature',
  //'Advanced price analytics',
  //'Priority support'
];

export default function OrderSummary({ plan }) {
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-neutral-200">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-neutral-900">
          Order Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between items-baseline p-4 bg-neutral-100 rounded-lg">
            <h4 className="font-semibold text-neutral-800">{plan.name} Plan</h4>
            <p className="text-2xl font-bold text-neutral-900">${plan.price.toFixed(2)}<span className="text-base text-neutral-500 font-medium">/month</span></p>
          </div>
        </div>
        <div>
          <h4 className="font-semibold text-neutral-800 mb-3">What's included:</h4>
          <ul className="space-y-2">
            {premiumFeatures.map(feature => (
              <li key={feature} className="flex items-start gap-3">
                <div className="w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3" />
                </div>
                <span className="text-neutral-600">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-neutral-500 text-center w-full">
          You will be charged monthly. You can cancel at any time.
        </p>
      </CardFooter>
    </Card>
  );
}