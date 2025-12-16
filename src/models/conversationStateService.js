import mongoose from 'mongoose';
import ConversationModel from './conversation.model.js';

// Configuration - exported for consistency
export const ACTIVE_SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
export const DATABASE_CLEANUP_DAYS = 10; // Delete after 10 days
export const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // Run cleanup every 24 hours

const mem = new Map();

function usingDb() {
  return mongoose.connection && mongoose.connection.readyState === 1;
}

export async function getState(senderId, includeMetadata = false) {
  if (usingDb()) {
    const doc = await ConversationModel.findOne({ senderId }).lean().exec();
    if (!doc) return null;

    // Check if state expired (30 min for active sessions)
    const now = Date.now();
    const updatedAt = new Date(doc.updatedAt).getTime();
    const elapsed = now - updatedAt;

    if (elapsed > ACTIVE_SESSION_TIMEOUT) {
      // Expired, delete it
      await ConversationModel.deleteOne({ senderId }).exec();
      return null;
    }

    return includeMetadata ? doc : doc.state;
  }

  // In-memory fallback with timeout check
  const entry = mem.get(senderId);
  if (!entry) return null;

  const elapsed = Date.now() - entry.timestamp;
  if (elapsed > ACTIVE_SESSION_TIMEOUT) {
    mem.delete(senderId);
    return null;
  }

  return includeMetadata ? entry : entry.state;
}

export async function setState(senderId, value, metadata = {}) {
  if (usingDb()) {
    await ConversationModel.findOneAndUpdate(
      { senderId },
      { state: value, metadata },
      { upsert: true, new: true }
    ).exec();
    return;
  }
  
  // In-memory store with timestamp
  mem.set(senderId, {
    state: value,
    timestamp: Date.now()
  });
}

export async function clearState(senderId) {
  if (usingDb()) {
    await ConversationModel.deleteOne({ senderId }).exec();
    return;
  }
  mem.delete(senderId);
}

// Cleanup old records from database (run periodically)
export async function cleanupOldStates() {
  if (!usingDb()) return;

  const cutoffDate = new Date(Date.now() - (DATABASE_CLEANUP_DAYS * 24 * 60 * 60 * 1000));
  
  try {
    const result = await ConversationModel.deleteMany({
      updatedAt: { $lt: cutoffDate }
    }).exec();
    
    if (result.deletedCount > 0) {
      console.log(`🗑️  Cleaned up ${result.deletedCount} old conversation states (older than ${DATABASE_CLEANUP_DAYS} days)`);
    }
  } catch (error) {
    console.error('Error cleaning up old states:', error);
  }
}

export default {
  getState,
  setState,
  clearState,
  cleanupOldStates
};
