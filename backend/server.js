/**
 * MultiCommerce API entry (Express).
 * - CORS, Helmet, cookies, JSON parsing, compression
 * - ensureDb() before /api (needed on Vercel cold starts)
 * - All REST routes under /api — see docs/04-API-MODULES.md
 */
import express from "express";
import helmet from "helmet";
import compression from "compression";
import router from "./routers/index.js";
import { ensureDb } from "./configs/database.js";
import envConfig from "./configs/envConfig.js";
import { redisStatus } from "./configs/redis.js";
import cors from "cors";
import cookieParser from "cookie-parser";

const PORT = envConfig.PORT || 8080;
const app = express();

// Needed for correct client IP behind Docker / reverse proxies (rate limit).
if (process.env.TRUST_PROXY === "1" || process.env.VERCEL === "1") {
  app.set("trust proxy", 1);
}

/** Allow CLIENT_URL list + local Vite ports during development. */
function resolveCorsOrigin() {
  const raw = envConfig.CLIENT_URL || "http://localhost:5173";
  const allowed = String(raw)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const isDev =
    process.env.NODE_ENV !== "production" && process.env.VERCEL !== "1";

  return (origin, callback) => {
    // Same-origin / non-browser tools (curl, Postman)
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowed.includes(origin)) {
      callback(null, true);
      return;
    }

    // Vite often jumps to 5174+ when 5173 is busy
    if (
      isDev &&
      /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)
    ) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked for origin: ${origin}`));
  };
}

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(compression());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: resolveCorsOrigin(),
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "X-App-Portal"],
    exposedHeaders: ["Content-Type", "Authorization", "X-Cache"],
    optionsSuccessStatus: 200,
    maxAge: 86400,
  })
);
app.use(cookieParser());

// Wait for MongoDB on every API request (required on Vercel cold starts).
app.use("/api", ensureDb, router);

app.get("/health", async (_req, res) => {
  let dbState = "unknown";
  try {
    const { connectDB } = await import("./configs/database.js");
    await connectDB();
    const { default: mongoose } = await import("mongoose");
    const states = ["disconnected", "connected", "connecting", "disconnecting"];
    dbState = states[mongoose.connection.readyState] || String(mongoose.connection.readyState);
  } catch (err) {
    return res.status(503).json({
      status: "degraded",
      service: "MultiCommerce API",
      db: "error",
      redis: redisStatus(),
      message: err.message || "Database unavailable",
      timestamp: new Date().toISOString(),
    });
  }

  res.status(200).json({
    status: "ok",
    service: "MultiCommerce API",
    db: dbState,
    redis: redisStatus(),
    timestamp: new Date().toISOString(),
  });
});

app.get("/", (_req, res) => {
  res.status(200).json({
    service: "MultiCommerce API",
    health: "/health",
    api: "/api",
  });
});

// Local / traditional host: listen. On Vercel, export the app as a serverless function.
if (!process.env.VERCEL) {
  app.listen(PORT, (err) => {
    if (err) {
      console.log(err);
      return;
    }
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;
