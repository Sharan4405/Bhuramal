import express from 'express';
import { handlePaymentCallback, handlePaymentWebhook } from '../controllers/paymentController.js';

const router = express.Router();

/**
 * Payment callback endpoint (browser redirect after payment)
 * This shows a success page and auto-redirects to WhatsApp
 */
router.get('/callback', handlePaymentCallback);

/**
 * Razorpay webhook endpoint (server-to-server notification)
 * This is the PREFERRED method for processing payments
 * It works even if the user closes their browser
 */
router.post('/webhook', express.json(), handlePaymentWebhook);

export default router;
