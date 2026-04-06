import { Router } from 'express';
import { EmailService } from '../services/email.service';
import { isAuthenticated, isAdmin } from '../middleware/auth.middleware';

const router = Router();

// Admin Endpoints
router.get('/logs', isAuthenticated, isAdmin, async (req, res) => {
  res.json(await EmailService.getAllLogs());
});

router.get('/logs/:recipient', isAuthenticated, isAdmin, async (req, res) => {
  res.json(await EmailService.getLogsByRecipient(req.params.recipient));
});

export default router;
