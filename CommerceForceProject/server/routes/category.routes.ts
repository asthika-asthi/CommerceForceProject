import { Router } from 'express';
import { CategoryService } from '../services/category.service';

const router = Router();

// Public route to get hierarchical categories for navigation
router.get('/', async (req, res) => {
  try {
    const categories = await CategoryService.getAll();
    // Only return top-level active categories for the initial menu, 
    // or return everything and we filter in frontend.
    // Let's return everything so the frontend can build the tree.
    res.json(categories.filter(c => c.is_active));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
