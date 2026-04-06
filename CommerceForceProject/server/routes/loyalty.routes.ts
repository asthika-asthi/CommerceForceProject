import { Router } from 'express';
import { LoyaltyService } from '../services/loyalty.service';
import { isAuthenticated, isAdmin } from '../middleware/auth.middleware';

const router = Router();

// User Endpoints
router.get('/my/balance', isAuthenticated, async (req: any, res) => {
  res.json({ balance: await LoyaltyService.getBalance(req.user.id) });
});

router.get('/my/history', isAuthenticated, async (req: any, res) => {
  res.json(await LoyaltyService.getHistory(req.user.id));
});

// Admin Endpoints
router.get('/stats', isAuthenticated, isAdmin, async (req, res) => {
  res.json(await LoyaltyService.getAllStats());
});

router.post('/adjust', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { userId, points, description } = req.body;
    await LoyaltyService.addPoints(userId, points, 'adjustment', description);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
