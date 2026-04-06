import { Router } from 'express';
import { ProductService } from '../services/product.service';
import { isAuthenticated, isAdmin } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/', async (req, res) => {
  try {
    const products = await ProductService.getAll();
    res.json(products);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await ProductService.getById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin routes
router.post('/', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const product = await ProductService.create(req.body);
    res.status(201).json(product);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const product = await ProductService.update(req.params.id, req.body);
    res.json(product);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    await ProductService.delete(req.params.id);
    res.status(204).end();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
