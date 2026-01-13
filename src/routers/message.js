import express from 'express';
import { requireAuth } from '../utils/auth.js';
import { sendMessageToUser } from '../controllers/messageController.js';

const router = express.Router();

// Send message from dashboard to user
router.post('/send', requireAuth, sendMessageToUser);

export default router;
