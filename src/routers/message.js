import express from 'express';
import Message from '../models/Message.js';
import Conversation from '../models/conversation.model.js';
import { sendMessage } from '../utils/whatsapp.js';
import { requireAuth } from '../utils/auth.js';

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
    
    // Send via WhatsApp (this will auto-save the message)
    await sendMessage(conversation.user, text);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
