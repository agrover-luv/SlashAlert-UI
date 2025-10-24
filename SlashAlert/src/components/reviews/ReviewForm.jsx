
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, Send } from "lucide-react";
import { motion } from "framer-motion";

export default function ReviewForm({ isOpen, onClose, onSubmit, currentUser }) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    rating: 0,
    user_location: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.rating === 0 || !formData.title.trim() || !formData.content.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      setFormData({
        title: '',
        content: '',
        rating: 0,
        user_location: ''
      });
      onClose();
    } catch (error) {
      console.error('Error submitting review:', error);
    }
    setIsSubmitting(false);
  };

  const handleRatingClick = (rating) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  const renderStars = () => {
    return [...Array(5)].map((_, index) => {
      const rating = index + 1;
      const isActive = rating <= (hoveredRating || formData.rating);
      
      return (
        <Star
          key={index}
          className={`w-8 h-8 cursor-pointer transition-colors ${
            isActive ? 'text-warning-amber fill-warning-amber' : 'text-neutral-300 hover:text-warning-amber'
          }`}
          onClick={() => handleRatingClick(rating)}
          onMouseEnter={() => setHoveredRating(rating)}
          onMouseLeave={() => setHoveredRating(0)}
        />
      );
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-white/90 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-neutral-900">
            Write a Review
          </DialogTitle>
          <DialogDescription>
            Share your experience with SlashAlert to help other users
          </DialogDescription>
        </DialogHeader>
        
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          onSubmit={handleSubmit}
          className="space-y-6 pt-4"
        >
          <div className="space-y-2">
            <Label className="text-neutral-700 font-medium">Your Rating *</Label>
            <div className="flex gap-1">
              {renderStars()}
            </div>
            {formData.rating > 0 && (
              <p className="text-sm text-neutral-500">
                {formData.rating === 1 ? 'Poor' :
                 formData.rating === 2 ? 'Fair' :
                 formData.rating === 3 ? 'Good' :
                 formData.rating === 4 ? 'Very Good' : 'Excellent'}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title" className="text-neutral-700 font-medium">
              Review Title *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Summarize your experience..."
              className="border-neutral-300"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content" className="text-neutral-700 font-medium">
              Your Review *
            </Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Tell us about your experience with SlashAlert. How has it helped you save money?"
              className="border-neutral-300 h-32"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" className="text-neutral-700 font-medium">
              Your Location (Optional)
            </Label>
            <Input
              id="location"
              value={formData.user_location}
              onChange={(e) => setFormData(prev => ({ ...prev, user_location: e.target.value }))}
              placeholder="e.g., New York, NY"
              className="border-neutral-300"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || formData.rating === 0 || !formData.title.trim() || !formData.content.trim()}
              className="flex-1 bg-gradient-to-r from-primary-blue to-accent-blue hover:from-primary-blue/90 hover:to-accent-blue/90"
            >
              {isSubmitting ? (
                'Submitting...'
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Review
                </>
              )}
            </Button>
          </div>
        </motion.form>
      </DialogContent>
    </Dialog>
  );
}
