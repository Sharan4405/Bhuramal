import axios from 'axios';
import Message from '../models/Message.js';
import Conversation from '../models/conversation.model.js';
import { notifyNewMessage } from '../services/socketService.js';

const API_VERSION = process.env.WHATSAPP_API_VERSION || 'v22.0';
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const TOKEN = process.env.WHATSAPP_TOKEN;

// Common URL for all WhatsApp API calls
const API_URL = `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`;

// Common headers for all requests
const API_HEADERS = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${TOKEN}`
};

if (!PHONE_NUMBER_ID || !TOKEN) {
  console.warn('WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_TOKEN not set. sendMessage will fail until they are provided.');
}

// Helper function to check credentials
function checkCredentials() {
  return PHONE_NUMBER_ID && TOKEN;
}

// Helper function to make WhatsApp API calls
async function makeWhatsAppRequest(body, functionName) {
  try {
    const res = await axios.post(API_URL, body, { headers: API_HEADERS });
    console.log(`WhatsApp ${functionName} response:`, res.data);
    return res.data;
  } catch (err) {
    console.error(`Error sending WhatsApp ${functionName}`, err?.response?.data || err.message);
    throw err;
  }
}

// Mark message as read (sends blue tick to customer)
export async function markMessageAsRead(messageId) {
  if (!checkCredentials()) {
    return;
  }

  const body = {
    messaging_product: 'whatsapp',
    status: 'read',
    message_id: messageId
  };

  try {
    const res = await axios.post(API_URL, body, { headers: API_HEADERS });
    console.log(`✓ Message ${messageId} marked as read (customer will see blue tick)`);
    return res.data;
  } catch (err) {
    console.error('Error marking message as read:', err?.response?.data || err.message);
    throw err;
  }
}

// Helper function to add header and footer to interactive messages
function addHeaderFooter(interactive, headerText, footerText) {
  if (headerText) {
    interactive.header = { type: "text", text: headerText };
  }
  if (footerText) {
    interactive.footer = { text: footerText };
  }
  return interactive;
}

// Helper function to build message body for interactive messages
function buildInteractiveBody(to, interactive) {
  return {
    messaging_product: 'whatsapp',
    to,
    type: "interactive",
    interactive
  };
}

// Helper to generate message title from text
function getMessageTitle(text) {
  const lowerText = text.toLowerCase();
  
  // Payment related
  if (lowerText.includes('payment successful')) return 'Payment Confirmation';
  if (lowerText.includes('payment required') || lowerText.includes('proceed to payment')) return 'Payment Request';
  if (lowerText.includes('payment failed')) return 'Payment Failed';
  
  // Order related
  if (lowerText.includes('order summary')) return 'Order Summary';
  if (lowerText.includes('order status')) return 'Order Status';
  if (lowerText.includes('track order')) return 'Order Tracking';
  
  // Address and delivery
  if (lowerText.includes('delivery address')) return 'Address Input';
  if (lowerText.includes('store address') || lowerText.includes('location')) return 'Store Location';
  
  // Cart
  if (lowerText.includes('cart')) return 'Cart Information';
  if (lowerText.includes('added') && lowerText.includes('to cart')) return 'Item Added';
  
  // Menu and navigation
  if (lowerText.includes('main menu') || lowerText.includes('what can i help')) return 'Main Menu';
  if (lowerText.includes('select a category') || lowerText.includes('place your order')) return 'Category Selection';
  if (lowerText.includes('select an item')) return 'Item Selection';
  if (lowerText.includes('select quantity')) return 'Quantity Selection';
  
  // Support
  if (lowerText.includes('support') && lowerText.includes('queries')) return 'Support Menu';
  if (lowerText.includes('connected with our support')) return 'Manual Support';
  
  // Welcome
  if (lowerText.includes('welcome to')) return 'Welcome Message';
  
  // Errors
  if (lowerText.includes('error')) return 'Error Message';
  if (lowerText.includes('session expired')) return 'Session Expired';
  
  return 'Bot Message'; // Default
}

// 💾 Helper to save outgoing message
async function saveOutgoingMessage(to, text, isManualMode = false, whatsappMessageId = null) {
  try {
    // Find or create conversation
    let conversation = await Conversation.findOne({ user: to });
    const messageTitle = isManualMode ? null : getMessageTitle(text);
    const displayText = isManualMode ? text : messageTitle;
    
    if (!conversation) {
      conversation = await Conversation.create({
        user: to,
        status: 'RESOLVED', // Start as resolved
        lastMessageAt: new Date(),
        lastMessage: displayText
      });
    } else {
      conversation.lastMessageAt = new Date();
      conversation.lastMessage = displayText;
      await conversation.save();
    }
    
    // Save ALL outgoing messages to display in dashboard
    const savedMessage = await Message.create({
      conversationId: conversation._id,
      user: to,
      text,
      messageTitle: isManualMode ? null : messageTitle,
      isManualMode,
      direction: 'OUT',
      timestamp: new Date(),
      whatsappMessageId, // Store WhatsApp message ID for status tracking
      status: 'sending' // Initial status
    });

    // Notify dashboard in real-time
    notifyNewMessage(conversation._id.toString(), {
      _id: savedMessage._id.toString(),
      conversationId: conversation._id,
      user: to,
      text,
      messageTitle: savedMessage.messageTitle,
      direction: 'OUT',
      timestamp: savedMessage.timestamp,
      status: 'sending'
    });
    
    return savedMessage; // Return the saved message
  } catch (err) {
    console.error('Error saving outgoing message:', err.message);
    return null;
  }
}

export async function sendMessage(to, text, saveToDb = true) {
  if (!checkCredentials()) {
    return;
  }

  const body = {
    messaging_product: 'whatsapp',
    to,
    text: { body: text }
  };

  const result = await makeWhatsAppRequest(body, 'sendMessage');
  
  // Only save to DB if explicitly requested (for automated bot messages)
  // Manual admin messages are saved by messageController before calling this
  if (result && saveToDb) {
    const whatsappMessageId = result.messages?.[0]?.id;
    await saveOutgoingMessage(to, text, false, whatsappMessageId); // Save as automated message
  }
  
  return result;
}

// Send interactive button message (up to 3 buttons)
export async function sendButtonMessage(to, bodyText, buttons, headerText = null, footerText = null) {
  if (!checkCredentials()) {
    return;
  }

  const interactive = addHeaderFooter({
    type: "button",
    body: { text: bodyText },
    action: {
      buttons: buttons.map((btn, index) => ({
        type: "reply",
        reply: {
          id: btn.id || `btn_${index}`,
          title: btn.title
        }
      }))
    }
  }, headerText, footerText);

  const result = await makeWhatsAppRequest(buildInteractiveBody(to, interactive), 'sendButtonMessage');
  
  if (result) {
    const whatsappMessageId = result.messages?.[0]?.id;
    await saveOutgoingMessage(to, bodyText, false, whatsappMessageId); // Save as automated message
  }
  
  return result;
}

// Send interactive list message (up to 10 items per section, 10 sections max)
export async function sendListMessage(to, bodyText, sections, buttonText = "View Options", headerText = null, footerText = null) {
  if (!checkCredentials()) {
    return;
  }

  const interactive = addHeaderFooter({
    type: "list",
    body: { text: bodyText },
    action: {
      button: buttonText,
      sections: sections.map(section => ({
        title: section.title,
        rows: section.rows.map(row => ({
          id: row.id,
          title: row.title,
          description: row.description || ""
        }))
      }))
    }
  }, headerText, footerText);

  const result = await makeWhatsAppRequest(buildInteractiveBody(to, interactive), 'sendListMessage');
  
  if (result) {
    const whatsappMessageId = result.messages?.[0]?.id;
    await saveOutgoingMessage(to, bodyText, false, whatsappMessageId); // Save as automated message
  }
  
  return result;
}

// Send message with URL button (Call-to-Action button)
export async function sendUrlButton(to, bodyText, buttonText, url, headerText = null, footerText = null) {
  if (!checkCredentials()) {
    return;
  }

  const interactive = addHeaderFooter({
    type: "cta_url",
    body: { text: bodyText },
    action: {
      name: "cta_url",
      parameters: {
        display_text: buttonText,
        url: url
      }
    }
  }, headerText, footerText);

  const result = await makeWhatsAppRequest(buildInteractiveBody(to, interactive), 'sendUrlButton');
  
  if (result) {
    const whatsappMessageId = result.messages?.[0]?.id;
    await saveOutgoingMessage(to, bodyText, false, whatsappMessageId); // Save as automated message
  }
  
  return result;
}

// Send native WhatsApp location (requires latitude and longitude)
export async function sendLocation(to, latitude, longitude, name = null, address = null) {
  if (!checkCredentials()) {
    return;
  }

  const body = {
    messaging_product: 'whatsapp',
    to,
    type: 'location',
    location: {
      latitude: Number(latitude),
      longitude: Number(longitude),
      name: name || undefined,
      address: address || undefined
    }
  };

  const result = await makeWhatsAppRequest(body, 'sendLocation');
  
  if (result) {
    await saveOutgoingMessage(to, `📍 Location: ${name || address || 'Shared location'}`);
  }
  
  return result;
}
