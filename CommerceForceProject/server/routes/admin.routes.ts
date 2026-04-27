import { Router } from "express";
import { AdminService } from "../services/admin.service";
import { ConfigService } from "../services/config.service";
import { CategoryService } from "../services/category.service";
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
  try {
    // 1. Update Database
    await AdminService.updateBranding(req.body);
    await AdminService.logActivity((req as any).user?.id, 'Branding Updated', 'System branding and configuration updated');

    // 2. Sync to JSON Config (branding.json)
    const currentBranding = await ConfigService.getBrandingConfig();
    const brandingJson: any = { ...currentBranding };
    
    const brandingFields = [
      'company_name', 'logo_url', 'favicon_url', 'primary_color', 'secondary_color',
      'font_family', 'button_style', 'background_style', 'background_value',
      'footer_copyright', 'footer_use_brand_color', 'contact_page_enabled', 'footer_email',
      'footer_phone', 'footer_address', 'social_links_enabled', 'currency_symbol', 'currency_code',
      'base_font_size', 'hero_font_size', 'heading_font_size', 'content_font_size',
      'carousel_enabled', 'carousel_images', 'hero_enabled',
      'hero_title', 'hero_subtitle', 'hero_image_url', 'hero_cta_text', 'hero_cta_link',
      'admin_email', 'catalogue_url', 'nav_font_family', 'nav_text_color', 
      'sidebar_font_size', 'sidebar_font_weight', 'top_nav_font_size', 'top_nav_font_weight',
      'nav_heading_color', 'nav_heading_font_weight', 'sidebar_background_style', 
      'sidebar_background_value', 'top_nav_background_style', 'top_nav_background_value',
      'footer_background_style', 'footer_background_value', 'category_display_style', 'footer_tagline'
    ];
    
    brandingFields.forEach(field => {
      if (req.body[field] !== undefined) {
        brandingJson[field] = req.body[field];
      }
    });
    
    await ConfigService.saveBrandingConfig(brandingJson);

    // 3. Sync to JSON Config (landing.json) if layout_config is present
    if (req.body.layout_config) {
      try {
        const sections = JSON.parse(req.body.layout_config);
        await ConfigService.saveLandingConfig({ sections });
      } catch (e) {
        console.error('Failed to parse layout_config for JSON sync:', e);
      }
    }

    // 4. Sync to JSON Config (payments.json) if payment_methods_config is present
    if (req.body.payment_methods_config) {
      try {
        const methods = JSON.parse(req.body.payment_methods_config);
        await ConfigService.savePaymentsConfig(methods);
      } catch (e) {
        console.error('Failed to parse payment_methods_config for JSON sync:', e);
      }
    }

    res.json({ success: true });
  } catch (err: any) {
    console.error('Failed to update branding and sync config:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/features", async (req, res) => {
  res.json(await AdminService.getFeatureFlags());
});

router.post("/features/toggle", isSuperAdmin, async (req, res) => {
  const { key, enabled } = req.body;
  await AdminService.toggleFeatureFlag(key, enabled);
  await AdminService.logActivity((req as any).user?.id, 'Feature Toggled', `Feature ${key} set to ${enabled ? 'enabled' : 'disabled'}`);
  res.json({ success: true });
});

router.get("/products", async (req, res) => {
  res.json(await AdminService.getProducts());
});

// Category Management
router.get("/categories", async (req, res) => {
  try {
    const categories = await CategoryService.getAll();
    res.json(categories);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/categories", async (req, res) => {
  try {
    const category = await CategoryService.create(req.body);
    await AdminService.logActivity((req as any).user?.id, 'Category Created', `Category: ${category.name}`);
    res.status(201).json(category);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.put("/categories/:id", async (req, res) => {
  try {
    await CategoryService.update(parseInt(req.params.id), req.body);
    await AdminService.logActivity((req as any).user?.id, 'Category Updated', `ID: ${req.params.id}`);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete("/categories/:id", async (req, res) => {
  try {
    await CategoryService.delete(parseInt(req.params.id));
    await AdminService.logActivity((req as any).user?.id, 'Category Deleted', `ID: ${req.params.id}`);
    res.status(204).end();
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
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
    await AdminService.logActivity((req as any).user?.id, 'Credit Limit Updated', `User ID ${req.params.id} credit limit set to ${creditLimit}`);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/users/:id/role", isSuperAdmin, async (req, res) => {
  const { role } = req.body;
  try {
    await AdminService.updateUserRole(req.params.id, role);
    await AdminService.logActivity((req as any).user?.id, 'User Role Updated', `User ID ${req.params.id} role set to ${role}`);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
