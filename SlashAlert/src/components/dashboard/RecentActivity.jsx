
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Clock, Bell, Target, Package } from "lucide-react";
import { format } from "date-fns";

const formatNumberWithCommas = (number) => {
  if (typeof number !== 'number' || isNaN(number)) return '0.00';
  return number.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const getAlertTypeIcon = (alertType) => {
  switch (alertType) {
    case 'price_drop':
      return TrendingDown;
    case 'target_reached':
      return Target;
    case 'back_in_stock':
      return Package;
    default:
      return Bell;
  }
};

const getAlertTypeColor = (alertType) => {
  switch (alertType) {
    case 'price_drop':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'target_reached':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'back_in_stock':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getAlertTypeLabel = (alertType) => {
  switch (alertType) {
    case 'price_drop':
      return 'Price Drop';
    case 'target_reached':
      return 'Target Reached';
    case 'back_in_stock':
      return 'Back in Stock';
    default:
      return 'Alert';
  }
};

export default function RecentActivity({ activities }) {
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-neutral-200">
      <CardHeader className="p-6 border-b border-neutral-200">
        <CardTitle className="flex items-center gap-2 text-xl font-bold text-neutral-900">
          <Clock className="w-5 h-5 text-primary-blue" />
          Recent Activity
          <span className="text-sm font-normal text-neutral-500">(Last 30 days)</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-500">No recent activity</p>
            <p className="text-sm text-neutral-400 mt-1">
              Price alerts from the last 30 days will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[32rem] overflow-y-auto">
            {activities.map((activity, index) => {
              const AlertIcon = getAlertTypeIcon(activity.alert_type);
              return (
                <div key={index} className="flex items-start justify-between p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1">
                      <AlertIcon className="w-5 h-5 text-primary-blue" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-neutral-900 mb-1 line-clamp-1">
                        {activity.product_name}
                      </p>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getAlertTypeColor(activity.alert_type)}`}
                        >
                          {getAlertTypeLabel(activity.alert_type)}
                        </Badge>
                        <Badge variant="outline" className="text-xs capitalize">
                          {activity.product_retailer}
                        </Badge>
                      </div>
                      <p className="text-sm text-neutral-600 mb-1">
                        {activity.message}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-neutral-500">
                        <span>
                          Current: ${activity.trigger_price ? formatNumberWithCommas(activity.trigger_price) : 'N/A'}
                        </span>
                        {activity.previous_price && (
                          <span>
                            Was: ${formatNumberWithCommas(activity.previous_price)}
                          </span>
                        )}
                        {activity.previous_price && activity.trigger_price && (
                          <span className="text-green-600 font-medium">
                            Saved: ${formatNumberWithCommas(activity.previous_price - activity.trigger_price)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="text-xs text-neutral-500 mb-1">
                      {activity.sent_at ? format(new Date(activity.sent_at), 'MMM d, h:mm a') : 'Not sent'}
                    </p>
                    <div className="flex gap-1">
                      {activity.email_sent && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                          Email
                        </Badge>
                      )}
                      {activity.sms_sent && (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                          SMS
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
