import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Payment Pending', color: 'gray', icon: '⏱️' },
  { value: 'confirmed', label: 'Order Placed', color: 'blue', icon: '✓' },
  { value: 'processing', label: 'Processing', color: 'yellow', icon: '⚙️' },
  { value: 'shipped', label: 'Shipped', color: 'purple', icon: '📦' },
  { value: 'delivery', label: 'Out for Delivery', color: 'indigo', icon: '🚚' },
  { value: 'delivered', label: 'Delivered', color: 'success', icon: '✅' },
  { value: 'cancelled', label: 'Cancelled', color: 'error', icon: '❌' }
];

type BadgeVariant = 'gray' | 'blue' | 'yellow' | 'purple' | 'indigo' | 'success' | 'error' | 'warning';

interface OrderDetailsModalProps {
  order: any;
  onClose: () => void;
  onUpdateStatus: (orderId: string, status: string) => void;
  getPaymentStatusColor: (status: string) => BadgeVariant | undefined;
}

export function OrderDetailsModal({ order, onClose, onUpdateStatus, getPaymentStatusColor }: OrderDetailsModalProps) {
  if (!order) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
      <Card className="w-full md:max-w-3xl md:rounded-xl rounded-t-2xl rounded-b-none md:rounded-b-xl p-6 max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">Order Details</h2>
            <p className="text-sm text-gray-600 mt-1 font-mono">{order.orderId}</p>
          </div>
          <button 
            onClick={onClose}
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
              <div className="font-semibold text-gray-900">{order.orderDate}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Total Amount</div>
              <div className="text-xl font-bold text-[rgb(var(--orange))]">₹{order.totalAmount.toLocaleString()}</div>
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
                  <div className="font-semibold text-gray-900">{order.customerName}</div>
                  <div className="text-sm text-gray-600 mt-1">{order.phoneNumber}</div>
                  <div className="text-sm text-gray-600 mt-2 flex items-start gap-2">
                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {order.fullAddress}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Items */}
          <div>
            <div className="text-xs text-gray-500 mb-2">Order Items ({order.totalItems})</div>
            <Card className="p-4 bg-gradient-to-br from-orange-50/30 to-white">
              <div className="space-y-3">
                {order.items.map((item: any, idx: number) => (
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
                  <div className="text-xl font-bold text-[rgb(var(--orange))]">₹{order.totalAmount}</div>
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
                  onClick={() => onUpdateStatus(order._id, status.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    order.status === status.value
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
                <Badge variant={getPaymentStatusColor(order.paymentStatus)}>
                  {order.paymentStatus}
                </Badge>
              </div>
              {order.razorpayPaymentId && (
                <div className="text-xs text-gray-600 mt-2 p-2 bg-white rounded">
                  <div className="font-mono">ID: {order.razorpayPaymentId}</div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </Card>

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
  );
}
