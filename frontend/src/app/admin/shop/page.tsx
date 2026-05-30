'use client';

import { useState } from 'react';
import {
  Plus, Search, Trash2, X, Loader2,
  Edit, Star, Eye, EyeOff, ChevronLeft, ChevronRight,
  ShoppingBag, Flame, Sparkles, CheckCircle2,
} from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import { MOCK_PRODUCTS } from '@/data/products';
import type { Product, ProductCategory } from '@/types';
import ImageUpload from '@/components/admin/ImageUpload';

const CATEGORIES: ProductCategory[] = ['Web Template', 'Tools', 'Software', 'Accounts', 'Ebook'];

const emptyProduct = {
  name: '',
  slug: '',
  price: 0,
  originalPrice: 0,
  thumbnail: '',
  category: 'Web Template' as ProductCategory,
  rating: 5,
  reviewCount: 0,
  description: '',
  features: [] as string[],
  isHot: false,
  isNew: false,
  stock: 999,
  isFeatured: false,
  soldCount: 0,
  tags: [] as string[],
};

function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(price);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export default function AdminShopPage() {
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | 'all'>('all');
  const [page, setPage] = useState(0);
  const [pageSize] = useState(8);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState({ ...emptyProduct });
  const [featureInput, setFeatureInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);

  // Filter
  const filtered = products.filter((p) => {
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === 'all' || p.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);

  // Open create form
  const openCreate = () => {
    setEditingId(null);
    setProductForm({ ...emptyProduct, slug: '' });
    setFeatureInput('');
    setTagInput('');
    setShowForm(true);
  };

  // Open edit form
  const openEdit = (product: Product) => {
    setEditingId(product.id);
    setProductForm({
      name: product.name,
      slug: product.slug,
      price: product.price,
      originalPrice: product.originalPrice ?? 0,
      thumbnail: product.thumbnail,
      category: product.category,
      rating: product.rating,
      reviewCount: product.reviewCount,
      description: product.description,
      features: product.features || [],
      isHot: product.isHot ?? false,
      isNew: product.isNew ?? false,
      stock: product.stock ?? 999,
      isFeatured: product.isFeatured ?? false,
      soldCount: product.soldCount ?? 0,
      tags: product.tags || [],
    });
    setFeatureInput('');
    setTagInput('');
    setShowForm(true);
  };

  // Delete
  const handleDelete = (id: string) => {
    if (!confirm('Delete this product?')) return;
    setProducts((prev) => prev.filter((p) => p.id !== id));
    toast.success('Product deleted');
  };

  // Save
  const handleSave = async () => {
    if (!productForm.name.trim()) {
      toast.error('Product name is required');
      return;
    }
    if (!productForm.slug.trim()) {
      setProductForm((f) => ({ ...f, slug: slugify(f.name) }));
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600)); // simulate API

    if (editingId) {
      setProducts((prev) =>
        prev.map((p) => (p.id === editingId ? { ...productForm, id: editingId } : p))
      );
      toast.success('Product updated');
    } else {
      const newProduct: Product = {
        ...productForm,
        id: Date.now().toString(),
        slug: productForm.slug || slugify(productForm.name),
        createdAt: new Date().toISOString(),
      };
      setProducts((prev) => [newProduct, ...prev]);
      toast.success('Product created');
    }
    setSaving(false);
    setShowForm(false);
  };

  // Toggle featured
  const toggleFeatured = (id: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isFeatured: !p.isFeatured } : p))
    );
  };

  // Toggle hot/new
  const toggleFlag = (id: string, flag: 'isHot' | 'isNew') => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [flag]: !p[flag] } : p))
    );
  };

  const addFeature = () => {
    if (!featureInput.trim()) return;
    setProductForm((f) => ({ ...f, features: [...f.features, featureInput.trim()] }));
    setFeatureInput('');
  };

  const removeFeature = (i: number) => {
    setProductForm((f) => ({ ...f, features: f.features.filter((_, idx) => idx !== i) }));
  };

  const addTag = () => {
    if (!tagInput.trim() || productForm.tags.includes(tagInput.trim())) return;
    setProductForm((f) => ({ ...f, tags: [...f.tags, tagInput.trim()] }));
    setTagInput('');
  };

  const removeTag = (i: number) => {
    setProductForm((f) => ({ ...f, tags: f.tags.filter((_, idx) => idx !== i) }));
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text-primary flex items-center gap-3">
            <ShoppingBag className="w-6 h-6 text-neon-violet" />
            Quản lý Shop
          </h1>
          <p className="text-text-muted text-sm mt-1">{products.length} sản phẩm</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-neon-indigo to-neon-violet text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Thêm sản phẩm
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search products..."
            className="w-full pl-9 pr-4 py-2.5 bg-darkcard border border-darkborder rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-violet/50"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all', ...CATEGORIES] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => { setCategoryFilter(cat as ProductCategory | 'all'); setPage(0); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                categoryFilter === cat
                  ? 'bg-neon-violet/20 border-neon-violet text-neon-violet'
                  : 'bg-darkcard border-darkborder text-text-secondary hover:border-neon-violet/30'
              }`}
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-darkcard border border-darkborder rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-darkborder">
                <th className="text-left px-4 py-3 text-text-muted font-medium">Product</th>
                <th className="text-left px-4 py-3 text-text-muted font-medium hidden md:table-cell">Category</th>
                <th className="text-left px-4 py-3 text-text-muted font-medium">Price</th>
                <th className="text-left px-4 py-3 text-text-muted font-medium hidden lg:table-cell">Badges</th>
                <th className="text-left px-4 py-3 text-text-muted font-medium hidden sm:table-cell">Stock</th>
                <th className="text-left px-4 py-3 text-text-muted font-medium hidden xl:table-cell">Sold</th>
                <th className="text-right px-4 py-3 text-text-muted font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-text-muted">
                    No products found
                  </td>
                </tr>
              ) : (
                paginated.map((product) => (
                  <tr key={product.id} className="border-b border-darkborder/50 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-darkbg">
                          <Image src={product.thumbnail} alt={product.name} fill className="object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-text-primary truncate max-w-[180px]">{product.name}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs text-text-muted">{product.rating} ({product.reviewCount})</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="px-2 py-1 bg-darkbg rounded-lg text-xs text-text-muted">{product.category}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-neon-violet">{formatPrice(product.price)}</p>
                      {product.originalPrice && (
                        <p className="text-xs text-text-muted line-through">{formatPrice(product.originalPrice)}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex gap-1 flex-wrap">
                        {product.isHot && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded">
                            <Flame className="w-2.5 h-2.5" />Hot
                          </span>
                        )}
                        {product.isNew && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-neon-cyan/20 text-neon-cyan text-xs rounded">
                            <Sparkles className="w-2.5 h-2.5" />New
                          </span>
                        )}
                        {product.isFeatured && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-neon-violet/20 text-neon-violet text-xs rounded">
                            <CheckCircle2 className="w-2.5 h-2.5" />Featured
                          </span>
                        )}
                        {!product.isHot && !product.isNew && !product.isFeatured && (
                          <span className="text-xs text-text-muted">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {product.stock === 0 ? (
                        <span className="text-xs text-red-400">Out of stock</span>
                      ) : product.stock <= 20 ? (
                        <span className="text-xs text-yellow-400">Low ({product.stock})</span>
                      ) : (
                        <span className="text-xs text-text-muted">{product.stock}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <span className="text-xs text-text-muted">{product.soldCount?.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => toggleFeatured(product.id)}
                          className={`p-1.5 rounded-lg transition-colors ${product.isFeatured ? 'text-neon-violet bg-neon-violet/10' : 'text-text-muted hover:text-text-primary hover:bg-white/5'}`}
                          title={product.isFeatured ? 'Remove featured' : 'Mark featured'}
                        >
                          <Star className={`w-4 h-4 ${product.isFeatured ? 'fill-current' : ''}`} />
                        </button>
                        <button
                          onClick={() => toggleFlag(product.id, 'isHot')}
                          className={`p-1.5 rounded-lg transition-colors ${product.isHot ? 'text-orange-400 bg-orange-500/10' : 'text-text-muted hover:text-text-primary hover:bg-white/5'}`}
                          title="Toggle Hot"
                        >
                          <Flame className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleFlag(product.id, 'isNew')}
                          className={`p-1.5 rounded-lg transition-colors ${product.isNew ? 'text-neon-cyan bg-neon-cyan/10' : 'text-text-muted hover:text-text-primary hover:bg-white/5'}`}
                          title="Toggle New"
                        >
                          <Sparkles className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEdit(product)}
                          className="p-1.5 rounded-lg text-text-muted hover:text-neon-violet hover:bg-neon-violet/10 transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-darkborder">
            <p className="text-xs text-text-muted">
              Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, filtered.length)} of {filtered.length}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-2 rounded-lg border border-darkborder text-text-muted hover:text-text-primary disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i).map((i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                    page === i
                      ? 'bg-neon-violet text-white'
                      : 'border border-darkborder text-text-muted hover:text-text-primary'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-2 rounded-lg border border-darkborder text-text-muted hover:text-text-primary disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative w-full max-w-2xl max-h-[90vh] bg-darkcard border border-darkborder rounded-2xl shadow-2xl overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-darkcard border-b border-darkborder px-6 py-4 flex items-center justify-between z-10">
              <h2 className="font-heading font-bold text-text-primary">
                {editingId ? 'Edit Product' : 'Add Product'}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-text-muted hover:text-text-primary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Name + Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5">Product Name *</label>
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={(e) => setProductForm((f) => ({ ...f, name: e.target.value, slug: f.slug || slugify(e.target.value) }))}
                    placeholder="e.g. Nexus Dashboard"
                    className="w-full px-4 py-2.5 bg-darkbg border border-darkborder rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-violet/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5">Slug</label>
                  <input
                    type="text"
                    value={productForm.slug}
                    onChange={(e) => setProductForm((f) => ({ ...f, slug: e.target.value }))}
                    placeholder="auto-generated-from-name"
                    className="w-full px-4 py-2.5 bg-darkbg border border-darkborder rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-violet/50"
                  />
                </div>
              </div>

              {/* Category + Price */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5">Category</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm((f) => ({ ...f, category: e.target.value as ProductCategory }))}
                    className="w-full px-4 py-2.5 bg-darkbg border border-darkborder rounded-xl text-sm text-text-primary focus:outline-none focus:border-neon-violet/50 cursor-pointer"
                  >
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5">Price (VND)</label>
                  <input
                    type="number"
                    value={productForm.price}
                    onChange={(e) => setProductForm((f) => ({ ...f, price: Number(e.target.value) }))}
                    className="w-full px-4 py-2.5 bg-darkbg border border-darkborder rounded-xl text-sm text-text-primary focus:outline-none focus:border-neon-violet/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5">Original Price (VND)</label>
                  <input
                    type="number"
                    value={productForm.originalPrice || ''}
                    onChange={(e) => setProductForm((f) => ({ ...f, originalPrice: Number(e.target.value) || 0 }))}
                    placeholder="Optional"
                    className="w-full px-4 py-2.5 bg-darkbg border border-darkborder rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-violet/50"
                  />
                </div>
              </div>

              {/* Thumbnail */}
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">Thumbnail URL</label>
                <ImageUpload
                  value={productForm.thumbnail}
                  onChange={(url) => setProductForm((f) => ({ ...f, thumbnail: url }))}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">Description</label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm((f) => ({ ...f, description: e.target.value }))}
                  rows={4}
                  placeholder="Product description..."
                  className="w-full px-4 py-2.5 bg-darkbg border border-darkborder rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-violet/50 resize-none"
                />
              </div>

              {/* Features */}
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">Features</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addFeature(); } }}
                    placeholder="Add a feature..."
                    className="flex-1 px-4 py-2.5 bg-darkbg border border-darkborder rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-violet/50"
                  />
                  <button onClick={addFeature} className="px-4 py-2.5 bg-neon-indigo/20 border border-neon-indigo/40 text-neon-indigo rounded-xl text-sm font-medium hover:bg-neon-indigo/30 transition-colors">
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {productForm.features.map((f, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-darkbg border border-darkborder rounded-lg text-xs text-text-secondary">
                      {f}
                      <button onClick={() => removeFeature(i)} className="text-text-muted hover:text-red-400">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">Tags</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                    placeholder="Add a tag..."
                    className="flex-1 px-4 py-2.5 bg-darkbg border border-darkborder rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-violet/50"
                  />
                  <button onClick={addTag} className="px-4 py-2.5 bg-neon-cyan/20 border border-neon-cyan/40 text-neon-cyan rounded-xl text-sm font-medium hover:bg-neon-cyan/30 transition-colors">
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {productForm.tags.map((t, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-darkbg border border-darkborder rounded-lg text-xs text-text-secondary">
                      #{t}
                      <button onClick={() => removeTag(i)} className="text-text-muted hover:text-red-400">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Badges */}
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">Badges</label>
                <div className="flex gap-3">
                  {[
                    { key: 'isHot', label: 'Hot', color: 'text-orange-400' },
                    { key: 'isNew', label: 'New', color: 'text-neon-cyan' },
                    { key: 'isFeatured', label: 'Featured', color: 'text-neon-violet' },
                  ].map(({ key, label, color }) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={productForm[key as 'isHot' | 'isNew' | 'isFeatured'] as boolean}
                        onChange={(e) => setProductForm((f) => ({ ...f, [key]: e.target.checked }))}
                        className="w-4 h-4 rounded border-darkborder bg-darkbg text-neon-violet focus:ring-neon-violet/50 cursor-pointer"
                      />
                      <span className={`text-sm ${color}`}>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Stock + Sold */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5">Stock</label>
                  <input
                    type="number"
                    value={productForm.stock}
                    onChange={(e) => setProductForm((f) => ({ ...f, stock: Number(e.target.value) }))}
                    className="w-full px-4 py-2.5 bg-darkbg border border-darkborder rounded-xl text-sm text-text-primary focus:outline-none focus:border-neon-violet/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5">Sold Count</label>
                  <input
                    type="number"
                    value={productForm.soldCount || 0}
                    onChange={(e) => setProductForm((f) => ({ ...f, soldCount: Number(e.target.value) }))}
                    className="w-full px-4 py-2.5 bg-darkbg border border-darkborder rounded-xl text-sm text-text-primary focus:outline-none focus:border-neon-violet/50"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-darkcard border-t border-darkborder px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowForm(false)}
                className="px-5 py-2.5 border border-darkborder rounded-xl text-sm text-text-muted hover:text-text-primary hover:border-darkborder/80 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-neon-indigo to-neon-violet text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingId ? 'Update Product' : 'Create Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
