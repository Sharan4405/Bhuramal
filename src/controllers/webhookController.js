import crypto from "crypto";
import {
  sendMessage,
  sendButtonMessage,
  sendListMessage,
  sendUrlButton,
} from "../utils/whatsapp.js";
import conversation from "../models/conversationStateService.js";
import * as catalog from "../services/catalogService.js";
import Order from "../models/Order.js";
import Message from "../models/Message.js";
import Conversation from "../models/conversation.model.js";
import { createPaymentLink } from "../services/paymentService.js";
import cartService from "../services/cartService.js";
import { notifyNewMessage } from "../services/socketService.js";
import { calculatePrice, getPriceBreakdown } from "../utils/priceCalculator.js";
import User from "../models/User.model.js";
import { error } from "console";
// Main menu configuration
const MAIN_MENU = {
  buttons: [
    { id: "orders", title: "🛒 Order Now" },
    { id: "view_cart", title: "🛒 View Cart" },
    { id: "support", title: "💬 Support & Queries" },
  ],
  footer: ' Main Menu par aane ke liye "menu" type karein.',
};

// Support menu configuration
const SUPPORT_MENU = {
  buttons: [
    { id: "track_order", title: "📦 Track Order" },
    { id: "view_address", title: "📍 View Address" },
    { id: "contact_team", title: "👨‍💼 Contact Team" },
  ],
};

// Store location/address
const STORE_ADDRESS =
  process.env.STORE_ADDRESS ||
  "Purana Thana, Shop No. SL-2, Opp Pillar No 56, Sodala, Ajmer Rd, Sodhala, Jaipur, Rajasthan 302019";
const STORE_LAT = process.env.STORE_LATITUDE
  ? parseFloat(process.env.STORE_LATITUDE)
  : null;
const STORE_LNG = process.env.STORE_LONGITUDE
  ? parseFloat(process.env.STORE_LONGITUDE)
  : null;
const STORE_MAPS_QUERY = process.env.STORE_MAPS_QUERY
  ? process.env.STORE_MAPS_QUERY.trim()
  : null;
const STORE_MAPS_LINK = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(STORE_ADDRESS)}`;

// 🔧 Helper to navigate to menu (reusable)
async function navigateToMenu(from, userName = null) {
  await conversation.setState(from, "menu");
  await showMainMenu(from, userName);
}

// helper to check address validation

function validateAddress(address) {
  const errors = [];

  const value = address.trim();

  // Minimum length
  if (value.length < 20) {
    errors.push("Address is too short.");
  }

  // House / Flat / Plot Number
  if (!/\d/.test(value)) {
    errors.push("House / Flat / Plot Number is missing.");
  }

  // PIN Code
  if (!/\b\d{6}\b/.test(value)) {
    errors.push("6-digit PIN Code is missing.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
// 🔧 Helper to navigate to manual support (reusable)
async function navigateToSupport(from) {
  await conversation.setState(from, "support_menu");
  await sendButtonMessage(
    from,
    "💬 *Support & Queries*\n\nBatayein, aapko kis cheez mein madad chahiye?",
    SUPPORT_MENU.buttons,
  );
}

// 🔧 Helper to send store location (reusable)
async function sendStoreLocation(from) {
  const mapsLink = STORE_MAPS_QUERY
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(STORE_MAPS_QUERY)}`
    : Number.isFinite(STORE_LAT) && Number.isFinite(STORE_LNG)
      ? `https://www.google.com/maps/search/?api=1&query=${STORE_LAT},${STORE_LNG}`
      : STORE_MAPS_LINK;

  await sendUrlButton(
    from,
    `📍 *Store ka Address*\n${STORE_ADDRESS}\n\nNeeche button se Google Maps par location dekh sakte hain.`,
    "View Location",
    mapsLink,
    "📍 Location",
  );
  await sendButtonMessage(
    from,
    "Aur agar aap main menu par wapas jana chahte hain to neeche diye gaye button ka use karein.",
    [
      {
        id: "main_menu",
        title: "🏠 Main Menu",
      },
    ],
  );
}

// Helper to send main menu
async function showMainMenu(from, userName = null) {
  const text = userName
    ? `Hi ${userName}! 👋

Welcome to *Bhuramal Bhagirath Prasad* 😊

Aaj aap kya order karna chahenge? jldi batao

👇 Neeche diye gaye options me se apni pasand ka option choose kar lijiye.

Agar kisi bhi cheez me help chahiye ho, to *Support & Queries* par tap kar dijiye. 💬`
    : `Hi! 👋

Welcome to *Bhuramal Bhagirath Prasad* 😊

Aaj aap kya order karna chahenge?

👇 Neeche diye gaye options me se apni pasand ka option choose kar lijiye.

Agar kisi bhi cheez me help chahiye ho, to *Support & Queries* par tap kar dijiye. 💬`;

  await sendButtonMessage(
    from,
    text,
    MAIN_MENU.buttons,
    "Main Menu",
    MAIN_MENU.footer,
  );
}

// Helper to show order categories
async function showOrderCategories(from) {
  const categories = await catalog.getCategories();
  const sections = [
    {
      title: "Available Categories",
      rows: categories.map((cat, idx) => ({
        id: `order_cat_${idx}`,
        title: cat,
        description: `View products`,
      })),
    },
    {
      title: "Navigation",
      rows: [
        {
          id: "main_menu",
          title: "↩️ Back to Main Menu",
          description: "Return to main menu",
        },
      ],
    },
  ];

  await sendListMessage(
    from,
    `🛍️ Aap kya lena chahenge? 😊

Sabhi categories neeche di gayi hain.

👇 Neeche list me se apni pasand ki category choose kijiye.`,
    sections,
    "Choose Category",
  );
}

const PAGE_SIZE = 8;

