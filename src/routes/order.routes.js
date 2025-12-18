import express from 'express';
import { 
  createOrderFromCart,
  getMyOrders,
  getOrderById,
  getOrderByNumber,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
  getOrderStats
} from '../controllers/order.controller.js';
import { authenticateUser, authenticateRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

// User routes
router.post('/create', authenticateUser, createOrderFromCart);
router.get('/my-orders', authenticateUser, getMyOrders);
router.get('/:orderId', authenticateUser, getOrderById);
router.get('/number/:orderNumber', authenticateUser, getOrderByNumber);
router.patch('/:orderId/cancel', authenticateUser, cancelOrder);

// Admin routes
router.get('/admin/all', authenticateRole(['admin']), getAllOrders);
router.patch('/admin/:orderId/status', authenticateRole(['admin']), updateOrderStatus);
router.get('/admin/stats', authenticateRole(['admin']), getOrderStats);

export default router;
