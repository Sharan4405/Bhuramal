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
  direction: { 
    type: String, 
    enum: ['IN', 'OUT'],
    required: true 
  },
  timestamp: { 
    type: Date, 
    default: Date.now,
    index: true
  }
}, { timestamps: true });

// Compound indexes for efficient queries
MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ user: 1, timestamp: -1 });

export default mongoose.model('Message', MessageSchema);
