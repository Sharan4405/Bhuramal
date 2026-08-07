/**
 * Cart Service - Manages shopping cart for multiple items
 * Database-backed with MongoDB for persistence
 */

import Cart from "../models/Cart.js";
import { resetCartReminder } from "./cartAbandonmentService.js";

const DELIVERY_CHARGE = 103;
const FREE_DELIVERY_THRESHOLD = 1500;

class CartService {
  /**
   * Add item to user's cart
   */
  async addItem(userId, item) {
    try {
      if (!userId || !item) {
        throw new Error("Invalid userId or item");
      }

      // Validate item structure
      if (!item.name || !item.price || !item.quantity) {
        throw new Error("Item missing required fields (name, price, quantity)");
      }

      // Find or create cart
      let cart = await Cart.findOne({ userId });

      if (!cart) {
        cart = new Cart({
          userId,
          items: [],
          expiresAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day
        });
      }

      // Check if item already exists in cart (for gram-based items, merge the weights)
      const existingItemIndex = cart.items.findIndex(
        (i) => i.name === item.name && i.weight === item.weight,
      );

      if (existingItemIndex >= 0) {
        // For gram-based items, add to existing weight and recalculate price
        if (item.unit === "grams") {
          cart.items[existingItemIndex].quantity += item.quantity;
          cart.items[existingItemIndex].totalPrice +=
            parseFloat(item.price) * item.quantity;

          cart.markModified("items");
        } else {
          // For non-gram items, update quantity
          cart.items[existingItemIndex].quantity += item.quantity;
          cart.items[existingItemIndex].totalPrice =
            cart.items[existingItemIndex].quantity *
            cart.items[existingItemIndex].unitPrice;
        }
        // Mark items array as modified for Mongoose
        cart.markModified("items");
      } else {
        // Add new item
        cart.items.push({
          name: item.name,
          weight: item.weight,
          unit: item.unit,
          quantity: item.quantity,
          unitPrice: parseFloat(item.price),
          totalPrice: parseFloat(item.price) * item.quantity,
        });
      }

      await cart.save();

      // Reset reminder flag since cart was updated
      await resetCartReminder(userId);

      return { success: true, cart };
    } catch (error) {
      console.error("❌ Error adding item to cart:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user's cart
   */
  async getCart(userId) {
    try {
      const cart = await Cart.findOne({ userId });
      return (
        cart || { items: [], createdAt: Date.now(), updatedAt: Date.now() }
      );
    } catch (error) {
      console.error("❌ Error getting cart:", error);
      return { items: [], createdAt: Date.now(), updatedAt: Date.now() };
    }
  }

  /**
   * Calculate cart totals
   */
  async getCartSummary(userId) {
    const cart = await this.getCart(userId);

    const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    // Products ka total — delivery charge ke bina
    const subtotal = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);

    // ₹1500 ya usse zyada par FREE delivery
    const deliveryCharge =
      subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE;

    // Final amount = products + delivery
    const totalAmount = subtotal + deliveryCharge;

    return {
      items: cart.items,
      totalItems,
      itemCount: cart.items.length,
      subtotal,
      deliveryCharge,
      totalAmount,
    };
  }

  /**
   * Clear user's cart
   */
  async clearCart(userId) {
    try {
      await Cart.deleteOne({ userId });
    } catch (error) {
      console.error("❌ Error clearing cart:", error);
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
      return { success: false, error: "Item not found" };
    } catch (error) {
      console.error("❌ Error removing item:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update quantity/weight of specific item in cart
   */
  async updateItemQuantity(userId, itemIndex, packets) {
    try {
      const cart = await Cart.findOne({ userId });

      if (!cart || !cart.items[itemIndex]) {
        return { success: false, error: "Item not found" };
      }

      const item = cart.items[itemIndex];

      // Only update packet quantity.
      // Existing weight/packing remains unchanged.
      item.quantity = packets;

      // Recalculate total using existing unit price
      item.totalPrice = Math.round(item.unitPrice * packets * 100) / 100;

      cart.markModified("items");

      await cart.save();

      // Reset reminder because cart was updated
      await resetCartReminder(userId);

      return {
        success: true,
        cart,
      };
    } catch (error) {
      console.error("❌ Error updating item quantity:", error);

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Format cart for display
   */
  async formatCartSummary(userId) {
    const summary = await this.getCartSummary(userId);

    if (summary.items.length === 0) {
      return "🛒 Your cart is empty";
    }

    let message = "🛒 *Your Cart*\n\n";

    summary.items.forEach((item, index) => {
      message += `${index + 1}. *${item.name}*\n`;

      const weight =
        item.unit === "grams"
          ? `${item.weight}g`
          : `${item.weight} ${item.unit}`;

      message += `   📦 Packing: ${weight}\n`;
      message += `   🔢 Packets: ${item.quantity}\n`;
      message += `   💰 Amount: ₹${Number(item.totalPrice).toFixed(2)}\n\n`;
    });

    message += `🛍️ Products: ${summary.itemCount}\n`;
    message += `📦 Total Packets: ${summary.totalItems}\n`;
    message += `💰 Item Amount: ₹${Number(summary.subtotal).toFixed(2)}\n`;

    if (summary.deliveryCharge === 0) {
      message += `🚚 Delivery Charges: *FREE* 🎉\n`;
    } else {
      message += `🚚 Delivery Charges: ₹${Number(summary.deliveryCharge).toFixed(2)}\n`;
    }

    message += `💵 *Total Bill: ₹${Number(summary.totalAmount).toFixed(2)}*`;

    return message;
  }

  /**
   * Get cart statistics (for monitoring)
   */
  async getStats() {
    try {
      const activeCarts = await Cart.countDocuments();
      const carts = await Cart.find();
      const totalItems = carts.reduce(
        (sum, cart) => sum + cart.items.length,
        0,
      );

      return {
        activeCarts,
        totalItems,
      };
    } catch (error) {
      console.error("❌ Error getting stats:", error);
      return { activeCarts: 0, totalItems: 0 };
    }
  }
}

// Singleton instance
const cartService = new CartService();

export default cartService;
