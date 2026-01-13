import express from 'express';
import { login, logout, setup } from '../controllers/authController.js';

const router = express.Router();

// Admin login
router.post('/login', login);

// Logout - client deletes token, this just confirms
router.post('/logout', logout);

// Create first admin (only if no admins exist)
router.post('/setup', setup);

export default router;
