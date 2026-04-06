import { Router } from "express";
import { AdminService } from "../services/admin.service";
import { isAuthenticated, isAdmin, isSuperAdmin } from "../middleware/auth.middleware";

const router = Router();

// Protect all admin routes with at least admin access
router.use(isAuthenticated, isAdmin);

router.get("/stats", async (req, res) => {
  res.json(await AdminService.getDashboardStats());
});

router.get("/branding", isSuperAdmin, async (req, res) => {
  res.json(await AdminService.getBranding());
});

router.post("/branding", isSuperAdmin, async (req, res) => {
  await AdminService.updateBranding(req.body);
  res.json({ success: true });
});

router.get("/features", isSuperAdmin, async (req, res) => {
  res.json(await AdminService.getFeatureFlags());
});

router.post("/features/toggle", isSuperAdmin, async (req, res) => {
  const { key, enabled } = req.body;
  await AdminService.toggleFeatureFlag(key, enabled);
  res.json({ success: true });
});

router.get("/products", async (req, res) => {
  res.json(await AdminService.getProducts());
});

router.get("/users", isSuperAdmin, async (req, res) => {
  res.json(await AdminService.getUsers());
});

router.post("/users/:id/credit-limit", isSuperAdmin, async (req, res) => {
  const { creditLimit } = req.body;
  try {
    await AdminService.updateUserCreditLimit(req.params.id, creditLimit);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/users/:id/role", isSuperAdmin, async (req, res) => {
  const { role } = req.body;
  try {
    await AdminService.updateUserRole(req.params.id, role);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
