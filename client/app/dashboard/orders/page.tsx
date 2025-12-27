'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { AdminNav } from '@/components/dashboard/AdminNav';

interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  weight?: string;
  unit?: string;
  unitPrice?: number;
  totalPrice?: number;
}

interface Order {
  _id: string;
  orderId: string;
  customerName: string;
  phoneNumber: string;
  fullAddress?: string;
  totalItems: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  orderDate: string;
  items: OrderItem[];
  razorpayPaymentId?: string;
}

interface Stats {
  totalOrders: number;
  totalRevenue: number;
  statusCounts?: {
    pending?: number;
    delivered?: number;
    confirmed?: number;
    processing?: number;
    shipped?: number;
    delivery?: number;
    cancelled?: number;
  };
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: 'gray', icon: '⏱️' },
  { value: 'confirmed', label: 'Confirmed', color: 'blue', icon: '✓' },
  { value: 'processing', label: 'Processing', color: 'yellow', icon: '⚙️' },
  { value: 'shipped', label: 'Shipped', color: 'purple', icon: '📦' },
  { value: 'delivery', label: 'Out for Delivery', color: 'indigo', icon: '🚚' },
  { value: 'delivered', label: 'Delivered', color: 'success', icon: '✅' },
  { value: 'cancelled', label: 'Cancelled', color: 'error', icon: '❌' }
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, [searchTerm, statusFilter, paymentFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      if (paymentFilter) params.append('paymentStatus', paymentFilter);
      
      const response = await fetch(`/api/orders?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setOrders(data.data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/orders/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      alert('Please login to update order status');
      return;
    }

    console.log('Updating order:', orderId, 'to status:', newStatus);
    
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      console.log('Update response:', data);
      
      if (response.ok && data.success) {
        alert(`✅ Order status updated to ${newStatus}`);
        await fetchOrders();
        await fetchStats();
        if (selectedOrder?._id === orderId) {
          setSelectedOrder(data.data);
        }
      } else {
        console.error('Failed to update:', data);
        alert(`❌ ${data.message || 'Failed to update status'}`);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('❌ Network error. Please try again.');
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    const statusObj = STATUS_OPTIONS.find(s => s.value === status);
    return statusObj?.color as 'gray' | 'blue' | 'yellow' | 'purple' | 'indigo' | 'success' | 'error' | 'warning' | undefined;
  };

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, 'gray' | 'yellow' | 'success' | 'error'> = {
      pending: 'gray',
      initiated: 'yellow',
      completed: 'success',
      failed: 'error'
    };
    return colors[status] || 'gray';
  };

  return (
    <>
      <AdminNav />
      <div className="min-h-screen bg-gray-50 pb-20 md:pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 md:py-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Orders</h1>
            <p className="text-sm text-gray-600 mt-1">Manage and track all customer orders</p>
          </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs md:text-sm text-gray-600">Total Orders</div>
                  <div className="text-xl md:text-2xl font-bold text-gray-900 mt-1">{stats.totalOrders}</div>
                </div>
                <div className="text-2xl md:text-3xl">📊</div>
              </div>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-orange-50 to-white border-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs md:text-sm text-orange-600 font-medium">Revenue</div>
                  <div className="text-xl md:text-2xl font-bold text-orange-700 mt-1">₹{stats.totalRevenue.toLocaleString()}</div>
                </div>
                <div className="text-2xl md:text-3xl">💰</div>
              </div>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-yellow-50 to-white border-yellow-100">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs md:text-sm text-yellow-600 font-medium">Pending</div>
                  <div className="text-xl md:text-2xl font-bold text-yellow-700 mt-1">{stats.statusCounts?.pending || 0}</div>
                </div>
                <div className="text-2xl md:text-3xl">⏱️</div>
              </div>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-green-50 to-white border-green-100">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs md:text-sm text-green-600 font-medium">Delivered</div>
                  <div className="text-xl md:text-2xl font-bold text-green-700 mt-1">{stats.statusCounts?.delivered || 0}</div>
                </div>
                <div className="text-2xl md:text-3xl">✅</div>
              </div>
            </Card>
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <Input
              placeholder="Search by Order ID, Name, Phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[rgb(var(--orange))] focus:ring-2 focus:ring-[rgb(var(--orange))]/20"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status.value} value={status.value}>{status.icon} {status.label}</option>
              ))}
            </select>

            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[rgb(var(--orange))] focus:ring-2 focus:ring-[rgb(var(--orange))]/20"
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
            >
              <option value="">All Payment Status</option>
              <option value="pending">⏳ Pending</option>
              <option value="initiated">🔄 Initiated</option>
              <option value="completed">✓ Completed</option>
              <option value="failed">✗ Failed</option>
            </select>

            <button onClick={fetchOrders} className="md:col-span-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors">
              Refresh
            </button>
          </div>
        </Card>

        {/* Orders List */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[rgb(var(--orange))]"></div>
          </div>
        ) : orders.length === 0 ? (
          <Card className="p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 text-lg">No orders found</p>
          </Card>
        ) : (
          <>
            {/* Desktop Table View */}
            <Card className="hidden lg:block overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Order ID</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Items</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Payment</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm font-semibold text-gray-900">{order.orderId}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{order.customerName}</div>
                          <div className="text-sm text-gray-500">{order.phoneNumber}</div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{order.totalItems}</td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-gray-900">₹{order.totalAmount.toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={getStatusBadgeVariant(order.status)}>
                            {STATUS_OPTIONS.find(s => s.value === order.status)?.icon} {STATUS_OPTIONS.find(s => s.value === order.status)?.label || order.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={getPaymentStatusColor(order.paymentStatus)}>
                            {order.paymentStatus}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{order.orderDate}</td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => setSelectedOrder(order)}
                            className="text-sm px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Mobile/Tablet Card View */}
            <div className="lg:hidden space-y-3">
              {orders.map((order) => (
                <Card 
                  key={order._id} 
                  className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-mono text-sm font-bold text-gray-900">{order.orderId}</div>
                      <div className="text-sm text-gray-600 mt-1">{order.orderDate}</div>
                    </div>
                    <Badge variant={getStatusBadgeVariant(order.status)}>
                      {STATUS_OPTIONS.find(s => s.value === order.status)?.icon} {STATUS_OPTIONS.find(s => s.value === order.status)?.label}
                    </Badge>
                  </div>

                  <div className="mb-3">
                    <div className="font-semibold text-gray-900">{order.customerName}</div>
                    <div className="text-sm text-gray-600">{order.phoneNumber}</div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div>
                      <div className="text-xs text-gray-500">Amount</div>
                      <div className="text-lg font-bold text-[rgb(var(--orange))]">₹{order.totalAmount.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Items</div>
                      <div className="text-lg font-semibold text-gray-900">{order.totalItems}</div>
                    </div>
                    <Badge variant={getPaymentStatusColor(order.paymentStatus)}>
                      {order.paymentStatus}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Order Detail Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
            <Card className="w-full md:max-w-3xl md:rounded-xl rounded-t-2xl rounded-b-none md:rounded-b-xl p-6 max-h-[90vh] overflow-y-auto animate-slide-up">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900">Order Details</h2>
                  <p className="text-sm text-gray-600 mt-1 font-mono">{selectedOrder.orderId}</p>
                </div>
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Order Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Order Date</div>
                    <div className="font-semibold text-gray-900">{selectedOrder.orderDate}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Total Amount</div>
                    <div className="text-xl font-bold text-[rgb(var(--orange))]">₹{selectedOrder.totalAmount.toLocaleString()}</div>
                  </div>
                </div>

                {/* Customer Info */}
                <div>
                  <div className="text-xs text-gray-500 mb-2">Customer Information</div>
                  <Card className="p-4 bg-gradient-to-br from-gray-50 to-white">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-[rgb(var(--orange))]/10 rounded-full">
                        <svg className="w-5 h-5 text-[rgb(var(--orange))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{selectedOrder.customerName}</div>
                        <div className="text-sm text-gray-600 mt-1">{selectedOrder.phoneNumber}</div>
                        <div className="text-sm text-gray-600 mt-2 flex items-start gap-2">
                          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {selectedOrder.fullAddress}
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Items */}
                <div>
                  <div className="text-xs text-gray-500 mb-2">Order Items ({selectedOrder.totalItems})</div>
                  <Card className="p-4 bg-gradient-to-br from-orange-50/30 to-white">
                    <div className="space-y-3">
                      {selectedOrder.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{item.name}</div>
                            <div className="text-sm text-gray-600 mt-0.5">
                              {item.weight} {item.unit} × {item.quantity} = ₹{item.unitPrice} each
                            </div>
                          </div>
                          <div className="font-bold text-gray-900">₹{item.totalPrice}</div>
                        </div>
                      ))}
                      <div className="flex justify-between pt-3 mt-2 border-t-2 border-gray-200">
                        <div className="font-bold text-gray-900">Total</div>
                        <div className="text-xl font-bold text-[rgb(var(--orange))]">₹{selectedOrder.totalAmount}</div>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Status Update */}
                <div>
                  <div className="text-xs text-gray-500 mb-2">Update Order Status</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {STATUS_OPTIONS.map((status) => (
                      <button
                        key={status.value}
                        onClick={() => updateOrderStatus(selectedOrder._id, status.value)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          selectedOrder.status === status.value
                            ? 'bg-[rgb(var(--orange))] text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <span className="block text-base mb-0.5">{status.icon}</span>
                        <span className="text-xs">{status.label.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payment Info */}
                <div>
                  <div className="text-xs text-gray-500 mb-2">Payment Information</div>
                  <Card className="p-4 bg-gradient-to-br from-green-50/30 to-white">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-700">Payment Status</span>
                      <Badge variant={getPaymentStatusColor(selectedOrder.paymentStatus)}>
                        {selectedOrder.paymentStatus}
                      </Badge>
                    </div>
                    {selectedOrder.razorpayPaymentId && (
                      <div className="text-xs text-gray-600 mt-2 p-2 bg-white rounded">
                        <div className="font-mono">ID: {selectedOrder.razorpayPaymentId}</div>
                      </div>
                    )}
                  </Card>
                </div>
              </div>
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
