import express from 'express';
import Message from '../models/Message.js';
import Conversation from '../models/conversation.model.js';
import { sendMessage } from '../utils/whatsapp.js';
import { requireAuth } from '../utils/auth.js';
import { notifyNewMessage } from '../services/socketService.js';

const router = express.Router();

// Send message from dashboard
router.post('/send', requireAuth, async (req, res) => {
  try {
    const { conversationId, text } = req.body;
    
    if (!conversationId || !text) {
      return res.status(400).json({ error: 'conversationId and text required' });
    }
    
    // Get conversation to find user phone number
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    // Save message to DB immediately
    const savedMessage = await Message.create({
      conversationId: conversation._id,
      user: conversation.user,
      text,
      direction: 'OUT',
      timestamp: new Date()
    });

    // Update conversation
    conversation.lastMessageAt = new Date();
    conversation.lastMessage = text;
    await conversation.save();

    // Notify dashboard in real-time immediately
    notifyNewMessage(conversation._id.toString(), {
      _id: savedMessage._id.toString(),
      conversationId: conversation._id,
      user: conversation.user,
      text,
      direction: 'OUT',
      timestamp: savedMessage.timestamp
    });

    // Send to WhatsApp in background (don't await)
    sendMessage(conversation.user, text).catch(err => {
      console.error('WhatsApp API error:', err.message);
    });
    
    // Respond immediately
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
