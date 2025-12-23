import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  user: { 
    type: String, 
    required: true,
    index: true  // Index for faster queries
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
    index: true  // Index for faster sorting
  }
}, { timestamps: true });

// Compound index for efficient queries by user and time
MessageSchema.index({ user: 1, timestamp: -1 });

export default mongoose.model('Message', MessageSchema);
