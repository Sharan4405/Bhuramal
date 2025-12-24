import mongoose from 'mongoose';

const ConversationSchema = new mongoose.Schema({
  user: { 
    type: String, 
    required: true, 
    unique: true,
    index: true
  },
  
  status: { 
    type: String, 
    enum: ['OPEN', 'RESOLVED'],
    default: 'OPEN'
  },
  
  lastMessageAt: { 
    type: Date, 
    default: Date.now,
    index: true
  },
  
  lastMessage: {
    type: String,
    default: ''
  },
  
  currentFlow: { 
    type: String, 
    enum: ['MENU', 'ORDER', 'TRACK', 'SUPPORT', null],
    default: null
  },
  
  // Legacy state field for backward compatibility with conversationStateService
  state: { type: String, default: null },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

export default mongoose.model('ConversationState', ConversationSchema);
