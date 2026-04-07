import { Router } from "express";
import { AdminService } from "../services/admin.service";
import { isAuthenticated, isAdmin, isSuperAdmin } from "../middleware/auth.middleware";
import multer from "multer";
import path from "path";

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `logo-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage });

// Protect all admin routes with at least admin access
router.use(isAuthenticated, isAdmin);

router.post("/branding/upload", isSuperAdmin, upload.single('logo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  const logoUrl = `/uploads/${req.file.filename}`;
  res.json({ logoUrl });
});

router.post("/seed", isSuperAdmin, async (req, res) => {
  try {
    await AdminService.seedData();
    res.json({ success: true, message: "Demo data seeded successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

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

router.get("/features", async (req, res) => {
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

router.get("/users/by-email/:email", async (req, res) => {
  const user = await AdminService.getUserByEmail(req.params.email);
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ error: "User not found" });
  }
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
