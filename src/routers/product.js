import express from 'express';
import {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  bulkUpdateStock
} from '../controllers/productController.js';
import {requireAuth}  from '../utils/auth.js';

const router = express.Router();

// Public routes (can be accessed without authentication if needed)
router.get('/', getAllProducts); // GET /api/products?search=tea&category=Beverages&inStock=true
router.get('/categories', getCategories); // GET /api/products/categories

// Protected routes (require admin authentication)
router.post('/', requireAuth, createProduct); // POST /api/products
router.put('/:id', requireAuth, updateProduct); // PUT /api/products/:id
router.delete('/:id', requireAuth, deleteProduct); // DELETE /api/products/:id
router.patch('/bulk/stock', requireAuth, bulkUpdateStock); // PATCH /api/products/bulk/stock

export default router;
