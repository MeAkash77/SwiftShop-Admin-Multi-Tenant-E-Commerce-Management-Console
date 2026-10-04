/**
 * Collapse duplicate / near-duplicate product gallery images (same photo URL).
 * Keeps one clear hero image so PDP UX is not spammy.
 *
 *   node scripts/dedupeProductImages.js
 */
import mongoose from "mongoose";
import envConfig from "../configs/envConfig.js";
import { connectDB } from "../configs/database.js";
import { assertSeedAllowed } from "../utils/assertSeedAllowed.js";
import Product from "../models/productModel.js";

assertSeedAllowed("dedupeProductImages");

function normalizeUrl(url) {
  try {
    const u = new URL(String(url));
    // ignore width/query differences of same Unsplash photo
    return `${u.origin}${u.pathname}`;
  } catch {
    return String(url || "").split("?")[0];
  }
}

async function main() {
  if (!envConfig.MONGODB_URL) throw new Error("MONGODB_URL is not set");
  await connectDB();

  const products = await Product.find({ "images.1": { $exists: true } }).select(
    "sku name images"
  );
  let fixed = 0;

  for (const p of products) {
    const seen = new Set();
    const unique = [];
    for (const img of p.images || []) {
      const key = normalizeUrl(img.url);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      unique.push(img);
    }
    if (unique.length !== (p.images || []).length) {
      p.images = unique;
      await p.save();
      fixed += 1;
      console.log(`OK ${p.sku || p._id} → ${unique.length} image(s)`);
    }
  }

  console.log(`\nDeduped ${fixed} products.`);
}

main()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error(err);
    try {
      await mongoose.disconnect();
    } catch {
      /* ignore */
    }
    process.exit(1);
  });
