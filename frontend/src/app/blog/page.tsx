'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, X, FileText } from 'lucide-react';
import { blogApi } from '@/lib/api';
import type { Post, Category, PageResponse } from '@/types';
import BlogCard from '@/components/blog/BlogCard';
import CategorySidebar from '@/components/blog/CategorySidebar';
import AgentActivityLog from '@/components/blog/CategorySidebar';

const ALL_TAGS = ['JavaScript', 'React', 'TypeScript', 'Next.js', 'Spring Boot', 'AI', 'Node.js', 'Python', 'CSS', 'Docker', 'PostgreSQL', 'DevOps'];

function BlogContent() {
  const searchParams = useSearchParams();
  const categorySlug = searchParams.get('category');

  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const pageSize = 9;

  const fetchCategories = useCallback(async () => {
    try {
      const response = await blogApi.getCategories();
      setCategories(response.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  }, []);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = {
        page: currentPage - 1,
        size: pageSize,
      };
      if (categorySlug) params.category = categorySlug;
      if (searchKeyword) params.keyword = searchKeyword;

      const response = await blogApi.getPosts(params as Parameters<typeof blogApi.getPosts>[0]);
      const data = response.data?.data as PageResponse<Post>;
      let filteredPosts = data?.content || [];

      // Client-side tag filter
      if (selectedTags.length > 0) {
        filteredPosts = filteredPosts.filter((post: Post) => {
          const postTags = post.tagNames || [];
          return selectedTags.some(tag =>
            postTags.some(pt => pt.toLowerCase() === tag.toLowerCase())
          );
        });
      }

      setPosts(filteredPosts);
      setTotalPages(data?.totalPages || 1);
      setTotalElements(data?.totalElements || 0);
    } catch (err) {
      console.error('Failed to fetch posts:', err);
      setError('Unable to load posts. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, categorySlug, searchKeyword, selectedTags]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);
  useEffect(() => { setCurrentPage(1); fetchPosts(); }, [fetchPosts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPosts();
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchKeyword('');
    setSelectedTags([]);
    setCurrentPage(1);
  };

  const activeCategory = categories.find((c) => c.slug === categorySlug);
  const hasActiveFilters = searchKeyword || selectedTags.length > 0;

  return (
    <>
      {/* Hero */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-neon-indigo/15 rounded-full blur-[150px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-neon-violet/15 rounded-full blur-[150px]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-4 py-1.5 bg-neon-indigo/10 border border-neon-indigo/20 rounded-full text-sm text-neon-indigo font-medium mb-4">
              CuongHoangDev Blog
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-text-primary mb-4">
              Blog by{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-indigo via-neon-violet to-neon-fuchsia">
                CuongHoang
              </span>
            </h1>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Explore articles about technology, programming, software development, and modern tech trends
            </p>
          </motion.div>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="sticky top-16 z-40 bg-darkbg/90 backdrop-blur-md border-b border-darkborder py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                type="text"
                placeholder="Search posts..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-darkcard border border-darkborder rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-violet/50 transition-colors"
              />
              {searchKeyword && (
                <button
                  type="button"
                  onClick={() => { setSearchKeyword(''); fetchPosts(); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-neon-indigo to-neon-violet text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
            >
              Search
            </button>
          </form>

          {/* Tag filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <span className="text-xs text-text-muted shrink-0">Tags:</span>
            {ALL_TAGS.map(tag => (
              <button
                key={tag}
                onClick={() => handleTagToggle(tag)}
                className={`
                  shrink-0 px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200
                  ${selectedTags.includes(tag)
                    ? 'bg-neon-fuchsia text-white'
                    : 'bg-darkcard text-text-muted hover:text-text-primary border border-darkborder hover:border-neon-fuchsia/30'
                  }
                `}
              >
                #{tag}
              </button>
            ))}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="shrink-0 px-3 py-1 text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Category banner */}
      {activeCategory && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-text-muted text-sm">Browsing:</span>
            <span className="px-3 py-1 bg-neon-violet/20 text-neon-violet text-sm font-medium rounded-lg border border-neon-violet/20">
              {activeCategory.name}
            </span>
            <a href="/blog" className="text-xs text-text-muted hover:text-neon-violet transition-colors">
              Clear
            </a>
          </div>
          {activeCategory.description && (
            <p className="text-text-muted text-sm mb-6">{activeCategory.description}</p>
          )}
        </div>
      )}

      {/* Results count */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
        <p className="text-text-muted text-sm">
          {totalElements > 0 ? `${totalElements} post${totalElements > 1 ? 's' : ''} found` : 'No posts found'}
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-darkcard rounded-2xl overflow-hidden border border-darkborder/50">
                  <div className="h-48 bg-darkbg" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-darkbg rounded w-1/3" />
                    <div className="h-6 bg-darkbg rounded w-3/4" />
                    <div className="h-3 bg-darkbg rounded w-full" />
                    <div className="h-3 bg-darkbg rounded w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/10 rounded-full mb-4">
            <FileText className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-text-secondary mb-4">{error}</p>
          <button
            onClick={fetchPosts}
            className="px-6 py-2.5 bg-neon-violet/20 text-neon-violet rounded-xl hover:bg-neon-violet/30 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty — AI Agent Activity Log */}
      {!loading && !error && posts.length === 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="max-w-lg mx-auto">
            <AgentActivityLog />
          </div>
          {hasActiveFilters && (
            <div className="text-center mt-6">
              <button
                onClick={clearFilters}
                className="px-6 py-2.5 bg-gradient-to-r from-neon-indigo to-neon-violet text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Posts Grid */}
      {!loading && !error && posts.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post, i) => (
              <BlogCard key={post.id} post={post} index={i} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-10">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-darkcard border border-darkborder rounded-xl text-sm text-text-secondary hover:text-text-primary hover:border-neon-violet/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                {[...Array(Math.min(totalPages, 7))].map((_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-xl text-sm font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-gradient-to-r from-neon-indigo to-neon-violet text-white'
                          : 'bg-darkcard border border-darkborder text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-darkcard border border-darkborder rounded-xl text-sm text-text-secondary hover:text-text-primary hover:border-neon-violet/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-darkbg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            <Suspense fallback={
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-darkcard rounded-2xl overflow-hidden border border-darkborder/50">
                      <div className="h-48 bg-darkbg" />
                      <div className="p-5 space-y-3">
                        <div className="h-4 bg-darkbg rounded w-1/3" />
                        <div className="h-6 bg-darkbg rounded w-3/4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            }>
              <BlogContent />
            </Suspense>
          </div>

          {/* Sidebar */}
          <div className="lg:w-80 shrink-0">
            <Suspense fallback={null}>
              <BlogSidebarWrapper />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}

function BlogSidebarWrapper() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    blogApi.getCategories().then(res => {
      setCategories(res.data?.data || []);
    }).catch(() => {});
  }, []);

  return (
    <div className="sticky top-36">
      <CategorySidebar categories={categories} />
    </div>
  );
}
