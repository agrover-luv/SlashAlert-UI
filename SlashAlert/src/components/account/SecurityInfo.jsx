import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

export default function SecurityInfo() {
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-neutral-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-bold text-neutral-900">
          <ShieldCheck className="w-6 h-6 text-success-green" />
          Account Security
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-neutral-700">
          Your account is secured by SlashAlert's platform. All communications and data operations are encrypted and securely handled through an automated session management system, which functions like a secure user token. You can rest assured that your data is safe and accessible only by you.
        </p>
      </CardContent>
    </Card>
  );
}