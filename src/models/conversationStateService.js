import mongoose from 'mongoose';
import ConversationModel from './conversation.model.js';
import Message from './Message.js';

// Configuration - exported for consistency
export const ACTIVE_SESSION_TIMEOUT = 6 * 60 * 60 * 1000; // 6 hours (360 minutes)
export const DATABASE_CLEANUP_DAYS = 30; // Delete after 30 days
export const MESSAGE_CLEANUP_DAYS = 30; // Delete messages after 30 days
export const CLEANUP_INTERVAL = 5 * 24 * 60 * 60 * 1000; // Run cleanup every 5 days

const mem = new Map();

function usingDb() {
  return mongoose.connection && mongoose.connection.readyState === 1;
}

export async function getState(senderId, includeMetadata = false) {
  if (usingDb()) {
    const doc = await ConversationModel.findOne({ user: senderId }).lean().exec();
    if (!doc) return null;

    // Check if state expired (3 hours for active sessions)
    const now = Date.now();
    const updatedAt = new Date(doc.updatedAt).getTime();
    const elapsed = now - updatedAt;

    if (elapsed > ACTIVE_SESSION_TIMEOUT) {
      // Expired, delete it and return 'expired' marker
      await ConversationModel.deleteOne({ user: senderId }).exec();
      return includeMetadata ? { state: null, expired: true, metadata: {} } : null;
    }

    return includeMetadata ? { state: doc.state, metadata: doc.metadata || {}, expired: false } : doc.state;
  }

  // In-memory fallback with timeout check
  const entry = mem.get(senderId);
  if (!entry) return null;

  const elapsed = Date.now() - entry.timestamp;
  if (elapsed > ACTIVE_SESSION_TIMEOUT) {
    mem.delete(senderId);
    return includeMetadata ? { state: null, expired: true, metadata: {} } : null;
  }

  return includeMetadata ? { state: entry.state, metadata: entry.metadata || {}, expired: false } : entry.state;
}

export async function setState(senderId, value, metadata = {}) {
  if (usingDb()) {
    await ConversationModel.findOneAndUpdate(
      { user: senderId },
      { 
        state: value, 
        metadata,
        lastMessageAt: new Date() // Update timestamp when state changes
      },
      { upsert: true, new: true }
    ).exec();
    return;
  }
  
  // In-memory store with timestamp and metadata
  mem.set(senderId, {
    state: value,
    metadata,
    timestamp: Date.now()
  });
}

export async function clearState(senderId) {
  if (usingDb()) {
    await ConversationModel.deleteOne({ user: senderId }).exec();
    return;
  }
  mem.delete(senderId);
}

// Cleanup old records from database (run periodically)
export async function cleanupOldStates() {
  if (!usingDb()) return;

  const cutoffDate = new Date(Date.now() - (DATABASE_CLEANUP_DAYS * 24 * 60 * 60 * 1000));
  const messageCutoffDate = new Date(Date.now() - (MESSAGE_CLEANUP_DAYS * 24 * 60 * 60 * 1000));
  
  try {
    // Cleanup old conversation states
    const statesDeleted = await ConversationModel.deleteMany({
      updatedAt: { $lt: cutoffDate }
    }).exec();
    
    // Cleanup old messages
    const messagesDeleted = await Message.deleteMany({
      createdAt: { $lt: messageCutoffDate }
    }).exec();
    
    if (statesDeleted.deletedCount > 0 || messagesDeleted.deletedCount > 0) {
      console.log(`🧹 Cleanup complete: ${statesDeleted.deletedCount} states, ${messagesDeleted.deletedCount} messages deleted`);
    }
  } catch (error) {
    console.error('Error cleaning up old data:', error);
  }
}

export default {
  getState,
  setState,
  clearState,
  cleanupOldStates
};
