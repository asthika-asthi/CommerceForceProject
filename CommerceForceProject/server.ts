import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { initDb } from "./server/db";
import adminRoutes from "./server/routes/admin.routes";
import authRoutes from "./server/routes/auth.routes";
import productRoutes from "./server/routes/product.routes";
import orderRoutes from "./server/routes/order.routes";
import warehouseRoutes from "./server/routes/warehouse.routes";
import loyaltyRoutes from "./server/routes/loyalty.routes";
import rfqRoutes from "./server/routes/rfq.routes";
import emailRoutes from "./server/routes/email.routes";
import couponRoutes from "./server/routes/coupon.routes";
import stripeRoutes from "./server/routes/stripe.routes";
import configRoutes from "./server/routes/config.routes";
import { AdminService } from "./server/services/admin.service";
import { ConfigService } from "./server/services/config.service";

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

  app.get("/api/branding", async (req, res) => {
    try {
      const dbBranding = await AdminService.getBranding();
      const client = (req.query.client as string) || 'default';
      
      const fileBranding = await ConfigService.getBrandingConfig(client);
      const fileLanding = await ConfigService.getLandingConfig(client);
      const filePayments = await ConfigService.getPaymentsConfig(client);
      
      // Merge: File configurations override database branding
      const branding = {
        ...dbBranding,
        ...(fileBranding || {})
      };

      // Specifically override layout and payments if JSON files exist
      if (fileLanding) {
        const sections = Array.isArray(fileLanding) ? fileLanding : fileLanding.sections;
        if (sections) {
          branding.layout_config = JSON.stringify(sections);
        }
      }
      
      if (filePayments) {
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
      
      // Startup Sync
      try {
        await AdminService.ensureSchema();
        
        const client = 'default';
        const brandingJson = await ConfigService.getBrandingConfig(client);
        const landingJson = await ConfigService.getLandingConfig(client);
        const paymentsJson = await ConfigService.getPaymentsConfig(client);

        if (brandingJson || landingJson || paymentsJson) {
          console.log('Syncing configurations from JSON files to database...');
          
          const currentBranding = await AdminService.getBranding();
          const updatedBranding: any = { ...currentBranding };

          if (brandingJson) {
            Object.assign(updatedBranding, brandingJson);
          }

          if (landingJson) {
            const sections = Array.isArray(landingJson) ? landingJson : landingJson.sections;
            if (sections) {
              updatedBranding.layout_config = JSON.stringify(sections);
            }
          }

          if (paymentsJson) {
            const payments = Array.isArray(paymentsJson) ? paymentsJson : paymentsJson.methods || paymentsJson;
            updatedBranding.payment_methods_config = JSON.stringify(payments);
          }

          await AdminService.updateBranding(updatedBranding);
          console.log('Configuration sync completed successfully.');
        }
      } catch (err) {
        console.error('Failed to sync configurations on startup:', err);
      }
    });
  }).catch((err) => {
    console.error("Failed to start server:", err);
  });
}
