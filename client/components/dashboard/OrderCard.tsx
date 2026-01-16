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

interface Order {
  _id: string;
  orderId: string;
  customerName: string;
  phoneNumber: string;
  totalItems: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  orderDate: string;
}

type BadgeVariant = 'gray' | 'blue' | 'yellow' | 'purple' | 'indigo' | 'success' | 'error' | 'warning';

interface OrderCardProps {
  order: Order;
  onView: (order: Order) => void;
  getStatusBadgeVariant: (status: string) => BadgeVariant | undefined;
  getPaymentStatusColor: (status: string) => BadgeVariant | undefined;
}

export function OrderCard({ order, onView, getStatusBadgeVariant, getPaymentStatusColor }: OrderCardProps) {
  const statusInfo = STATUS_OPTIONS.find(s => s.value === order.status);

  return (
    <Card 
      className="p-4 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onView(order)}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="font-mono text-sm font-bold text-gray-900">{order.orderId}</div>
          <div className="text-sm text-gray-600 mt-1">{order.orderDate}</div>
        </div>
        <Badge variant={getStatusBadgeVariant(order.status)}>
          {statusInfo?.icon} {statusInfo?.label}
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
  );
}
