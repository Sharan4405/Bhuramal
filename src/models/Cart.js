import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  weight: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 1
  },
  unitPrice: {
    type: Number,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  }
}, { _id: false });

const cartSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  items: [cartItemSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    index: { expires: 0 } // TTL index - cart expires after this date
  }
});

// Update the updatedAt timestamp before saving
cartSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;
