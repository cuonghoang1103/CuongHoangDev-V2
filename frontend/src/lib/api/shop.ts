'use client';

import type { ApiResponse, PageResponse } from '@/types';

const API_BASE = '/api/v1';

function getToken(): string {
  if (typeof window === 'undefined') return '';
  // Credentials: token stored as 'token' in localStorage (set by login)
  // OAuth: token stored as 'auth_token' in localStorage (set by setAuth)
  return localStorage.getItem('auth_token') || localStorage.getItem('token') || '';
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `HTTP ${res.status}`);
  }

  return res.json();
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ProductResponse {
  id: number;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  thumbnailUrl?: string;
  images?: string;
  price: number;
  originalPrice?: number;
  stockQuantity: number;
  soldCount: number;
  featured: boolean;
  active: boolean;
  categoryId?: number;
  categoryName?: string;
  type: string;
  createdAt: string;
}

export interface CategoryResponse {
  id: number;
  name: string;
  slug: string;
  description?: string;
  sortOrder: number;
}

export interface DiscountValidateResponse {
  valid: boolean;
  code: string;
  discountType?: string;
  discountValue?: number;
  discountAmount?: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  message: string;
}

export interface CreateOrderItem {
  productId: number;
  productName: string;
  productSlug?: string;
  productImage?: string;
  price: number;
  quantity: number;
}

export interface CreateOrderRequest {
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  buyerAddress?: string;
  items: CreateOrderItem[];
  discountCode?: string;
  notes?: string;
}

export interface OrderResponse {
  id: number;
  orderCode: string;
  userId?: number;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  buyerAddress?: string;
  subtotal: number;
  discountAmount: number;
  discountCode?: string;
  total: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  paidAt?: string;
  items: OrderItemResponse[];
  createdAt: string;
}

export interface OrderItemResponse {
  id: number;
  productName: string;
  productSlug?: string;
  productImage?: string;
  price: number;
  quantity: number;
  total: number;
}

// ─── Products API ─────────────────────────────────────────────────────────────

export async function getProducts(params?: {
  page?: number;
  size?: number;
  category?: string;
  featured?: boolean;
  search?: string;
}): Promise<PageResponse<ProductResponse>> {
  const sp = new URLSearchParams();
  if (params?.page !== undefined) sp.set('page', String(params.page));
  if (params?.size !== undefined) sp.set('size', String(params.size));
  if (params?.category) sp.set('category', params.category);
  if (params?.featured !== undefined) sp.set('featured', String(params.featured));
  if (params?.search) sp.set('search', params.search);

  const qs = sp.toString();
  const res = await request<ApiResponse<PageResponse<ProductResponse>>>(
    `/shop/products${qs ? `?${qs}` : ''}`
  );
  return res.data;
}

export async function getFeaturedProducts(): Promise<ProductResponse[]> {
  const res = await request<ApiResponse<ProductResponse[]>>(
    '/shop/products/featured'
  );
  return res.data;
}

export async function getProductBySlug(slug: string): Promise<ProductResponse> {
  const res = await request<ApiResponse<ProductResponse>>(
    `/shop/products/${slug}`
  );
  return res.data;
}

export async function getProductById(id: number): Promise<ProductResponse> {
  const res = await request<ApiResponse<ProductResponse>>(
    `/shop/products/id/${id}`
  );
  return res.data;
}

// ─── Categories API ───────────────────────────────────────────────────────────

export async function getCategories(): Promise<CategoryResponse[]> {
  const res = await request<ApiResponse<CategoryResponse[]>>(
    '/shop/categories'
  );
  return res.data;
}

// ─── Discounts API ────────────────────────────────────────────────────────────

export async function validateDiscount(
  code: string
): Promise<DiscountValidateResponse> {
  const res = await request<ApiResponse<DiscountValidateResponse>>(
    `/discounts/validate/${code}`
  );
  return res.data;
}

// ─── Orders API ──────────────────────────────────────────────────────────────

export async function createOrder(
  data: CreateOrderRequest
): Promise<ApiResponse<OrderResponse> > {
  return request('/orders', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getOrderByCode(
  code: string
): Promise<ApiResponse<OrderResponse> > {
  return request(`/orders/${code}`);
}

export async function getMyOrders(): Promise<ApiResponse<OrderResponse[]> > {
  return request('/orders/my');
}

// ─── Admin API ───────────────────────────────────────────────────────────────

export async function adminCreateProduct(
  data: Partial<ProductResponse>
): Promise<ApiResponse<ProductResponse> > {
  return request('/shop/admin/products', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function adminUpdateProduct(
  id: number,
  data: Partial<ProductResponse>
): Promise<ApiResponse<ProductResponse> > {
  return request(`/shop/admin/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function adminDeleteProduct(
  id: number
): Promise<ApiResponse<void> > {
  return request(`/shop/admin/products/${id}`, {
    method: 'DELETE',
  });
}

// ─── Admin Orders ─────────────────────────────────────────────────────────────

export async function adminGetOrders(params?: {
  page?: number;
  size?: number;
  status?: string;
}): Promise<PageResponse<OrderResponse>> {
  const sp = new URLSearchParams();
  if (params?.page !== undefined) sp.set('page', String(params.page));
  if (params?.size !== undefined) sp.set('size', String(params.size));
  if (params?.status) sp.set('status', params.status);

  const qs = sp.toString();
  return request(`/orders/admin${qs ? `?${qs}` : ''}`);
}

export async function adminUpdateOrderStatus(
  id: number,
  status: string
): Promise<ApiResponse<OrderResponse> > {
  return request(`/orders/admin/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

// ─── Admin Discounts ──────────────────────────────────────────────────────────

export async function adminGetDiscounts() {
  return request<
    ApiResponse<
      Array<{
        id: number;
        code: string;
        discountType: string;
        discountValue: number;
        minOrderAmount: number;
        maxDiscountAmount?: number;
        maxUses?: number;
        usedCount: number;
        active: boolean;
        description?: string;
        expiresAt?: string;
      }>
    >
  >('/discounts/admin');
}

export async function adminCreateDiscount(
  data: Record<string, unknown>
): Promise<ApiResponse<void> > {
  return request('/discounts/admin', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function adminUpdateDiscount(
  id: number,
  data: Record<string, unknown>
): Promise<ApiResponse<void> > {
  return request(`/discounts/admin/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function adminDeleteDiscount(
  id: number
): Promise<ApiResponse<void> > {
  return request(`/discounts/admin/${id}`, {
    method: 'DELETE',
  });
}

// ─── Map backend product → frontend Product type ─────────────────────────────

export function mapProductFromBackend(bp: ProductResponse) {
  return {
    id: String(bp.id),
    name: bp.name,
    slug: bp.slug,
    price: bp.price,
    originalPrice: bp.originalPrice,
    thumbnail: bp.thumbnailUrl || '/images/products/default.jpg',
    category: (bp.categoryName as 'Web Template' | 'Tools' | 'Software' | 'Accounts' | 'Ebook') || 'Web Template',
    rating: 5,
    reviewCount: 0,
    description: bp.shortDescription || bp.description || '',
    features: [],
    isHot: false,
    isNew: false,
    stock: bp.stockQuantity,
    isFeatured: bp.featured,
    soldCount: bp.soldCount,
    createdAt: bp.createdAt,
    tags: [],
  };
}
