/**
 * Seed categories + products for every category via product API.
 * Usage: node scripts/seedProducts.js
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/userModel.js";
import Store from "../models/storeModel.js";
import Category from "../models/categoryModel.js";
import Product from "../models/productModel.js";
import envConfig from "../configs/envConfig.js";

dotenv.config();

const API = `http://localhost:${envConfig.PORT || 3000}/api`;
const VENDOR_EMAIL = "vendor.demo@multicommerce.local";
const VENDOR_PASSWORD = "Vendor@12345";

const CATEGORY_DEFS = [
  { name: "Electronics", slug: "electronics", description: "Gadgets, audio and tech accessories" },
  { name: "Mobiles", slug: "mobiles", description: "Phones and mobile accessories" },
  { name: "Fashion", slug: "fashion", description: "Clothing, footwear and style" },
  { name: "Home", slug: "home", description: "Home living and decor" },
  { name: "Appliances", slug: "appliances", description: "Kitchen and home appliances" },
  { name: "Beauty", slug: "beauty", description: "Skincare, haircare and personal care" },
  { name: "Sports", slug: "sports", description: "Fitness and outdoor gear" },
  { name: "Books", slug: "books", description: "Stationery and study essentials" },
  { name: "Bags", slug: "bags", description: "Bags, sleeves and travel gear" },
  { name: "Toys", slug: "toys", description: "Kids toys and games" },
];

/** At least 5 products per category */
const catalogByCategory = {
  electronics: [
    ["Wireless Bluetooth Earbuds", 1299, "AudioTech"],
    ["Noise Cancelling Headphones", 3499, "SoundMax"],
    ["USB-C Fast Charger 65W", 899, "PowerGo"],
    ["Power Bank 20000mAh", 1599, "ChargePro"],
    ["Smart Watch Fitness Band", 2499, "FitPulse"],
    ["Bluetooth Speaker Mini", 999, "BoomBox"],
  ],
  mobiles: [
    ["Android Phone Case Clear", 299, "Caseify"],
    ["Tempered Glass Screen Guard", 199, "ShieldX"],
    ["Type-C Data Cable 1.5m", 249, "CableKing"],
    ["Mobile Tripod Stand", 599, "SnapHold"],
    ["Wireless Car Charger Mount", 1299, "DriveCharge"],
  ],
  fashion: [
    ["Cotton Casual T-Shirt", 499, "UrbanWear"],
    ["Slim Fit Denim Jeans", 1299, "DenimCo"],
    ["Running Sports Shoes", 2199, "Sprint"],
    ["Leather Wallet Men", 799, "CraftLeather"],
    ["Women Ethnic Kurti", 899, "EthnicAura"],
    ["Analog Wrist Watch", 1499, "TimeCraft"],
    ["Aviator Sunglasses", 699, "ShadeOn"],
  ],
  home: [
    ["Cotton Bedsheet King", 1199, "HomeNest"],
    ["Memory Foam Pillow", 899, "SoftRest"],
    ["LED Desk Lamp", 749, "BrightDesk"],
    ["Non-Stick Frying Pan", 999, "CookEase"],
    ["Stainless Steel Bottle 1L", 449, "HydroLife"],
    ["Wall Clock Silent", 599, "TickTock"],
  ],
  appliances: [
    ["Vacuum Cleaner Portable", 3499, "CleanAir"],
    ["Electric Kettle 1.5L", 1299, "BoilFast"],
    ["Mixer Grinder 500W", 2799, "BlendPro"],
    ["Steam Iron Press", 1599, "PressIt"],
    ["Room Heater Fan", 1899, "WarmHome"],
  ],
  beauty: [
    ["Face Wash Neem 100ml", 199, "GlowCare"],
    ["Herbal Shampoo 400ml", 349, "HairPure"],
    ["Sunscreen SPF 50", 449, "SunShield"],
    ["Lip Balm Natural", 149, "LipSoft"],
    ["Body Lotion Cocoa", 299, "SkinSilk"],
  ],
  sports: [
    ["Yoga Mat Anti-Slip", 799, "FlexFit"],
    ["Dumbbell Set 5kg", 1499, "IronGym"],
    ["Skipping Rope Pro", 299, "CardioGo"],
    ["Sports Water Bottle", 399, "HydraSport"],
    ["Badminton Racket Pair", 1299, "SmashPlay"],
  ],
  books: [
    ["Notebook Ruled A5", 99, "WriteWell"],
    ["Gel Pen Pack of 10", 149, "InkFlow"],
    ["Study Table Lamp LED", 649, "FocusLight"],
    ["Highlighter Set of 5", 129, "MarkBright"],
    ["Planner Diary 2026", 249, "PlanDay"],
  ],
  bags: [
    ["Backpack 25L School", 999, "CarryAll"],
    ["Laptop Sleeve 15 inch", 699, "TechBag"],
    ["Travel Duffel Bag", 1499, "Voyage"],
    ["Sling Crossbody Bag", 549, "UrbanSling"],
    ["Laptop Backpack 30L", 1299, "WorkPack"],
  ],
  toys: [
    ["Kids Building Blocks", 899, "BuildFun"],
    ["Remote Control Car", 1299, "SpeedKid"],
    ["Puzzle 500 Pieces", 499, "BrainBox"],
    ["Soft Plush Teddy", 599, "CuddleToy"],
    ["Board Game Family Pack", 799, "PlayNight"],
  ],
};

