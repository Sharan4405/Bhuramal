import Message from "../models/Message.js";
import Conversation from "../models/conversation.model.js";
import { sendMessage } from "../utils/whatsapp.js";
import { notifyNewMessage } from "../services/socketService.js";

/**
 * Send message from dashboard to user via WhatsApp
 */
export async function sendMessageToUser(req, res) {
  const totalStart = Date.now();

  try {
    const { conversationId, text } = req.body;

    if (!conversationId || !text) {
      return res
        .status(400)
        .json({ error: "conversationId and text required" });
    }

    // Fetch Conversation
    const conversationStart = Date.now();
    const conversation = await Conversation.findById(conversationId);
    // console.log("Conversation Fetch:", Date.now() - conversationStart, "ms");

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    // Save Message
    const saveStart = Date.now();
    const savedMessage = await Message.create({
      conversationId: conversation._id,
      user: conversation.user,
      text,
      isManualMode: true,
      direction: "OUT",
      timestamp: new Date(),
      status: "sending",
    });
    // console.log("Message Save:", Date.now() - saveStart, "ms");

    // Update Conversation
    const updateStart = Date.now();
    conversation.lastMessageAt = new Date();
    conversation.lastMessage = text;
    await conversation.save();
    // console.log("Conversation Update:", Date.now() - updateStart, "ms");

    // Notify Dashboard
    notifyNewMessage(conversation._id.toString(), {
      _id: savedMessage._id.toString(),
      conversationId: conversation._id,
      user: conversation.user,
      text,
      direction: "OUT",
      timestamp: savedMessage.timestamp,
      status: "sending",
    });

    // WhatsApp API
    const whatsappStart = Date.now();
    const whatsappResult = await sendMessage(conversation.user, text, false);
    // console.log("WhatsApp API:", Date.now() - whatsappStart, "ms");

    // Update Status
    if (whatsappResult?.messages?.[0]?.id) {
      const statusStart = Date.now();

      savedMessage.whatsappMessageId = whatsappResult.messages[0].id;
      savedMessage.status = "sent";
      await savedMessage.save();

      // console.log("Status Update:", Date.now() - statusStart, "ms");

      notifyNewMessage(conversation._id.toString(), {
        _id: savedMessage._id.toString(),
        status: "sent",
        type: "status_update",
      });
    }

    // console.log("✅ Total Time:", Date.now() - totalStart, "ms");

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    // console.log("❌ Failed After:", Date.now() - totalStart, "ms");
    res.status(500).json({ error: error.message });
  }
}
