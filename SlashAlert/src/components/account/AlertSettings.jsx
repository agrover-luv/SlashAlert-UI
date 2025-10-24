import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Bell, Mail, MessageSquare, Save, Zap, CheckCircle, Loader2 } from "lucide-react";

export default function AlertSettings({ user, onSave, isSaving }) {
  const [formData, setFormData] = useState({
    phone_number: '',
    email_alerts_enabled: true,
    sms_alerts_enabled: false
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        phone_number: user.phone_number || '',
        email_alerts_enabled: user.email_alerts_enabled !== false,
        sms_alerts_enabled: user.sms_alerts_enabled || false
      });
    }
  }, [user]);

  const handleSave = async () => {
    await onSave(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const isPremiumUser = user?.subscription_plan === 'premium';

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-neutral-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-bold text-neutral-900">
          <Bell className="w-6 h-6 text-primary-blue" />
          Alert Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-primary-blue" />
              <div>
                <Label className="font-medium text-neutral-900">Email Alerts</Label>
                <p className="text-sm text-neutral-500">Get notified via email when prices drop</p>
              </div>
            </div>
            <Switch
              checked={formData.email_alerts_enabled}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, email_alerts_enabled: checked }))}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-primary-blue" />
              <div className="flex items-center gap-2">
                <div>
                  <Label className="font-medium text-neutral-900 flex items-center gap-2">
                    SMS Alerts 
                    {!isPremiumUser && <Zap className="w-4 h-4 text-warning-amber" />}
                  </Label>
                  <p className="text-sm text-neutral-500">
                    {isPremiumUser ? 'Get instant SMS notifications' : 'Premium feature - SMS alerts'}
                  </p>
                </div>
                {!isPremiumUser && (
                  <Badge variant="outline" className="bg-warning-amber/10 text-warning-amber border-warning-amber/20">
                    Premium
                  </Badge>
                )}
              </div>
            </div>
            <Switch
              checked={formData.sms_alerts_enabled && isPremiumUser}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, sms_alerts_enabled: checked }))}
              disabled={!isPremiumUser}
            />
          </div>

          {(formData.sms_alerts_enabled && isPremiumUser) && (
            <div className="space-y-2">
              <Label htmlFor="phone_number" className="text-neutral-700 font-medium">
                Phone Number
              </Label>
              <Input
                id="phone_number"
                type="tel"
                value={formData.phone_number}
                onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                placeholder="+1 (555) 123-4567"
                className="border-neutral-300"
              />
              <p className="text-xs text-neutral-500">
                Include country code for international numbers
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-neutral-200 pt-6">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className={`w-full transition-all duration-200 ${
              saved 
                ? 'bg-success-green hover:bg-success-green text-white' 
                : 'bg-gradient-to-r from-primary-blue to-accent-blue hover:from-primary-blue/90 hover:to-accent-blue/90 text-white'
            }`}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : saved ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Alert Settings
              </>
            )}
          </Button>
        </div>

        <div className="bg-slate-50 p-4 rounded-lg border border-primary-blue/20">
          <h4 className="font-medium text-neutral-900 mb-2">How Alerts Work</h4>
          <ul className="text-sm text-neutral-600 space-y-1">
            <li>• Get notified when products reach your target price</li>
            <li>• Receive alerts for significant price drops (10% or more)</li>
            <li>• SMS alerts are available for Premium subscribers</li>
            <li>• You can customize alert preferences per product</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}