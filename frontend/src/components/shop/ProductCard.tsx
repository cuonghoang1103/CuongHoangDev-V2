'use client';

import { motion } from 'framer-motion';
import { ShoppingCart, Eye, Flame, Sparkles, Package } from 'lucide-react';
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

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  const addShopItem = useCartStore((state) => state.addShopItem);

  const discountPercent = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: 'easeOut' }}
      className="group relative"
    >
      <div className="bg-darkcard border border-darkborder rounded-2xl overflow-hidden hover:border-neon-violet/50 transition-all duration-300 hover:shadow-neon-sm hover:-translate-y-1 flex flex-col h-full">
        {/* Thumbnail */}
        <Link href={`/shop/${product.slug}`} className="block relative aspect-[4/3] overflow-hidden">
          <Image
            src={product.thumbnail}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />

          {/* Badges */}
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
            {discountPercent > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-neon-violet text-white text-xs font-bold rounded-full shadow-lg">
                -{discountPercent}%
              </span>
            )}
          </div>

          {/* Stock badge */}
          {product.stock <= 20 && product.stock > 0 && (
            <div className="absolute top-3 right-3 px-2 py-1 bg-yellow-500/90 text-yellow-900 text-xs font-bold rounded-full backdrop-blur-sm">
              Only {product.stock} left
            </div>
          )}

          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="px-4 py-2 bg-darkcard/90 border border-darkborder rounded-full text-text-muted font-bold text-sm backdrop-blur-sm">
                Out of Stock
              </span>
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
            <div className="flex gap-2">
              <Link
                href={`/shop/${product.slug}`}
                className="flex items-center gap-1.5 px-4 py-2 bg-white/90 backdrop-blur-md text-darkbg rounded-full text-sm font-semibold hover:bg-white transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Eye className="w-4 h-4" />
                Detail
              </Link>
            </div>
          </div>
        </Link>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          {/* Category */}
          <span className="inline-block text-xs font-medium text-neon-violet mb-2">
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

          {/* Price */}
          <div className="flex items-end justify-between mt-auto">
            <div>
              <p className="text-lg font-heading font-bold text-neon-violet">
                {formatPrice(product.price)}
              </p>
              {product.originalPrice && (
                <p className="text-xs text-text-muted line-through">
                  {formatPrice(product.originalPrice)}
                </p>
              )}
            </div>

            {/* Add to cart */}
            <button
              onClick={() => addShopItem(product)}
              disabled={product.stock === 0}
              className="flex items-center gap-1.5 px-3 py-2 bg-neon-violet/20 hover:bg-neon-violet/30 border border-neon-violet/40 text-neon-violet rounded-xl text-xs font-semibold transition-all hover:shadow-neon-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              Add
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
