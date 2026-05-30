'use client';

import { useState, useMemo } from 'react';
import { notFound } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ShoppingCart,
  CheckCircle2,
  Star,
  ChevronDown,
  ChevronUp,
  Share2,
  Clock,
  Users,
  Tag,
  ShieldCheck,
  Download,
  ArrowLeft,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { MOCK_PRODUCTS } from '@/data/products';
import { useCartStore } from '@/store/cartStore';
import StarRating from '@/components/shop/StarRating';
import ProductCard from '@/components/shop/ProductCard';
import CartDrawer from '@/components/shop/CartDrawer';
import type { Product } from '@/types';

function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(price);
}

const MOCK_REVIEWS = [
  {
    id: '1',
    userName: 'Nguyen Van A',
    rating: 5,
    title: 'Excellent product!',
    content:
      'This template is exactly what I needed. Clean code, beautiful design, and very easy to customize. Highly recommended!',
    createdAt: '2025-01-15T10:00:00Z',
  },
  {
    id: '2',
    userName: 'Tran Thi B',
    rating: 4,
    title: 'Great value for money',
    content:
      'The quality is outstanding for the price. Documentation is clear and the support team responds quickly.',
    createdAt: '2025-01-10T10:00:00Z',
  },
  {
    id: '3',
    userName: 'Le Quoc C',
    rating: 5,
    title: 'Saved me weeks of work',
    content:
      "I've used many templates before but this one is by far the best. Well-structured, modern, and fully responsive.",
    createdAt: '2025-01-05T10:00:00Z',
  },
];

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [activeTab, setActiveTab] = useState<'description' | 'features' | 'reviews'>('description');
  const [showAllReviews, setShowAllReviews] = useState(false);

  const product = MOCK_PRODUCTS.find((p) => p.slug === slug);

  const addItem = useCartStore((state) => state.addItem);

  if (!product) {
    notFound();
  }

  const discountPercent = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  const relatedProducts = MOCK_PRODUCTS.filter(
    (p) => p.category === product.category && p.id !== product.id
  ).slice(0, 4);

  const displayedReviews = showAllReviews ? MOCK_REVIEWS : MOCK_REVIEWS.slice(0, 2);
  const totalSold = product.soldCount || 0;

  return (
    <div className="min-h-screen bg-darkbg pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back */}
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-neon-violet transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Shop
        </Link>

        {/* Product main */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">
          {/* Images */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-darkcard border border-darkborder group">
              <Image
                src={product.thumbnail}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                priority
              />

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.isHot && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold rounded-full shadow-lg">
                    Hot
                  </span>
                )}
                {product.isNew && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-neon-cyan to-blue-500 text-white text-xs font-bold rounded-full shadow-lg">
                    New
                  </span>
                )}
                {discountPercent > 0 && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-neon-violet text-white text-xs font-bold rounded-full shadow-lg">
                    -{discountPercent}%
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnail strip */}
            <div className="grid grid-cols-4 gap-3 mt-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="relative aspect-square rounded-xl overflow-hidden bg-darkcard border border-darkborder hover:border-neon-violet/50 transition-colors cursor-pointer"
                >
                  <Image
                    src={product.thumbnail}
                    alt={`${product.name} view ${i}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col"
          >
            {/* Category */}
            <span className="inline-flex items-center gap-1 text-sm font-medium text-neon-violet mb-3">
              <Tag className="w-4 h-4" />
              {product.category}
            </span>

            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-text-primary mb-3">
              {product.name}
            </h1>

            {/* Rating + Meta */}
            <div className="flex flex-wrap items-center gap-4 mb-5">
              <StarRating rating={product.rating} reviewCount={product.reviewCount} size="md" />
              <span className="text-text-muted text-sm flex items-center gap-1">
                <Users className="w-4 h-4" />
                {totalSold.toLocaleString()} sold
              </span>
              {product.stock > 0 && (
                <span className="text-text-muted text-sm flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  In Stock
                </span>
              )}
            </div>

            {/* Price */}
            <div className="bg-darkcard border border-darkborder rounded-2xl p-6 mb-6">
              <div className="flex items-end gap-3 mb-3">
                <span className="text-4xl font-heading font-bold text-neon-violet">
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice && (
                  <>
                    <span className="text-lg text-text-muted line-through">
                      {formatPrice(product.originalPrice)}
                    </span>
                    <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-bold rounded">
                      Save {formatPrice(product.originalPrice - product.price)}
                    </span>
                  </>
                )}
              </div>

              {/* Add to cart */}
              <button
                onClick={() => addItem(product)}
                disabled={product.stock === 0}
                className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-neon-indigo to-neon-violet text-white font-bold rounded-xl hover:opacity-90 transition-all hover:shadow-neon-sm disabled:opacity-40 disabled:cursor-not-allowed text-base"
              >
                <ShoppingCart className="w-5 h-5" />
                {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>

              {/* Trust signals */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                {[
                  { icon: ShieldCheck, text: 'Secure Payment' },
                  { icon: Download, text: 'Instant Download' },
                  { icon: Clock, text: '24/7 Support' },
                  { icon: Star, text: 'Quality Guarantee' },
                ].map(({ icon: Icon, text }) => (
                  <div
                    key={text}
                    className="flex items-center gap-2 text-xs text-text-muted"
                  >
                    <Icon className="w-4 h-4 text-neon-violet" />
                    {text}
                  </div>
                ))}
              </div>
            </div>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 bg-darkcard border border-darkborder rounded-lg text-xs text-text-muted"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="mb-16">
          <div className="flex gap-1 p-1 bg-darkcard rounded-xl border border-darkborder mb-8 w-fit">
            {(['description', 'features', 'reviews'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab
                    ? 'bg-neon-violet text-white shadow-neon-sm'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab === 'reviews' && ` (${product.reviewCount})`}
              </button>
            ))}
          </div>

          {activeTab === 'description' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-darkcard border border-darkborder rounded-2xl p-8"
            >
              <h3 className="text-lg font-heading font-bold text-text-primary mb-4">
                About This Product
              </h3>
              <p className="text-text-secondary leading-relaxed">{product.description}</p>
            </motion.div>
          )}

          {activeTab === 'features' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-darkcard border border-darkborder rounded-2xl p-8"
            >
              <h3 className="text-lg font-heading font-bold text-text-primary mb-6">
                Key Features
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {product.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-neon-violet/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4 text-neon-violet" />
                    </div>
                    <span className="text-text-secondary text-sm leading-relaxed">{feature}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'reviews' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Rating summary */}
              <div className="bg-darkcard border border-darkborder rounded-2xl p-8">
                <div className="flex items-center gap-6 mb-6">
                  <div className="text-center">
                    <p className="text-5xl font-heading font-bold text-neon-violet">
                      {product.rating.toFixed(1)}
                    </p>
                    <StarRating rating={product.rating} reviewCount={product.reviewCount} size="md" />
                  </div>
                  <div className="flex-1 h-2 bg-darkbg rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full"
                      style={{ width: `${(product.rating / 5) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Review list */}
              <div className="space-y-4">
                {displayedReviews.map((review) => (
                  <div
                    key={review.id}
                    className="bg-darkcard border border-darkborder rounded-2xl p-6"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-text-primary">{review.userName}</p>
                        <StarRating rating={review.rating} size="sm" showCount={false} />
                      </div>
                      <span className="text-xs text-text-muted">
                        {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    {review.title && (
                      <p className="font-semibold text-text-primary mb-2">{review.title}</p>
                    )}
                    <p className="text-text-secondary text-sm leading-relaxed">{review.content}</p>
                  </div>
                ))}
              </div>

              {MOCK_REVIEWS.length > 2 && (
                <button
                  onClick={() => setShowAllReviews(!showAllReviews)}
                  className="w-full py-3 text-center text-sm text-neon-violet hover:text-neon-indigo transition-colors border border-neon-violet/20 rounded-xl hover:border-neon-violet/40"
                >
                  {showAllReviews ? 'Show less' : `Show all ${MOCK_REVIEWS.length} reviews`}
                </button>
              )}
            </motion.div>
          )}
        </div>

        {/* Related products */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-heading font-bold text-text-primary mb-6">
              Related Products
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>

      <CartDrawer />
    </div>
  );
}
