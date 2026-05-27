'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Post } from '@/types';
import { formatDateShort, formatNumber, truncateText } from '@/lib/utils';

interface BlogCardProps {
  post: Post;
  variant?: 'default' | 'featured' | 'compact';
}

export default function BlogCard({ post, variant = 'default' }: BlogCardProps) {
  const isFeatured = variant === 'featured';
  const isCompact = variant === 'compact';

  if (isCompact) {
    return (
      <Link href={`/blog/${post.slug}`}>
        <article className="flex gap-4 p-3 rounded-xl hover:bg-darkcard/50 transition-all duration-300 group">
          <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
            {post.thumbnailUrl ? (
              <Image
                src={post.thumbnailUrl}
                alt={post.title}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-neon-indigo to-neon-violet" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-text-primary text-sm line-clamp-2 group-hover:text-neon-violet transition-colors">
              {post.title}
            </h3>
            <p className="text-text-muted text-xs mt-1">
              {formatDateShort(post.publishedAt || post.createdAt)}
            </p>
          </div>
        </article>
      </Link>
    );
  }

  return (
    <Link href={`/blog/${post.slug}`}>
      <article
        className={`
          group relative rounded-2xl overflow-hidden
          bg-darkcard border border-darkborder/50
          hover:border-neon-violet/30
          transition-all duration-500
          ${isFeatured ? 'md:col-span-2 md:row-span-2' : ''}
        `}
      >
        {/* Thumbnail */}
        <div
          className={`
            relative overflow-hidden
            ${isFeatured ? 'h-64 md:h-80' : 'h-48'}
          `}
        >
          {post.thumbnailUrl ? (
            <Image
              src={post.thumbnailUrl}
              alt={post.title}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-700"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-neon-indigo via-neon-violet to-neon-fuchsia" />
          )}
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-darkbg via-darkbg/20 to-transparent" />

          {/* Featured Badge */}
          {post.isFeatured && (
            <div className="absolute top-4 left-4 px-3 py-1 bg-neon-violet/90 backdrop-blur-sm rounded-full">
              <span className="text-xs font-medium text-white">Nổi bật</span>
            </div>
          )}

          {/* Category Badge */}
          {post.categoryName && (
            <div className="absolute top-4 right-4 px-3 py-1 bg-darkbg/80 backdrop-blur-sm rounded-full border border-darkborder">
              <span className="text-xs font-medium text-text-secondary">{post.categoryName}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className={`p-5 ${isFeatured ? 'md:p-6' : ''}`}>
          {/* Title */}
          <h2
            className={`
              font-heading font-semibold text-text-primary
              group-hover:text-neon-violet transition-colors duration-300
              line-clamp-2
              ${isFeatured ? 'text-xl md:text-2xl' : 'text-lg'}
            `}
          >
            {post.title}
          </h2>

          {/* Excerpt */}
          {post.excerpt && (
            <p className={`text-text-secondary mt-3 line-clamp-2 ${isFeatured ? 'text-base md:text-lg' : 'text-sm'}`}>
              {truncateText(post.excerpt, isFeatured ? 150 : 100)}
            </p>
          )}

          {/* Meta */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-darkborder/50">
            <div className="flex items-center gap-3">
              {/* Author Avatar */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-indigo to-neon-fuchsia flex items-center justify-center">
                <span className="text-xs font-medium text-white">
                  {post.authorName?.charAt(0).toUpperCase() || 'A'}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">{post.authorName || 'Admin'}</p>
                <p className="text-xs text-text-muted">
                  {formatDateShort(post.publishedAt || post.createdAt)}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-text-muted">
              <span className="flex items-center gap-1 text-xs">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {formatNumber(post.viewCount)}
              </span>
            </div>
          </div>

          {/* Tags */}
          {post.tagNames && post.tagNames.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {post.tagNames.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 text-xs bg-neon-violet/10 text-neon-violet rounded-md"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Hover Glow Effect */}
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-neon-indigo/5 via-neon-violet/5 to-neon-fuchsia/5" />
        </div>
      </article>
    </Link>
  );
}
