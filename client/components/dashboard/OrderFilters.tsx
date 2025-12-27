import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', icon: '⏱️' },
  { value: 'confirmed', label: 'Confirmed', icon: '✓' },
  { value: 'processing', label: 'Processing', icon: '⚙️' },
  { value: 'shipped', label: 'Shipped', icon: '📦' },
  { value: 'delivery', label: 'Out for Delivery', icon: '🚚' },
  { value: 'delivered', label: 'Delivered', icon: '✅' },
  { value: 'cancelled', label: 'Cancelled', icon: '❌' }
];

interface OrderFiltersProps {
  searchTerm: string;
  statusFilter: string;
  paymentFilter: string;
  showFilters: boolean;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onPaymentChange: (value: string) => void;
  onToggleFilters: () => void;
  onRefresh: () => void;
}

export function OrderFilters({
  searchTerm,
  statusFilter,
  paymentFilter,
  showFilters,
  onSearchChange,
  onStatusChange,
  onPaymentChange,
  onToggleFilters,
  onRefresh
}: OrderFiltersProps) {
  return (
    <>
      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <Input
            placeholder="Search by Order ID, Name, Phone..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Filter Toggle Button (Mobile) */}
      <button
        onClick={onToggleFilters}
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
            onChange={(e) => onStatusChange(e.target.value)}
          >
            <option value="">All Status</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status.value} value={status.value}>{status.icon} {status.label}</option>
            ))}
          </select>

          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[rgb(var(--orange))] focus:ring-2 focus:ring-[rgb(var(--orange))]/20"
            value={paymentFilter}
            onChange={(e) => onPaymentChange(e.target.value)}
          >
            <option value="">All Payment Status</option>
            <option value="pending">⏳ Pending</option>
            <option value="initiated">🔄 Initiated</option>
            <option value="completed">✓ Completed</option>
            <option value="failed">✗ Failed</option>
          </select>

          <button onClick={onRefresh} className="md:col-span-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors">
            Refresh
          </button>
        </div>
      </Card>
    </>
  );
}