const imageUrls = [
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80",
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80",
  "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&q=80",
  "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=400&q=80",
  "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=400&q=80",
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80",
  "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&q=80",
  "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400&q=80",
];

async function ensureVendorAndStore() {
  let vendor = await User.findOne({ email: VENDOR_EMAIL }).select("+password");

  if (!vendor) {
    vendor = await User.create({
      email: VENDOR_EMAIL,
      password: VENDOR_PASSWORD,
      role: "vendor",
      firstName: "Demo",
      lastName: "Vendor",
      phoneNumber: "9999999999",
      isEmailVerified: true,
      isActive: true,
    });
    console.log("Created demo vendor:", VENDOR_EMAIL);
  } else {
    vendor.isEmailVerified = true;
    vendor.isActive = true;
    vendor.role = "vendor";
    vendor.password = VENDOR_PASSWORD;
    await vendor.save();
    console.log("Updated demo vendor:", VENDOR_EMAIL);
  }

  let store = await Store.findOne({ vendorId: vendor._id });
  if (!store) {
    store = await Store.create({
      storeName: "MultiMart Official",
      description: "Demo marketplace store with curated everyday essentials.",
      vendorId: vendor._id,
      email: "store.demo@multicommerce.local",
      phone: "9876543210",
      address: "Ahmedabad, Gujarat, India",
      isActive: true,
    });
    console.log("Created demo store:", store.storeName);
  } else {
    console.log("Using existing store:", store.storeName);
  }

  return { vendor, store };
}

async function ensureCategories() {
  const map = {};
  for (const def of CATEGORY_DEFS) {
    let category = await Category.findOne({ slug: def.slug });
    if (!category) {
      category = await Category.create({ ...def, status: true });
      console.log("Created category:", def.name);
    } else {
      category.name = def.name;
      category.description = def.description;
      category.status = true;
      await category.save();
    }
    map[def.slug] = category;
  }
  return map;
}

async function loginVendor() {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: VENDOR_EMAIL, password: VENDOR_PASSWORD }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `Login failed (${res.status})`);
  }
  return data.accessToken || data.token;
}

async function createProduct(token, storeId, categoryId, categoryName, item, index) {
  const [name, price, brand] = item;
  const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}-${index}`;
  const sku = `SKU-${Date.now()}-${String(index + 1).padStart(3, "0")}`;
  const image = imageUrls[index % imageUrls.length];

  const body = {
    name,
    description: `${name} from ${brand}. Category: ${categoryName}. Quality marketplace product with fast shipping.`,
    shortDescription: `${brand} · ${categoryName}`,
    price,
    discountPrice: Math.round(price * 0.85),
    stock: 20 + ((index * 7) % 80),
    store: storeId,
    category: categoryId,
    brand,
    slug,
    sku,
    status: "active",
    tags: [categoryName.toLowerCase(), brand.toLowerCase()],
    images: [{ public_id: `seed/${sku}`, url: image }],
  };

  const res = await fetch(`${API}/product/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `Create failed for ${name}`);
  }
  return data.product;
}

async function main() {
  await mongoose.connect(envConfig.MONGODB_URL || process.env.MONGODB_URL);
  console.log("Connected to MongoDB");

  const { store } = await ensureVendorAndStore();
  const categories = await ensureCategories();

  const deleted = await Product.deleteMany({ store: store._id });
  console.log(`Cleared ${deleted.deletedCount} existing store products`);

  const token = await loginVendor();
  console.log("Logged in as vendor via API");

  let created = 0;
  let index = 0;

  for (const def of CATEGORY_DEFS) {
    const items = catalogByCategory[def.slug] || [];
    const category = categories[def.slug];
    console.log(`\nSeeding ${def.name} (${items.length} products)...`);

    for (const item of items) {
      const product = await createProduct(
        token,
        store._id.toString(),
        category._id.toString(),
        def.name,
        item,
        index
      );
      created += 1;
      index += 1;
      console.log(`  [${created}] ${product.name} → ${def.name}`);
    }
  }

  console.log(`\nDone. Created ${created} products across ${CATEGORY_DEFS.length} categories.`);
  console.log(`Vendor login: ${VENDOR_EMAIL} / ${VENDOR_PASSWORD}`);
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error("Seed failed:", err.message);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
