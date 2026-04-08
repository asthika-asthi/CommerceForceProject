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
import { AdminService } from "./server/services/admin.service";

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

  app.get("/api/branding", async (req, res) => {
    try {
      const branding = await AdminService.getBranding();
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
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`CommerceForce server running on http://0.0.0.0:${PORT}`);
    });
  }).catch((err) => {
    console.error("Failed to start server:", err);
  });
}
