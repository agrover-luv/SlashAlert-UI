import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const formatNumberWithCommas = (number) => {
  if (typeof number !== 'number' || isNaN(number)) return '0.00';
  return number.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function StatsCard({ title, value, icon: Icon, color, trend, description }) {
  // Format value based on whether it's a currency amount or count
  const formattedValue = typeof value === 'number' && title.includes('Savings') 
    ? `$${formatNumberWithCommas(value)}`
    : value;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="transform transition-all duration-300"
    >
      <Card className="relative overflow-hidden bg-gradient-to-br from-white via-white to-purple-50/30 border-2 border-purple-200 hover:border-pink-300 hover:shadow-2xl transition-all duration-300 rounded-2xl h-full">
        <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl from-pink-200/20 to-purple-200/20 rounded-full transform translate-x-4 -translate-y-4" />
        <div className="absolute bottom-0 left-0 w-8 h-8 bg-gradient-to-tr from-yellow-200/20 to-orange-200/20 rounded-full transform -translate-x-2 translate-y-2" />
        
        <CardContent className="p-4 relative z-10">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-600 mb-1 flex items-center gap-1 truncate">
                <span className="truncate">{title}</span>
                <Sparkles className="w-3 h-3 text-yellow-500 flex-shrink-0" />
              </p>
              <p className="text-2xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2 leading-tight">
                {formattedValue}
              </p>
              {description && (
                <p className="text-xs text-gray-500 font-medium truncate">{description}</p>
              )}
            </div>
            <div className={`p-2 rounded-lg ${color} shadow-lg transform rotate-12 hover:rotate-0 transition-transform duration-300 ml-2`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
          </div>
          {trend && (
            <div className="mt-3 flex items-center text-xs bg-gradient-to-r from-green-100 to-blue-100 p-1.5 rounded-lg">
              <span className={`font-bold ${trend.positive ? 'text-green-600' : 'text-red-500'}`}>
                {trend.value}
              </span>
              <span className="text-gray-600 ml-1 font-medium">{trend.label}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}