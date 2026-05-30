'use client';

import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ProductCategory, PriceRange, SortOption } from '@/types';
import { CATEGORIES, PRICE_RANGES, SORT_OPTIONS } from '@/data/products';

interface ProductFilterProps {
  search: string;
  onSearchChange: (value: string) => void;
  category: ProductCategory | 'all';
  onCategoryChange: (value: ProductCategory | 'all') => void;
  priceRange: PriceRange;
  onPriceRangeChange: (value: PriceRange) => void;
  sort: SortOption;
  onSortChange: (value: SortOption) => void;
  totalResults: number;
}

export default function ProductFilter({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  priceRange,
  onPriceRangeChange,
  sort,
  onSortChange,
  totalResults,
}: ProductFilterProps) {
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const activeFiltersCount = [
    category !== 'all',
    priceRange !== 'all',
    sort !== 'newest',
  ].filter(Boolean).length;

  const clearAll = () => {
    onCategoryChange('all');
    onPriceRangeChange('all');
    onSortChange('newest');
    onSearchChange('');
  };

  return (
    <div className="space-y-4">
      {/* Search & Controls Row */}
      <div className="flex gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-10 pr-4 py-2.5 bg-darkcard border border-darkborder rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-violet/50 transition-colors"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Mobile filter toggle */}
        <button
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-darkcard border border-darkborder rounded-xl text-sm font-medium text-text-secondary hover:border-neon-violet/30 transition-colors"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {activeFiltersCount > 0 && (
            <span className="w-5 h-5 bg-neon-violet text-white text-xs rounded-full flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>

        {/* Sort - Desktop */}
        <div className="hidden lg:block">
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="px-4 py-2.5 bg-darkcard border border-darkborder rounded-xl text-sm text-text-secondary focus:outline-none focus:border-neon-violet/50 cursor-pointer hover:border-neon-violet/30 transition-colors appearance-none pr-8"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
            }}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results count + clear */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-muted">
          <span className="text-text-primary font-semibold">{totalResults}</span>{' '}
          {totalResults === 1 ? 'product' : 'products'} found
        </p>
        {activeFiltersCount > 0 && (
          <button
            onClick={clearAll}
            className="text-sm text-neon-violet hover:text-neon-indigo transition-colors"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Filter panels */}
      <AnimatePresence>
        {showMobileFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="lg:hidden overflow-hidden"
          >
            <FilterPanel
              category={category}
              onCategoryChange={onCategoryChange}
              priceRange={priceRange}
              onPriceRangeChange={onPriceRangeChange}
              sort={sort}
              onSortChange={onSortChange}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop filter row */}
      <div className="hidden lg:flex gap-4 items-center flex-wrap">
        <FilterPanel
          category={category}
          onCategoryChange={onCategoryChange}
          priceRange={priceRange}
          onPriceRangeChange={onPriceRangeChange}
          sort={sort}
          onSortChange={onSortChange}
        />
      </div>
    </div>
  );
}

function FilterPanel({
  category,
  onCategoryChange,
  priceRange,
  onPriceRangeChange,
  sort,
  onSortChange,
}: {
  category: ProductCategory | 'all';
  onCategoryChange: (v: ProductCategory | 'all') => void;
  priceRange: PriceRange;
  onPriceRangeChange: (v: PriceRange) => void;
  sort: SortOption;
  onSortChange: (v: SortOption) => void;
}) {
  return (
    <>
      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => onCategoryChange(cat.value as ProductCategory | 'all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
              category === cat.value
                ? 'bg-neon-violet/20 border-neon-violet text-neon-violet'
                : 'bg-darkcard border-darkborder text-text-secondary hover:border-neon-violet/30'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Price range */}
      <div className="flex gap-2 flex-wrap">
        {PRICE_RANGES.map((range) => (
          <button
            key={range.value}
            onClick={() => onPriceRangeChange(range.value as PriceRange)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
              priceRange === range.value
                ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan'
                : 'bg-darkcard border-darkborder text-text-secondary hover:border-neon-cyan/30'
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>

      {/* Sort */}
      <div className="flex gap-2 flex-wrap">
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onSortChange(opt.value as SortOption)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
              sort === opt.value
                ? 'bg-neon-indigo/20 border-neon-indigo text-neon-indigo'
                : 'bg-darkcard border-darkborder text-text-secondary hover:border-neon-indigo/30'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </>
  );
}
