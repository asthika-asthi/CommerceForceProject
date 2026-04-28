import { Router } from 'express';
import { ProductService } from '../services/product.service';
import { AdminService } from '../services/admin.service';
import { isAuthenticated, isAdmin, isSuperAdmin } from '../middleware/auth.middleware';

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

// Stock validation endpoint
router.post('/validate-stock', async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Items array is required' });
    }

    const { WarehouseService } = await import('../services/warehouse.service');
    
    for (const item of items) {
      const stock = await WarehouseService.getStockLevel(item.productId);
      if (stock < item.quantity) {
        const product = await ProductService.getById(item.productId);
        const productName = product?.name || 'Product';
        return res.status(400).json({ error: `We're sorry, it looks like we don't have enough of ${productName} in stock. We only have ${stock} units available at this time.` });
      }
    }

    res.json({ valid: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin routes
router.post('/', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const product = await ProductService.create(req.body);
    await AdminService.logActivity((req as any).user?.id, 'Product Created', `Product: ${product.name} (SKU: ${product.sku})`);
    res.status(201).json(product);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const product = await ProductService.update(req.params.id, req.body);
    await AdminService.logActivity((req as any).user?.id, 'Product Updated', `Product: ${product.name} (SKU: ${product.sku})`);
    res.json(product);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const product = await ProductService.getById(req.params.id);
    await ProductService.delete(req.params.id);
    if (product) {
      await AdminService.logActivity((req as any).user?.id, 'Product Deleted', `Product: ${product.name} (SKU: ${product.sku})`);
    }
    res.status(204).end();
  } catch (error: any) {
    if (error.message?.includes('Cannot delete product with existing orders')) {
      return res.status(400).json({ error: error.message });
    }
    if (error.message?.includes('FOREIGN KEY') || error.message?.includes('constraint')) {
      return res.status(400).json({ error: 'Cannot delete product with existing records that depend on it. Try deactivating it instead.' });
    }
    res.status(500).json({ error: error.message });
  }
});

export default router;
