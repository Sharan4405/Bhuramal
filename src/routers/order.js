import express from 'express';
import {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  updateOrder,
  deleteOrder,
  getOrderStats
} from '../controllers/orderController.js';
import { requireAuth } from '../utils/auth.js';

const router = express.Router();

// All order management routes require authentication
router.get('/', requireAuth, getAllOrders); // GET /api/orders?search=BBP&status=pending&page=1&limit=20
router.get('/stats', requireAuth, getOrderStats); // GET /api/orders/stats?startDate=2025-01-01&endDate=2025-12-31
router.get('/:id', requireAuth, getOrderById); // GET /api/orders/:id (MongoDB _id or orderId)
router.patch('/:id/status', requireAuth, updateOrderStatus); // PATCH /api/orders/:id/status
router.put('/:id', requireAuth, updateOrder); // PUT /api/orders/:id
router.delete('/:id', requireAuth, deleteOrder); // DELETE /api/orders/:id?permanent=true

export default router;
