import express from 'express';
import { requireAuth } from '../utils/auth.js';
import { 
  getConversations, 
  getMessages, 
  resolveConversation, 
  reopenConversation 
} from '../controllers/conversationController.js';

const router = express.Router();

// Get all conversations (paginated)
router.get('/', requireAuth, getConversations);

// Get messages for a conversation
router.get('/:id/messages', requireAuth, getMessages);

// Resolve conversation
router.patch('/:id/resolve', requireAuth, resolveConversation);

// Reopen conversation
router.patch('/:id/reopen', requireAuth, reopenConversation);

export default router;
