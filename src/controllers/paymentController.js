import Order from '../models/Order.js';
import { sendButtonMessage } from '../utils/whatsapp.js';
import conversation from '../models/conversationStateService.js';
import cartService from '../services/cartService.js';

/**
 * Send payment confirmation via WhatsApp
 */
async function sendPaymentConfirmation(order) {
  try {
    const itemSummary = order.items.map(item => 
      `${item.quantity} x ${item.name} (${item.weight}${item.unit})`
    ).join('\n');
    
    await sendButtonMessage(
      order.phoneNumber,
      `🎉 *Payment Successful!*\n\n` +
      `✅ Your order has been confirmed!\n\n` +
      `📦 *Order Details:*\n${itemSummary}\n\n` +
      `💰 Amount Paid: ₹${order.totalAmount.toFixed(2)}\n` +
      `📋 Order ID: ${order.orderId}\n\n` +
      `📍 *Delivery Address:*\n${order.fullAddress}\n\n` +
      `🚚 We will contact you shortly for delivery.\n\n` +
      `Thank you for choosing us! 🙏`,
      [
        { id: 'orders', title: '🛒 Order More' },
        { id: 'main_menu', title: '🏠 Main Menu' }
      ],
      "Order Confirmed"
    );
    
    // Clear cart and reset conversation state after successful order
    cartService.clearCart(order.phoneNumber);
    await conversation.setState(order.phoneNumber, 'menu');
    
    console.log('✅ Payment confirmation sent to:', order.phoneNumber);
  } catch (error) {
    console.error('⚠️ Failed to send WhatsApp confirmation:', error.message);
    throw error;
  }
}

/**
 * Razorpay webhook handler - processes payment events
 * This is called by Razorpay when payment status changes
 */
export async function handlePaymentWebhook(req, res) {
  try {
    
    const event = req.body;
    
    console.log('📥 Razorpay webhook received:', event.event);
    
    // Handle different event types
    switch (event.event) {
      case 'payment_link.paid':
        const paymentLinkId = event.payload.payment_link.entity.id;
        const paymentId = event.payload.payment.entity.id;
        
        // Find order by payment link ID
        const order = await Order.findOne({ razorpayOrderId: paymentLinkId });
        
        if (!order) {
          console.error('❌ Order not found for payment link:', paymentLinkId);
          break;
        }
        
        // Only process if not already completed
        if (order.paymentStatus !== 'completed') {
          order.paymentStatus = 'completed';
          order.razorpayPaymentId = paymentId;
          order.status = 'confirmed';
          await order.save();
          
          console.log('✅ Order confirmed via webhook:', order.orderId);
          
          // Send WhatsApp confirmation (main success path)
          try {
            await sendPaymentConfirmation(order);
          } catch (whatsappError) {
            console.error('⚠️ Failed to send WhatsApp confirmation:', whatsappError.message);
          }
        } else {
          console.log('ℹ️ Order already processed:', order.orderId);
        }
        break;
        
      case 'payment_link.cancelled':
      case 'payment_link.expired':
        const linkId = event.payload.payment_link.entity.id;
        const orderToUpdate = await Order.findOne({ razorpayOrderId: linkId });
        
        if (orderToUpdate && orderToUpdate.paymentStatus === 'pending') {
          orderToUpdate.paymentStatus = 'failed';
          orderToUpdate.status = 'cancelled';
          await orderToUpdate.save();
          console.log('❌ Payment link expired/cancelled:', orderToUpdate.orderId);
        }
        break;
        
      default:
        console.log('ℹ️ Unhandled webhook event:', event.event);
    }
    
    // Always return 200 to acknowledge receipt
    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}
