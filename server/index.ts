import express from "express";
import { createServer as createViteServer } from "vite";
import * as dotenv from "dotenv";
import { corsMiddleware } from "./middleware/cors";

// Routes imports
import healthRoutes from "./routes/health.routes";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import bootstrapRoutes from "./routes/bootstrap.routes";
import cityRoutes from "./routes/city.routes";
import adminRoutes from "./routes/admin.routes";
import contentRoutes from "./routes/content.routes";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Middleware
  app.use(corsMiddleware);

  // Fix preflight OPTIONS per Express 5
  app.use((req, res, next) => {
    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }
    next();
  });

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Register Routes
  app.use("/api", healthRoutes);
  console.log("[Route] Loaded: /api/health");

  app.use("/api/dev", authRoutes);
  console.log("[Route] Loaded: /api/dev/login");

  app.use("/api/user", userRoutes);
  console.log("[Route] Loaded: /api/user/me");

  app.use("/api/bootstrap", bootstrapRoutes);
  console.log("[Route] Loaded: /api/bootstrap/* (all, cities, messages, profiles, levels, sponsors)");

  app.use("/api/city", cityRoutes);
  console.log("[Route] Loaded: /api/city/:cityId/details");

  app.use("/api/admin", adminRoutes);
  console.log("[Route] Loaded: /api/admin/create-user");

  app.use("/api", contentRoutes); // content handles /api/partner-integrations and /api/bootstrap/content
  console.log("[Route] Loaded: /api/partner-integrations");
  console.log("[Route] Loaded: /api/bootstrap/content");

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve static files from dist
    app.use(express.static("dist"));
  }

  app.listen(PORT, "127.0.0.1", () => {
    console.log(`Server running on http://127.0.0.1:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
});
