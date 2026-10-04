/**
 * Seed the company master catalog (brand → product → models).
 * Vendors browse these and auto-fill their own listing.
 *
 * Usage (from backend/):
 *   npm run seed:master
 *
 * Safe to re-run: entries keyed by (brand + name).
 */
import mongoose from "mongoose";
import envConfig from "../configs/envConfig.js";
import { connectDB } from "../configs/database.js";
import { assertSeedAllowed } from "../utils/assertSeedAllowed.js";
import Category from "../models/categoryModel.js";
import CatalogProduct from "../models/catalogProductModel.js";

assertSeedAllowed("seed:master");

const u = (id, w = 800) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const opt = (key, label, values) => ({ key, label, values });
const spec = (label, value) => ({ label, value });

/**
 * Master products. `models` = optionGroups (the selectable versions).
 * categorySlug must match a seeded Category slug (see seedCatalog.js).
 */
const CATALOG = [
  // ---------------- Mobiles ----------------
  {
    brand: "Samsung",
    name: "Galaxy S24 Ultra",
    categorySlug: "mobiles",
    productType: "mobile",
    img: "photo-1610945415295-d9bbf067e59c",
    price: 129999,
    discountPrice: 114999,
    shortDescription: "Flagship 6.8\" QHD+ AMOLED with 200MP camera & S Pen",
    models: [
      opt("color", "Color", ["Titanium Black", "Titanium Grey", "Titanium Violet"]),
      opt("storage", "Storage", ["256GB", "512GB", "1TB"]),
      opt("ram", "RAM", ["12GB"]),
    ],
    specs: [
      spec("Processor / Chipset", "Snapdragon 8 Gen 3"),
      spec("Display", "6.8 inch QHD+ Dynamic AMOLED 2X, 120Hz"),
      spec("Battery", "5000 mAh, 45W fast charge"),
      spec("Camera", "200MP + 50MP + 12MP + 10MP"),
      spec("OS", "Android 14, One UI 6"),
      spec("Network", "5G"),
      spec("Warranty", "1 year"),
    ],
    about: [
      "Built-in S Pen for notes and precision",
      "Titanium frame, Gorilla Armor glass",
      "AI photo and translation features",
    ],
  },
  {
    brand: "Apple",
    name: "iPhone 15 Pro",
    categorySlug: "mobiles",
    productType: "mobile",
    img: "photo-1695048133142-1a20484d2569",
    price: 134900,
    discountPrice: 129900,
    shortDescription: "Titanium design, A17 Pro chip, 48MP camera",
    models: [
      opt("color", "Color", ["Natural Titanium", "Blue Titanium", "White Titanium", "Black Titanium"]),
      opt("storage", "Storage", ["128GB", "256GB", "512GB", "1TB"]),
    ],
    specs: [
      spec("Processor / Chipset", "Apple A17 Pro"),
      spec("Display", "6.1 inch Super Retina XDR, 120Hz"),
      spec("Battery", "Up to 23 hrs video"),
      spec("Camera", "48MP + 12MP + 12MP"),
      spec("OS", "iOS 17"),
      spec("Network", "5G"),
      spec("Warranty", "1 year"),
    ],
    about: [
      "Aerospace-grade titanium",
      "Action button + USB-C",
      "ProMotion 120Hz display",
    ],
  },
  {
    brand: "OnePlus",
    name: "OnePlus 12",
    categorySlug: "mobiles",
    productType: "mobile",
    img: "photo-1598327105666-5b89351aff97",
    price: 64999,
    discountPrice: 59999,
    shortDescription: "Snapdragon 8 Gen 3, 100W charging, Hasselblad camera",
    models: [
      opt("color", "Color", ["Silky Black", "Flowy Emerald"]),
      opt("storage", "Storage", ["256GB", "512GB"]),
      opt("ram", "RAM", ["12GB", "16GB"]),
    ],
    specs: [
      spec("Processor / Chipset", "Snapdragon 8 Gen 3"),
      spec("Display", "6.82 inch QHD+ AMOLED, 120Hz"),
      spec("Battery", "5400 mAh, 100W SUPERVOOC"),
      spec("Camera", "50MP + 64MP + 48MP Hasselblad"),
      spec("OS", "Android 14, OxygenOS 14"),
      spec("Warranty", "1 year"),
    ],
    about: ["100W fast charge", "Hasselblad tuned camera", "Rain-touch display"],
  },

  // ---------------- Laptops ----------------
  {
    brand: "Apple",
    name: "MacBook Air 13 (M3)",
    categorySlug: "electronics",
    productType: "laptop",
    img: "photo-1517336714731-489689fd1ca8",
    price: 114900,
    discountPrice: 109900,
    shortDescription: "M3 chip, 13.6\" Liquid Retina, fanless & light",
    models: [
      opt("color", "Color", ["Midnight", "Starlight", "Space Grey", "Silver"]),
      opt("storage", "SSD Storage", ["256GB", "512GB", "1TB"]),
      opt("ram", "RAM", ["8GB", "16GB", "24GB"]),
    ],
    specs: [
      spec("Processor / Chipset", "Apple M3 (8-core)"),
      spec("Graphics", "8-core / 10-core GPU"),
      spec("Display", "13.6 inch Liquid Retina"),
      spec("Battery", "Up to 18 hours"),
      spec("OS", "macOS"),
      spec("Ports", "2x Thunderbolt, MagSafe"),
      spec("Warranty", "1 year"),
    ],
    about: ["Fanless silent design", "Up to 18 hr battery", "1.24 kg ultralight"],
  },
  {
    brand: "Dell",
    name: "Dell XPS 14",
    categorySlug: "electronics",
    productType: "laptop",
    img: "photo-1593642702821-c8da6771f0c6",
    price: 169990,
    discountPrice: 154990,
    shortDescription: "Intel Core Ultra 7, 14.5\" OLED, premium build",
    models: [
      opt("color", "Color", ["Platinum", "Graphite"]),
      opt("storage", "SSD Storage", ["512GB", "1TB", "2TB"]),
      opt("ram", "RAM", ["16GB", "32GB"]),
    ],
    specs: [
      spec("Processor / Chipset", "Intel Core Ultra 7"),
      spec("Graphics", "Intel Arc / RTX 4050"),
      spec("Display", "14.5 inch 3.2K OLED touch"),
      spec("Battery", "Up to 12 hours"),
      spec("OS", "Windows 11"),
      spec("Ports", "3x Thunderbolt 4"),
      spec("Warranty", "1 year"),
    ],
    about: ["CNC aluminium chassis", "InfinityEdge OLED", "Haptic trackpad"],
  },

  // ---------------- Tablets ----------------
  {
    brand: "Apple",
    name: "iPad Air (M2)",
    categorySlug: "electronics",
    productType: "tablet",
    img: "photo-1544244015-0df4b3ffc6b0",
    price: 59900,
    discountPrice: 56900,
    shortDescription: "M2 chip, 11\" Liquid Retina, Apple Pencil Pro support",
    models: [
      opt("color", "Color", ["Space Grey", "Blue", "Purple", "Starlight"]),
      opt("storage", "Storage", ["128GB", "256GB", "512GB", "1TB"]),
      opt("connectivity", "Connectivity", ["Wi-Fi", "Wi-Fi + Cellular"]),
    ],
    specs: [
      spec("Processor / Chipset", "Apple M2"),
      spec("Display", "11 inch Liquid Retina"),
      spec("RAM", "8GB"),
      spec("Battery", "Up to 10 hours"),
      spec("OS", "iPadOS"),
      spec("Warranty", "1 year"),
    ],
    about: ["Apple Pencil Pro ready", "Landscape front camera", "Ultra-portable"],
  },

  // ---------------- Fashion ----------------
  {
    brand: "Nike",
    name: "Nike Sportswear Club Tee",
    categorySlug: "fashion",
    productType: "fashion",
    img: "photo-1521572163474-6864f9cf17ab",
    price: 1995,
    discountPrice: 1495,
    shortDescription: "Soft cotton crew-neck everyday t-shirt",
    models: [
      opt("color", "Color", ["Black", "White", "Navy", "Grey", "Olive"]),
      opt("size", "Size", ["S", "M", "L", "XL", "XXL"]),
    ],
    specs: [
      spec("Material", "100% Cotton"),
      spec("Fit", "Regular"),
      spec("Care", "Machine wash"),
      spec("Country of Origin", "India"),
    ],
    about: ["Soft breathable cotton", "Ribbed crew neck", "Everyday fit"],
  },
  {
    brand: "Levi's",
    name: "Levi's 511 Slim Jeans",
    categorySlug: "fashion",
    productType: "fashion",
    img: "photo-1542272604-787c3835535d",
    price: 3999,
    discountPrice: 2799,
    shortDescription: "Slim-fit stretch denim, all-day comfort",
    models: [
      opt("color", "Color", ["Dark Indigo", "Mid Blue", "Black"]),
      opt("size", "Waist", ["30", "32", "34", "36", "38"]),
    ],
    specs: [
      spec("Material", "98% Cotton, 2% Elastane"),
      spec("Fit", "Slim"),
      spec("Care", "Machine wash cold"),
      spec("Country of Origin", "India"),
    ],
    about: ["Stretch for comfort", "Classic 5-pocket", "Slim through leg"],
  },
  {
    brand: "Adidas",
    name: "Adidas Ultraboost Light",
    categorySlug: "fashion",
    productType: "fashion",
    img: "photo-1542291026-7eec264c27ff",
    price: 15999,
    discountPrice: 11999,
    shortDescription: "Lightweight responsive running shoes",
    models: [
      opt("color", "Color", ["Core Black", "Cloud White", "Grey"]),
      opt("size", "Size (UK)", ["6", "7", "8", "9", "10", "11"]),
    ],
    specs: [
      spec("Material", "Primeknit upper"),
      spec("Fit", "Regular"),
      spec("Care", "Wipe clean"),
      spec("Country of Origin", "Vietnam"),
    ],
    about: ["Light BOOST midsole", "Breathable Primeknit", "Continental rubber grip"],
  },

  // ---------------- Appliances ----------------
  {
    brand: "LG",
    name: "LG Front Load Washing Machine",
    categorySlug: "appliances",
    productType: "appliance",
    img: "photo-1626806787461-102c1bfaaea1",
    price: 42990,
    discountPrice: 34990,
    shortDescription: "AI Direct Drive, steam wash, inverter motor",
    models: [
      opt("color", "Color / Finish", ["White", "Steel Silver"]),
      opt("capacity", "Capacity", ["7kg", "8kg", "9kg"]),
    ],
    specs: [
      spec("Power", "220-240V"),
      spec("Energy Rating", "5 Star"),
      spec("Dimensions", "60 x 55 x 85 cm"),
      spec("Warranty", "2 years (10 yr motor)"),
    ],
    about: ["AI Direct Drive", "Steam allergy care", "10-year motor warranty"],
  },
  {
    brand: "Philips",
    name: "Philips Air Fryer XL",
    categorySlug: "appliances",
    productType: "appliance",
    img: "photo-1626804475297-41608ea09aeb",
    price: 12995,
    discountPrice: 8995,
    shortDescription: "Rapid Air, 4.1L, oil-free frying",
    models: [
      opt("color", "Color / Finish", ["Black", "White"]),
      opt("capacity", "Capacity", ["4.1L", "6.2L"]),
    ],
    specs: [
      spec("Power", "1400W"),
      spec("Energy Rating", "4 Star"),
      spec("Dimensions", "31 x 32 x 36 cm"),
      spec("Warranty", "2 years"),
    ],
    about: ["Rapid Air technology", "Dishwasher-safe basket", "Up to 90% less fat"],
  },

  // ---------------- Electronics ----------------
  {
    brand: "Sony",
    name: "Sony WH-1000XM5 Headphones",
    categorySlug: "electronics",
    productType: "electronics",
    img: "photo-1618366712010-f4ae9c647dcb",
    price: 29990,
    discountPrice: 24990,
    shortDescription: "Industry-leading noise cancellation, 30h battery",
    models: [
      opt("color", "Color", ["Black", "Silver", "Midnight Blue"]),
    ],
    specs: [
      spec("Connectivity", "Bluetooth 5.2, USB-C, 3.5mm"),
      spec("Battery", "30 hours"),
      spec("Compatibility", "Android, iOS, Windows"),
      spec("Warranty", "1 year"),
    ],
    about: ["Best-in-class ANC", "30 hr battery", "Multipoint connection"],
  },
  {
    brand: "boAt",
    name: "boAt Airdopes progression TWS",
    categorySlug: "electronics",
    productType: "electronics",
    img: "photo-1590658268037-6bf12165a8df",
    price: 4999,
    discountPrice: 1799,
    shortDescription: "True wireless earbuds, ENx mic, 40h playtime",
    models: [
      opt("color", "Color", ["Black", "White", "Blue"]),
    ],
    specs: [
      spec("Connectivity", "Bluetooth 5.3"),
      spec("Battery", "40 hours total"),
      spec("Compatibility", "Android, iOS"),
      spec("Warranty", "1 year"),
    ],
    about: ["ENx clear calls", "Fast charge", "Low latency mode"],
  },
];

