import { Router } from 'express';
import { OrderService } from '../services/order.service';
import { isAuthenticated, isAdmin } from '../middleware/auth.middleware';

const router = Router();

// Get all orders (Admin only)
router.get('/', isAuthenticated, isAdmin, async (req: any, res) => {
  try {
    const orders = await OrderService.getAll();
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's orders
router.get('/my', isAuthenticated, async (req: any, res) => {
  try {
    const orders = await OrderService.getByUserId(req.user.id);
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get order by ID
router.get('/:id', isAuthenticated, async (req: any, res) => {
  try {
    const order = await OrderService.getById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Allow if admin or if user owns the order
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin' && req.user.role !== 'client' && order.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    res.json(order);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create order
router.post('/', isAuthenticated, async (req: any, res) => {
  try {
    const order = await OrderService.create(req.user.id, req.body);
    res.status(201).json(order);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Update order status (Admin only)
router.patch('/:id/status', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    const order = await OrderService.updateStatus(req.params.id, status);
    res.json(order);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
