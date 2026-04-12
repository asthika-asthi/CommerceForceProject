import { Router } from 'express';
import { ConfigService } from '../services/config.service';

const router = Router();

router.get('/landing', async (req, res) => {
  const client = (req.query.client as string) || 'default';
  const config = await ConfigService.getLandingConfig(client);
  if (!config) return res.status(404).json({ error: 'Landing config not found' });
  res.json(config);
});

router.get('/category', async (req, res) => {
  const client = (req.query.client as string) || 'default';
  const config = await ConfigService.getCategoryConfig(client);
  if (!config) return res.status(404).json({ error: 'Category config not found' });
  res.json(config);
});

export default router;
