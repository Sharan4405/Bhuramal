import mongoose from 'mongoose';

const ConversationSchema = new mongoose.Schema({
  senderId: { type: String, required: true, unique: true },
  state: { type: String, default: null },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

export default mongoose.model('ConversationState', ConversationSchema);