async function showCategoryItems(from, category, items, page = 0) {
  const totalPages = Math.ceil(items.length / PAGE_SIZE);

  const start = page * PAGE_SIZE;
  const end = start + PAGE_SIZE;

  const currentItems = items.slice(start, end);

  const itemRows = currentItems.map((item, idx) => ({
    id: `item_${start + idx}`, // original index preserve
    title: item.name.substring(0, 24),
    description: `${item.weight} ${item.unit} - ₹${item.price}`.substring(
      0,
      72,
    ),
  }));

  const navigationRows = [];

  if (page > 0) {
    navigationRows.push({
      id: `item_prev_${page - 1}`,
      title: "⬅️ Previous",
      description: "Pichhle products dekhein",
    });
  }

  if (page < totalPages - 1) {
    navigationRows.push({
      id: `item_next_${page + 1}`,
      title: "➡️ Next",
      description: "Aur products dekhein",
    });
  }

  navigationRows.push({
    id: "go_back_categories",
    title: "↩️ Categories",
    description: "Dusri category dekhein",
  });

  const sections = [
    {
      title: `${category} (${page + 1}/${totalPages})`,
      rows: itemRows,
    },
    {
      title: "More Options",
      rows: navigationRows,
    },
  ];

  await sendListMessage(
    from,
    `📦 *${category}*

Yahan available products ki list di gayi hai.

👇 Jo product chahiye, us par tap karke select kar lijiye.`,
    sections,
    "Choose Product",
  );
}

// 🔧 Helper to display cart with full options (reusable)
async function showCartWithOptions(from) {
  const cart = await cartService.getCart(from);
  const summary = await cartService.getCartSummary(from);

  // Build items list in message text
  let itemsText = cart.items
    .map((item, idx) => {
      const weight =
        item.unit === "grams"
          ? `${item.weight}g`
          : `${item.weight} ${item.unit}`;
      const qty = item.quantity > 1 ? ` × ${item.quantity}` : "";
      return `${idx + 1}. *${item.name}*\n   ${weight}${qty} - ₹${item.totalPrice.toFixed(2)}`;
    })
    .join("\n\n");

  const sections = [
    {
      title: "Aap kya karna chahenge?",
      rows: [
        {
          id: "change_quantity",
          title: "✏️ Change Quantity",
          description: "Quantity update karein",
        },
        {
          id: "checkout",
          title: "💳 Checkout",
          description: "Payment karke order complete karein",
        },
        {
          id: "orders",
          title: "➕ Continue Shopping",
          description: "Aur products add karein",
        },
        {
          id: "clear_cart",
          title: "🗑️ Clear Cart",
          description: "Cart khaali karein",
        },
        {
          id: "main_menu",
          title: "🏠 Main Menu",
          description: "Main menu par jayein",
        },
      ],
    },
  ];

  await sendListMessage(
    from,
    `🛒 *Ye raha aapka cart!*

${itemsText}

━━━━━━━━━━━━━━━━
📦 Total Products: ${summary.totalItems}
💰 *Total Bill: ₹${summary.totalAmount.toFixed(2)}*

👇 Ab batayein, aage kya karna chahenge?`,
    sections,
    "Continue",
  );

  await conversation.setState(from, "view_cart_options");
}

// Verify webhook for WhatsApp Cloud API
function verifyWebhook(req, res) {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      console.log("Webhook verified");
      return res.status(200).send(challenge);
    }
    return res.sendStatus(403);
  }
  res.sendStatus(400);
}

// Helper to verify webhook signature
function verifySignature(req) {
  // ✅ Skip signature verification during load testing
  if (process.env.LOAD_TEST === "true") {
    console.log("🧪 Load Test: Signature verification skipped");
    return true;
  }

  const signature = req.headers["x-hub-signature-256"];
  const appSecret = process.env.WHATSAPP_APP_SECRET;

  if (!appSecret) {
    console.warn(
      "⚠️ WHATSAPP_APP_SECRET not set - skipping signature verification",
    );
    return true;
  }

  if (!signature) {
    console.error("❌ Missing X-Hub-Signature-256 header");
    return false;
  }

  const rawBody = req.rawBody || JSON.stringify(req.body);

  const expectedSignature =
    "sha256=" +
    crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");

  const isValid = crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature),
  );

  if (!isValid) {
    console.error("❌ Invalid webhook signature");
  }

  return isValid;
}

