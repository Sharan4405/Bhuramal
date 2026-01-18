import Message from '../models/Message.js';
import Conversation from '../models/conversation.model.js';
import { sendMessage } from '../utils/whatsapp.js';
import { notifyNewMessage } from '../services/socketService.js';

/**
 * Send message from dashboard to user via WhatsApp
 */
export async function sendMessageToUser(req, res) {
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
    
    // Save message to DB immediately with isManualMode: true (admin messages are manual)
    const savedMessage = await Message.create({
      conversationId: conversation._id,
      user: conversation.user,
      text,
      isManualMode: true,
      direction: 'OUT',
      timestamp: new Date(),
      status: 'sending' // Initial status
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
      timestamp: savedMessage.timestamp,
      status: 'sending'
    });

    // Send to WhatsApp and get message ID
    const whatsappResult = await sendMessage(conversation.user, text, false);
    
    // Update message with WhatsApp message ID for status tracking
    if (whatsappResult?.messages?.[0]?.id) {
      savedMessage.whatsappMessageId = whatsappResult.messages[0].id;
      savedMessage.status = 'sent';
      await savedMessage.save();
      
      // Notify status update
      notifyNewMessage(conversation._id.toString(), {
        _id: savedMessage._id.toString(),
        status: 'sent',
        type: 'status_update'
      });
    }
    
    // Respond immediately
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
