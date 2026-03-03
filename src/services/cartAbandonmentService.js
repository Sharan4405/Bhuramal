/**
 * Cart Abandonment Service
 * Sends reminder notifications to users who have items in cart
 * but haven't completed checkout after 2 hours
 */

import Cart from '../models/Cart.js';
import { sendButtonMessage } from '../utils/whatsapp.js';
import conversation from '../models/conversationStateService.js';

// Configuration
const REMINDER_DELAY = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
const CHECK_INTERVAL = 15 * 60 * 1000; // Check every 15 minutes

/**
 * Send cart reminder to a user
 */
async function sendCartReminder(userId, cart) {
  try {
    const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
    
    // Build item summary
    const itemSummary = cart.items.slice(0, 3).map(item => {
      const weight = item.unit === 'grams' ? `${item.weight}g` : `${item.weight} ${item.unit}`;
      return `• ${item.name} - ${weight}`;
    }).join('\n');
    
    const moreItems = cart.items.length > 3 ? `\n...and ${cart.items.length - 3} more item(s)` : '';
    
    await sendButtonMessage(
      userId,
      `🛒 *Your cart is waiting!*\n\n` +
      `You have ${totalItems} item(s) in your cart:\n\n` +
      `${itemSummary}${moreItems}\n\n` +
      `💰 Total: ₹${totalAmount.toFixed(2)}\n\n` +
      `Complete your order now to enjoy our premium dry fruits and nuts! 🌟\n\n` +
      `Your cart will expire within 24 hours.`,
      [
        { id: 'view_cart', title: '🛒 View Cart' },
        { id: 'checkout', title: '💳 Checkout Now' },
        { id: 'main_menu', title: '🏠 Main Menu' }
      ],
      "Cart Reminder"
    );
    
    // Mark reminder as sent
    cart.reminderSent = true;
    cart.reminderSentAt = new Date();
    await cart.save();
    
    console.log(`✅ Cart reminder sent to ${userId}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send cart reminder to ${userId}:`, error.message);
    return false;
  }
}

/**
 * Check for abandoned carts and send reminders
 */
export async function checkAbandonedCarts() {
  try {
    const now = new Date();
    const reminderThreshold = new Date(now.getTime() - REMINDER_DELAY);
    
    // Find carts that:
    // 1. Have items
    // 2. Haven't received a reminder yet
    // 3. Were last updated more than 2 hours ago
    // 4. Haven't expired yet
    const abandonedCarts = await Cart.find({
      'items.0': { $exists: true }, // Has at least one item
      reminderSent: false,
      updatedAt: { $lte: reminderThreshold },
      expiresAt: { $gt: now } // Not expired yet
    });
    
    if (abandonedCarts.length === 0) {
      console.log('ℹ️ No abandoned carts found');
      return;
    }
    
    console.log(`📋 Found ${abandonedCarts.length} abandoned cart(s) to remind`);
    
    // Send reminders
    for (const cart of abandonedCarts) {
      await sendCartReminder(cart.userId, cart);
      
      // Small delay between messages to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`✅ Processed ${abandonedCarts.length} abandoned cart reminder(s)`);
  } catch (error) {
    console.error('❌ Error checking abandoned carts:', error);
  }
}

/**
 * Start the cart abandonment checker
 * Runs every 15 minutes to check for abandoned carts
 */
export function startCartAbandonmentChecker() {
  console.log('🚀 Cart abandonment checker started (checks every 15 minutes)');
  
  // Run immediately on startup
  checkAbandonedCarts();
  
  // Then run every 15 minutes
  setInterval(() => {
    checkAbandonedCarts();
  }, CHECK_INTERVAL);
}

/**
 * Reset reminder flag when cart is updated (called from cartService)
 */
export async function resetCartReminder(userId) {
  try {
    await Cart.findOneAndUpdate(
      { userId },
      { 
        reminderSent: false,
        reminderSentAt: null 
      }
    );
  } catch (error) {
    console.error(`❌ Error resetting cart reminder for ${userId}:`, error.message);
  }
}

export default {
  checkAbandonedCarts,
  startCartAbandonmentChecker,
  resetCartReminder
};
