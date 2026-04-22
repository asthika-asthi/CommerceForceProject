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
  const headers = "id,sku,name,description,category,base_price,sale_percentage,image_url,images,allow_direct_buy,is_active,is_featured,initial_stock,min_stock_level\n";
  const example = ",SKU-001,Example Product,This is a description,Electronics,99.99,10,https://picsum.photos/200,\"https://picsum.photos/300,https://picsum.photos/400\",true,true,false,50,5\n";
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=product_template.csv');
  res.send(headers + example);
});

/**
 * Export All Products as Master CSV
 */
router.get("/products/export", async (req, res) => {
  try {
    const products = await AdminService.getProducts();
    const headers = ["id", "sku", "name", "description", "category", "base_price", "sale_percentage", "image_url", "images", "allow_direct_buy", "is_active", "is_featured", "total_stock"];
    
    const rows = products.map(p => {
      return headers.map(h => {
        let val = (p as any)[h];
        if (h === 'images' && Array.isArray(val)) {
          return `"${val.join(',')}"`;
        }
        if (typeof val === 'string' && val.includes(',')) {
          return `"${val}"`;
        }
        return val !== undefined && val !== null ? val : "";
      }).join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=master_products.csv');
    res.send(csv);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Export Current Config as Master JSON
 */
router.get("/config/export", async (req, res) => {
  try {
    const branding = await AdminService.getBranding();
    const features = await AdminService.getFeatureFlags();
    
    // Ensure all branding fields from BrandingConfig interface are present for ease of editing
    const brandingKeys = [
      'company_name', 'domain', 'logo_url', 'favicon_url', 'primary_color', 'secondary_color', 
      'font_family', 'button_style', 'background_style', 'background_value', 'hero_title', 
      'hero_subtitle', 'hero_image_url', 'hero_cta_text', 'hero_cta_link', 'featured_products', 
      'layout_config', 'footer_config', 'footer_email', 'footer_address', 'footer_phone', 
      'footer_copyright', 'footer_use_brand_color', 'social_links_enabled', 'contact_page_enabled', 
      'payment_methods_config', 'currency_symbol', 'currency_code', 'base_font_size', 
      'hero_font_size', 'heading_font_size', 'content_font_size', 'carousel_enabled', 
      'hero_enabled', 'carousel_images', 'catalogue_url', 'admin_email', 'footer_tagline',
      'loyalty_points_per_currency', 'loyalty_redemption_value', 'loyalty_program_name', 'loyalty_banner_image',
      'category_display_style', 'nav_font_family', 'nav_text_color', 
      'sidebar_font_size', 'sidebar_font_weight', 'top_nav_font_size', 'top_nav_font_weight',
      'nav_heading_color', 'nav_heading_font_weight'
    ];

    const fullBranding: any = {};
    brandingKeys.forEach(key => {
      fullBranding[key] = (branding as any)[key] !== undefined ? (branding as any)[key] : null;
    });

    // Construct master config with all fields
    const masterConfig = {
      branding: fullBranding,
      features: features.map(f => ({
        feature_key: f.feature_key,
        enabled: f.enabled,
        description: f.description || "",
        config_json: f.config_json || "{}"
      })),
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
