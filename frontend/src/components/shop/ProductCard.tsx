'use client';

import { motion } from 'framer-motion';
import { ShoppingCart, Eye, Flame, Sparkles, Package, TrendingUp, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/types';
import { useCartStore } from '@/store/cartStore';
import StarRating from './StarRating';

interface ProductCardProps {
  product: Product;
  index?: number;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(price);
}

function calcDiscount(original: number | undefined, current: number): number {
  if (!original || original <= current) return 0;
  return Math.round((1 - current / original) * 100);
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  const addShopItem = useCartStore((state) => state.addShopItem);

  const discountPercent = calcDiscount(product.originalPrice, product.price);
  const safeStock = product.stock ?? 0;
  const safeSold = product.soldCount ?? 0;

  const c = {
    primary: '#a855f7',
    secondary: '#ec4899',
    tertiary: '#22d3ee',
    border: 'rgba(168,85,247,0.2)',
    text: '#f8fafc',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: 'easeOut' }}
      className="group relative"
    >
      <div
        className="bg-darkcard border border-darkborder rounded-2xl overflow-hidden hover:border-neon-violet/50 transition-all duration-300 hover:shadow-neon-sm hover:-translate-y-1 flex flex-col h-full"
      >
        {/* Thumbnail */}
        <Link href={`/shop/${product.slug}`} className="block relative aspect-[4/3] overflow-hidden">
          {product.thumbnail ? (
            <Image
              src={product.thumbnail}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-neon-indigo/30 to-neon-violet/30 flex items-center justify-center">
              <Package className="w-8 h-8 text-white/30" />
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Top-left badge cluster */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {product.isHot && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold rounded-full shadow-lg">
                <Flame className="w-3 h-3" />
                Hot
              </span>
            )}
            {product.isNew && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-neon-cyan to-blue-500 text-white text-xs font-bold rounded-full shadow-lg">
                <Sparkles className="w-3 h-3" />
                New
              </span>
            )}
          </div>

          {/* Top-right: discount badge */}
          {discountPercent > 0 && (
            <div
              className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${c.primary}, ${c.secondary})`,
                boxShadow: `0 0 16px ${c.primary}80`,
                color: '#fff',
              }}
            >
              -{discountPercent}%
            </div>
          )}

          {/* Bottom-left: low stock warning */}
          {safeStock > 0 && safeStock <= 20 && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
              style={{
                background: 'rgba(250,204,21,0.9)',
                color: '#713f12',
                backdropFilter: 'blur(8px)',
              }}
            >
              <AlertCircle className="w-3 h-3" />
              Chỉ còn {safeStock}
            </div>
          )}

          {safeStock === 0 && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
              <span
                className="px-5 py-2.5 bg-darkcard/90 border border-darkborder rounded-full font-bold text-sm"
                style={{ color: c.textMuted }}
              >
                Hết hàng
              </span>
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
            <Link
              href={`/shop/${product.slug}`}
              className="flex items-center gap-1.5 px-5 py-2 bg-white/95 backdrop-blur-md text-darkbg rounded-full text-sm font-semibold hover:bg-white transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <Eye className="w-4 h-4" />
              Xem chi tiết
            </Link>
          </div>
        </Link>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          {/* Category */}
          <span className="inline-block text-[11px] font-semibold uppercase tracking-wider mb-2"
            style={{ color: c.primary }}>
            {product.category}
          </span>

          {/* Name */}
          <Link href={`/shop/${product.slug}`}>
            <h3 className="font-heading font-bold text-text-primary text-sm leading-snug line-clamp-2 hover:text-neon-violet transition-colors mb-2 flex-1">
              {product.name}
            </h3>
          </Link>

          {/* Rating */}
          <div className="mb-3">
            <StarRating rating={product.rating} reviewCount={product.reviewCount} size="sm" />
          </div>

          {/* Price row */}
          <div className="flex items-end justify-between mt-auto mb-3">
            <div className="flex flex-col gap-0.5">
              {discountPercent > 0 ? (
                <>
                  <p
                    className="text-lg font-heading font-bold leading-none"
                    style={{ color: c.primary, textShadow: `0 0 16px ${c.primary}60` }}
                  >
                    {formatPrice(product.price)}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs line-through" style={{ color: c.textMuted }}>
                      {formatPrice(product.originalPrice!)}
                    </span>
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                      style={{ background: `${c.primary}15`, color: c.primary }}
                    >
                      -{discountPercent}%
                    </span>
                  </div>
                </>
              ) : (
                <p
                  className="text-lg font-heading font-bold leading-none"
                  style={{ color: c.primary }}
                >
                  {formatPrice(product.price)}
                </p>
              )}
            </div>

            <button
              onClick={() => addShopItem(product)}
              disabled={safeStock === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:shadow-neon-sm disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: safeStock === 0 ? '#1f2937' : `${c.primary}20`,
                border: `1px solid ${c.primary}40`,
                color: c.primary,
              }}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              {safeStock === 0 ? 'Hết hàng' : 'Mua'}
            </button>
          </div>

          {/* Stock + Sold bar */}
          <div className="space-y-1.5 pt-3 border-t" style={{ borderColor: `${c.border}50` }}>
            <div className="flex items-center justify-between text-[11px]" style={{ color: c.textMuted }}>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" style={{ color: c.secondary }} />
                <span>{safeSold.toLocaleString()} đã bán</span>
              </div>
              <div className="flex items-center gap-1">
                {safeStock > 0 ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span style={{ color: '#4ade80' }}>Còn hàng</span>
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    <span style={{ color: '#f87171' }}>Hết hàng</span>
                  </>
                )}
              </div>
            </div>
            {/* Stock progress bar */}
            <div className="h-1 rounded-full overflow-hidden" style={{ background: '#1f2937' }}>
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (safeStock / 100) * 100)}%` }}
                transition={{ delay: 0.1 + index * 0.06, duration: 0.5 }}
                style={{
                  background: safeStock === 0
                    ? '#ef4444'
                    : `linear-gradient(90deg, ${c.primary}, ${c.secondary})`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
