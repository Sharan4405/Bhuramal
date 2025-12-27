import { Card } from '@/components/ui/Card';

interface OrderStatsProps {
  stats: {
    totalOrders: number;
    totalRevenue: number;
    statusCounts: Record<string, number>;
  } | null;
}

export function OrderStats({ stats }: OrderStatsProps) {
  if (!stats) return null;

  return (
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
  );
}
