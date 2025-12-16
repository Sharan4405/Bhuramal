import express from 'express';
import Order from '../models/Order.js';
import { getPaymentLinkStatus } from '../services/paymentService.js';
import { sendButtonMessage } from '../utils/whatsapp.js';

const router = express.Router();

/**
 * Payment callback endpoint
 * Razorpay will redirect here after payment
 */
router.get('/callback', async (req, res) => {
  try {
    const { razorpay_payment_link_id, razorpay_payment_id, razorpay_signature } = req.query;
    
    console.log('💳 Payment callback received:', {
      linkId: razorpay_payment_link_id,
      paymentId: razorpay_payment_id
    });
    
    if (!razorpay_payment_link_id) {
      return res.status(400).send('Payment link ID is required');
    }
    
    // Get payment link status
    const linkStatus = await getPaymentLinkStatus(razorpay_payment_link_id);
    
    if (linkStatus.success) {
      // Find order by payment link ID
      const order = await Order.findOne({ razorpayOrderId: razorpay_payment_link_id });
      
      if (order) {
        // Update order payment status
        if (linkStatus.status === 'paid') {
          // Check if already processed to avoid duplicate messages
          const wasAlreadyCompleted = order.paymentStatus === 'completed';
          
          order.paymentStatus = 'completed';
          order.razorpayPaymentId = razorpay_payment_id;
          order.razorpaySignature = razorpay_signature;
          order.status = 'confirmed';
          await order.save();
          
          console.log('✅ Payment completed for order:', order._id);
          
          // Send WhatsApp confirmation ONLY if not already sent
          if (!wasAlreadyCompleted) {
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
                `🆔 Order ID: ${order._id}\n` +
                `📍 *Delivery Address:*\n${order.fullAddress}\n\n` +
                `🚚 We will contact you shortly for delivery.\n\n` +
                `Thank you for choosing us! 🙏`,
                [
                  { id: 'orders', title: '🛒 Order More' },
                  { id: 'main_menu', title: '🏠 Main Menu' }
                ],
                "Order Confirmed"
              );
              console.log('📱 WhatsApp confirmation sent via callback');
            } catch (whatsappError) {
              console.error('⚠️ Failed to send WhatsApp confirmation:', whatsappError);
            }
          } else {
            console.log('⏭️  Skipping duplicate confirmation (already sent)');
          }
          
          // Redirect back to WhatsApp app
          const businessPhone = process.env.WHATSAPP_BUSINESS_NUMBER || '919019942380'; // Your business WhatsApp number
          
          return res.send(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>Payment Successful</title>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 30px 20px; background: #f5f5f5; margin: 0; }
                .success { background: white; padding: 30px 20px; border-radius: 10px; max-width: 400px; margin: 0 auto; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .icon { font-size: 64px; color: #4CAF50; margin-bottom: 10px; }
                h1 { color: #333; font-size: 24px; margin: 10px 0; }
                p { color: #666; line-height: 1.6; font-size: 14px; margin: 10px 0; }
                .order-id { background: #f0f0f0; padding: 10px; border-radius: 5px; margin: 15px 0; font-family: monospace; font-size: 12px; word-break: break-all; }
                .btn { display: inline-block; margin: 20px 10px 10px; padding: 12px 24px; background: #25D366; color: white; text-decoration: none; border-radius: 25px; font-weight: bold; }
                .btn:hover { background: #20BA5A; }
                .note { font-size: 12px; color: #999; margin-top: 20px; }
              </style>
            </head>
            <body>
              <div class="success">
                <div class="icon">✅</div>
                <h1>Payment Successful!</h1>
                <p>Your order has been confirmed.</p>
                <div class="order-id">Order ID: ${order._id}</div>
                <p>A confirmation message has been sent to your WhatsApp.</p>
                <a href="whatsapp://send?phone=${businessPhone}" class="btn">Open WhatsApp</a>
                <p class="note">You can close this page now</p>
              </div>
            </body>
            </html>
          `);
        } else {
          order.paymentStatus = 'failed';
          await order.save();
          
          console.log('❌ Payment failed for order:', order._id);
          
          return res.send(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>Payment Failed</title>
              <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
                .error { background: white; padding: 40px; border-radius: 10px; max-width: 500px; margin: 0 auto; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .icon { font-size: 64px; color: #f44336; }
                h1 { color: #333; }
                p { color: #666; line-height: 1.6; }
              </style>
            </head>
            <body>
              <div class="error">
                <div class="icon">❌</div>
                <h1>Payment Failed</h1>
                <p>Your payment could not be processed.</p>
                <p>Please contact us on WhatsApp for assistance.</p>
                <p><strong>You can close this window now.</strong></p>
              </div>
            </body>
            </html>
          `);
        }
      }
    }
    
    res.send('Payment processing...');
  } catch (error) {
    console.error('❌ Error processing payment callback:', error);
    res.status(500).send('Error processing payment');
  }
});

/**
 * Razorpay webhook endpoint for payment events
 * This receives notifications directly from Razorpay
 */
router.post('/webhook', express.json(), async (req, res) => {
  try {
    const event = req.body;
    
    console.log('🔔 Razorpay webhook received:', {
      event: event.event,
      timestamp: new Date().toISOString()
    });
    
    // Handle different event types
    switch (event.event) {
      case 'payment_link.paid':
        const paymentLinkId = event.payload.payment_link.entity.id;
        const paymentId = event.payload.payment.entity.id;
        
        console.log('📋 Processing payment_link.paid webhook:', {
          paymentLinkId,
          paymentId
        });
        
        // Update order status
        const order = await Order.findOne({ razorpayOrderId: paymentLinkId });
        
        if (!order) {
          console.error('❌ Order not found for payment link:', paymentLinkId);
          break;
        }
        
        if (order.paymentStatus !== 'completed') {
          order.paymentStatus = 'completed';
          order.razorpayPaymentId = paymentId;
          order.status = 'confirmed';
          await order.save();
          console.log('✅ Order payment confirmed via webhook:', order._id);
          
          // Send WhatsApp confirmation notification
          try {
            const itemSummary = order.items.map(item => 
              `${item.quantity} x ${item.name} (${item.weight} ${item.unit})`
            ).join('\n');
            
            const confirmationMessage = `🎉 *Payment Successful!*\n\n` +
              `✅ Your order has been confirmed!\n\n` +
              `📦 *Order Details:*\n${itemSummary}\n\n` +
              `💰 Amount Paid: ₹${order.totalAmount.toFixed(2)}\n` +
              `🆔 Order ID: ${order._id}\n` +
              `📍 *Delivery Address:*\n${order.fullAddress}\n\n` +
              `🚚 We will contact you shortly for delivery.\n\n` +
              `Thank you for choosing us! 🙏`;
            
            await sendButtonMessage(
              order.phoneNumber,
              confirmationMessage,
              [
                { id: 'orders', title: '🛒 Order More' },
                { id: 'main_menu', title: '🏠 Main Menu' }
              ],
              "Order Confirmed"
            );
            
            console.log('📱 WhatsApp payment confirmation sent successfully to:', order.phoneNumber);
          } catch (whatsappError) {
            console.error('⚠️  Failed to send WhatsApp confirmation:', whatsappError.message);
          }
        } else {
          console.log('⏭️  Webhook: Order already completed, skipping duplicate notification');
        }
        break;
        
      case 'payment_link.cancelled':
      case 'payment_link.expired':
        const linkId = event.payload.payment_link.entity.id;
        const orderToUpdate = await Order.findOne({ razorpayOrderId: linkId });
        if (orderToUpdate) {
          orderToUpdate.paymentStatus = 'failed';
          await orderToUpdate.save();
          console.log('❌ Payment link expired/cancelled:', orderToUpdate._id);
        }
        break;
    }
    
    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
