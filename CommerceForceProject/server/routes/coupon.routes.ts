import { Router } from 'express';
import { CouponService } from '../services/coupon.service';
import { isAuthenticated, isAdmin } from '../middleware/auth.middleware';

const router = Router();

// Public/Customer Endpoints
router.get('/validate/:code', isAuthenticated, async (req, res) => {
  const { amount } = req.query;
  const result = await CouponService.validateCoupon(req.params.code, parseFloat(amount as string) || 0);
  res.json(result);
});

// Admin Endpoints
router.get('/', isAuthenticated, isAdmin, async (req, res) => {
  res.json(await CouponService.getAll());
});

router.post('/', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const coupon = await CouponService.create(req.body);
    res.status(201).json(coupon);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', isAuthenticated, isAdmin, async (req, res) => {
  await CouponService.delete(req.params.id);
  res.json({ success: true });
});

export default router;
