import axios from 'axios';

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

export async function sendMessage(to, text) {
  if (!checkCredentials()) {
    return;
  }

  const body = {
    messaging_product: 'whatsapp',
    to,
    text: { body: text }
  };

  return makeWhatsAppRequest(body, 'sendMessage');
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

  return makeWhatsAppRequest(buildInteractiveBody(to, interactive), 'sendButtonMessage');
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

  return makeWhatsAppRequest(buildInteractiveBody(to, interactive), 'sendListMessage');
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

  return makeWhatsAppRequest(buildInteractiveBody(to, interactive), 'sendUrlButton');
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

  return makeWhatsAppRequest(body, 'sendLocation');
}
