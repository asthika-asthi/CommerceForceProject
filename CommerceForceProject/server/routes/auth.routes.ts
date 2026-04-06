import { Router } from 'express';
import { AuthService } from '../services/auth.service';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const result = await AuthService.register(req.body);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const result = await AuthService.login(req.body);
    res.json(result);
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
});

router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = AuthService.verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  try {
    const user = await AuthService.getUserById(decoded.id);
    res.json({ user });
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

export default router;
