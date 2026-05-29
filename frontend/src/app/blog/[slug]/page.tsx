'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Clock, Eye, Calendar, ArrowLeft, Share2,
  Twitter, Facebook, Linkedin, Link2, Check
} from 'lucide-react';
import { blogApi } from '@/lib/api';
import type { Post } from '@/types';
import BlogCard from '@/components/blog/BlogCard';

function estimateReadingTime(content?: string) {
  if (!content) return 5;
  const text = content.replace(/<[^>]*>/g, '').replace(/```[\s\S]*?```/g, '').replace(/`[^`]*`/g, '');
  const words = text.split(/\s+/).filter(Boolean);
  return Math.max(1, Math.ceil(words.length / 200));
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function ShareButtons({ title, slug }: { title: string; slug: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== 'undefined' ? `${window.location.origin}/blog/${slug}` : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLinks = [
    {
      name: 'Twitter',
      icon: Twitter,
      color: 'hover:text-sky-400',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
    },
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'hover:text-blue-500',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'hover:text-blue-600',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    },
  ];

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-text-muted mr-1">Share:</span>
      {shareLinks.map((s) => (
        <a
          key={s.name}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`p-2 rounded-lg text-text-muted ${s.color} transition-colors`}
          title={s.name}
        >
          <s.icon className="w-4 h-4" />
        </a>
      ))}
      <button
        onClick={handleCopy}
        className="p-2 rounded-lg text-text-muted hover:text-neon-violet transition-colors"
        title="Copy link"
      >
        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Link2 className="w-4 h-4" />}
      </button>
    </div>
  );
}

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
      const postData = response.data?.data;
      setPost(postData);

      if (postData?.categorySlug) {
        const relatedResponse = await blogApi.search({
          category: postData.categorySlug,
          size: 3,
        });
        const related = (relatedResponse.data?.data?.content || []).filter(
          (p: Post) => p.slug !== slug
        );
        setRelatedPosts(related.slice(0, 3));
      }
    } catch (err) {
      console.error('Failed to fetch post:', err);
      setError('Unable to load post. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  if (loading) {
    return (
      <div className="min-h-screen bg-darkbg pt-20 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-neon-violet/30 border-t-neon-violet rounded-full animate-spin" />
          <p className="text-text-secondary">Loading post...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-darkbg pt-20 flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/10 rounded-full mb-4">
            <span className="text-2xl">!</span>
          </div>
          <h1 className="text-2xl font-heading font-bold text-text-primary mb-2">Post not found</h1>
          <p className="text-text-secondary mb-6">{error || 'This post does not exist.'}</p>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-neon-indigo to-neon-violet text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  const readingTime = estimateReadingTime(post.content);

  return (
    <article className="min-h-screen bg-darkbg">
      {/* Hero */}
      <section className="relative h-[45vh] min-h-[360px]">
        <div className="absolute inset-0">
          {post.thumbnailUrl ? (
            <img
              src={post.thumbnailUrl}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-neon-indigo via-neon-violet to-neon-fuchsia" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-darkbg via-darkbg/50 to-darkbg/20" />
        </div>

        {/* Back button */}
        <div className="absolute top-6 left-6 z-10">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 px-4 py-2 bg-darkbg/80 backdrop-blur-sm rounded-xl text-text-primary hover:text-neon-violet transition-colors border border-darkborder"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </div>

        {/* Hero content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
          <div className="max-w-4xl mx-auto">
            {/* Category */}
            {post.categoryName && (
              <Link
                href={`/blog?category=${post.categorySlug}`}
                className="inline-block px-3 py-1 bg-neon-violet text-white text-sm font-medium rounded-full mb-4 hover:bg-neon-violet/80 transition-colors"
              >
                {post.categoryName}
              </Link>
            )}

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-text-primary leading-tight mb-6"
            >
              {post.title}
            </motion.h1>

            {/* Meta */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex flex-wrap items-center gap-5 text-sm text-text-secondary"
            >
              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-indigo to-neon-fuchsia flex items-center justify-center text-white font-bold">
                  {post.authorName?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div>
                  <p className="font-medium text-text-primary">{post.authorName || 'CuongHoang'}</p>
                  <p className="text-xs text-text-muted flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(post.publishedAt || post.createdAt)}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {readingTime} min read
                </span>
                <span className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4" />
                  {post.viewCount > 0 ? post.viewCount.toLocaleString() : '0'} views
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Share bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex items-center justify-between mb-8 pb-6 border-b border-darkborder"
        >
          <ShareButtons title={post.title} slug={post.slug} />
        </motion.div>

        {/* Article */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-darkcard rounded-2xl border border-darkborder p-6 md:p-10"
        >
          {/* Excerpt / Lead */}
          {post.excerpt && (
            <p className="text-xl text-text-secondary italic border-l-4 border-neon-violet pl-6 mb-8 leading-relaxed">
              {post.excerpt}
            </p>
          )}

          {/* Content */}
          <div
            className="prose prose-invert prose-lg max-w-none
              prose-headings:font-heading prose-headings:text-text-primary
              prose-p:text-text-secondary prose-p:leading-relaxed
              prose-a:text-neon-violet prose-a:no-underline hover:prose-a:underline
              prose-code:text-neon-cyan prose-code:bg-darkbg prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
              prose-pre:bg-darkbg prose-pre:border prose-pre:border-darkborder
              prose-blockquote:border-neon-violet prose-blockquote:text-text-muted
              prose-img:rounded-2xl
              prose-li:text-text-secondary"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Tags */}
          {post.tagNames && post.tagNames.length > 0 && (
            <div className="mt-10 pt-8 border-t border-darkborder">
              <div className="flex flex-wrap gap-2">
                {post.tagNames.map((tag) => (
                  <span
                    key={tag}
                    className="px-4 py-1.5 bg-neon-indigo/10 text-neon-indigo rounded-full text-sm"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Author Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-8 bg-gradient-to-r from-neon-indigo/10 to-neon-violet/10 rounded-2xl border border-neon-violet/15 p-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-neon-indigo to-neon-fuchsia flex items-center justify-center text-white text-2xl font-bold shrink-0">
              {post.authorName?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div>
              <p className="text-sm text-text-muted mb-0.5">Written by</p>
              <h3 className="text-lg font-heading font-bold text-text-primary">
                {post.authorName || 'CuongHoang'}
              </h3>
              <p className="text-sm text-text-muted">
                Software Developer & Tech Content Creator
              </p>
            </div>
          </div>
        </motion.div>

        {/* Share bottom */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mt-8 flex items-center justify-between"
        >
          <ShareButtons title={post.title} slug={post.slug} />
          <Link
            href="/blog"
            className="flex items-center gap-2 text-sm text-text-muted hover:text-neon-violet transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>
        </motion.div>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mt-16"
          >
            <h2 className="text-2xl font-heading font-bold text-text-primary mb-6">
              Related Posts
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((rp, i) => (
                <BlogCard key={rp.id} post={rp} index={i} variant="compact" />
              ))}
            </div>
          </motion.section>
        )}
      </section>
    </article>
  );
}
