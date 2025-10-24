
import React, { useState, useEffect } from 'react';
import { Review } from "@/api/entities";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, ThumbsUp, MessageSquare, TrendingUp, Users, Award } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import ReviewForm from "../components/reviews/ReviewForm";
import ReviewCard from "../components/reviews/ReviewCard";
import ReviewStats from "../components/reviews/ReviewStats";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', '5', '4', '3', '2', '1'

  useEffect(() => {
    loadReviews();
    fetchCurrentUser();
  }, []);

  const loadReviews = async () => {
    setIsLoading(true);
    try {
      const fetchedReviews = await Review.list('-created_date');
      setReviews(fetchedReviews);
    } catch (error) {
      console.error('Error loading reviews:', error);
    }
    setIsLoading(false);
  };

  const fetchCurrentUser = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
    } catch (error) {
      console.error('User not logged in:', error);
    }
  };

  const handleSubmitReview = async (reviewData) => {
    try {
      const newReview = {
        ...reviewData,
        user_name: currentUser?.full_name || 'Anonymous User',
        is_verified: !!currentUser,
        helpful_count: 0
      };
      
      await Review.create(newReview);
      setShowForm(false);
      loadReviews();
    } catch (error) {
      console.error('Error submitting review:', error);
    }
  };

  const handleHelpfulClick = async (reviewId) => {
    try {
      const review = reviews.find(r => r.id === reviewId);
      if (review) {
        await Review.update(reviewId, {
          helpful_count: (review.helpful_count || 0) + 1
        });
        loadReviews();
      }
    } catch (error) {
      console.error('Error updating helpful count:', error);
    }
  };

  const handleAdminCommentSubmit = async (reviewId, comment) => {
    try {
      await Review.update(reviewId, {
        admin_comment: comment,
        admin_comment_date: new Date().toISOString()
      });
      loadReviews(); // Refresh reviews to show the new comment
    } catch (error) {
      console.error('Failed to submit admin comment:', error);
    }
  };

  const getFilteredReviews = () => {
    if (filter === 'all') return reviews;
    return reviews.filter(review => review.rating === parseInt(filter));
  };

  const filteredReviews = getFilteredReviews();

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-light-blue/30 p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-neutral-900 mb-4">
            Customer Reviews & Feedback
          </h1>
          <p className="text-neutral-600 text-lg">
            See what our users are saying about SlashAlert
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <ReviewStats reviews={reviews} />
          </div>
          <div className="flex flex-col gap-4">
            <Card className="bg-white/80 backdrop-blur-sm border-neutral-200">
              <CardContent className="p-6 text-center">
                <Award className="w-12 h-12 text-warning-amber mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  Share Your Experience
                </h3>
                <p className="text-neutral-600 text-sm mb-4">
                  Help others discover the benefits of smart price tracking
                </p>
                <Button
                  onClick={() => setShowForm(true)}
                  className="w-full bg-gradient-to-r from-primary-blue to-accent-blue hover:from-primary-blue/90 hover:to-accent-blue/90"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Write a Review
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold text-neutral-900">
            Reviews ({filteredReviews.length})
          </h2>
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
              className={filter === 'all' ? 'bg-primary-blue' : ''}
            >
              All
            </Button>
            {[5, 4, 3, 2, 1].map(rating => (
              <Button
                key={rating}
                variant={filter === rating.toString() ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(rating.toString())}
                className={`flex items-center gap-1 ${filter === rating.toString() ? 'bg-primary-blue' : ''}`}
              >
                {rating} <Star className="w-3 h-3 fill-current" />
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white/80 backdrop-blur-sm rounded-xl p-6 animate-pulse">
                <div className="h-4 bg-neutral-200 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-neutral-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-neutral-200 rounded w-full mb-4"></div>
                <div className="h-4 bg-neutral-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence>
              {filteredReviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  onHelpfulClick={handleHelpfulClick}
                  currentUser={currentUser}
                  onAdminCommentSubmit={handleAdminCommentSubmit}
                />
              ))}
            </AnimatePresence>
            
            {filteredReviews.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-xl"
              >
                <MessageSquare className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                  No reviews match your filter
                </h3>
                <p className="text-neutral-500">
                  Try selecting a different rating or view all reviews
                </p>
              </motion.div>
            )}
          </div>
        )}
      </div>

      <ReviewForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleSubmitReview}
        currentUser={currentUser}
      />
    </div>
  );
}
