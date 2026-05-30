'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Zap, Shield, Clock, Star, ShoppingBag } from 'lucide-react';
import ProductCard from '@/components/shop/ProductCard';
import ProductFilter from '@/components/shop/ProductFilter';
import CartDrawer from '@/components/shop/CartDrawer';
import { MOCK_PRODUCTS } from '@/data/products';
import type { ProductCategory, PriceRange, SortOption } from '@/types';

function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(price);
}

export default function ShopPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ProductCategory | 'all'>('all');
  const [priceRange, setPriceRange] = useState<PriceRange>('all');
  const [sort, setSort] = useState<SortOption>('newest');

  const filtered = useMemo(() => {
    let products = [...MOCK_PRODUCTS];

    // Search
    if (search) {
      const q = search.toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Category
    if (category !== 'all') {
      products = products.filter((p) => p.category === category);
    }

    // Price range
    if (priceRange === 'under200') {
      products = products.filter((p) => p.price < 200000);
    } else if (priceRange === '200to500') {
      products = products.filter((p) => p.price >= 200000 && p.price <= 500000);
    } else if (priceRange === 'above500') {
      products = products.filter((p) => p.price > 500000);
    }

    // Sort
    switch (sort) {
      case 'price_asc':
        products.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        products.sort((a, b) => b.price - a.price);
        break;
      case 'popular':
        products.sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0));
        break;
      case 'newest':
      default:
        products.sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
        );
        break;
    }

    return products;
  }, [search, category, priceRange, sort]);

  return (
    <div className="min-h-screen bg-darkbg pt-20">
      {/* Hero */}
      <section className="relative py-12 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-neon-indigo/10 rounded-full blur-[180px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-neon-violet/10 rounded-full blur-[180px]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-2xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-neon-violet/10 border border-neon-violet/20 rounded-full text-sm text-neon-violet mb-6">
              <ShoppingBag className="w-4 h-4" />
              Digital Marketplace
            </div>
            <h1 className="text-3xl md:text-5xl font-heading font-bold text-text-primary mb-4">
              Digital Products & Tools by{' '}
              <span className="gradient-text">CuongHoang</span>
            </h1>
            <p className="text-text-secondary text-base md:text-lg">
              Premium web templates, developer tools, software, and digital resources — crafted with care and ready to ship.
            </p>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-8">
              {[
                { icon: Shield, text: 'Secure Payment' },
                { icon: Clock, text: 'Instant Delivery' },
                { icon: Star, text: 'Quality Guaranteed' },
                { icon: Zap, text: 'Lifetime Updates' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-text-muted text-sm">
                  <Icon className="w-4 h-4 text-neon-violet" />
                  {text}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Products */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Filter */}
        <div className="mb-8">
          <ProductFilter
            search={search}
            onSearchChange={setSearch}
            category={category}
            onCategoryChange={setCategory}
            priceRange={priceRange}
            onPriceRangeChange={setPriceRange}
            sort={sort}
            onSortChange={setSort}
            totalResults={filtered.length}
          />
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-darkcard flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-10 h-10 text-text-muted/30" />
            </div>
            <h3 className="text-xl font-heading font-bold text-text-primary mb-2">
              No products found
            </h3>
            <p className="text-text-muted">Try adjusting your filters or search term</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        )}
      </div>

      {/* Cart Drawer */}
      <CartDrawer />
    </div>
  );
}
