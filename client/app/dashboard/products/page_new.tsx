'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { ProductCard } from '@/components/dashboard/ProductCard';
import { ProductTable } from '@/components/dashboard/ProductTable';
import { ProductFormModal } from '@/components/dashboard/ProductFormModal';
import { ProductFilters } from '@/components/dashboard/ProductFilters';

interface Product {
  _id: string;
  name: string;
  category: string;
  weight: string | number;
  unit: string;
  price: number;
  inStock: boolean;
  description?: string;
}

interface FormData {
  name: string;
  category: string;
  weight: string;
  unit: string;
  price: string;
  inStock: boolean;
  description: string;
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

  const [formData, setFormData] = useState<FormData>({
    name: '',
    category: '',
    weight: '',
    unit: 'gm',
    price: '',
    inStock: true,
    description: ''
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [searchTerm, selectedCategory, stockFilter]);

  const fetchProducts = async () => {
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
  };

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
        handleCancel();
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
      weight: String(product.weight),
      unit: product.unit,
      price: String(product.price),
      inStock: product.inStock,
      description: product.description || ''
    });
    setShowAddModal(true);
  };

  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCancel = () => {
    setShowAddModal(false);
    setEditingProduct(null);
    setFormData({
      name: '',
      category: '',
      weight: '',
      unit: 'gm',
      price: '',
      inStock: true,
      description: ''
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 md:py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Products</h1>
            <p className="text-sm text-gray-600 mt-1">{products.length} total products</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Product
          </button>
        </div>

        {/* Filters */}
        <ProductFilters
          searchTerm={searchTerm}
          selectedCategory={selectedCategory}
          stockFilter={stockFilter}
          categories={categories}
          showFilters={showFilters}
          onSearchChange={setSearchTerm}
          onCategoryChange={setSelectedCategory}
          onStockFilterChange={setStockFilter}
          onToggleFilters={() => setShowFilters(!showFilters)}
          onRefresh={fetchProducts}
        />

        {/* Products List */}
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
            <div className="hidden md:block">
              <ProductTable 
                products={products} 
                onEdit={handleEdit} 
                onDelete={handleDelete} 
              />
            </div>
            <div className="md:hidden space-y-3">
              {products.map((product) => (
                <ProductCard 
                  key={product._id} 
                  product={product} 
                  onEdit={handleEdit} 
                  onDelete={handleDelete} 
                />
              ))}
            </div>
          </>
        )}

        {/* Add/Edit Modal */}
        <ProductFormModal
          isOpen={showAddModal}
          isEditing={!!editingProduct}
          formData={formData}
          categories={categories}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          onChange={handleFormChange}
        />
      </div>
    </div>
  );
}