// Handle incoming webhook events (messages)
async function handleIncoming(req, res) {
  const totalStart = Date.now();
  try {
    // Verify webhook signature first
    if (!verifySignature(req)) {
      console.warn("⚠️  Invalid webhook signature - ignoring payload");
      return res.sendStatus(200); // Return 200 to prevent retries
    }

    const body = req.body;

    // Basic structure check - silently ignore invalid payloads
    if (!body.entry || !Array.isArray(body.entry)) {
      console.log("⚠️  Invalid webhook payload structure - ignored");
      return res.sendStatus(200); // Return 200 to prevent retries
    }

    // Iterate entries (could be batched)
    for (const entry of body.entry) {
      const changes = entry.changes || [];
      for (const change of changes) {
        const value = change.value || {};

        // Handle message status updates (sent, delivered, read)
        const statuses =
          value.statuses && Array.isArray(value.statuses) ? value.statuses : [];
        for (const statusUpdate of statuses) {
          const { id: whatsappMessageId, status, timestamp } = statusUpdate;

          try {
            // Update message status in database
            const message = await Message.findOneAndUpdate(
              { whatsappMessageId },
              {
                status,
                updatedAt: new Date(parseInt(timestamp) * 1000),
              },
              { new: true },
            );

            if (message) {
              console.log(
                `✅ Message ${whatsappMessageId} status updated to: ${status}`,
              );

              // Notify dashboard in real-time
              notifyNewMessage(message.conversationId.toString(), {
                _id: message._id.toString(),
                status,
                type: "status_update",
              });
            }
          } catch (err) {
            console.error("Error updating message status:", err.message);
          }
        }

        const messages =
          value.messages && Array.isArray(value.messages) ? value.messages : [];

        for (const message of messages) {
          const messageId = message.id;

          // Skip if already processed this message ID
          if (global.processedMessages?.has(messageId)) {
            continue;
          }
          if (!global.processedMessages) global.processedMessages = new Set();
          global.processedMessages.add(messageId);

          // Keep cache small (last 1000 messages)
          if (global.processedMessages.size > 1000) {
            const arr = Array.from(global.processedMessages);
            global.processedMessages = new Set(arr.slice(-1000));
          }
          const from = message.from; // sender phone number id
          const userName = value.contacts?.[0]?.profile?.name || "there"; // Get user's WhatsApp name

          // Check if user already exists
          let user = await User.findOne({
            phoneNumber: from,
          });

          if (!user) {
            user = await User.create({
              phoneNumber: from,
              customerName: userName,
            });

            console.log(`✅ New user created: ${userName} (${from})`);
          } else if (user.customerName !== userName) {
            user.customerName = userName;
            await user.save();
          }

          // Handle different message types
          let text = "";
          let displayText = ""; // Human-readable text for saving to dashboard
          let latitude = null;
          let longitude = null;

          if (message.text && message.text.body) {
            text = message.text.body.trim();
            displayText = text;
          } else if (message.interactive) {
            // Handle button/list responses
            if (message.interactive.button_reply) {
              text = message.interactive.button_reply.id;
              displayText = message.interactive.button_reply.title || text;
            } else if (message.interactive.list_reply) {
              text = message.interactive.list_reply.id;
              displayText = message.interactive.list_reply.title || text;
            }
          } else if (message.location) {
            console.log("📍 Location received:", message.location);

            latitude = message.location.latitude;
            longitude = message.location.longitude;

            text = "__LOCATION__";
            displayText = "📍 Shared Current Location";

            console.log("📍 User coordinates:", {
              latitude,
              longitude,
            });
          }
          if (!text) {
            await sendMessage(
              from,
              "Sorry, I can only process text messages and button selections.",
            );
            continue;
          }

          // 💾 Save incoming message (async, doesn't block reply)
          (async () => {
            try {
              let conv = await Conversation.findOne({ user: from });
              if (!conv) {
                conv = await Conversation.create({
                  user: from,
                  status: "RESOLVED", // Start as resolved, only set OPEN when user requests support
                  lastMessageAt: new Date(),
                  lastMessage: displayText,
                });
              } else {
                // Only update message fields, preserve state
                await Conversation.updateOne(
                  { user: from },
                  {
                    $set: {
                      lastMessageAt: new Date(),
                      lastMessage: displayText,
                    },
                  },
                );
              }

              // Check if user is in manual mode
              const currentState = await conversation.getState(from);
              const isManual = currentState === "manual";

              const savedMessage = await Message.create({
                conversationId: conv._id,
                user: from,
                text: displayText, // Save human-readable text
                isManualMode: isManual,
                direction: "IN",
                timestamp: new Date(),
                whatsappMessageId: messageId, // Store WhatsApp message ID
              });

              // Notify dashboard in real-time with actual saved message
              notifyNewMessage(conv._id.toString(), {
                _id: savedMessage._id.toString(),
                conversationId: conv._id,
                user: from,
                text: displayText, // Show human-readable text in dashboard
                direction: "IN",
                timestamp: savedMessage.timestamp,
              });
            } catch (err) {
              console.error("Error saving incoming message:", err.message);
            }
          })();

          const textLower = text.toLowerCase();
          const stateStart = Date.now();

          const state = await conversation.getState(from);

          console.log(
            `📝 Message from ${from}: "${text}" | State: ${state || "null"}`,
          );

          // Global commands: menu and back
          if (
            textLower === "menu" ||
            text === "main_menu" ||
            textLower === "back" ||
            text === "back_to_category"
          ) {
            await navigateToMenu(from);
            continue;
          }

          // Global: switch to manual support from anywhere
          if (text === "support") {
            await navigateToSupport(from);
            continue;
          }

          // Retry checkout globally
          if (text === "retry_checkout") {
            await cartService.clearCart(from);

            await conversation.setState(from, "menu");

            await showMainMenu(from);

            continue;
          }
          // Global: address/location queries from any state (single interactive message)
          if (
            /\b(address|location|where\s+are\s+you|store\s+location|shop\s+address|map)\b/i.test(
              textLower,
            ) ||
            text === "view_address"
          ) {
            await sendStoreLocation(from);
            continue;
          }

          // Handle expired/no state
          if (!state) {
            // Check if session expired (had previous state but timed out)
            const metadata = await conversation.getState(from, true);
            if (metadata && metadata.expired) {
              await sendMessage(
                from,
                `⏱️ Lagta hai kaafi der ho gayi hai 😊
              
Aapka pichla selection save nahi reh paaya. Koi baat nahi, chaliye dobara shuru karte hain.`,
              );
              await navigateToMenu(from);
            } else {
              // New user - show welcome with name
              const greetingStart = Date.now();
              await navigateToMenu(from, userName);
            }
            continue;
          }

          // Support menu handler
          if (state === "support_menu") {
            if (text === "track_order") {
              await conversation.setState(from, "awaiting_order_id");
              await sendMessage(
                from,
                '📦 *Order Track Karein*\n\nApna Order ID bhej dijiye, hum aapke order ki details bata denge.\n\nOrder ID aapko payment confirmation message mein mil jayegi.\n\nMenu par wapas jaane ke liye "menu" type kre.',
              );
            } else if (text === "view_address") {
              await sendStoreLocation(from);
            } else if (text === "contact_team") {
              await conversation.setState(from, "manual");

              // Auto-set conversation status to OPEN for support tracking
              await Conversation.updateOne(
                { user: from },
                { $set: { status: "OPEN" } },
              );

              await sendMessage(
                from,
                `👨‍💼 Theek hai 😊
              
Aapki baat hamari team tak pahucha di gayi hai.

Jaldi hi hamari team aapse contact karegi.
              
Main menu par wapas aane ke liye kabhi bhi "menu" likh sakte hain.`,
              );
            } else {
              await sendMessage(
                from,
                "😊 Maaf kijiye, main samajh nahi paaya.\nKripya diye gaye options mein se select kar dijiye.",
              );
            }
            continue;
          }

          // Manual mode: do not auto-respond (menu already handled above)
          if (state === "manual") {
            continue;
          }

          // Only respond to hi/hello in menu state
          if (state === "menu" && /^hi$|^hello$/i.test(text)) {
            const sendStart = Date.now();
            await sendMessage(from, "Hello! 👋 Please use the options above.");
            continue;
          }

          // Handle main menu buttons globally (from any state)
          if (text === "orders") {
            // If already in ordering flow, ignore (stale button click)
            if (
              state === "ordering" ||
              state === "selecting_item" ||
              state === "quantity_input"
            ) {
              continue;
            }
            await showOrderCategories(from);
            await conversation.setState(from, "ordering");
            continue;
          }

          // Handle cart reminder buttons globally (can be clicked from any state)
          if (text === "view_cart" && state !== "menu") {
            // If cart reminder button clicked from non-menu state
            await conversation.setState(from, "menu");

            if (await cartService.isEmpty(from)) {
              await sendButtonMessage(
                from,
                "🛒 Your cart is empty.\n\nStart shopping to add items!",
                [{ id: "orders", title: "🛒 Start Shopping" }],
              );
            } else {
              await showCartWithOptions(from);
            }
            continue;
          }

          // Handle checkout from reminder (can be clicked from any state)
          if (
            text === "checkout" &&
            !["view_cart_options", "cart_options"].includes(state)
          ) {
            // Direct checkout from reminder
            const isEmpty = await cartService.isEmpty(from);
            if (isEmpty) {
              await sendButtonMessage(
                from,
                `Lagta hai aapka cart abhi khaali hai.

Pehle apni pasand ke products add kar lijiye, phir hum checkout ki process aage badhayenge.`,
                [{ id: "orders", title: "🛒 Start Shopping" }],
              );
              await conversation.setState(from, "menu");
            } else {
              await conversation.setState(from, "address_input");
              await sendMessage(
                from,
                `Delivery ke liye hume aapka complete address chahiye.

Kripya apna poora delivery address bhej dijiye.

Address me ye details zarur honi chahiye:

🏠 House / Flat / Plot Number
📍 Area / Locality
🏙️ City
🗺️ State
📮 6-digit PIN Code

Example:

House No. 21
Vaishali Nagar
Jaipur
Rajasthan
302021`,
              );
            }
            continue;
          }

          // Main menu handler
          if (state === "menu") {
            if (text === "view_cart") {
              // Show cart contents
              if (await cartService.isEmpty(from)) {
                await sendButtonMessage(
                  from,
                  `Aapka cart abhi khaali hai.

Apni pasand ke products add kijiye aur phir checkout kijiye.`,
                  [{ id: "orders", title: "🛒 Start Shopping" }],
                );
              } else {
                await showCartWithOptions(from);
              }
            } else {
              await sendMessage(
                from,
                "Kripya upar diye gaye options me se kisi ek ko choose kijiye.",
              );
            }
            continue;
          }

          // View cart options handler
          if (state === "view_cart_options") {
            // Handle Change Quantity action
            if (text === "change_quantity") {
              const cart = await cartService.getCart(from);

              if (!cart.items || cart.items.length === 0) {
                await sendButtonMessage(
                  from,
                  "🛒 Aapka cart abhi empty hai.\n\nKuch items add karke shopping start karein ",
                  [{ id: "orders", title: "🛒 Start Shopping" }],
                );
                await conversation.setState(from, "menu");
                continue;
              }

              const sections = [
                {
                  title: "Item Choose Karein",
                  rows: cart.items.map((item, idx) => {
                    const weight =
                      item.unit === "grams"
                        ? `${item.weight}g`
                        : `${item.weight} ${item.unit}`;
                    const qty = item.quantity > 1 ? ` × ${item.quantity}` : "";
                    return {
                      id: `edit_item_${idx}`,
                      title: `${item.name}`,
                      description: `${weight}${qty} - ₹${item.totalPrice.toFixed(2)}`,
                    };
                  }),
                },
                {
                  title: "Navigation",
                  rows: [
                    {
                      id: "view_cart",
                      title: "↩️ Back to Cart",
                      description: "Cancel",
                    },
                  ],
                },
              ];

              await sendListMessage(
                from,
                `✏️ Kaunsa item change karna hai?\n\nNeeche se item select kar dijiye, aap quantity ya packet size update kar sakte hain `,
                sections,
                "Select Item",
              );
              await conversation.setState(from, "select_item_to_edit");
              continue;
            }

            // Handle Main Menu action
            if (text === "main_menu") {
              await showMainMenu(from);
              await conversation.setState(from, "menu");
              continue;
            }

            // Handle orders (continue shopping)
            if (text === "orders") {
              await showOrderCategories(from);
              await conversation.setState(from, "ordering");
              continue;
            }

            // Handle checkout
            if (text === "checkout") {
              const existingUser = await User.findOne({
                phoneNumber: from,
              });

              if (
                existingUser?.fullAddress &&
                existingUser?.latitude &&
                existingUser?.longitude
              ) {
                await conversation.setState(from, "address_confirmation");

                await sendButtonMessage(
                  from,
                  `📍 Aapne pehle is address par order receive kiya tha:

${existingUser.fullAddress}

Kya aap isi address par delivery karwana chahenge?`,
                  [
                    {
                      id: "use_saved_address",
                      title: "✅ Same Address",
                    },
                    {
                      id: "new_address",
                      title: "✏️ New Address",
                    },
                  ],
                  "Delivery Address",
                );
              } else {
                await conversation.setState(from, "address_input");

                await sendMessage(
                  from,
                  `📍 Order deliver karne ke liye apna address bhej dijiye 😊

Address mein ye details zaroor likh dein:

🏠 House / Flat / Plot Number
📍 Area / Locality
🏙️ City
🗺️ State
📮 6-digit PIN Code

Example:

House No. 21
Vaishali Nagar
Jaipur
Rajasthan
302021`,
                );
              }

              continue;
            }
            // Handle clear cart
            if (text === "clear_cart") {
              await cartService.clearCart(from);
              await sendButtonMessage(
                from,
                "✅ Aapka cart khali kar diya gaya hai.\n\nAgar dobara kuch order karna ho toh neeche se start kar sakte hain",
                [{ id: "orders", title: "🏠 Main Menu" }],
              );
              await conversation.setState(from, "menu");
              continue;
            }

            // If unrecognized action
            await sendMessage(
              from,
              "Maaf kijiye, main samajh nahi paaya 😊\nKripya diye gaye options mein se koi ek select kar dijiye.",
            );
            continue;
          }

          // Select item to edit quantity handler
          if (state === "select_item_to_edit") {
            // Handle item selection
            if (text.startsWith("edit_item_")) {
              const itemIndex = parseInt(text.split("_")[2]);
              const cart = await cartService.getCart(from);
              const item = cart.items[itemIndex];

              if (!item) {
                await sendMessage(
                  from,
                  "Maaf kijiye 😊 Ye item nahi mil paaya.",
                );
                continue;
              }

              // Selected item ki existing packing aur quantity ko maintain rakho
              const packetSize =
                item.unit === "grams"
                  ? `${item.weight}g`
                  : `${item.weight} ${item.unit}`;

              await sendMessage(
                from,
                `✏️ *${item.name}*

📦 Packing: ${packetSize}
🔢 Abhi cart mein: ${item.quantity} packet(s)

📦 Ab kitne packets chahiye?

👇 Sirf number type karke bata dijiye.

Example:
1
2
5
10`,
              );

              await conversation.setState(from, "edit_packet_quantity", {
                itemIndex,
                packetSize: Number(item.weight),
              });

              continue;
            }

            // Handle back to cart
            if (text === "view_cart") {
              await showCartWithOptions(from);
              continue;
            }
            continue;
          }

          // Edit packet quantity
          if (state === "edit_packet_quantity") {
            const packets = parseInt(text);

            if (isNaN(packets) || packets <= 0) {
              await sendMessage(
                from,
                `😊 Samajh nahi aaya.
              
Packet ki quantity number mein bhej dijiye.
              
*Example:*
1
2
5
10`,
              );
              continue;
            }

            const stateData = await conversation.getState(from, true);

            const { itemIndex, packetSize } = stateData.metadata;

            const result = await cartService.updateItemQuantity(
              from,
              itemIndex,
              packetSize,
              packets,
            );

            if (result.success) {
              await sendMessage(
                from,
                "✅ Theek hai, quantity update kar di gayi hai",
              );
              await showCartWithOptions(from);
            } else {
              await sendMessage(from, "❌ Error updating cart.");
            }

            continue;
          }
          // Ordering handler - selecting category
          if (state === "ordering") {
            // Parse category from list selection (format: order_cat_0)
            let selectedCategory = null;

            if (text.startsWith("order_cat_")) {
              const catIndex = parseInt(text.split("_")[2]);
              const categories = await catalog.getCategories();
              selectedCategory = categories[catIndex];
            } else {
              // Fallback: direct text input
              selectedCategory = text.trim();
            }

            const categoryItems =
              await catalog.getItemsByCategory(selectedCategory);

            if (categoryItems.length > 0) {
              await showCategoryItems(from, selectedCategory, categoryItems);
              await conversation.setState(from, "selecting_item", {
                selectedCategory,
              });
            } else {
              await sendMessage(
                from,
                "Invalid category. Please select from the list above.",
              );
            }
            continue;
          }

          // Selecting item handler
          if (state === "selecting_item") {
            // next page
            if (text.startsWith("item_next_")) {
              const page = Number(text.replace("item_next_", ""));

              const stateData = await conversation.getState(from, true);
              const selectedCategory = stateData?.metadata?.selectedCategory;

              const categoryItems =
                await catalog.getItemsByCategory(selectedCategory);

              await showCategoryItems(
                from,
                selectedCategory,
                categoryItems,
                page,
              );

              continue;
            }
            // previous page
            if (text.startsWith("item_prev_")) {
              const page = Number(text.replace("item_prev_", ""));

              const stateData = await conversation.getState(from, true);
              const selectedCategory = stateData?.metadata?.selectedCategory;

              const categoryItems =
                await catalog.getItemsByCategory(selectedCategory);

              await showCategoryItems(
                from,
                selectedCategory,
                categoryItems,
                page,
              );

              continue;
            }
            // Handle go back to categories
            if (text === "go_back_categories") {
              await showOrderCategories(from);
              await conversation.setState(from, "ordering");
              continue;
            }

            // Get selected category and find item
            const stateData = await conversation.getState(from, true);
            const selectedCategory = stateData?.metadata?.selectedCategory;

            if (!selectedCategory) {
              await sendMessage(from, "Session expired. Please start over.");
              await navigateToMenu(from);
              continue;
            }

            const categoryItems =
              await catalog.getItemsByCategory(selectedCategory);
            let selectedItem = null;

            // Parse item from list selection (format: item_0)
            if (text.startsWith("item_")) {
              const itemIndex = parseInt(text.split("_")[1]);
              selectedItem = categoryItems[itemIndex];
            } else {
              // Fallback: search by name
              selectedItem = categoryItems.find(
                (item) =>
                  item.name && item.name.toLowerCase() === text.toLowerCase(),
              );
            }

            if (selectedItem) {
              const packetSize =
                selectedItem.unit === "grams"
                  ? `${selectedItem.weight}g`
                  : `${selectedItem.weight} ${selectedItem.unit}`;

              const unitPrice = Number(selectedItem.price);

              // Save selected item and directly move to packet quantity
              await conversation.setState(from, "packet_quantity", {
                selectedItem,
                selectedCategory,
                packetSize: Number(selectedItem.weight),
                unitPrice,
              });

              // Ask only for number of packets
              await sendMessage(
                from,
                `📦 *${selectedItem.name}*

Packing: ${packetSize}
Price: ₹${unitPrice.toFixed(2)} per packet

📦 Ab kitne packets chahiye?

👇 Sirf number type karke bata dijiye.

Example:
1
2
5
10`,
              );
            } else {
              await sendMessage(
                from,
                "😅 Ye product samajh nahi aaya.\n\n👇 Kripya upar di gayi list me se hi koi product select kijiye.",
              );
            }
            continue;
          }

          // packet input

          if (state === "packet_quantity") {
            const packets = parseInt(text);

            if (isNaN(packets) || packets <= 0) {
              await sendMessage(
                from,
                `Please sirf packet ki quantity number me batayein.

Example:
1
2
5
10`,
              );
              continue;
            }

            const stateData = await conversation.getState(from, true);
            if (!stateData?.metadata?.selectedItem) {
              await sendMessage(
                from,
                `Aapka session expire ho gaya hai.

Chaliye, dobara shuru karte hain.`,
              );
              await navigateToMenu(from);
              continue;
            }
            const { selectedItem, selectedCategory, packetSize, unitPrice } =
              stateData.metadata;

            const cartResult = await cartService.addItem(from, {
              name: selectedItem.name,
              weight: packetSize,
              unit: selectedItem.unit,
              quantity: packets,
              price: unitPrice.toFixed(2),
            });

            if (!cartResult.success) {
              await sendMessage(
                from,
                "Maaf kijiye, product cart me add nahi ho paya. Kripya ek baar phir try kijiye.",
              );
              continue;
            }

            await sendButtonMessage(
              from,
              `✅ *${selectedItem.name}* aapke cart me add kar diya gaya hai.

📦 Packing: ${packetSize}${selectedItem.unit === "grams" ? "g" : ` ${selectedItem.unit}`}
🔢 Packets: ${packets}
💰 Total Amount: ₹${(unitPrice * packets).toFixed(2)}

${await cartService.formatCartSummary(from)}

Ab batayein, aage kya karna chahenge?`,
              [
                { id: "add_more", title: "Add More Items" },
                { id: "view_cart", title: "View Cart" },
                { id: "checkout", title: "Checkout" },
              ],
            );

            await conversation.setState(from, "cart_options", {
              selectedItem,
              selectedCategory,
            });

            continue;
          }

          // Cart options handler
          if (state === "cart_options") {
            if (text === "add_more") {
              await showOrderCategories(from);
              await conversation.setState(from, "ordering");
            } else if (text === "checkout") {
              const existingUser = await User.findOne({
                phoneNumber: from,
              });

              if (
                existingUser?.fullAddress &&
                existingUser?.latitude &&
                existingUser?.longitude
              ) {
                await conversation.setState(from, "address_confirmation");

                await sendButtonMessage(
                  from,
                  `📍 Aapne pehle is address par order receive kiya tha:

${existingUser.fullAddress}

Kya aap isi address par delivery karwana chahenge?`,
                  [
                    {
                      id: "use_saved_address",
                      title: "✅ Same Address",
                    },
                    {
                      id: "new_address",
                      title: "✏️ New Address",
                    },
                  ],
                  "Delivery Address",
                );
              } else {
                await conversation.setState(from, "address_input");

                await sendMessage(
                  from,
                  `📍 Order deliver karne ke liye apna address bhej dijiye 😊

Address mein ye details zaroor likh dein:

🏠 House / Flat / Plot Number
📍 Area / Locality
🏙️ City
🗺️ State
📮 6-digit PIN Code

Example:

House No. 21
Vaishali Nagar
Jaipur
Rajasthan
302021`,
                );
              }
            } else if (text === "view_cart") {
              // Show full cart with options to edit quantities
              if (await cartService.isEmpty(from)) {
                await sendButtonMessage(
                  from,
                  `Aapka cart abhi khaali hai.

  Chaliye, shopping shuru karte hain! 😊`,
                  [{ id: "orders", title: "🛒 Start Shopping" }],
                );
                await conversation.setState(from, "menu");
              } else {
                await showCartWithOptions(from);
              }
            } else {
              await sendMessage(
                from,
                `Maaf kijiye, "${text}" option samajh nahi aaya.

  Kripya upar diye gaye options me se kisi ek ko select kijiye.`,
              );
            }
            continue;
          }

          if (state === "address_confirmation") {
            if (text === "new_address") {
              await conversation.setState(from, "address_input");

              await sendMessage(
                from,
                `📍 Order deliver karne ke liye apna address bhej dijiye 😊

Address mein ye details zaroor likh dein:

🏠 House / Flat / Plot Number
📍 Area / Locality
🏙️ City
🗺️ State
📮 6-digit PIN Code

Example:

House No. 21
Vaishali Nagar
Jaipur
Rajasthan
302021`,
              );

              continue;
            }

            if (text === "use_saved_address") {
              const existingUser = await User.findOne({
                phoneNumber: from,
              });

              const customerName =
                userName || existingUser.customerName || "Customer";

              const fullAddress = existingUser.fullAddress;
              const latitude = existingUser.latitude;
              const longitude = existingUser.longitude;

              // Final validation before order creation
              const validation = validateAddress(fullAddress);

              if (!validation.valid) {
                await sendMessage(
                  from,
                  `Address abhi complete nahi lag raha.

Kripya niche di gayi details check karke dobara bhej dijiye.

${validation.errors.map((error) => `• ${error}`).join("\n")}`,
                );

                continue;
              }

              // Get cart summary
              const cartSummary = await cartService.getCartSummary(from);

              if (cartSummary.items.length === 0) {
                await sendMessage(
                  from,
                  `🛒 Aapka cart abhi khaali hai.

Pehle kuch products add kar lijiye, phir hum checkout ki process aage badhayenge.`,
                );

                await navigateToMenu(from);
                continue;
              }
              try {
                // Generate order ID
                const orderId = await Order.generateOrderId();

                // prepare order data
                const orderData = {
                  orderId,
                  customerName,
                  phoneNumber: from,
                  fullAddress,
                  latitude,
                  longitude,
                  items: cartSummary.items,
                  totalItems: cartSummary.totalItems,
                  totalAmount: cartSummary.totalAmount,
                  status: "pending",
                };

                // Update user final data
                await User.findOneAndUpdate(
                  {
                    phoneNumber: from,
                  },

                  {
                    $set: {
                      customerName,
                      fullAddress,
                      latitude,
                      longitude,
                    },
                  },
                );

                // Create order description for payment
                const itemsDescription = cartSummary.items
                  .map(
                    (item) => `${item.quantity}x ${item.weight}g ${item.name}`,
                  )
                  .join(", ");

                // Create payment link
                const paymentResult = await createPaymentLink({
                  orderId: orderData.orderId,
                  amount: cartSummary.totalAmount,
                  customerName: customerName,
                  customerPhone: from,
                  description: itemsDescription.substring(0, 100), // Razorpay has 100 char limit
                });

                if (paymentResult.success) {
                  const newOrder = new Order({
                    ...orderData,
                    paymentLink: paymentResult.paymentLink,
                    razorpayOrderId: paymentResult.paymentLinkId,
                    paymentStatus: "pending",
                  });

                  await newOrder.save();

                  // Format cart items for display
                  let itemsList = "";
                  cartSummary.items.forEach((item, index) => {
                    itemsList += `${index + 1}. ${item.quantity} x ${item.name} (${item.weight} ${item.unit})\n   ₹${item.totalPrice.toFixed(2)}\n`;
                  });

                  // Send payment button with order summary
                  const orderSummary = `📦 *Aapke order ki details*

${itemsList}
💰 *Total Amount: ₹${cartSummary.totalAmount.toFixed(2)}*

📍 *Delivery Address:*
${fullAddress}

🧾 Order ID: ${newOrder.orderId}

Neeche diye gaye button par tap karke payment complete kar dijiye.

Payment Razorpay ke through bilkul secure hai.`;

                  await sendUrlButton(
                    from,
                    orderSummary,
                    "Proceed to Payment",
                    paymentResult.paymentLink,
                    "💰 Payment Required",
                  );
                  // reset conversation state
                  await conversation.setState(from, "menu");
                  console.log("State changed to menu");
                  console.log(await conversation.getState(from));

                  // Note: Cart will be cleared after successful payment in payment webhook
                } else {
                  // Payment link creation failed
                  console.error(
                    "❌ Payment link creation failed:",
                    paymentResult.error,
                  );
                  await conversation.setState(from, "menu");
                  await sendButtonMessage(
                    from,
                    `Maaf kijiye, payment link banane me thodi dikkat aa gayi.

Kripya dobara try kijiye. Agar problem bani rahe, to hamari support team aapki madad karegi.

`,
                    [
                      { id: "retry_checkout", title: "🔄 Try Again" },
                      { id: "support", title: "💬 Contact Support" },
                    ],
                    "Payment",
                  );
                }
              } catch (error) {
                console.error("❌ Error processing order:", error);

                // Clear cart and state

                await conversation.setState(from, "menu");

                // Notify user of error
                await sendButtonMessage(
                  from,
                  `Maaf kijiye, aapka order process karte waqt ek dikkat aa gayi.

Kripya thodi der baad dobara try kijiye. Agar problem bani rahe, to hamari support team se sampark kar sakte hain.`,
                  [
                    { id: "retry_checkout", title: "🔄 Try Again" },
                    { id: "support", title: "💬 Contact Support" },
                  ],
                  "Error",
                );
              }
            }

            continue;
          }

          if (state === "address_input") {
            // Address input
            let fullAddress = "";

            const customerName = userName || user.customerName || "Customer";

            // User shared location
            if (text === "__LOCATION__") {
              const existingUser = await User.findOne({
                phoneNumber: from,
              });

              // Address check
              if (!existingUser?.fullAddress) {
                await sendMessage(
                  from,
                  `Delivery se pehle hume aapka complete address chahiye.
                
Kripya pehle apna poora address bhej dijiye.
                
Example:
                
House No. 21
Vaishali Nagar
Jaipur
Rajasthan
302021`,
                );

                continue;
              }

              // Location check
              if (!latitude || !longitude) {
                await sendMessage(
                  from,
                  `Lagta hai location sahi se receive nahi ho paayi.
                
Kripya dobara apni current location share kar dijiye.`,
                );

                continue;
              }

              fullAddress = existingUser.fullAddress;

              console.log("✅ Location received:", {
                latitude,
                longitude,
              });
            }

            // User typed address
            else {
              fullAddress = text.trim();

              // Validate address
              const validation = validateAddress(fullAddress);

              if (!validation.valid) {
                await sendMessage(
                  from,
                  `Delivery me koi dikkat na ho, isliye hume complete address chahiye.

Kripya apna address dobara check karke bhej dijiye.

${validation.errors.map((error) => `• ${error}`).join("\n")}

Example:

House No. 21
Vaishali Nagar
Jaipur
Rajasthan
302021`,
                );

                continue;
              }

              // Save only validated address
              await User.findOneAndUpdate(
                {
                  phoneNumber: from,
                },
                {
                  $set: {
                    customerName,
                    fullAddress,
                  },
                },
              );

              await sendMessage(
                from,
                `Address receive ho gaya.

Ab bas apni current location share kar dijiye, taaki hum delivery location confirm kar saken.

Location share karne ke liye:
📎 Attachment → Location → Send Current Location`,
              );

              continue;
            }

            // Final validation before order creation
            const validation = validateAddress(fullAddress);

            if (!validation.valid) {
              await sendMessage(
                from,
                `Address abhi complete nahi lag raha.
              
Kripya niche di gayi details check karke dobara bhej dijiye.
              
              ${validation.errors.map((error) => `• ${error}`).join("\n")}`,
              );

              continue;
            }

            // Get cart summary
            const cartSummary = await cartService.getCartSummary(from);

            if (cartSummary.items.length === 0) {
              await sendMessage(
                from,
                `🛒 Aapka cart abhi khaali hai.

Pehle kuch products add kar lijiye, phir hum checkout ki process aage badhayenge.`,
              );

              await navigateToMenu(from);

              continue;
            }

            try {
              // Generate order ID
              const orderId = await Order.generateOrderId();

              // prepare order data
              const orderData = {
                orderId,
                customerName,
                phoneNumber: from,
                fullAddress,
                latitude,
                longitude,
                items: cartSummary.items,
                totalItems: cartSummary.totalItems,
                totalAmount: cartSummary.totalAmount,
                status: "pending",
              };

              // Update user final data
              await User.findOneAndUpdate(
                {
                  phoneNumber: from,
                },

                {
                  $set: {
                    customerName,
                    fullAddress,
                    latitude,
                    longitude,
                  },
                },
              );

              // Create order description for payment
              const itemsDescription = cartSummary.items
                .map((item) => `${item.quantity}x ${item.weight}g ${item.name}`)
                .join(", ");

              // Create payment link
              const paymentResult = await createPaymentLink({
                orderId: orderData.orderId,
                amount: cartSummary.totalAmount,
                customerName: customerName,
                customerPhone: from,
                description: itemsDescription.substring(0, 100), // Razorpay has 100 char limit
              });

              if (paymentResult.success) {
                const newOrder = new Order({
                  ...orderData,
                  paymentLink: paymentResult.paymentLink,
                  razorpayOrderId: paymentResult.paymentLinkId,
                  paymentStatus: "pending",
                });

                await newOrder.save();

                // Format cart items for display
                let itemsList = "";
                cartSummary.items.forEach((item, index) => {
                  itemsList += `${index + 1}. ${item.quantity} x ${item.name} (${item.weight} ${item.unit})\n   ₹${item.totalPrice.toFixed(2)}\n`;
                });

                // Send payment button with order summary
                const orderSummary = `📦 *Aapke order ki details*

${itemsList}
💰 *Total Amount: ₹${cartSummary.totalAmount.toFixed(2)}*

📍 *Delivery Address:*
${fullAddress}

🧾 Order ID: ${newOrder.orderId}

Neeche diye gaye button par tap karke payment complete kar dijiye.

Payment Razorpay ke through bilkul secure hai.`;

                await sendUrlButton(
                  from,
                  orderSummary,
                  "Proceed to Payment",
                  paymentResult.paymentLink,
                  "💰 Payment Required",
                );
                // reset conversation state
                await conversation.setState(from, "menu");
                console.log("State changed to menu");
                console.log(await conversation.getState(from));

                // Note: Cart will be cleared after successful payment in payment webhook
              } else {
                // Payment link creation failed
                console.error(
                  "❌ Payment link creation failed:",
                  paymentResult.error,
                );
                await conversation.setState(from, "menu");
                await sendButtonMessage(
                  from,
                  `Maaf kijiye, payment link banane me thodi dikkat aa gayi.

Kripya dobara try kijiye. Agar problem bani rahe, to hamari support team aapki madad karegi.

`,
                  [
                    { id: "retry_checkout", title: "🔄 Try Again" },
                    { id: "support", title: "💬 Contact Support" },
                  ],
                  "Payment",
                );
              }
            } catch (error) {
              console.error("❌ Error processing order:", error);

              // Clear cart and state

              await conversation.setState(from, "menu");

              // Notify user of error
              await sendButtonMessage(
                from,
                `Maaf kijiye, aapka order process karte waqt ek dikkat aa gayi.

Kripya thodi der baad dobara try kijiye. Agar problem bani rahe, to hamari support team se sampark kar sakte hain.`,
                [
                  { id: "retry_checkout", title: "🔄 Try Again" },
                  { id: "support", title: "💬 Contact Support" },
                ],
                "Error",
              );
            }
            continue;
          }

          // Track order - awaiting order ID input
          if (state === "awaiting_order_id") {
            const orderId = text.trim();

            try {
              // Fetch order from database using custom orderId field
              const order = await Order.findOne({ orderId: orderId });

              if (!order) {
                await sendButtonMessage(
                  from,
                  `😊 Maaf kijiye, hume ye Order ID nahi mil paayi.

Kripya Order ID check karke dobara bhej dijiye. Agar koi dikkat ho toh humari team se baat kar sakte hain.`,
                  [
                    { id: "track_order", title: "🔍 Dobara Check Karein" },
                    { id: "support", title: "💬 Team Se Baat Karein" },
                  ],
                  "Order Nahi Mila",
                );
                await conversation.setState(from, "menu");
                continue;
              }

              // Status emoji mapping
              const statusDisplay = {
                pending: "⏳ Payment Pending",
                confirmed: "✅ Payment confirmed",
                processing: "📦 Preparing",
                shipped: "🚚 Shipped",
                delivery: " Out for delivery",
                delivered: "✨ Delivered",
                cancelled: "❌ Cancelled",
              };

              // Build status message with buttons
              let statusMsg = `📦 Order Status\n\n`;
              statusMsg += `Order ID: ${order.orderId}\n`;
              statusMsg += `Status: ${statusDisplay[order.status] || order.status}`;

              // Add custom status message if provided by admin
              if (order.statusMessage && order.statusMessage.trim()) {
                statusMsg += `\n\n${order.statusMessage}`;
              }

              // Send with buttons in one message
              await sendButtonMessage(from, statusMsg, [
                { id: "track_order", title: "🔍 Track Another" },
                { id: "main_menu", title: "🏠 Main Menu" },
              ]);

              await conversation.setState(from, "menu");
            } catch (error) {
              console.error("❌ Error fetching order:", error);
              await sendButtonMessage(
                from,
                `😊 Maaf kijiye, abhi aapke order ki details nahi mil paayi.

Kripya thodi der baad dobara try karein. Agar dikkat ho toh humari team se baat kar sakte hain.`,
                [
                  { id: "track_order", title: "🔍 Dobara Try Karein" },
                  { id: "support", title: "💬 Team Se Baat Karein" },
                ],
                "Order Details",
              );
              await conversation.setState(from, "menu");
            }
            continue;
          }

          // Support/manual state handled earlier

          // Fallback if no recognized state or trigger
          await sendMessage(
            from,
            "👋 Namaste 😊\n\nShuru karne ke liye 'Hi' bhej dijiye.\nMain aapko products, orders aur support mein help kar dunga.",
          );
        }
      }
    }
    // 200 to Facebook so retries stop
    return res.sendStatus(200);
  } catch (err) {
    console.error("Error handling webhook", err);
    return res.sendStatus(500);
  }
}

export { verifyWebhook, handleIncoming };
