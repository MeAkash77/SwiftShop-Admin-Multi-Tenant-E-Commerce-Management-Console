/**
 * Fix broken Unsplash image URLs on catalog products (MC-CAT-*).
 * Dev-safe: uses assertSeedAllowed (ALLOW_SEED=1 for production-like).
 *
 *   node scripts/fixCatalogImages.js
 */
import mongoose from "mongoose";
import envConfig from "../configs/envConfig.js";
import { connectDB } from "../configs/database.js";
import { assertSeedAllowed } from "../utils/assertSeedAllowed.js";
import Product from "../models/productModel.js";

assertSeedAllowed("fixCatalogImages");

const u = (id, w = 800) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

/** Verified 200 OK Unsplash IDs (checked with HEAD). */
const FIXES = {
  "MC-CAT-EL-02": "photo-1484704849700-f032a568e944", // headphones
  "MC-CAT-EL-04": "photo-1625842268584-8f3296236761", // power bank / device
  "MC-CAT-MB-10": "photo-1601784551446-20c9e07cdbdb", // phone case
  "MC-CAT-FA-10": "photo-1521572163474-6864f9cf17ab", // shirt
  "MC-CAT-HM-06": "photo-1493663284031-b7e3aefcae8e", // home décor
  "MC-CAT-HM-07": "photo-1416879595882-3373a0480b5b", // planter / greenery
  "MC-CAT-HM-09": "photo-1556910103-1c02745aae4d", // kitchen
  "MC-CAT-HM-10": "photo-1600880292089-90a7e086ee0c", // candles / amber
  "MC-CAT-AP-08": "photo-1574269909862-7e1d70bb8078", // kitchen appliance
  "MC-CAT-BE-05": "photo-1556228578-8c89e6adf883", // lotions
  "MC-CAT-BE-06": "photo-1556228720-195a672e8a03", // serum bottles
  "MC-CAT-BE-07": "photo-1596462502278-27bfdc403348", // beauty flatlay
  "MC-CAT-BE-08": "photo-1612817288484-6f916006741a", // skincare desk
  "MC-CAT-BE-09": "photo-1571781926291-c477ebfd024b", // grooming bottles
  "MC-CAT-SP-05": "photo-1531415074968-036ba1b575da", // sports ball
  "MC-CAT-SP-07": "photo-1517836357463-d25dfeac3438", // fitness
  "MC-CAT-SP-10": "photo-1518611012118-696072aa579a", // workout
  "MC-CAT-BK-01": "photo-1544947950-fa07a98d237f", // notebook/book
  "MC-CAT-BG-04": "photo-1584917865442-de89df76afd3", // handbag
  "MC-CAT-BG-06": "photo-1553062407-98eeb64c6a62", // tote/backpack
  "MC-CAT-BG-09": "photo-1515488042361-ee00e0ddd4e4", // kids gear
  "MC-CAT-TY-01": "photo-1558611848-73f7eb4001a1", // colorful toys
  "MC-CAT-TY-03": "photo-1566576912321-d58ddd7a6088", // wooden play
  "MC-CAT-TY-04": "photo-1515488042361-ee00e0ddd4e4", // soft kids toys
  "MC-CAT-TY-05": "photo-1560343090-f0409e92791a", // game box style
  "MC-CAT-TY-10": "photo-1617038260897-41a1f14a8ca0", // cards / table game
};

async function main() {
  if (!envConfig.MONGODB_URL) throw new Error("MONGODB_URL is not set");
  await connectDB();

  let updated = 0;
  for (const [sku, photoId] of Object.entries(FIXES)) {
    const url = u(photoId);
    const url2 = u(photoId, 1200);
    // verify before writing
    const head = await fetch(url, { method: "HEAD", redirect: "follow" });
    if (!head.ok) {
      console.error(`SKIP ${sku} — still broken ${photoId} (${head.status})`);
      continue;
    }
    const res = await Product.updateOne(
      { sku },
      {
        $set: {
          images: [
            { public_id: `seed/${sku}-1`, url },
            { public_id: `seed/${sku}-2`, url: url2 },
          ],
        },
      }
    );
    if (res.matchedCount) {
      updated += 1;
      console.log(`OK ${sku} → ${photoId}`);
    } else {
      console.log(`MISS ${sku} (not in DB)`);
    }
  }

  console.log(`\nUpdated ${updated} products.`);
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
