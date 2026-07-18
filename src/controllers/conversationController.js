import Conversation from '../models/conversation.model.js';
import Message from '../models/Message.js';
import { markMessageAsRead } from '../utils/whatsapp.js';

/**
 * Get all conversations (paginated)
 */
export async function getConversations(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status; // OPEN or RESOLVED
    
    const query = status ? { status } : {};
    
    const conversations = await Conversation.find(query)
      .sort({ lastMessageAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();
    
    const total = await Conversation.countDocuments(query);
    
    res.json({
      conversations,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get messages for a conversation
 */
export async function getMessages(req, res) {
  try {
    const conversationId = req.params.id;
    const limit = parseInt(req.query.limit) || 50;
    
    const messages = await Message.find({ conversationId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    
    // Mark all incoming messages as read so customer sees blue ticks
    const unreadIncomingMessages = messages.filter(
      msg => msg.direction === 'IN' && msg.whatsappMessageId
    );
    
    // Mark messages as read in background (don't await)
    unreadIncomingMessages.forEach(msg => {
      markMessageAsRead(msg.whatsappMessageId).catch(err => {
        console.error(`Failed to mark message ${msg.whatsappMessageId} as read:`, err.message);
      });
    });
    
    res.json({ messages: messages.reverse() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Resolve conversation
 */
export async function resolveConversation(req, res) {
  try {
    const conversation = await Conversation.findByIdAndUpdate(
      req.params.id,
      { status: 'RESOLVED' },
      { new: true }
    );
    
    res.json({ conversation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Reopen conversation
 */
export async function reopenConversation(req, res) {
  try {
    const conversation = await Conversation.findByIdAndUpdate(
      req.params.id,
      { status: 'OPEN' },
      { new: true }
    );
    
    res.json({ conversation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
