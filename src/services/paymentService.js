import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

/**
 * Create a Razorpay payment link for an order
 * @param {Object} orderData - Order details
 * @param {string} orderData.orderId - Database order ID
 * @param {number} orderData.amount - Amount in rupees
 * @param {string} orderData.customerName - Customer name
 * @param {string} orderData.customerPhone - Customer phone number
 * @param {string} orderData.description - Order description
 * @returns {Promise<Object>} Payment link details
 */
export async function createPaymentLink(orderData) {
  try {
    const { orderId, amount, customerName, customerPhone, description } = orderData;
    
    // Create payment link - webhook will handle payment confirmation
    const paymentLink = await razorpay.paymentLink.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      description: description || `Order Payment - ${orderId}`,
      customer: {
        name: customerName,
        contact: customerPhone
      },
      notify: {
        sms: false,      // Disabled - we send our own WhatsApp message
        whatsapp: false  // Disabled - we send our own WhatsApp message
      },
      notes: {
        order_id: orderId
      }
    });

    return {
      success: true,
      paymentLinkId: paymentLink.id,
      paymentLink: paymentLink.short_url,
      amount: amount,
      expiresAt: paymentLink.expire_by
    };
  } catch (error) {
    console.error('❌ Error creating payment link:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Verify Razorpay payment signature
 * @param {string} orderId - Razorpay order ID
 * @param {string} paymentId - Razorpay payment ID
 * @param {string} signature - Razorpay signature
 * @returns {boolean} Whether signature is valid
 */
export function verifyPaymentSignature(orderId, paymentId, signature) {
  try {
    const text = `${orderId}|${paymentId}`;
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');
    
    return generatedSignature === signature;
  } catch (error) {
    console.error('❌ Error verifying signature:', error);
    return false;
  }
}

/**
 * Get payment details by payment ID
 * @param {string} paymentId - Razorpay payment ID
 * @returns {Promise<Object>} Payment details
 */
export async function getPaymentDetails(paymentId) {
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return {
      success: true,
      payment
    };
  } catch (error) {
    console.error('❌ Error fetching payment:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get payment link status
 * @param {string} linkId - Payment link ID
 * @returns {Promise<Object>} Payment link status
 */
export async function getPaymentLinkStatus(linkId) {
  try {
    const link = await razorpay.paymentLink.fetch(linkId);
    return {
      success: true,
      status: link.status,
      link
    };
  } catch (error) {
    console.error('❌ Error fetching payment link:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export default {
  createPaymentLink,
  verifyPaymentSignature,
  getPaymentDetails,
  getPaymentLinkStatus
};
