import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ConversationState',
    required: true,
    index: true
  },
  user: { 
    type: String, 
    required: true,
    index: true
  },
  text: { 
    type: String, 
    required: true 
  },
  messageTitle: {
    type: String,
    default: null // Title for automated messages (e.g., 'Payment Confirmation', 'Address Input')
  },
  isManualMode: {
    type: Boolean,
    default: false // True if message was sent/received in manual support mode
  },
  direction: { 
    type: String, 
    enum: ['IN', 'OUT'],
    required: true 
  },
  timestamp: { 
    type: Date, 
    default: Date.now,
    index: true
  },
  // WhatsApp message status tracking
  whatsappMessageId: {
    type: String,
    default: null,
    index: true // For quick lookup when status updates arrive
  },
  status: {
    type: String,
    enum: ['sending', 'sent', 'delivered', 'read', 'failed'],
    default: 'sent' // Default for incoming messages and manual sends
  }
}, { timestamps: true });

// Compound indexes for efficient queries
MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ user: 1, timestamp: -1 });

export default mongoose.model('Message', MessageSchema);
