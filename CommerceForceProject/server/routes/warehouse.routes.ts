import { Router } from 'express';
import { WarehouseService } from '../services/warehouse.service';
import { isAuthenticated, isAdmin } from '../middleware/auth.middleware';

const router = Router();

// Warehouse Endpoints
router.get('/', isAuthenticated, async (req, res) => {
  res.json(await WarehouseService.getAll());
});

router.post('/', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const warehouse = await WarehouseService.create(req.body);
    res.status(201).json(warehouse);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const warehouse = await WarehouseService.update(req.params.id, req.body);
    res.json(warehouse);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Inventory Endpoints
router.get('/:id/inventory', isAuthenticated, async (req, res) => {
  res.json(await WarehouseService.getInventoryByWarehouse(req.params.id));
});

router.post('/:id/inventory', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { productId, quantity, minStockLevel } = req.body;
    const inventory = await WarehouseService.updateStock(req.params.id, productId, quantity, minStockLevel);
    res.json(inventory);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Alerts Endpoints
router.get('/inventory/alerts', isAuthenticated, isAdmin, async (req, res) => {
  res.json(await WarehouseService.getAlerts());
});

router.patch('/inventory/alerts/:id/read', isAuthenticated, isAdmin, async (req, res) => {
  await WarehouseService.markAlertAsRead(req.params.id);
  res.json({ success: true });
});

export default router;
