'use client';

import { motion } from 'framer-motion';
import { Star, ThumbsUp, User } from 'lucide-react';
import type { CourseReview } from '@/types';

interface ReviewsProps {
  reviews: CourseReview[];
  avgRating: number;
  totalReviews: number;
}

function RatingBar({ label, percent }: { label: string; percent: number }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-text-muted w-8">{label}</span>
      <div className="flex-1 h-2 bg-darkbg rounded-full overflow-hidden">
        <div
          className="h-full bg-yellow-400 rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-text-muted w-10 text-right">{Math.round(percent)}%</span>
    </div>
  );
}

export default function Reviews({ reviews, avgRating, totalReviews }: ReviewsProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-6 items-start">
        {/* Overall rating */}
        <div className="flex flex-col items-center justify-center p-6 bg-darkcard border border-darkborder rounded-2xl min-w-[160px]">
          <p className="text-5xl font-bold text-text-primary font-heading">{avgRating.toFixed(1)}</p>
          <div className="flex items-center gap-1 mt-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${star <= Math.round(avgRating) ? 'text-yellow-400 fill-yellow-400' : 'text-text-muted'}`}
              />
            ))}
          </div>
          <p className="text-sm text-text-muted mt-1">{totalReviews} reviews</p>
        </div>

        {/* Rating breakdown */}
        <div className="flex-1 space-y-2 p-4 bg-darkcard border border-darkborder rounded-2xl">
          <RatingBar label="5" percent={(avgRating / 5) * 100} />
          <RatingBar label="4" percent={Math.max(0, ((avgRating - 4) / 5) * 100)} />
          <RatingBar label="3" percent={Math.max(0, ((avgRating - 3) / 5) * 100)} />
          <RatingBar label="2" percent={Math.max(0, ((avgRating - 2) / 5) * 100)} />
          <RatingBar label="1" percent={Math.max(0, ((avgRating - 1) / 5) * 100)} />
        </div>
      </div>

      {/* Review list */}
      <div className="space-y-4">
        {reviews.length > 0 ? reviews.map((review) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3 }}
            className="bg-darkcard border border-darkborder rounded-2xl p-5"
          >
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-indigo to-neon-violet flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden">
                {review.userAvatar ? (
                  <img src={review.userAvatar} alt={review.userFullName} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-text-primary">{review.userFullName}</p>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-text-muted'}`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-text-muted">
                    {new Date(review.createdAt).toLocaleDateString('vi-VN', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
                {review.title && (
                  <p className="text-sm font-medium text-text-primary mt-2">{review.title}</p>
                )}
                {review.content && (
                  <p className="text-sm text-text-secondary mt-1 leading-relaxed">{review.content}</p>
                )}
                {review.rating >= 4 && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-green-400">
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>Recommended</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )) : (
          <div className="text-center py-12">
            <Star className="w-12 h-12 text-text-muted/30 mx-auto mb-3" />
            <p className="text-text-muted">No reviews yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
