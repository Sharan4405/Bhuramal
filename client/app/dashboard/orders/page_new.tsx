'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { OrderCard } from '@/components/dashboard/OrderCard';
import { OrderTable } from '@/components/dashboard/OrderTable';
import { OrderStats } from '@/components/dashboard/OrderStats';
import { OrderFilters } from '@/components/dashboard/OrderFilters';
import { OrderDetailsModal } from '@/components/dashboard/OrderDetailsModal';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: 'gray' },
  { value: 'confirmed', label: 'Confirmed', color: 'blue' },
  { value: 'processing', label: 'Processing', color: 'yellow' },
  { value: 'shipped', label: 'Shipped', color: 'purple' },
  { value: 'delivery', label: 'Out for Delivery', color: 'indigo' },
  { value: 'delivered', label: 'Delivered', color: 'success' },
  { value: 'cancelled', label: 'Cancelled', color: 'error' }
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
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
      
      if (data.success) {
        alert(`Order status updated to ${newStatus}`);
        fetchOrders();
        fetchStats();
        if (selectedOrder?._id === orderId) {
          setSelectedOrder(data.data);
        }
      } else {
        alert(data.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const getStatusBadgeVariant = (status: string): 'gray' | 'blue' | 'yellow' | 'purple' | 'indigo' | 'success' | 'error' | 'warning' | undefined => {
    const statusObj = STATUS_OPTIONS.find(s => s.value === status);
    return statusObj?.color as 'gray' | 'blue' | 'yellow' | 'purple' | 'indigo' | 'success' | 'error' | 'warning' | undefined;
  };

  const getPaymentStatusColor = (status: string): 'gray' | 'yellow' | 'success' | 'error' | undefined => {
    const colors: Record<string, 'gray' | 'yellow' | 'success' | 'error'> = {
      pending: 'gray',
      initiated: 'yellow',
      completed: 'success',
      failed: 'error'
    };
    return colors[status] as 'gray' | 'yellow' | 'success' | 'error' | undefined;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 md:py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-600 mt-1">Manage and track all customer orders</p>
        </div>

        {/* Stats */}
        <OrderStats stats={stats} />

        {/* Filters */}
        <OrderFilters
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          paymentFilter={paymentFilter}
          showFilters={showFilters}
          onSearchChange={setSearchTerm}
          onStatusChange={setStatusFilter}
          onPaymentChange={setPaymentFilter}
          onToggleFilters={() => setShowFilters(!showFilters)}
          onRefresh={fetchOrders}
        />

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
            <div className="hidden lg:block">
              <OrderTable
                orders={orders}
                onView={setSelectedOrder}
                getStatusBadgeVariant={getStatusBadgeVariant}
                getPaymentStatusColor={getPaymentStatusColor}
              />
            </div>
            <div className="lg:hidden space-y-3">
              {orders.map((order) => (
                <OrderCard
                  key={order._id}
                  order={order}
                  onView={setSelectedOrder}
                  getStatusBadgeVariant={getStatusBadgeVariant}
                  getPaymentStatusColor={getPaymentStatusColor}
                />
              ))}
            </div>
          </>
        )}

        {/* Order Details Modal */}
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdateStatus={updateOrderStatus}
          getPaymentStatusColor={getPaymentStatusColor}
        />
      </div>
    </div>
  );
}
