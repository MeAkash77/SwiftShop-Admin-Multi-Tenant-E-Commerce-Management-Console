import mongoose from "mongoose";
import envConfig from "./envConfig.js";

/**
 * Cached connection for Vercel serverless (reuse across warm invocations).
 * Without waiting for connect, Mongoose buffers queries and times out at 10s.
 */
const globalCache = globalThis;

if (!globalCache.__multicommerceMongoose) {
  globalCache.__multicommerceMongoose = { conn: null, promise: null };
}

const cache = globalCache.__multicommerceMongoose;

export async function connectDB() {
  const uri = String(envConfig.MONGODB_URL || "").trim();

  if (!uri) {
    throw new Error("MONGODB_URL is not set");
  }

  if (cache.conn && mongoose.connection.readyState === 1) {
    return cache.conn;
  }

  if (!cache.promise) {
    mongoose.set("bufferCommands", false);

    const maxPoolSize = Number(envConfig.MONGO_MAX_POOL) || (process.env.VERCEL ? 5 : 20);

    cache.promise = mongoose
      .connect(uri, {
        // Faster fail on cold serverless; larger pool under Docker
        serverSelectionTimeoutMS: 8000,
        maxPoolSize,
        minPoolSize: 0,
      })
      .then((m) => {
        console.log("Connected to MongoDB");
        return m;
      })
      .catch((err) => {
        cache.promise = null;
        console.error("MongoDB connection failed:", err.message);
        throw err;
      });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}

/** Express middleware — ensure DB is ready before route handlers. */
export async function ensureDb(req, res, next) {
  try {
    await connectDB();
    next();
  } catch (err) {
    return res.status(503).json({
      message:
        err.message ||
        "Database unavailable. Check MONGODB_URL and Atlas Network Access (allow 0.0.0.0/0 for Vercel).",
    });
  }
}

// Local / long-running process: connect on boot (non-blocking log only).
// On Vercel: start Mongo as soon as the function boots so the first
// request does not serialise "wait for connect" after routing.
connectDB().catch(() => {});

export default connectDB;
