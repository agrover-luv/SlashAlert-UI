import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, TrendingUp, Users, Award } from "lucide-react";
import { motion } from "framer-motion";

export default function ReviewStats({ reviews }) {
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0 
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews).toFixed(1)
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length,
    percentage: totalReviews > 0 ? (reviews.filter(r => r.rating === rating).length / totalReviews) * 100 : 0
  }));

  const verifiedReviews = reviews.filter(r => r.is_verified).length;
  const verifiedPercentage = totalReviews > 0 ? ((verifiedReviews / totalReviews) * 100).toFixed(0) : 0;

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    return [...Array(5)].map((_, index) => (
      <Star
        key={index}
        className={`w-5 h-5 ${
          index < fullStars || (index === fullStars && hasHalfStar)
            ? 'text-warning-amber fill-warning-amber' 
            : 'text-neutral-300'
        }`}
      />
    ));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-white/80 backdrop-blur-sm border-neutral-200">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl font-bold text-neutral-900">
            <TrendingUp className="w-6 h-6 text-primary-blue" />
            Review Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-neutral-900 mb-2">
                {averageRating}
              </div>
              <div className="flex justify-center mb-2">
                {renderStars(parseFloat(averageRating))}
              </div>
              <p className="text-sm text-neutral-500">
                Based on {totalReviews} reviews
              </p>
            </div>
            
            <div className="text-center">
              <div className="text-4xl font-bold text-success-green mb-2">
                {verifiedPercentage}%
              </div>
              <div className="flex items-center justify-center gap-1 mb-2">
                <Users className="w-4 h-4 text-success-green" />
                <span className="text-sm font-medium text-success-green">Verified</span>
              </div>
              <p className="text-sm text-neutral-500">
                {verifiedReviews} verified reviews
              </p>
            </div>
            
            <div className="text-center">
              <div className="text-4xl font-bold text-warning-amber mb-2">
                {ratingDistribution.filter(r => r.rating >= 4).reduce((sum, r) => sum + r.count, 0)}
              </div>
              <div className="flex items-center justify-center gap-1 mb-2">
                <Award className="w-4 h-4 text-warning-amber" />
                <span className="text-sm font-medium text-warning-amber">4+ Stars</span>
              </div>
              <p className="text-sm text-neutral-500">
                High satisfaction
              </p>
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-semibold text-neutral-900">Rating Distribution</h4>
            {ratingDistribution.map(({ rating, count, percentage }) => (
              <div key={rating} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-16">
                  <span className="text-sm font-medium">{rating}</span>
                  <Star className="w-3 h-3 text-warning-amber fill-warning-amber" />
                </div>
                <div className="flex-1 bg-neutral-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-primary-blue to-accent-blue rounded-full h-2 transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="text-sm text-neutral-500 w-12 text-right">
                  {count}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}