import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
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
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
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
  timestamps: false
});

// Indexes for better query performance
orderSchema.index({ phoneNumber: 1 });
orderSchema.index({ orderDate: -1 });
orderSchema.index({ status: 1 });



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