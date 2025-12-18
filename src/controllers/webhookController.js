import crypto from 'crypto';
import { sendMessage, sendButtonMessage, sendListMessage, sendUrlButton, sendLocation } from '../utils/whatsapp.js';
import conversation from '../models/conversationStateService.js';
import * as catalog from '../services/catalogService.js';
import Order from '../models/Order.js';
import { createPaymentLink } from '../services/paymentService.js';
import cartService from '../services/cartService.js';

// Main menu configuration
const MAIN_MENU = {
  buttons: [
    { id: 'orders', title: '🛒 Order Now' },
    { id: 'track_order', title: '📦 Track Order' },
    { id: 'support', title: '💬 Support & Queries' }
  ],
  footer: 'Type "menu" anytime to return here'
};

// Store location/address
const STORE_ADDRESS = process.env.STORE_ADDRESS || 'Purana Thana, Shop No. SL-2, Opp Pillar No 56, Sodala, Ajmer Rd, Sodhala, Jaipur, Rajasthan 302019';
const STORE_LAT = process.env.STORE_LATITUDE ? parseFloat(process.env.STORE_LATITUDE) : null;
const STORE_LNG = process.env.STORE_LONGITUDE ? parseFloat(process.env.STORE_LONGITUDE) : null;
const STORE_MAPS_QUERY = process.env.STORE_MAPS_QUERY ? process.env.STORE_MAPS_QUERY.trim() : null;
const STORE_MAPS_LINK = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(STORE_ADDRESS)}`;

// Helper to send main menu
async function showMainMenu(from, userName = null) {
  const text = userName 
    ? `Hello ${userName}! 👋\n\nWelcome to *Bhuramal Bhagirath Prasad* - Your trusted partner for premium dry fruits and nuts! 🌟\n\nWhat can I help you with today?\n\nNeed help? Tap *Support & Queries*.`
    : 'What can I help you with today?\n\nNeed help? Tap *Support & Queries*.';
  
  await sendButtonMessage(from, text, MAIN_MENU.buttons, "Main Menu", MAIN_MENU.footer);
}

// Helper to show order categories
async function showOrderCategories(from) {
  const categories = await catalog.getCategories();
  const sections = [{
    title: "Order Categories",
    rows: categories.map((cat, idx) => ({
      id: `order_cat_${idx}`,
      title: cat,
      description: `Order from ${cat}`
    }))
  }];
  
  await sendListMessage(from, "🛒 *Place Your Order*\n\nSelect a category:", sections, "Select Category");
}

async function showCategoryItems(from, category, items) {
  const sections = [
    {
      title: category,
      rows: items.map((item, idx) => ({
        id: `item_${idx}`,
        title: item.name.substring(0, 24),
        description: `${item.weight} ${item.unit} - ₹${item.price}`.substring(0, 72)
      }))
    },
    {
      title: "Navigation",
      rows: [{ id: 'go_back_categories', title: '↩️ Back to Categories', description: 'Choose a different category' }]
    }
  ];
  
  await sendListMessage(from, `📦 *${category}*\n\nSelect an item:`, sections, "Select Item");
}

// Verify webhook for WhatsApp Cloud API
function verifyWebhook(req, res) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token){
    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      console.log('Webhook verified');
      return res.status(200).send(challenge);
    }
    return res.sendStatus(403);
  } 
  res.sendStatus(400);
}

// Helper to verify webhook signature
function verifySignature(req) {
  const signature = req.headers['x-hub-signature-256'];
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  
  if (!appSecret) {
    console.warn('⚠️  WHATSAPP_APP_SECRET not set - skipping signature verification');
    return true; // Allow in development
  }
  
  if (!signature) {
    console.error('❌ Missing X-Hub-Signature-256 header');
    return false;
  }
  
  // Get raw body (captured before JSON parsing)
  const rawBody = req.rawBody || JSON.stringify(req.body);
  
  // Calculate expected signature
  const expectedSignature = 'sha256=' + crypto
    .createHmac('sha256', appSecret)
    .update(rawBody)
    .digest('hex');
  
  // Compare signatures
  const isValid = crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
  
  if (!isValid) {
    console.error('❌ Invalid webhook signature');
  }
  
  return isValid;
}

// Handle incoming webhook events (messages)
async function handleIncoming(req, res) {
  try {
    // Verify webhook signature first
    if (!verifySignature(req)) {
      console.error('🚫 Rejected webhook with invalid signature');
      return res.sendStatus(403);
    }
    
    const body = req.body;

    // Basic structure check
    if (!body.entry || !Array.isArray(body.entry)) {
      return res.sendStatus(400);
    }

    // Iterate entries (could be batched)
    for (const entry of body.entry) {
      const changes = entry.changes || [];
      for (const change of changes) {
        const value = change.value || {};
        const messages = (value.messages && Array.isArray(value.messages)) ? value.messages : [];

        for (const message of messages) {
          const messageId = message.id;

          // Skip if already processed this message ID
          if (global.processedMessages?.has(messageId)) {
            console.log(`⏭️  Skipping duplicate message ID: ${messageId}`);
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
          const userName = value.contacts?.[0]?.profile?.name || 'there'; // Get user's WhatsApp name

          // Handle different message types
          let text = '';
          let interactiveResponse = null;

          if (message.text && message.text.body) {
            text = message.text.body.trim();
          } else if (message.interactive) {
            // Handle button/list responses
            interactiveResponse = message.interactive;
            if (message.interactive.button_reply) {
              text = message.interactive.button_reply.id; // Use button ID as text
            } else if (message.interactive.list_reply) {
              text = message.interactive.list_reply.id; // Use list item ID as text
            }
          }

          if (!text) {
            await sendMessage(from, "Sorry, I can only process text messages and button selections.");
            continue;
          }

          const textLower = text.toLowerCase();
          const state = await conversation.getState(from);
          
          console.log(`📝 Message from ${from}: "${text}" | State: ${state || 'null'}`);

          // Global commands: menu and back
          if (textLower === 'menu' || text === 'main_menu') {
            await conversation.setState(from, 'menu');
            await showMainMenu(from);
            continue;
          }

          // Global: switch to manual support from anywhere
          if (text === 'support') {
            await conversation.setState(from, 'manual');
            await sendMessage(from, '👨‍💼 You\'re now in *manual support* mode. Our team will assist you shortly.\n\nType "menu" anytime to return to the bot.');
            continue;
          }

          // Global: "menu" keyword - works from ANY state (but not "main menu" text)
          if (textLower === 'menu') {
            await conversation.setState(from, 'menu');
            await showMainMenu(from);
            continue;
          }

          if (textLower === 'back' || text === 'back_to_category') {
            await conversation.setState(from, 'menu');
            await showMainMenu(from);
            continue;
          }

          // Global: address/location queries from any state (single interactive message)
          if (/\b(address|location|where\s+are\s+you|store\s+location|shop\s+address|map)\b/i.test(textLower)) {
            const mapsLink = STORE_MAPS_QUERY
              ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(STORE_MAPS_QUERY)}`
              : (Number.isFinite(STORE_LAT) && Number.isFinite(STORE_LNG))
                ? `https://www.google.com/maps/search/?api=1&query=${STORE_LAT},${STORE_LNG}`
                : STORE_MAPS_LINK;

            await sendUrlButton(
              from,
              `📍 *Store Address*\n${STORE_ADDRESS}\n\nTap the button below to open the location in Google Maps.`,
              'View Location',
              mapsLink,
              '📍 Location'
            );
            continue;
          }

          // Handle expired/no state - NEW SESSION, show welcome with name
          if (!state) {
            await conversation.setState(from, 'menu');
            await showMainMenu(from, userName);
            continue;
          }

          // Existing session - user types hi/hello - show menu WITHOUT welcome
          if (/^hi$|^hello$/i.test(text)) {
            await conversation.setState(from, 'menu');
            await showMainMenu(from); // No userName = no welcome message
            continue;
          }

          // Manual mode: do not auto-respond (menu already handled above)
          if (state === 'manual') {
            continue;
          }

          // Handle main menu buttons globally (from any state)
          if (text === 'orders') {
            // If already in ordering flow, ignore (stale button click)
            if (state === 'ordering' || state === 'selecting_item' || state === 'quantity_input') {
              console.log('⏭️ Ignoring stale "Order More" button - already ordering');
              continue;
            }
            await showOrderCategories(from);
            await conversation.setState(from, 'ordering');
            continue;
          }
          
          if (text === 'main_menu') {
            // If already at main menu, ignore (stale button click)
            if (state === 'menu') {
              console.log('⏭️ Ignoring stale "Main Menu" button - already at menu');
              continue;
            }
            await showMainMenu(from);
            await conversation.setState(from, 'menu');
            continue;
          }

          // Main menu handler
          if (state === 'menu') {
            if (text === '1') {
              await showOrderCategories(from);
              await conversation.setState(from, 'ordering');
            } else if (text === 'track_order' || text === '2') {
              await conversation.setState(from, 'awaiting_order_id');
              await sendMessage(from, '📦 *Track Your Order*\n\nPlease enter your Order ID to check the status.\n\nYou can find the Order ID in your payment confirmation message.\n\nType "menu" to return.');
            } else if (text === 'support' || text === '3') {
              await conversation.setState(from, 'manual');
              await sendMessage(from, '👨‍💼 You\'re now in *manual support* mode. Our team will assist you shortly.\n\nType "menu" anytime to return to the bot.');
            } else {
              await sendMessage(from, "Please use the buttons above or type 1-3.");
            }
            continue;
          }

          // Ordering handler - selecting category
          if (state === 'ordering') {
            // Parse category from list selection (format: order_cat_0)
            let selectedCategory = null;
            
            if (text.startsWith('order_cat_')) {
              const catIndex = parseInt(text.split('_')[2]);
              const categories = await catalog.getCategories();
              selectedCategory = categories[catIndex];
            } else {
              // Fallback: direct text input
              selectedCategory = text.trim();
            }
            
            const categoryItems = await catalog.getItemsByCategory(selectedCategory);

            if (categoryItems.length > 0) {
              await showCategoryItems(from, selectedCategory, categoryItems);
              await conversation.setState(from, 'selecting_item', { selectedCategory });
            } else {
              await sendMessage(from, "Invalid category. Please select from the list above.");
            }
            continue;
          }

          // Selecting item handler
          if (state === 'selecting_item') {
            // Handle go back to categories
            if (text === 'go_back_categories') {
              await showOrderCategories(from);
              await conversation.setState(from, 'ordering');
              continue;
            }

            // Get selected category and find item
            const stateData = await conversation.getState(from, true);
            const selectedCategory = stateData?.metadata?.selectedCategory;
            
            if (!selectedCategory) {
              await sendMessage(from, "Session expired. Please start over.");
              await showMainMenu(from);
              await conversation.setState(from, 'menu');
              continue;
            }
            
            const categoryItems = await catalog.getItemsByCategory(selectedCategory);
            let selectedItem = null;
            
            // Parse item from list selection (format: item_0)
            if (text.startsWith('item_')) {
              const itemIndex = parseInt(text.split('_')[1]);
              selectedItem = categoryItems[itemIndex];
            } else {
              // Fallback: search by name
              selectedItem = categoryItems.find(item =>
                item.name && item.name.toLowerCase() === text.toLowerCase()
              );
            }

            if (selectedItem) {
              await conversation.setState(from, 'quantity_input', {
                selectedItem: selectedItem,
                selectedCategory: selectedCategory
              });
              await sendButtonMessage(
                from,
                `📦 *${selectedItem.name}*\n\n` +
                `📊 ${selectedItem.weight} ${selectedItem.unit} - ₹${selectedItem.price}\n` +
                `💰 Price per gram: ₹${(selectedItem.price / selectedItem.weight).toFixed(2)}\n\n` +
                `Please enter how many grams you want to order:\n` +
                `Example: 250 (for 250 grams)`,
                [
                  { id: 'go_back_items', title: '↩️ Go Back' }
                ]
              );
            } else {
              await sendMessage(from, "Invalid item. Please select from the list above.");
            }
            continue;
          }

          // Quantity input (in grams)
          if (state === 'quantity_input') {
            // Handle go back to item selection
            if (text === 'go_back_items') {
              const stateData = await conversation.getState(from, true);
              const selectedCategory = stateData?.metadata?.selectedCategory;
              if (selectedCategory) {
                const categoryItems = await catalog.getItemsByCategory(selectedCategory);
                await showCategoryItems(from, selectedCategory, categoryItems);
                await conversation.setState(from, 'selecting_item', { selectedCategory });
              } else {
                await showOrderCategories(from);
                await conversation.setState(from, 'ordering');
              }
              continue;
            }

            const gramsRequested = parseInt(text);
            if (gramsRequested > 0) {
              const stateData = await conversation.getState(from, true);
              const selectedItem = stateData?.metadata?.selectedItem;
              
              if (!selectedItem) {
                await sendMessage(from, "❌ Session expired. Please start over.");
                await showMainMenu(from);
                await conversation.setState(from, 'menu');
                continue;
              }
              
              // Calculate price based on grams requested
              const catalogWeight = parseFloat(selectedItem.weight);
              const catalogPrice = parseFloat(selectedItem.price);
              const pricePerGram = catalogPrice / catalogWeight;
              const totalPrice = pricePerGram * gramsRequested;
              
              // Add item to cart with calculated price
              const cartResult = cartService.addItem(from, {
                name: selectedItem.name,
                weight: gramsRequested, // Store requested grams
                unit: 'grams',
                quantity: 1, // Always 1 since we're dealing with weight
                price: totalPrice.toFixed(2)
              });
              
              if (!cartResult.success) {
                await sendMessage(from, "❌ Error adding item to cart. Please try again.");
                continue;
              }
              
              // Show cart summary with options in single message
              await sendButtonMessage(
                from,
                `✅ Added ${gramsRequested}g of ${selectedItem.name} to cart!\n` +
                `💰 Price: ₹${totalPrice.toFixed(2)}\n\n${cartService.formatCartSummary(from)}\n\n` +
                `What would you like to do next?`,
                [
                  { id: 'add_more', title: '➕ Add More Items' },
                  { id: 'checkout', title: '💳 Checkout' }
                ]
              );
              
              await conversation.setState(from, 'cart_options');
            } else {
              await sendMessage(from, "Please enter a valid number of grams (e.g., 250)");
            }
            continue;
          }

          // Cart options handler
          if (state === 'cart_options') {
            console.log(`🛒 Cart options - User: ${from}, Text: "${text}", State: ${state}`);
            
            if (text === 'add_more') {
              await showOrderCategories(from);
              await conversation.setState(from, 'ordering');
            } else if (text === 'checkout') {
              await conversation.setState(from, 'address_input');
              await sendMessage(
                from,
                `📍 *Delivery Address Required*\n\nPlease provide your complete delivery address:\n\n*Example:*\nJohn Doe\n123, MG Road\nBangalore - 560001`
              );
            } else {
              await sendMessage(from, `❓ Unrecognized option: "${text}". Please use the buttons to proceed.`);
            }
            continue;
          }
          


          // Address input
          if (state === 'address_input') {
            const fullAddress = text.trim();
            const addressLines = text.trim().split('\n');
            const customerName = addressLines[0] || userName || 'Customer';
            
            // Get cart summary
            const cartSummary = cartService.getCartSummary(from);
            
            if (cartSummary.items.length === 0) {
              await sendMessage(from, "🛒 Your cart is empty. Please add items first.");
              await showMainMenu(from);
              await conversation.setState(from, 'menu');
              continue;
            }
            
            try {
              console.log('💾 Saving order to database:', {
                customerName,
                phoneNumber: from,
                items: cartSummary.items,
                totalItems: cartSummary.totalItems,
                totalAmount: cartSummary.totalAmount
              });
              
              // Save order to database with all cart items
              const newOrder = new Order({
                customerName: customerName,
                phoneNumber: from,
                fullAddress: fullAddress,
                items: cartSummary.items,
                totalItems: cartSummary.totalItems,
                totalAmount: cartSummary.totalAmount,
                status: 'pending'
              });
              
              await newOrder.save();
              console.log('✅ Order saved to database:', newOrder._id);
              
              // Create order description for payment
              const itemsDescription = cartSummary.items
                .map(item => `${item.quantity}x ${item.name}`)
                .join(', ');
              
              // Create payment link
              const paymentResult = await createPaymentLink({
                orderId: newOrder._id.toString(),
                amount: cartSummary.totalAmount,
                customerName: customerName,
                customerPhone: from,
                description: itemsDescription.substring(0, 100) // Razorpay has 100 char limit
              });
              
              if (paymentResult.success) {
                // Update order with payment link
                newOrder.paymentLink = paymentResult.paymentLink;
                newOrder.razorpayOrderId = paymentResult.paymentLinkId;
                newOrder.paymentStatus = 'initiated';
                await newOrder.save();
                
                console.log('✅ Payment link created:', paymentResult.paymentLink);
                
                // Format cart items for display
                let itemsList = '';
                cartSummary.items.forEach((item, index) => {
                  itemsList += `${index + 1}. ${item.quantity} x ${item.name} (${item.weight} ${item.unit})\n   ₹${item.totalPrice.toFixed(2)}\n`;
                });
                
                // Send payment button with order summary
                const orderSummary = `📦 *Order Summary*\n\n${itemsList}\n💰 *Total: ₹${cartSummary.totalAmount.toFixed(2)}*\n\n📍 *Delivery Address:*\n${fullAddress}\n\n🆔 Order ID: ${newOrder._id}\n\n💳 Complete your payment to confirm the order.\n\nPayment is secure via Razorpay 🔒`;
                
                await sendUrlButton(
                  from,
                  orderSummary,
                  'Proceed to Payment',
                  paymentResult.paymentLink,
                  '💰 Payment Required'
                );
                
                // Note: Cart will be cleared after successful payment in payment webhook
              } else {
                // Payment link creation failed
                console.error('❌ Payment link creation failed:', paymentResult.error);
                
                await sendButtonMessage(
                  from,
                  `❌ Unable to create payment link. Please try again or contact support.\n\n🆔 Order ID: ${newOrder._id}`,
                  [
                    { id: 'orders', title: '🛒 Try Again' },
                    { id: 'support', title: '💬 Contact Support' }
                  ],
                  "Payment Error"
                );
              }
              
            } catch (error) {
              console.error('❌ Error processing order:', error);
              
              // Clear cart and state
              cartService.clearCart(from);
              await conversation.clearState(from);
              
              // Notify user of error
              await sendButtonMessage(
                from,
                `❌ *Error Processing Order*\n\nSorry, there was an error processing your order. Please try again or contact support.\n\nError: ${error.message}`,
                [
                  { id: 'orders', title: '🛒 Try Again' },
                  { id: 'support', title: '💬 Contact Support' }
                ],
                "Error"
              );
            }
            continue;
          }

          // Track order - awaiting order ID input
          if (state === 'awaiting_order_id') {
            const orderId = text.trim();
            
            try {
              // Validate MongoDB ObjectId format
              if (!/^[0-9a-fA-F]{24}$/.test(orderId)) {
                await sendMessage(from, '❌ Invalid Order ID format.\n\nPlease enter a valid Order ID or type "menu" to return.');
                continue;
              }
              
              // Fetch order from database
              const order = await Order.findById(orderId);
              
              if (!order) {
                await sendButtonMessage(
                  from,
                  `❌ *Order Not Found*\n\nNo order found with ID: ${orderId}\n\nPlease check your Order ID and try again.`,
                  [
                    { id: 'track_order', title: '🔍 Try Again' },
                    { id: 'support', title: '💬 Contact Support' }
                  ],
                  'Order Not Found'
                );
                await conversation.setState(from, 'menu');
                continue;
              }
              
              // Status emoji mapping
              const statusDisplay = {
                'pending': '🛒 Order placed',
                'confirmed': '✅ Payment confirmed',
                'processing': '📦 Preparing',
                'shipped': '🚚 Shipped',
                'delivery': ' Out for delivery',
                'delivered': '✨ Delivered',
                'cancelled': '❌ Cancelled'
              };
              
              // Get last update time
              const now = new Date();
              const istOffset = 5.5 * 60 * 60 * 1000;
              const istTime = new Date(now.getTime() + istOffset);
              const timeStr = istTime.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
              
              // Build status message with buttons
              let statusMsg = `📦 Order Status\n\n`;
              statusMsg += `Order ID: ${order._id}\n`;
              statusMsg += `Status: ${statusDisplay[order.status] || order.status}\n`;
              statusMsg += `Last updated: ${timeStr}`;
              
              // Add custom status message if provided by admin
              if (order.statusMessage && order.statusMessage.trim()) {
                statusMsg += `\n\n${order.statusMessage}`;
              }
              
              // Send with buttons in one message
              await sendButtonMessage(
                from,
                statusMsg,
                [
                  { id: 'track_order', title: '🔍 Track Another' },
                  { id: 'main_menu', title: '🏠 Main Menu' }
                ]
              );
              
              await conversation.setState(from, 'menu');
              
            } catch (error) {
              console.error('❌ Error fetching order:', error);
              await sendButtonMessage(
                from,
                `❌ *Error*\n\nSorry, there was an error retrieving your order. Please try again or contact support.`,
                [
                  { id: 'track_order', title: '🔍 Try Again' },
                  { id: 'support', title: '💬 Contact Support' }
                ],
                'Error'
              );
              await conversation.setState(from, 'menu');
            }
            continue;
          }

          // Support/manual state handled earlier

          // Fallback if no recognized state or trigger
          await sendMessage(from, "Send 'hi' to start. I can show a menu and help with orders and support.");
        }
      }
    }

    // 200 to Facebook so retries stop
    return res.sendStatus(200);
  } catch (err) {
    console.error('Error handling webhook', err);
    return res.sendStatus(500);
  }
}

export {
  verifyWebhook,
  handleIncoming
};
