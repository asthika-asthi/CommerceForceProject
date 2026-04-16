import { Router } from "express";
import { ImportService } from "../services/import.service";
import { StorageService } from "../services/storage.service";
import { isAuthenticated, isSuperAdmin } from "../middleware/auth.middleware";
import multer from "multer";
import path from "path";
import fs from "fs";
import { AdminService } from "../services/admin.service";

const router = Router();
const upload = multer({ dest: 'uploads/temp/' });

// Protect all import routes with superadmin access
router.use(isAuthenticated, isSuperAdmin);

/**
 * Bulk Product CSV Import
 */
router.post("/products/csv", upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  try {
    const results = await ImportService.processProductCsv(req.file.path, (req as any).user.id);
    // Cleanup temp file
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    
    res.json(results);
  } catch (err: any) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Master JSON Config Import
 */
router.post("/config/master", upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  try {
    const result = await ImportService.processMasterConfig(req.file.path, (req as any).user.id);
    // Cleanup temp file
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    
    if (result.success) {
      res.json({ success: true, message: "Master configuration updated successfully" });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (err: any) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Download Product CSV Template
 */
router.get("/products/template", async (req, res) => {
  const headers = "id,name,description,category,base_price,sale_percentage,image_url,allow_direct_buy\n";
  const example = ",Example Product,This is a description,Electronics,99.99,10,https://picsum.photos/200,true\n";
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=product_template.csv');
  res.send(headers + example);
});

/**
 * Export Current Config as Master JSON
 */
router.get("/config/export", async (req, res) => {
  try {
    const branding = await AdminService.getBranding();
    const features = await AdminService.getFeatureFlags();
    
    // Construct master config
    const masterConfig = {
      branding,
      features,
      // Landing config is in branding.layout_config as JSON string
      landing: branding.layout_config ? JSON.parse(branding.layout_config) : []
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=master_config.json');
    res.send(JSON.stringify(masterConfig, null, 2));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