function keyOf(item) {
  return { brand: item.brand, name: item.name };
}

async function resolveCategories() {
  const cats = await Category.find({}).select("_id slug").lean();
  const map = {};
  for (const c of cats) map[c.slug] = c._id;
  return map;
}

async function upsertCatalog(categoryMap) {
  let created = 0;
  let updated = 0;

  for (const item of CATALOG) {
    const payload = {
      brand: item.brand,
      name: item.name,
      categorySlug: item.categorySlug,
      category: categoryMap[item.categorySlug] || undefined,
      productType: item.productType || "generic",
      description: `<p><strong>${item.name}</strong> by <em>${item.brand}</em>. ${
        item.shortDescription || ""
      }</p>`,
      shortDescription: item.shortDescription || `${item.brand} · ${item.name}`,
      aboutItems: item.about || [],
      specifications: item.specs || [],
      optionGroups: item.models || [],
      images: [{ public_id: `catalog/${item.brand}-${item.name}`, url: u(item.img) }],
      suggestedPrice: item.price,
      suggestedDiscountPrice: item.discountPrice,
      tags: [item.categorySlug, item.brand.toLowerCase(), "catalog"],
      status: "active",
    };

    const existing = await CatalogProduct.findOne(keyOf(item));
    if (existing) {
      Object.assign(existing, payload);
      await existing.save();
      updated += 1;
    } else {
      await CatalogProduct.create(payload);
      created += 1;
    }
  }

  return { created, updated };
}

async function main() {
  if (!envConfig.MONGODB_URL) throw new Error("MONGODB_URL is not set");
  await connectDB();

  console.log("1) Resolving categories…");
  const categoryMap = await resolveCategories();
  const missing = [...new Set(CATALOG.map((c) => c.categorySlug))].filter(
    (s) => !categoryMap[s]
  );
  if (missing.length) {
    console.warn(
      `  ! Missing categories: ${missing.join(", ")} (run npm run seed:catalog first). Continuing without category link.`
    );
  }

  console.log("2) Upserting master catalog…");
  const { created, updated } = await upsertCatalog(categoryMap);
  console.log(`  Created ${created}, updated ${updated}`);

  const total = await CatalogProduct.countDocuments();
  const brands = await CatalogProduct.distinct("brand");
  console.log(`\n  Master catalog items: ${total}`);
  console.log(`  Brands: ${brands.sort().join(", ")}`);
  console.log("\nDone. Vendors: /vendor/products → Add from catalog.");
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
