
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, ThumbsUp, MapPin, CheckCircle, MessageSquare as ReplyIcon } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Textarea } from '@/components/ui/textarea';

export default function ReviewCard({ review, onHelpfulClick, currentUser, onAdminCommentSubmit }) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState(review.admin_comment || '');

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating 
            ? 'text-warning-amber fill-warning-amber' 
            : 'text-neutral-300'
        }`}
      />
    ));
  };

  const handleReplySubmit = (e) => {
    e.preventDefault();
    if (replyContent.trim()) {
      onAdminCommentSubmit(review.id, replyContent);
      setShowReplyForm(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-white/80 backdrop-blur-sm border-neutral-200 hover:shadow-lg transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-neutral-900 text-lg">
                  {review.title}
                </h3>
                {review.is_verified && (
                  <Badge variant="secondary" className="bg-success-green/10 text-success-green border-success-green/20 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Verified
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex">{renderStars(review.rating)}</div>
                <span className="text-sm text-neutral-500">
                  {format(new Date(review.created_date), 'MMM d, yyyy')}
                </span>
              </div>
            </div>
          </div>
          
          <p className="text-neutral-700 mb-4 leading-relaxed">
            {review.content}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-neutral-500">
              <div className="flex items-center gap-1">
                <span className="font-medium">{review.user_name}</span>
              </div>
              {review.user_location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>{review.user_location}</span>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onHelpfulClick(review.id)}
              className="text-neutral-500 hover:text-primary-blue"
            >
              <ThumbsUp className="w-4 h-4 mr-1" />
              Helpful ({(review.helpful_count || 0)})
            </Button>
          </div>

          {/* Admin Reply Section */}
          {review.admin_comment && (
            <div className="mt-6 ml-8 p-4 bg-slate-50 border-l-4 border-primary-blue rounded-r-lg">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-neutral-800">Reply from SlashAlert</p>
                {review.admin_comment_date && (
                  <p className="text-xs text-neutral-500">
                    - {format(new Date(review.admin_comment_date), 'MMM d, yyyy')}
                  </p>
                )}
              </div>
              <p className="mt-2 text-neutral-700 leading-relaxed">{review.admin_comment}</p>
            </div>
          )}

          {/* Admin Reply Form */}
          {currentUser && currentUser.role === 'admin' && (
            <div className="mt-6 ml-8">
              {!showReplyForm ? (
                <Button variant="outline" size="sm" onClick={() => setShowReplyForm(true)}>
                  <ReplyIcon className="w-4 h-4 mr-2" />
                  {review.admin_comment ? 'Edit Reply' : 'Add Reply'}
                </Button>
              ) : (
                <motion.form
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onSubmit={handleReplySubmit}
                  className="space-y-3"
                >
                  <Textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Write a public reply..."
                    className="bg-white"
                  />
                  <div className="flex gap-2">
                    <Button type="submit" size="sm">Submit Reply</Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowReplyForm(false);
                        setReplyContent(review.admin_comment || ''); // Reset on cancel
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </motion.form>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
