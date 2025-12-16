import { sendMessage, sendButtonMessage, sendListMessage, sendUrlButton } from '../utils/whatsapp.js';
import conversation from '../models/conversationStateService.js';
import * as catalog from '../services/catalogService.js';
import Order from '../models/Order.js';
import { createPaymentLink } from '../services/paymentService.js';
import cartService from '../services/cartService.js';

// Main menu configuration
const MAIN_MENU = {
  buttons: [
    { id: 'orders', title: '🛒 Order Now' },
    { id: 'support', title: '💬 Support & Queries' }
  ],
  footer: 'Type "menu" anytime to return here'
};

// Helper to send main menu
async function showMainMenu(from, userName = null) {
  const text = userName 
    ? `Hello ${userName}! 👋\n\nWelcome to *Bhuramal Bhagirath Prasad* - Your trusted partner for premium dry fruits and nuts! 🌟\n\nWhat can I help you with today?`
    : 'What can I help you with today?';
  
  await sendButtonMessage(from, text, MAIN_MENU.buttons, "Main Menu", MAIN_MENU.footer);
}

// Helper to show order categories
async function showOrderCategories(from) {
  const categories = catalog.getCategories();
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
  const sections = [{
    title: category,
    rows: items.map((item, idx) => ({
      id: `item_${idx}`,
      title: item.name.substring(0, 24),
      description: `${item.weight} ${item.unit} - ₹${item.price}`.substring(0, 72)
    }))
  }];
  
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

// Handle incoming webhook events (messages)
async function handleIncoming(req, res) {
  try {
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

          if (textLower === 'back' || text === 'back_to_category') {
            await conversation.setState(from, 'menu');
            await showMainMenu(from);
            continue;
          }

          // Welcome message for explicit greetings only
          if (/^hi$|^hello$/i.test(text)) {
            await conversation.setState(from, 'menu');
            await showMainMenu(from, userName);
            continue;
          }

          // Handle expired/no state - don't auto-show menu
          if (!state) {
            await sendMessage(from, "Hi! Type 'menu' to see options or 'hi' to start over.");
            continue;
          }

          // Main menu handler
          if (state === 'menu') {
            if (text === 'orders' || text === '1') {
              await showOrderCategories(from);
              await conversation.setState(from, 'ordering');
            } else if (text === 'support' || text === '2') {
              await conversation.setState(from, 'support');
              await sendMessage(from, '💬 *Support & Queries*\n\nPlease type your question and our team will respond shortly.\n\nType "menu" to return.');
            } else {
              await sendMessage(from, "Please use the buttons above or type 1-2.");
            }
            continue;
          }

          // Ordering handler - selecting category
          if (state === 'ordering') {
            if (text.toLowerCase() === 'menu') {
              await showMainMenu(from);
              await conversation.setState(from, 'menu');
              continue;
            }

            // Parse category from list selection (format: order_cat_0)
            let selectedCategory = null;
            
            if (text.startsWith('order_cat_')) {
              const catIndex = parseInt(text.split('_')[2]);
              const categories = catalog.getCategories();
              selectedCategory = categories[catIndex];
            } else {
              // Fallback: direct text input
              selectedCategory = text.trim();
            }
            
            const categoryItems = catalog.getItemsByCategory(selectedCategory);

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
            if (text.toLowerCase() === 'menu') {
              await showMainMenu(from);
              await conversation.setState(from, 'menu');
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
            
            const categoryItems = catalog.getItemsByCategory(selectedCategory);
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
              await sendMessage(
                from,
                `📦 *${selectedItem.name}*\n\n` +
                `📊 ${selectedItem.weight} ${selectedItem.unit} - ₹${selectedItem.price}\n` +
                `💰 Price per gram: ₹${(selectedItem.price / selectedItem.weight).toFixed(2)}\n\n` +
                `Please enter how many grams you want to order:\n` +
                `Example: 250 (for 250 grams)`
              );
            } else {
              await sendMessage(from, "Invalid item. Please select from the list above.");
            }
            continue;
          }

          // Quantity input (in grams)
          if (state === 'quantity_input') {
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
                
                // Clear cart after successful order
                cartService.clearCart(from);
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

          // Support queries
          if (state === 'support') {
            await sendButtonMessage(
              from,
              `✅ *Query Received*\n\nOur team will respond shortly.\n\nYour message:\n"${text}"`,
              MAIN_MENU.buttons,
              "Thank You"
            );
            await conversation.clearState(from);
            continue;
          }

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
