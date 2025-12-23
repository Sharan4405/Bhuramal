/**
 * Cart Service - Manages shopping cart for multiple items
 * Production-ready with validation and error handling
 * Cart persists for session duration (no separate timeout)
 */

class CartService {
  constructor() {
    // In-memory cart storage (user phone number as key)
    this.carts = new Map();
  }

  /**
   * Add item to user's cart
   */
  addItem(userId, item) {
    try {
      if (!userId || !item) {
        throw new Error('Invalid userId or item');
      }

      // Validate item structure
      if (!item.name || !item.price || !item.quantity) {
        throw new Error('Item missing required fields (name, price, quantity)');
      }

      // Get or create cart
      let cart = this.carts.get(userId);
      if (!cart) {
        cart = {
          items: [],
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
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

      cart.updatedAt = Date.now();
      this.carts.set(userId, cart);

      return { success: true, cart };
    } catch (error) {
      console.error('❌ Error adding item to cart:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user's cart
   */
  getCart(userId) {
    const cart = this.carts.get(userId);
    return cart || { items: [], createdAt: Date.now(), updatedAt: Date.now() };
  }

  /**
   * Calculate cart totals
   */
  getCartSummary(userId) {
    const cart = this.getCart(userId);
    
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
  clearCart(userId) {
    this.carts.delete(userId);
  }

  /**
   * Check if cart is empty
   */
  isEmpty(userId) {
    const cart = this.getCart(userId);
    return cart.items.length === 0;
  }

  /**
   * Remove specific item from cart
   */
  removeItem(userId, itemIndex) {
    const cart = this.carts.get(userId);
    if (cart && cart.items[itemIndex]) {
      cart.items.splice(itemIndex, 1);
      cart.updatedAt = Date.now();
      
      if (cart.items.length === 0) {
        this.clearCart(userId);
      } else {
        this.carts.set(userId, cart);
      }
      
      return { success: true };
    }
    return { success: false, error: 'Item not found' };
  }

  /**
   * Format cart for display
   */
  formatCartSummary(userId) {
    const summary = this.getCartSummary(userId);
    
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
  getStats() {
    return {
      activeCarts: this.carts.size,
      totalItems: Array.from(this.carts.values())
        .reduce((sum, cart) => sum + cart.items.length, 0)
    };
  }
}

// Singleton instance
const cartService = new CartService();

export default cartService;
