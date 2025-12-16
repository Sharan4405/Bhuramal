import express from 'express';
import * as controller from '../controllers/webhookController.js';

const router = express.Router();

// Verification (GET) and message webhook (POST)
router.get('/', controller.verifyWebhook);
router.post('/', controller.handleIncoming);

export default router;
