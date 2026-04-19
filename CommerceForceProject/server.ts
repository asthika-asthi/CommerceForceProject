import { config as dotenvConfig } from 'dotenv';
const dotenvResult = dotenvConfig();
console.log('Dotenv Load Result:', { 
  error: dotenvResult.error ? dotenvResult.error.message : 'None',
  parsed: dotenvResult.parsed ? Object.keys(dotenvResult.parsed) : 'None'
});

import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { initDb } from "./server/db.ts";
import adminRoutes from "./server/routes/admin.routes.ts";
import authRoutes from "./server/routes/auth.routes.ts";
import productRoutes from "./server/routes/product.routes.ts";
import orderRoutes from "./server/routes/order.routes.ts";
import warehouseRoutes from "./server/routes/warehouse.routes.ts";
import loyaltyRoutes from "./server/routes/loyalty.routes.ts";
import rfqRoutes from "./server/routes/rfq.routes.ts";
import emailRoutes from "./server/routes/email.routes.ts";
import couponRoutes from "./server/routes/coupon.routes.ts";
import stripeRoutes from "./server/routes/stripe.routes.ts";
import configRoutes from "./server/routes/config.routes.ts";
import importRoutes from "./server/routes/import.routes.ts";
import storageRoutes from "./server/routes/storage.routes.ts";
import { AdminService } from "./server/services/admin.service.ts";
import { ConfigService } from "./server/services/config.service.ts";
import { StorageService } from "./server/services/storage.service.ts";

if (!import.meta.url) {
  throw new Error('import.meta.url is undefined. Ensure you are running in ESM mode.');
}
console.log('Starting server with import.meta.url:', import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createApp() {
  const app = express();

  // Initialize Database
  await initDb();
  StorageService.init();

  app.use(express.json());
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  // API Routes
  app.use("/api/admin", adminRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/products", productRoutes);
  app.use("/api/orders", orderRoutes);
  app.use("/api/warehouses", warehouseRoutes);
  app.use("/api/loyalty", loyaltyRoutes);
  app.use("/api/rfq", rfqRoutes);
  app.use("/api/email", emailRoutes);
  app.use("/api/coupons", couponRoutes);
  app.use("/api/stripe", stripeRoutes);
  app.use("/api/config", configRoutes);
  app.use("/api/admin/import", importRoutes);
  app.use("/api/storage", storageRoutes);

  app.get("/api/branding", async (req, res) => {
    try {
      const dbBranding = await AdminService.getBranding();
      const client = (req.query.client as string) || 'default';
      
      const fileBranding = await ConfigService.getBrandingConfig(client);
      const fileLanding = await ConfigService.getLandingConfig(client);
      const filePayments = await ConfigService.getPaymentsConfig(client);
      
      // Database is the source of truth, files are synced to DB on startup
      // We only merge files here if the DB is missing critical info (fallback)
      const branding = {
        ...dbBranding
      };

      // If DB is empty or missing company name, use file as fallback
      if (!branding.company_name && fileBranding) {
        Object.assign(branding, fileBranding);
      }
      
      // If DB layout is empty, use file as fallback
      if ((!branding.layout_config || branding.layout_config === '[]') && fileLanding) {
        const sections = Array.isArray(fileLanding) ? fileLanding : fileLanding.sections;
        if (sections) {
          branding.layout_config = JSON.stringify(sections);
        }
      }
      
      // If DB payments is empty, use file as fallback
      if ((!branding.payment_methods_config || branding.payment_methods_config === '[]') && filePayments) {
        const payments = Array.isArray(filePayments) ? filePayments : filePayments.methods || filePayments;
        branding.payment_methods_config = JSON.stringify(payments);
      }
      
      res.json(branding);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "CommerceForce API is running" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  return app;
}

if (process.env.NODE_ENV !== 'test') {
  createApp().then(app => {
    const PORT = 3000;
    app.listen(PORT, "0.0.0.0", async () => {
      console.log(`CommerceForce server running on http://0.0.0.0:${PORT}`);
      
      // Environment Check
      console.log('Environment Check:', {
        NODE_ENV: process.env.NODE_ENV,
        SMTP_HOST: (process.env.SMTP_HOST || process.env.EMAIL_HOST) ? 'Configured' : 'Missing',
        SMTP_USER: (process.env.SMTP_USER || process.env.EMAIL_USER) ? 'Configured' : 'Missing',
        SMTP_PASS: (process.env.SMTP_PASS || process.env.EMAIL_PASS) ? 'Configured' : 'Missing'
      });

      // Startup Sync
      try {
        await AdminService.ensureSchema();
        
        const client = 'default';
        const brandingJson = await ConfigService.getBrandingConfig(client);
        const landingJson = await ConfigService.getLandingConfig(client);
        const paymentsJson = await ConfigService.getPaymentsConfig(client);

        if (brandingJson || landingJson || paymentsJson) {
          console.log('Checking for configuration sync from JSON files to database...');
          
          const currentBranding = await AdminService.getBranding();
          const updatedBranding: any = { ...currentBranding };
          let needsUpdate = false;

          // Only sync branding if DB is using default company name or is empty or "B2B Portal"
          if (brandingJson && (!currentBranding.company_name || 
                               currentBranding.company_name === 'TechParts Pro' || 
                               currentBranding.company_name === 'B2B Portal' ||
                               currentBranding.company_name === 'CommerceForce')) {
            console.log('Syncing branding.json to database...');
            Object.assign(updatedBranding, brandingJson);
            needsUpdate = true;
          }

          // Only sync layout if DB layout is empty or default
          if (landingJson && (!currentBranding.layout_config || currentBranding.layout_config === '[]')) {
            const sections = Array.isArray(landingJson) ? landingJson : landingJson.sections;
            if (sections) {
              console.log('Syncing landing.json to database...');
              updatedBranding.layout_config = JSON.stringify(sections);
              needsUpdate = true;
            }
          }

          // Only sync payments if DB payments is empty or default
          if (paymentsJson && (!currentBranding.payment_methods_config || currentBranding.payment_methods_config === '[]')) {
            const payments = Array.isArray(paymentsJson) ? paymentsJson : paymentsJson.methods || paymentsJson;
            console.log('Syncing payments.json to database...');
            updatedBranding.payment_methods_config = JSON.stringify(payments);
            needsUpdate = true;
          }

          if (needsUpdate) {
            await AdminService.updateBranding(updatedBranding);
            console.log('Configuration sync completed successfully.');
          } else {
            console.log('Database already has custom configuration. Skipping JSON sync.');
          }
        }
      } catch (err) {
        console.error('Failed to sync configurations on startup:', err);
      }
    });
  }).catch((err) => {
    console.error("Failed to start server:", err);
  });
}
