'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { AdminNav } from '@/components/dashboard/AdminNav';

interface Product {
  _id: string;
  name: string;
  category: string;
  weight: string;
  unit: string;
  price: number;
  inStock: boolean;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [stockFilter, setStockFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    weight: '',
    unit: 'gm',
    price: '',
    inStock: true
  });

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory) params.append('category', selectedCategory);
      if (stockFilter) params.append('inStock', stockFilter);
      
      const response = await fetch(`/api/products?${params}`);
      const data = await response.json();
      if (data.success) {
        setProducts(data.data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCategory, stockFilter]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/products/categories');
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    try {
      const url = editingProduct 
        ? `/api/products/${editingProduct._id}`
        : '/api/products';
      
      const method = editingProduct ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        alert(editingProduct ? 'Product updated!' : 'Product added!');
        setShowAddModal(false);
        setEditingProduct(null);
        resetForm();
        fetchProducts();
        fetchCategories();
      } else {
        alert(data.message || 'Failed to save product');
      }
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Product deleted!');
        fetchProducts();
      } else {
        alert(data.message || 'Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      weight: product.weight,
      unit: product.unit,
      price: product.price.toString(),
      inStock: product.inStock
    });
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      weight: '',
      unit: 'gm',
      price: '',
      inStock: true
    });
  };

  const handleCancel = () => {
    setShowAddModal(false);
    setEditingProduct(null);
    resetForm();
  };

  return (
    <>
      <AdminNav />
      <div className="min-h-screen bg-gray-50 pb-20 md:pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 md:py-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Product Management</h1>
                <p className="text-base text-gray-600">Manage your product catalog - {products.length} total products</p>
              </div>
              <button 
                onClick={() => setShowAddModal(true)}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Product
              </button>
            </div>
          </div>

        {/* Search Bar */}
        <div className="mb-4 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[rgb(var(--orange))] focus:ring-4 focus:ring-[rgb(var(--orange))]/10 transition-all"
          />
        </div>

        {/* Filter Toggle Button (Mobile) */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="md:hidden w-full mb-4 px-4 py-2 bg-white border border-gray-300 rounded-lg flex items-center justify-between"
        >
          <span className="font-medium">Filters</span>
          <svg 
            className={`w-5 h-5 transition-transform ${showFilters ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Filters */}
        <Card className={`mb-6 p-4 ${showFilters ? 'block' : 'hidden md:block'}`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[rgb(var(--orange))] focus:ring-2 focus:ring-[rgb(var(--orange))]/20"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[rgb(var(--orange))] focus:ring-2 focus:ring-[rgb(var(--orange))]/20"
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
            >
              <option value="">All Stock Status</option>
              <option value="true">In Stock</option>
              <option value="false">Out of Stock</option>
            </select>

            <button onClick={fetchProducts} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors">
              Refresh
            </button>
          </div>
        </Card>

        {/* Products Grid/List */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[rgb(var(--orange))]"></div>
          </div>
        ) : products.length === 0 ? (
          <Card className="p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-gray-500 text-lg">No products found</p>
          </Card>
        ) : (
          <>
            {/* Desktop Table View */}
            <Card className="hidden md:block overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Weight</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{product.name}</div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{product.category}</td>
                        <td className="px-6 py-4 text-gray-600">{product.weight} {product.unit}</td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-gray-900">₹{product.price}</span>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={product.inStock ? 'success' : 'error'}>
                            {product.inStock ? 'In Stock' : 'Out of Stock'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleEdit(product)}
                              className="text-sm px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDelete(product._id)}
                              className="text-sm px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {products.map((product) => (
                <Card key={product._id} className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg">{product.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{product.category}</p>
                    </div>
                    <Badge variant={product.inStock ? 'success' : 'error'}>
                      {product.inStock ? 'In Stock' : 'Out'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between mb-3 text-sm">
                    <span className="text-gray-600">{product.weight} {product.unit}</span>
                    <span className="text-xl font-bold text-[rgb(var(--orange))]">₹{product.price}</span>
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-gray-100">
                    <button 
                      onClick={() => handleEdit(product)}
                      className="flex-1 px-4 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-colors"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(product._id)}
                      className="flex-1 px-4 py-2 text-sm bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
            <Card className="w-full md:max-w-2xl md:rounded-xl rounded-t-2xl rounded-b-none md:rounded-b-xl p-6 max-h-[90vh] overflow-y-auto animate-slide-up">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
                <button 
                  onClick={handleCancel}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block mb-2 font-medium text-gray-700">Product Name *</label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g., Basmati Rice"
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium text-gray-700">Category *</label>
                  <Input
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    list="categories"
                    placeholder="e.g., Grains"
                  />
                  <datalist id="categories">
                    {categories.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">Weight *</label>
                    <Input
                      required
                      value={formData.weight}
                      onChange={(e) => setFormData({...formData, weight: e.target.value})}
                      placeholder="500"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">Unit *</label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[rgb(var(--orange))] focus:ring-2 focus:ring-[rgb(var(--orange))]/20"
                      value={formData.unit}
                      onChange={(e) => setFormData({...formData, unit: e.target.value})}
                    >
                      <option value="gm">gm</option>
                      <option value="kg">kg</option>
                      <option value="ml">ml</option>
                      <option value="l">l</option>
                      <option value="pcs">pcs</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block mb-2 font-medium text-gray-700">Price (₹) *</label>
                  <Input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    placeholder="299"
                  />
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    id="inStock"
                    checked={formData.inStock}
                    onChange={(e) => setFormData({...formData, inStock: e.target.checked})}
                    className="w-5 h-5 text-[rgb(var(--orange))] rounded focus:ring-[rgb(var(--orange))]"
                  />
                  <label htmlFor="inStock" className="font-medium text-gray-700 cursor-pointer">
                    Product is in stock
                  </label>
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
                  <button 
                    type="button" 
                    onClick={handleCancel} 
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 btn-primary"
                  >
                    {editingProduct ? 'Update Product' : 'Add Product'}
                  </button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
      </div>
    </>
  );
}
