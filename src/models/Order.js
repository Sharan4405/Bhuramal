import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  // Short readable Order ID
  orderId: { type: String, unique: true, required: true },
  
  // Customer Information
  customerName: { type: String, required: true, trim: true },
  phoneNumber: { type: String, required: true, trim: true },
  fullAddress: { type: String, required: true, trim: true },
  // Order Information
  items: [{
    name: { type: String, required: true },
    weight: { type: String, required: true },
    unit: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true }
  }],
  // Order Summary
  totalItems: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  
  // Order Status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivery', 'delivered', 'cancelled'],
    default: 'pending'
  },
  orderDate: { 
    type: String,
    default: () => {
      // Indian Standard Time date only (YYYY-MM-DD)
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      const istDate = new Date(now.getTime() + istOffset);
      return istDate.toISOString().split('T')[0]; // Returns only date: 2025-11-12
    }
  },
  
  // Payment Information
  paymentStatus: {
    type: String,
    enum: ['pending', 'initiated', 'completed', 'failed'],
    default: 'pending'
  },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
  paymentLink: { type: String }
}, {
  timestamps: true // Stores in UTC, convert to IST when displaying
});

// Indexes for better query performance (orderId already indexed by unique:true)
orderSchema.index({ phoneNumber: 1 });
orderSchema.index({ orderDate: -1 });
orderSchema.index({ status: 1 });

// Static method to generate short Order ID
orderSchema.statics.generateOrderId = async function() {
  // Format: BBP-YYMMDD-XXXXX (e.g., BBP-251218-00001)
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + istOffset);
  
  const year = istDate.getFullYear().toString().slice(-2);
  const month = String(istDate.getMonth() + 1).padStart(2, '0');
  const day = String(istDate.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  
  // Find today's order count
  const todayStart = istDate.toISOString().split('T')[0];
  const todayOrdersCount = await this.countDocuments({
    orderDate: todayStart
  });
  
  const sequence = String(todayOrdersCount + 1).padStart(5, '0');
  return `BBP-${dateStr}-${sequence}`;
};

// Middleware to ensure updatedAt is always updated on findOneAndUpdate, updateOne, etc.
orderSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

orderSchema.pre('updateOne', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

orderSchema.pre('updateMany', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

// Instance methods
orderSchema.methods.addItem = function(item) {
  this.items.push(item);
  this.recalculateTotals();
};

orderSchema.methods.recalculateTotals = function() {
  this.totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
  this.totalAmount = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
};

// Static methods
orderSchema.statics.findByPhoneNumber = function(phoneNumber) {
  return this.find({ phoneNumber }).sort({ orderDate: -1 });
};

orderSchema.statics.findPendingOrders = function() {
  return this.find({ status: 'pending' }).sort({ orderDate: -1 });
};

const Order = mongoose.model('Order', orderSchema);

export default Order;