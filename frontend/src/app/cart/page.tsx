'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import {
  Minus, Plus, Trash2, ArrowLeft, ShoppingBag,
  ShieldCheck, Truck, CreditCard, Lock, Tag, ArrowRight,
} from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import StarRating from '@/components/shop/StarRating';

function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(price);
}

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotalPrice, clearCart } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-darkbg pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="w-24 h-24 rounded-full bg-darkcard flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-12 h-12 text-text-muted/30" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-text-primary mb-3">Your cart is empty</h1>
            <p className="text-text-muted mb-8">Add some products to get started</p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-neon-indigo to-neon-violet text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const subtotal = getTotalPrice();
  const discount = items.reduce((acc, item) => {
    if (item.product.originalPrice) {
      return acc + (item.product.originalPrice - item.product.price) * item.quantity;
    }
    return acc;
  }, 0);
  const total = subtotal;

  return (
    <div className="min-h-screen bg-darkbg pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-text-primary">
              Shopping Cart
            </h1>
            <p className="text-text-muted text-sm mt-1">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </p>
          </div>
          <Link
            href="/shop"
            className="flex items-center gap-2 text-sm text-text-muted hover:text-neon-violet transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Continue Shopping
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart items */}
          <div className="lg:col-span-2 space-y-4">
            {/* Clear all */}
            <div className="flex justify-end">
              <button
                onClick={clearCart}
                className="text-sm text-text-muted hover:text-red-400 transition-colors"
              >
                Clear cart
              </button>
            </div>

            {items.map((item, index) => {
              const itemDiscount = item.product.originalPrice
                ? (item.product.originalPrice - item.product.price) * item.quantity
                : 0;

              return (
                <motion.div
                  key={item.product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-darkcard border border-darkborder rounded-2xl p-4 sm:p-5 flex gap-4 sm:gap-5"
                >
                  {/* Thumbnail */}
                  <Link
                    href={`/shop/${item.product.slug}`}
                    className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden flex-shrink-0"
                  >
                    <Image
                      src={item.product.thumbnail}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <Link
                        href={`/shop/${item.product.slug}`}
                        className="font-heading font-bold text-text-primary hover:text-neon-violet transition-colors text-sm sm:text-base leading-tight"
                      >
                        {item.product.name}
                      </Link>
                      <button
                        onClick={() => removeItem(item.product.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <span className="text-xs text-neon-violet font-medium">{item.product.category}</span>

                    <div className="flex items-center gap-2 mt-1 mb-3">
                      <StarRating
                        rating={item.product.rating}
                        reviewCount={item.product.reviewCount}
                        size="sm"
                      />
                    </div>

                    {/* Price */}
                    <div className="flex items-end justify-between gap-2">
                      <div>
                        <p className="text-lg font-heading font-bold text-neon-violet">
                          {formatPrice(item.product.price * item.quantity)}
                        </p>
                        {item.product.originalPrice && (
                          <p className="text-xs text-text-muted line-through">
                            {formatPrice(item.product.originalPrice * item.quantity)}
                          </p>
                        )}
                        {itemDiscount > 0 && (
                          <p className="text-xs text-green-400 font-medium">
                            Save {formatPrice(itemDiscount)}
                          </p>
                        )}
                      </div>

                      {/* Quantity */}
                      <div className="flex items-center gap-1 bg-darkbg border border-darkborder rounded-xl">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="w-9 h-9 flex items-center justify-center rounded-xl text-text-muted hover:text-text-primary hover:bg-darkborder/50 transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold text-text-primary">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="w-9 h-9 flex items-center justify-center rounded-xl text-text-muted hover:text-text-primary hover:bg-darkborder/50 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-darkcard border border-darkborder rounded-2xl p-6 sticky top-24">
              <h2 className="font-heading font-bold text-text-primary text-lg mb-6">
                Order Summary
              </h2>

              {/* Line items */}
              <div className="space-y-3 mb-4 pb-4 border-b border-darkborder">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Subtotal</span>
                  <span className="text-text-primary font-medium">{formatPrice(subtotal + discount)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Discount</span>
                    <span className="text-green-400 font-medium">-{formatPrice(discount)}</span>
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="flex justify-between items-end mb-6">
                <span className="text-text-secondary">Total</span>
                <span className="text-2xl font-heading font-bold text-neon-violet">
                  {formatPrice(total)}
                </span>
              </div>

              {/* Coupon */}
              <div className="mb-6">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                      type="text"
                      placeholder="Coupon code"
                      className="w-full pl-9 pr-3 py-2.5 bg-darkbg border border-darkborder rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-violet/50 transition-colors"
                    />
                  </div>
                  <button className="px-4 py-2.5 bg-darkbg border border-darkborder rounded-xl text-sm text-text-secondary hover:border-neon-violet/30 hover:text-neon-violet transition-colors">
                    Apply
                  </button>
                </div>
              </div>

              {/* Checkout */}
              <button
                onClick={() => {
                  alert('Thanh toán thành công! Cảm ơn bạn đã mua hàng.');
                  clearCart();
                }}
                className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-neon-indigo to-neon-violet text-white font-bold rounded-xl hover:opacity-90 transition-opacity mb-3"
              >
                <Lock className="w-4 h-4" />
                Checkout Now
              </button>

              {/* Trust signals */}
              <div className="space-y-2 pt-4 border-t border-darkborder">
                {[
                  { icon: ShieldCheck, text: '100% Secure Payment' },
                  { icon: Truck, text: 'Instant Digital Delivery' },
                  { icon: CreditCard, text: 'Support all payment methods' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2 text-xs text-text-muted">
                    <Icon className="w-4 h-4 text-neon-violet flex-shrink-0" />
                    {text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
