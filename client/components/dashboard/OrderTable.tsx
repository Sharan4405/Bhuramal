import { Badge } from '@/components/ui/Badge';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: 'gray', icon: '⏱️' },
  { value: 'confirmed', label: 'Confirmed', color: 'blue', icon: '✓' },
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

interface OrderTableProps {
  orders: Order[];
  onView: (order: Order) => void;
  getStatusBadgeVariant: (status: string) => BadgeVariant | undefined;
  getPaymentStatusColor: (status: string) => BadgeVariant | undefined;
}

export function OrderTable({ orders, onView, getStatusBadgeVariant, getPaymentStatusColor }: OrderTableProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
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
            {orders.map((order) => {
              const statusInfo = STATUS_OPTIONS.find(s => s.value === order.status);
              
              return (
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
                      {statusInfo?.icon} {statusInfo?.label}
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
                      onClick={() => onView(order)}
                      className="text-sm px-3 py-1.5 text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-lg transition-all font-medium shadow-sm"
                    >
                      View
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
