/**
 * Cart Service - Manages shopping cart for multiple items
 * Database-backed with MongoDB for persistence
 */

import Cart from '../models/Cart.js';

class CartService {
  /**
   * Add item to user's cart
   */
  async addItem(userId, item) {
    try {
      if (!userId || !item) {
        throw new Error('Invalid userId or item');
      }

      // Validate item structure
      if (!item.name || !item.price || !item.quantity) {
        throw new Error('Item missing required fields (name, price, quantity)');
      }

      // Find or create cart
      let cart = await Cart.findOne({ userId });
      
      if (!cart) {
        cart = new Cart({
          userId,
          items: [],
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        });
      }

      // Check if item already exists in cart (for gram-based items, merge the weights)
      const existingItemIndex = cart.items.findIndex(
        i => i.name === item.name
      );

      if (existingItemIndex >= 0) {
        // For gram-based items, add to existing weight and recalculate price
        if (item.unit === 'grams') {
          cart.items[existingItemIndex].weight += item.weight;
          cart.items[existingItemIndex].totalPrice += parseFloat(item.price);
        } else {
          // For non-gram items, update quantity
          cart.items[existingItemIndex].quantity += item.quantity;
          cart.items[existingItemIndex].totalPrice = 
            cart.items[existingItemIndex].quantity * cart.items[existingItemIndex].unitPrice;
        }
      } else {
        // Add new item
        cart.items.push({
          name: item.name,
          weight: item.weight,
          unit: item.unit,
          quantity: item.quantity,
          unitPrice: parseFloat(item.price) / item.quantity, // Price per unit
          totalPrice: parseFloat(item.price)
        });
      }

      await cart.save();

      return { success: true, cart };
    } catch (error) {
      console.error('❌ Error adding item to cart:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user's cart
   */
  async getCart(userId) {
    try {
      const cart = await Cart.findOne({ userId });
      return cart || { items: [], createdAt: Date.now(), updatedAt: Date.now() };
    } catch (error) {
      console.error('❌ Error getting cart:', error);
      return { items: [], createdAt: Date.now(), updatedAt: Date.now() };
    }
  }

  /**
   * Calculate cart totals
   */
  async getCartSummary(userId) {
    const cart = await this.getCart(userId);
    
    const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
    
    return {
      items: cart.items,
      totalItems,
      totalAmount,
      itemCount: cart.items.length
    };
  }

  /**
   * Clear user's cart
   */
  async clearCart(userId) {
    try {
      await Cart.deleteOne({ userId });
    } catch (error) {
      console.error('❌ Error clearing cart:', error);
    }
  }

  /**
   * Check if cart is empty
   */
  async isEmpty(userId) {
    const cart = await this.getCart(userId);
    return cart.items.length === 0;
  }

  /**
   * Remove specific item from cart
   */
  async removeItem(userId, itemIndex) {
    try {
      const cart = await Cart.findOne({ userId });
      if (cart && cart.items[itemIndex]) {
        cart.items.splice(itemIndex, 1);
        
        if (cart.items.length === 0) {
          await Cart.deleteOne({ userId });
        } else {
          await cart.save();
        }
        
        return { success: true };
      }
      return { success: false, error: 'Item not found' };
    } catch (error) {
      console.error('❌ Error removing item:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Format cart for display
   */
  async formatCartSummary(userId) {
    const summary = await this.getCartSummary(userId);
    
    if (summary.items.length === 0) {
      return '🛒 Your cart is empty';
    }

    let message = '🛒 *Your Cart*\n\n';
    
    summary.items.forEach((item, index) => {
      message += `${index + 1}. ${item.name}\n`;
      // For gram-based items, show weight directly (no quantity multiplication)
      if (item.unit === 'grams') {
        message += `   ${item.weight}g - ₹${item.totalPrice.toFixed(2)}\n\n`;
      } else {
        message += `   ${item.weight} ${item.unit} × ${item.quantity} = ₹${item.totalPrice.toFixed(2)}\n\n`;
      }
    });
    
    message += `📦 Total Items: ${summary.itemCount}\n`;
    message += `💰 *Total Amount: ₹${summary.totalAmount.toFixed(2)}*`;
    
    return message;
  }

  /**
   * Get cart statistics (for monitoring)
   */
  async getStats() {
    try {
      const activeCarts = await Cart.countDocuments();
      const carts = await Cart.find();
      const totalItems = carts.reduce((sum, cart) => sum + cart.items.length, 0);
      
      return {
        activeCarts,
        totalItems
      };
    } catch (error) {
      console.error('❌ Error getting stats:', error);
      return { activeCarts: 0, totalItems: 0 };
    }
  }
}

// Singleton instance
const cartService = new CartService();

export default cartService;
