import express from 'express';
import { handlePaymentWebhook } from '../controllers/paymentController.js';

const router = express.Router();

/**
 * Razorpay webhook endpoint - handles all payment events
 * No callback/redirect needed - webhook processes everything
 */
router.post('/webhook', express.json(), handlePaymentWebhook);

export default router;
