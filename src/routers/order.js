import express from 'express';
import {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  updateOrder,
  deleteOrder,
  getOrderStats
} from '../controllers/orderController.js';
import { verifyToken } from '../utils/auth.js';

const router = express.Router();

// All order management routes require authentication
router.get('/', verifyToken, getAllOrders); // GET /api/orders?search=BBP&status=pending&page=1&limit=20
router.get('/stats', verifyToken, getOrderStats); // GET /api/orders/stats?startDate=2025-01-01&endDate=2025-12-31
router.get('/:id', verifyToken, getOrderById); // GET /api/orders/:id (MongoDB _id or orderId)
router.patch('/:id/status', verifyToken, updateOrderStatus); // PATCH /api/orders/:id/status
router.put('/:id', verifyToken, updateOrder); // PUT /api/orders/:id
router.delete('/:id', verifyToken, deleteOrder); // DELETE /api/orders/:id?permanent=true

export default router;
