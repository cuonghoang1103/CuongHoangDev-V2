'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { coursesApi, courseCategoryApi } from '@/lib/api';
import type { Course, CourseCategory } from '@/types';
import CourseCard from '@/components/academy/CourseCard';
import type { PageResponse } from '@/types';

const LEVELS = ['All', 'Beginner', 'Intermediate', 'Advanced'];
const SORT_OPTIONS = [
  { label: 'Newest', value: 'newest' },
  { label: 'Popular', value: 'popular' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
];

export default function AcademyPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [level, setLevel] = useState('All');
  const [priceFilter, setPriceFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchCourses = useCallback(async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setPage(0);
      }
      const params: Record<string, string | number> = {
        page: reset ? 0 : page,
        size: 12,
      };
      if (search) params.keyword = search;
      if (category !== 'All') params.category = category;
      if (level !== 'All') params.level = level;
      if (sortBy === 'popular') params.sortBy = 'popular';
      if (sortBy === 'newest') params.sortBy = 'newest';

      const res = await coursesApi.getAll(params);
      const data: PageResponse<Course> = res.data?.data;
      const newCourses = data?.content || [];

      if (reset) {
        setCourses(newCourses);
      } else {
        setCourses(prev => [...prev, ...newCourses]);
      }
      setTotal(data?.totalElements || 0);
      setHasMore(!data?.last);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    } finally {
      setLoading(false);
    }
  }, [search, category, level, sortBy, page]);

  useEffect(() => {
    coursesApi.getAll({ size: 100 }).then(res => {
      const cats: CourseCategory[] = res.data?.data?.content?.map((c: Course) => ({
        id: c.categoryId || 0,
        name: c.categoryName || 'Other',
        slug: c.categorySlug || '',
        sortOrder: 0,
      })) || [];
      const unique = Array.from(new Map(cats.map((c: CourseCategory) => [c.id, c])).values());
      setCategories(unique);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCourses(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, category, level, sortBy, priceFilter]);

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(p => p + 1);
    }
  };

  useEffect(() => {
    if (page > 0) fetchCourses(false);
  }, [page]);

  const clearFilters = () => {
    setSearch('');
    setCategory('All');
    setLevel('All');
    setPriceFilter('All');
    setSortBy('newest');
  };

  const hasActiveFilters = search || category !== 'All' || level !== 'All' || priceFilter !== 'All';

  return (
    <div className="min-h-screen bg-darkbg pt-20">
      {/* Hero */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-neon-indigo/20 rounded-full blur-[150px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-neon-violet/20 rounded-full blur-[150px]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-4 py-1.5 bg-neon-indigo/10 border border-neon-indigo/20 rounded-full text-sm text-neon-indigo font-medium mb-4">
              CuongHoangDev Academy
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-text-primary mb-4">
              Learn & Grow Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-indigo to-neon-violet">Skills</span>
            </h1>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Master programming, frameworks, and modern technologies with hands-on courses designed by experts
            </p>
          </motion.div>
        </div>
      </section>

      {/* Search & Filter Bar */}
      <section className="sticky top-16 z-40 bg-darkbg/90 backdrop-blur-md border-b border-darkborder py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search courses..."
                className="w-full pl-12 pr-4 py-3 bg-darkcard border border-darkborder rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-violet/50 transition-colors"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-colors ${
                showFilters || hasActiveFilters
                  ? 'bg-neon-violet/10 border-neon-violet/30 text-neon-violet'
                  : 'bg-darkcard border-darkborder text-text-secondary hover:text-text-primary'
              }`}
            >
              <SlidersHorizontal className="w-5 h-5" />
              <span className="hidden sm:inline">Filters</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 bg-neon-violet rounded-full" />
              )}
            </button>

            {/* Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none pl-4 pr-10 py-3 bg-darkcard border border-darkborder rounded-xl text-text-secondary text-sm focus:outline-none focus:border-neon-violet/50 cursor-pointer"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
            </div>
          </div>

          {/* Filter panel */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-4 bg-darkcard border border-darkborder rounded-2xl"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Category */}
                <div>
                  <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Category</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setCategory('All')}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        category === 'All' ? 'bg-neon-violet text-white' : 'bg-darkbg text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      All
                    </button>
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setCategory(cat.name)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          category === cat.name ? 'bg-neon-violet text-white' : 'bg-darkbg text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Level */}
                <div>
                  <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Level</label>
                  <div className="flex flex-wrap gap-2">
                    {LEVELS.map(lv => (
                      <button
                        key={lv}
                        onClick={() => setLevel(lv)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          level === lv ? 'bg-neon-violet text-white' : 'bg-darkbg text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        {lv}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price */}
                <div>
                  <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Price</label>
                  <div className="flex flex-wrap gap-2">
                    {['All', 'Free', 'Paid'].map(p => (
                      <button
                        key={p}
                        onClick={() => setPriceFilter(p)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          priceFilter === p ? 'bg-neon-violet text-white' : 'bg-darkbg text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-4 flex items-center gap-1 text-sm text-red-400 hover:text-red-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Clear all filters
                </button>
              )}
            </motion.div>
          )}
        </div>
      </section>

      {/* Course Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Results header */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-text-muted text-sm">
              {total > 0 ? `${total} course${total > 1 ? 's' : ''} found` : 'No courses found'}
            </p>
          </div>

          {loading && courses.length === 0 ? (
            /* Skeleton */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-darkcard rounded-2xl overflow-hidden border border-darkborder/50">
                    <div className="aspect-video bg-darkbg" />
                    <div className="p-5 space-y-3">
                      <div className="h-4 bg-darkbg rounded w-1/2" />
                      <div className="h-5 bg-darkbg rounded w-3/4" />
                      <div className="h-3 bg-darkbg rounded w-full" />
                      <div className="h-3 bg-darkbg rounded w-2/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : courses.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {courses
                  .filter(c => {
                    if (priceFilter === 'Free') return c.isFree || c.price === 0;
                    if (priceFilter === 'Paid') return !c.isFree && c.price > 0;
                    return true;
                  })
                  .map((course, i) => (
                    <CourseCard key={course.id} course={course} index={i} />
                  ))}
              </div>

              {/* Load more */}
              {hasMore && (
                <div className="text-center mt-10">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="px-8 py-3 bg-darkcard border border-darkborder text-text-secondary rounded-xl hover:border-neon-violet hover:text-neon-violet transition-all disabled:opacity-50"
                  >
                    {loading ? 'Loading...' : 'Load More Courses'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20">
              <Search className="w-16 h-16 text-text-muted/30 mx-auto mb-4" />
              <h3 className="text-xl font-heading font-bold text-text-primary mb-2">No courses found</h3>
              <p className="text-text-muted mb-4">Try adjusting your search or filters</p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="px-6 py-2.5 bg-gradient-to-r from-neon-indigo to-neon-violet text-white rounded-xl hover:opacity-90 transition-opacity"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
