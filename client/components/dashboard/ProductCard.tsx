import { Badge } from '@/components/ui/Badge';

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

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}

export function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
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
          onClick={() => onEdit(product)}
          className="flex-1 px-4 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-colors"
        >
          Edit
        </button>
        <button 
          onClick={() => onDelete(product._id)}
          className="flex-1 px-4 py-2 text-sm bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
