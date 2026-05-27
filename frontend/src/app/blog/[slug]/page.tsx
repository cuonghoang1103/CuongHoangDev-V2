'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { blogApi } from '@/lib/api';
import type { Post } from '@/types';
import { formatDate } from '@/lib/utils';
import BlogCard from '@/components/blog/BlogCard';

export default function BlogDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [post, setPost] = useState<Post | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPost = useCallback(async () => {
    if (!slug) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await blogApi.getPostBySlug(slug);
      setPost(response.data.data);
      
      // Fetch related posts
      if (response.data.data?.categoryId) {
        const relatedResponse = await blogApi.getPosts({
          category: response.data.data.categorySlug,
          size: 3,
        });
        setRelatedPosts(
          (relatedResponse.data.data.content || []).filter(
            (p: Post) => p.slug !== slug
          )
        );
      }
    } catch (err) {
      console.error('Failed to fetch post:', err);
      setError('Không thể tải bài viết. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  if (loading) {
    return (
      <div className="min-h-screen bg-darkbg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-neon-violet/30 border-t-neon-violet rounded-full animate-spin" />
          <p className="text-text-secondary">Đang tải bài viết...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-darkbg flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/10 rounded-full mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-heading font-bold text-text-primary mb-2">
            Không tìm thấy bài viết
          </h1>
          <p className="text-text-secondary mb-6">{error || 'Bài viết này không tồn tại.'}</p>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-neon-indigo to-neon-violet text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Quay lại Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <article className="min-h-screen bg-darkbg">
      {/* Hero Section */}
      <section className="relative h-[50vh] min-h-[400px]">
        {/* Background Image */}
        <div className="absolute inset-0">
          {post.thumbnailUrl ? (
            <Image
              src={post.thumbnailUrl}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-neon-indigo via-neon-violet to-neon-fuchsia" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-darkbg via-darkbg/60 to-transparent" />
        </div>

        {/* Back Button */}
        <div className="absolute top-6 left-6 z-10">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 px-4 py-2 bg-darkbg/80 backdrop-blur-sm rounded-xl text-text-primary hover:text-neon-violet transition-colors border border-darkborder"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Quay lại
          </Link>
        </div>

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
          <div className="max-w-4xl mx-auto">
            {/* Category Badge */}
            {post.categoryName && (
              <Link
                href={`/blog?category=${post.categoryId}`}
                className="inline-block px-4 py-1 bg-neon-violet text-white text-sm font-medium rounded-full mb-4 hover:bg-neon-violet/80 transition-colors"
              >
                {post.categoryName}
              </Link>
            )}

            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-text-primary leading-tight mb-6">
              {post.title}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-6 text-text-secondary">
              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-indigo to-neon-fuchsia flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {post.authorName?.charAt(0).toUpperCase() || 'A'}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-text-primary">{post.authorName || 'Admin'}</p>
                  <p className="text-sm">{formatDate(post.publishedAt || post.createdAt)}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {post.viewCount} lượt xem
                </span>
              </div>

              {/* Share */}
              <div className="flex items-center gap-2">
                <span className="text-sm">Chia sẻ:</span>
                <button className="p-2 hover:bg-darkcard rounded-lg transition-colors" title="Facebook">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </button>
                <button className="p-2 hover:bg-darkcard rounded-lg transition-colors" title="Twitter">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </button>
                <button className="p-2 hover:bg-darkcard rounded-lg transition-colors" title="Copy link">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-darkcard rounded-2xl border border-darkborder/50 p-6 md:p-10">
          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-xl text-text-secondary italic border-l-4 border-neon-violet pl-6 mb-8">
              {post.excerpt}
            </p>
          )}

          {/* Content */}
          <div
            className="prose prose-invert prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Tags */}
          {post.tagNames && post.tagNames.length > 0 && (
            <div className="mt-10 pt-8 border-t border-darkborder">
              <h3 className="text-sm font-medium text-text-muted mb-3">Tags:</h3>
              <div className="flex flex-wrap gap-2">
                {post.tagNames.map((tag) => (
                  <Link
                    key={tag}
                    href={`/blog?tag=${tag}`}
                    className="px-4 py-2 bg-neon-violet/10 text-neon-violet rounded-full text-sm hover:bg-neon-violet/20 transition-colors"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Author Card */}
        <div className="mt-8 bg-gradient-to-r from-neon-indigo/10 to-neon-violet/10 rounded-2xl border border-neon-violet/20 p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-neon-indigo to-neon-fuchsia flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {post.authorName?.charAt(0).toUpperCase() || 'A'}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-heading font-semibold text-text-primary">
                {post.authorName || 'Admin'}
              </h3>
              <p className="text-text-secondary text-sm">
                Tác giả tại CuongHoangDev
              </p>
            </div>
          </div>
        </div>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-heading font-bold text-text-primary mb-6">
              Bài viết liên quan
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost) => (
                <BlogCard key={relatedPost.id} post={relatedPost} variant="compact" />
              ))}
            </div>
          </section>
        )}
      </section>
    </article>
  );
}
