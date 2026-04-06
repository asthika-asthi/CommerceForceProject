import { Router } from 'express';
import { RFQService } from '../services/rfq.service';
import { isAuthenticated, isAdmin } from '../middleware/auth.middleware';

const router = Router();

// Customer Endpoints
router.post('/', isAuthenticated, async (req: any, res) => {
  try {
    const rfq = await RFQService.create(req.user.id, req.body);
    res.status(201).json(rfq);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/my', isAuthenticated, async (req: any, res) => {
  res.json(await RFQService.getByUserId(req.user.id));
});

router.get('/:id', isAuthenticated, async (req: any, res) => {
  const rfq = await RFQService.getById(req.params.id);
  if (!rfq) return res.status(404).json({ error: 'RFQ not found' });
  
  // Security check: only owner or admin can view
  if (rfq.user_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'superadmin' && req.user.role !== 'client') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  res.json(rfq);
});

router.patch('/:id/accept', isAuthenticated, async (req: any, res) => {
  const rfq = await RFQService.getById(req.params.id);
  if (!rfq || rfq.user_id !== req.user.id) return res.status(404).json({ error: 'RFQ not found' });
  
  if (rfq.status !== 'quoted') {
    return res.status(400).json({ error: 'Only quoted RFQs can be accepted' });
  }
  
  const updated = await RFQService.updateStatus(req.params.id, 'accepted');
  res.json(updated);
});

router.post('/:id/convert', isAuthenticated, async (req: any, res) => {
  try {
    const { paymentMethod, couponCode } = req.body;
    const result = await RFQService.convertToOrder(req.params.id, paymentMethod, couponCode);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Admin Endpoints
router.get('/', isAuthenticated, isAdmin, async (req, res) => {
  res.json(await RFQService.getAll());
});

router.patch('/:id/quote', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const rfq = await RFQService.updateQuote(req.params.id, req.body);
    res.json(rfq);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/:id/status', isAuthenticated, isAdmin, async (req, res) => {
  const rfq = await RFQService.updateStatus(req.params.id, req.body.status);
  res.json(rfq);
});

export default router;
