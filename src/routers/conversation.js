import express from 'express';
import Conversation from '../models/conversation.model.js';
import Message from '../models/Message.js';
import { requireAuth } from '../utils/auth.js';

const router = express.Router();

// Get all conversations (paginated)
router.get('/', requireAuth, async (req, res) => {
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
});

// Get messages for a conversation
router.get('/:id/messages', requireAuth, async (req, res) => {
  try {
    const conversationId = req.params.id;
    const limit = parseInt(req.query.limit) || 50;
    
    const messages = await Message.find({ conversationId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    
    res.json({ messages: messages.reverse() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Resolve conversation
router.patch('/:id/resolve', requireAuth, async (req, res) => {
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
});

// Reopen conversation
router.patch('/:id/reopen', requireAuth, async (req, res) => {
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
});

export default router;
