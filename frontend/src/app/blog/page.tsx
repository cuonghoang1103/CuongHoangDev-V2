'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { blogApi } from '@/lib/api';
import type { Post, Category, PageResponse } from '@/types';
import BlogCard from '@/components/blog/BlogCard';
import CategorySidebar from '@/components/blog/CategorySidebar';
import Pagination from '@/components/blog/Pagination';

function BlogContent() {
  const searchParams = useSearchParams();
  const categorySlug = searchParams.get('category');

  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState('');
  const pageSize = 6;

  const fetchCategories = useCallback(async () => {
    try {
      const response = await blogApi.getCategories();
      setCategories(response.data.data || []);
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
      const data = response.data.data as PageResponse<Post>;
      setPosts(data.content || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Failed to fetch posts:', err);
      setError('Không thể tải bài viết. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, categorySlug, searchKeyword]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);
  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPosts();
  };

  const activeCategory = categories.find((c) => c.slug === categorySlug);

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Tìm kiếm bài viết..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full px-4 py-3 pl-12 rounded-xl bg-darkcard border border-darkborder text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-violet/50 transition-colors"
            />
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button type="submit" className="px-6 py-3 bg-gradient-to-r from-neon-indigo to-neon-violet text-white font-medium rounded-xl hover:opacity-90 transition-opacity">
            Tìm kiếm
          </button>
        </form>
      </div>

      {activeCategory && (
        <div className="mb-6">
          <h2 className="text-2xl font-heading font-bold text-text-primary">{activeCategory.name}</h2>
          {activeCategory.description && <p className="text-text-secondary mt-1">{activeCategory.description}</p>}
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-darkcard rounded-2xl overflow-hidden border border-darkborder/50">
                <div className="h-48 bg-darkbg" />
                <div className="p-5 space-y-3">
                  <div className="h-6 bg-darkbg rounded-lg w-3/4" />
                  <div className="h-4 bg-darkbg rounded w-full" />
                  <div className="h-4 bg-darkbg rounded w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/10 rounded-full mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-text-secondary">{error}</p>
          <button onClick={() => fetchPosts()} className="mt-4 px-6 py-2 bg-neon-violet/20 text-neon-violet rounded-xl hover:bg-neon-violet/30 transition-colors">
            Thử lại
          </button>
        </div>
      )}

      {!loading && !error && posts.length === 0 && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-neon-violet/10 rounded-full mb-4">
            <svg className="w-8 h-8 text-neon-violet" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          <h3 className="text-xl font-heading font-semibold text-text-primary mb-2">Chưa có bài viết nào</h3>
          <p className="text-text-secondary">
            {categorySlug ? 'Danh mục này hiện chưa có bài viết.' : 'Hãy là người đầu tiên đăng bài viết!'}
          </p>
        </div>
      )}

      {!loading && !error && posts.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post, index) => (
              <BlogCard key={post.id} post={post} variant={index === 0 ? 'featured' : 'default'} />
            ))}
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </>
      )}
    </>
  );
}

function BlogLoading() {
  return (
    <div className="flex-1">
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="animate-pulse flex-1 flex gap-2">
          <div className="h-12 flex-1 bg-darkcard rounded-xl" />
          <div className="h-12 w-24 bg-darkcard rounded-xl" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-darkcard rounded-2xl overflow-hidden border border-darkborder/50">
              <div className="h-48 bg-darkbg" />
              <div className="p-5 space-y-3">
                <div className="h-6 bg-darkbg rounded-lg w-3/4" />
                <div className="h-4 bg-darkbg rounded w-full" />
                <div className="h-4 bg-darkbg rounded w-2/3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-darkbg">
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-indigo/20 rounded-full blur-[128px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-violet/20 rounded-full blur-[128px]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-text-primary mb-6">
            Blog của{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-neon-indigo via-neon-violet to-neon-fuchsia">
              CuongHoangDev
            </span>
          </h1>
          <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto">
            Khám phá những bài viết về công nghệ, lập trình và chia sẻ kinh nghiệm phát triển phần mềm
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="flex flex-col lg:flex-row gap-8">
          <Suspense fallback={<BlogLoading />}>
            <BlogContent />
          </Suspense>
          <div className="lg:w-80">
            <CategorySidebar categories={[]} />
          </div>
        </div>
      </section>
    </div>
  );
}
