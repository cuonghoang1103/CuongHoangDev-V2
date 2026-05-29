'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Send, TrendingUp, Tag, BookOpen } from 'lucide-react';
import type { Category } from '@/types';
import toast from 'react-hot-toast';

interface CategorySidebarProps {
  categories: Category[];
  activeCategory?: string;
  popularTags?: string[];
  onTagClick?: (tag: string) => void;
  selectedTags?: string[];
}

export default function CategorySidebar({
  categories,
  activeCategory,
  popularTags = [],
  onTagClick,
  selectedTags = [],
}: CategorySidebarProps) {
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email');
      return;
    }
    setSubscribing(true);
    await new Promise(r => setTimeout(r, 1000));
    toast.success('Subscribed successfully!');
    setEmail('');
    setSubscribing(false);
  };

  const displayTags = popularTags.length > 0
    ? popularTags
    : ['JavaScript', 'React', 'TypeScript', 'Next.js', 'Spring Boot', 'AI', 'Node.js', 'Python', 'CSS', 'Docker'];

  return (
    <aside className="space-y-6">
      {/* Categories */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="bg-darkcard rounded-2xl border border-darkborder p-5"
      >
        <h3 className="font-heading font-semibold text-text-primary mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-neon-violet" />
          Categories
        </h3>

        <nav className="space-y-1">
          <Link
            href="/blog"
            className={`
              flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200
              ${!activeCategory
                ? 'bg-neon-violet/15 text-neon-violet border border-neon-violet/20'
                : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
              }
            `}
          >
            <span className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-current opacity-60" />
              All Posts
            </span>
          </Link>

          {categories.map((cat) => {
            const isActive = activeCategory === cat.slug;
            return (
              <Link
                key={cat.id}
                href={`/blog?category=${cat.slug}`}
                className={`
                  flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200
                  ${isActive
                    ? 'bg-neon-violet/15 text-neon-violet border border-neon-violet/20'
                    : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
                  }
                `}
              >
                <span className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-current opacity-40" />
                  {cat.name}
                </span>
                {cat.postCount !== undefined && (
                  <span className="text-xs opacity-60">{cat.postCount}</span>
                )}
              </Link>
            );
          })}
        </nav>
      </motion.div>

      {/* Popular Topics */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-darkcard rounded-2xl border border-darkborder p-5"
      >
        <h3 className="font-heading font-semibold text-text-primary mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-neon-fuchsia" />
          Popular Topics
        </h3>

        <div className="flex flex-wrap gap-2">
          {displayTags.map((tag) => {
            const isSelected = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                onClick={() => onTagClick?.(tag)}
                className={`
                  px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
                  ${isSelected
                    ? 'bg-neon-fuchsia text-white'
                    : 'bg-neon-fuchsia/10 text-neon-fuchsia hover:bg-neon-fuchsia/20'
                  }
                `}
              >
                #{tag}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Newsletter */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-gradient-to-br from-neon-indigo/10 via-neon-violet/10 to-neon-fuchsia/10 rounded-2xl border border-neon-violet/20 p-5"
      >
        <div className="flex items-center gap-2 mb-2">
          <Mail className="w-5 h-5 text-neon-violet" />
          <h3 className="font-heading font-semibold text-text-primary">Newsletter</h3>
        </div>
        <p className="text-sm text-text-muted mb-4 leading-relaxed">
          Get the latest posts and tutorials delivered to your inbox weekly.
        </p>
        <form onSubmit={handleSubscribe} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-4 py-2.5 rounded-xl bg-darkbg/80 border border-darkborder text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-neon-violet/50 transition-colors"
          />
          <button
            type="submit"
            disabled={subscribing}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-neon-indigo to-neon-violet text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {subscribing ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                Subscribe
              </>
            )}
          </button>
        </form>
      </motion.div>
    </aside>
  );
}
