/**
 * Soft per-IP rate limit for public catalog browse/search.
 * High enough for normal shoppers; protects Mongo/Redis under bots.
 */
import rateLimit from "express-rate-limit";

export const catalogBrowseLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many product requests. Please wait a moment and try again.",
  },
});

export default catalogBrowseLimiter;
