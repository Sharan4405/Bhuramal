import mongoose from 'mongoose';

const ConversationSchema = new mongoose.Schema({
  user: { 
    type: String, 
    required: true, 
    unique: true,
    index: true
  },
  // Legacy field for backward compatibility
  senderId: { type: String },
  
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
  
  currentFlow: { 
    type: String, 
    enum: ['MENU', 'ORDER', 'TRACK', 'SUPPORT', null],
    default: null
  },
  
  // Legacy state field for backward compatibility
  state: { type: String, default: null },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

// Ensure user field is set from senderId if not present
ConversationSchema.pre('save', function(next) {
  if (!this.user && this.senderId) {
    this.user = this.senderId;
  }
  next();
});

export default mongoose.model('ConversationState', ConversationSchema);
