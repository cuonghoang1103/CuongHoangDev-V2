'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Clock, Eye, Calendar, ArrowRight } from 'lucide-react';
import type { Post } from '@/types';

interface BlogCardProps {
  post: Post;
  index?: number;
  variant?: 'default' | 'featured' | 'compact';
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function estimateReadingTime(content?: string) {
  if (!content) return 5;
  const words = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export default function BlogCard({ post, index = 0, variant = 'default' }: BlogCardProps) {
  const isFeatured = variant === 'featured';
  const isCompact = variant === 'compact';
  const readingTime = estimateReadingTime(post.content || post.excerpt);

  if (isCompact) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.3 }}
      >
        <Link href={`/blog/${post.slug}`}>
          <article className="flex gap-4 p-3 rounded-xl hover:bg-darkcard/60 transition-all duration-200 group">
            <div className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden">
              {post.thumbnailUrl ? (
                <img
                  src={post.thumbnailUrl}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-neon-indigo to-neon-violet flex items-center justify-center">
                  <span className="text-white/50 text-xs font-bold">CH</span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-text-primary text-sm line-clamp-2 group-hover:text-neon-violet transition-colors">
                {post.title}
              </h3>
              <div className="flex items-center gap-2 mt-1.5 text-xs text-text-muted">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                <span>&bull;</span>
                <Clock className="w-3 h-3" />
                <span>{readingTime}m</span>
              </div>
            </div>
          </article>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.07, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="group relative"
    >
      <Link href={`/blog/${post.slug}`}>
        <div
          className={`
            bg-darkcard border border-darkborder rounded-2xl overflow-hidden
            hover:border-neon-violet/40 transition-all duration-300
            ${isFeatured ? 'md:col-span-2' : ''}
          `}
        >
          {/* Thumbnail */}
          <div className={`relative overflow-hidden ${isFeatured ? 'h-52 md:h-72' : 'h-48'}`}>
            {post.thumbnailUrl ? (
              <img
                src={post.thumbnailUrl}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-neon-indigo/40 via-neon-violet/30 to-neon-fuchsia/20 flex items-center justify-center">
                <span className="text-white/30 text-4xl font-heading font-bold">CH</span>
              </div>
            )}

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-darkbg/80 via-transparent to-transparent" />

            {/* Badges */}
            <div className="absolute top-3 left-3 flex gap-2">
              {post.isFeatured && (
                <span className="px-3 py-1 bg-neon-fuchsia/90 backdrop-blur-sm text-white text-xs font-semibold rounded-lg">
                  Featured
                </span>
              )}
              {post.categoryName && (
                <span className="px-3 py-1 bg-darkbg/80 backdrop-blur-sm border border-darkborder text-text-secondary text-xs font-medium rounded-lg">
                  {post.categoryName}
                </span>
              )}
            </div>
          </div>

          {/* Content */}
          <div className={`p-5 ${isFeatured ? 'md:p-6' : ''}`}>
            {/* Title */}
            <h2
              className={`
                font-heading font-bold text-text-primary
                group-hover:text-neon-violet transition-colors duration-200
                line-clamp-2
                ${isFeatured ? 'text-xl md:text-2xl' : 'text-base md:text-lg'}
              `}
            >
              {post.title}
            </h2>

            {/* Excerpt */}
            {post.excerpt && (
              <p className={`text-text-muted mt-2 line-clamp-2 ${isFeatured ? 'text-sm md:text-base' : 'text-sm'}`}>
                {post.excerpt}
              </p>
            )}

            {/* Meta */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-darkborder/50">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-neon-indigo to-neon-fuchsia flex items-center justify-center text-white text-xs font-bold">
                  {post.authorName?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div>
                  <p className="text-xs font-medium text-text-primary">{post.authorName || 'CuongHoang'}</p>
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {readingTime}m read
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-xs text-text-muted">
                  <Eye className="w-3.5 h-3.5" />
                  {post.viewCount > 0 ? post.viewCount.toLocaleString() : '0'}
                </span>
                <span className="text-neon-violet text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                  Read
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>

            {/* Tags */}
            {post.tagNames && post.tagNames.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {post.tagNames.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 text-xs bg-neon-indigo/10 text-neon-indigo rounded-md"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
