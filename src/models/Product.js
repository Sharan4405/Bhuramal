import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  weight: {
    type: mongoose.Schema.Types.Mixed, // Can be number or string like "500"
    required: true
  },
  unit: {
    type: String,
    required: true,
    trim: true,
    default: 'gm'
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  inStock: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Compound index for category + name queries
productSchema.index({ category: 1, name: 1 });

// Index for search functionality
productSchema.index({ name: 'text', category: 'text' });

const Product = mongoose.model('Product', productSchema);

export default Product;
