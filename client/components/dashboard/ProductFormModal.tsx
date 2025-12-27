import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

interface ProductFormModalProps {
  isOpen: boolean;
  isEditing: boolean;
  formData: {
    name: string;
    category: string;
    weight: string;
    unit: string;
    price: string;
    inStock: boolean;
  };
  categories: string[];
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  onChange: (field: string, value: any) => void;
}

export function ProductFormModal({
  isOpen,
  isEditing,
  formData,
  categories,
  onSubmit,
  onCancel,
  onChange
}: ProductFormModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
      <Card className="w-full md:max-w-2xl md:rounded-xl rounded-t-2xl rounded-b-none md:rounded-b-xl p-6 max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button 
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block mb-2 font-medium text-gray-700">Product Name *</label>
            <Input
              required
              value={formData.name}
              onChange={(e) => onChange('name', e.target.value)}
              placeholder="e.g., Basmati Rice"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium text-gray-700">Category *</label>
            <Input
              required
              value={formData.category}
              onChange={(e) => onChange('category', e.target.value)}
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
                onChange={(e) => onChange('weight', e.target.value)}
                placeholder="500"
              />
            </div>
            <div>
              <label className="block mb-2 font-medium text-gray-700">Unit *</label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[rgb(var(--orange))] focus:ring-2 focus:ring-[rgb(var(--orange))]/20"
                value={formData.unit}
                onChange={(e) => onChange('unit', e.target.value)}
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
              onChange={(e) => onChange('price', e.target.value)}
              placeholder="299"
            />
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="inStock"
              checked={formData.inStock}
              onChange={(e) => onChange('inStock', e.target.checked)}
              className="w-5 h-5 text-[rgb(var(--orange))] rounded focus:ring-[rgb(var(--orange))]"
            />
            <label htmlFor="inStock" className="font-medium text-gray-700 cursor-pointer">
              Product is in stock
            </label>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
            <button 
              type="button" 
              onClick={onCancel} 
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="flex-1 btn-primary"
            >
              {isEditing ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </form>
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
