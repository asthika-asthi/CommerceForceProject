import { Router } from 'express';
import { NewsletterService } from '../services/newsletter.service';

const router = Router();

router.post('/subscribe', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Invalid email address' });
    }
    const result = await NewsletterService.subscribe(email);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
