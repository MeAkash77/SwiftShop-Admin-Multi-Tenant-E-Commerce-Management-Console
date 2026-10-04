/**
 * Seed a rich customer catalog: ~100 products across categories,
 * fix miscategorized items, attach distinct images, add photo reviews.
 *
 * Usage (from backend/):
 *   node scripts/seedCatalog.js
 *
 * Safe to re-run: products keyed by SKU `MC-CAT-*`, reviews keyed by product+customer.
 */
import mongoose from "mongoose";
import envConfig from "../configs/envConfig.js";
import { connectDB } from "../configs/database.js";
import { assertSeedAllowed } from "../utils/assertSeedAllowed.js";
import Category from "../models/categoryModel.js";
import Product from "../models/productModel.js";
import Store from "../models/storeModel.js";
import User from "../models/userModel.js";
import Review from "../models/reviewModel.js";

assertSeedAllowed("seed:catalog");

const u = (id, w = 800) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const CATEGORIES = [
  { name: "Electronics", slug: "electronics", description: "Audio, wearables, chargers & gadgets" },
  { name: "Mobiles", slug: "mobiles", description: "Phones and mobile accessories" },
  { name: "Fashion", slug: "fashion", description: "Apparel, footwear & style" },
  { name: "Home", slug: "home", description: "Living, kitchen & décor" },
  { name: "Appliances", slug: "appliances", description: "Home & kitchen appliances" },
  { name: "Beauty", slug: "beauty", description: "Skincare, haircare & grooming" },
  { name: "Sports", slug: "sports", description: "Fitness gear and outdoor sports" },
  { name: "Books", slug: "books", description: "Books, stationery & planners" },
  { name: "Bags", slug: "bags", description: "Backpacks, sleeves & travel bags" },
  { name: "Toys", slug: "toys", description: "Toys, puzzles & family games" },
];

/** Keyword → category slug for verifying older products */
const CATEGORY_RULES = [
  { slug: "mobiles", re: /\b(phone|galaxy|iphone|android|mobile|screen guard|tempered glass|tripod|car charger|data cable|phone case)\b/i },
  { slug: "electronics", re: /\b(earbuds|headphone|charger|power bank|smart watch|bluetooth speaker|earphone|gadget)\b/i },
  { slug: "fashion", re: /\b(t-?shirt|jeans|kurti|wallet|aviator|sunglasses|wrist watch|denim|apparel)\b/i },
  { slug: "sports", re: /\b(yoga|dumbbell|skipping|badminton|running shoes|sports water|fitness)\b/i },
  { slug: "home", re: /\b(bedsheet|pillow|desk lamp|frying pan|bottle|wall clock|cookware|table lamp)\b/i },
  { slug: "appliances", re: /\b(vacuum|kettle|mixer|grinder|steam iron|heater|appliance)\b/i },
  { slug: "beauty", re: /\b(face wash|shampoo|sunscreen|lip balm|lotion|skincare|beauty)\b/i },
  { slug: "books", re: /\b(notebook|pen|highlighter|planner|diary|book|stationery)\b/i },
  { slug: "bags", re: /\b(backpack|laptop sleeve|duffel|sling|crossbody|bag)\b/i },
  { slug: "toys", re: /\b(building blocks|remote control|puzzle|plush|teddy|board game|toy)\b/i },
];

/**
 * Exactly 10 products per category (100 total). SKUs are stable for upserts.
 * Images: distinct Unsplash photos per SKU.
 */
const CATALOG = {
  electronics: [
    { sku: "MC-CAT-EL-01", name: "Wireless Bluetooth Earbuds Pro", brand: "SoundWave", price: 2999, discountPrice: 1799, type: "electronics", img: "photo-1590658268037-6bf12165a8df" },
    { sku: "MC-CAT-EL-02", name: "Noise Cancelling Over-Ear Headphones", brand: "Auralis", price: 8999, discountPrice: 6499, type: "electronics", img: "photo-1484704849700-f032a568e944" },
    { sku: "MC-CAT-EL-03", name: "USB-C GaN Fast Charger 65W", brand: "ChargeX", price: 2499, discountPrice: 1599, type: "electronics", img: "photo-1583863788434-e58a36330cf0" },
    { sku: "MC-CAT-EL-04", name: "Power Bank 20000mAh PD", brand: "VoltPack", price: 3499, discountPrice: 2299, type: "electronics", img: "photo-1625842268584-8f3296236761" },
    { sku: "MC-CAT-EL-05", name: "Smart Fitness Watch Series 5", brand: "PulseBand", price: 5999, discountPrice: 3999, type: "electronics", img: "photo-1523275335684-37898b6baf30" },
    { sku: "MC-CAT-EL-06", name: "Portable Bluetooth Speaker Mini", brand: "BoomLite", price: 2799, discountPrice: 1699, type: "electronics", img: "photo-1608043152269-423dbba4e7e1" },
    { sku: "MC-CAT-EL-07", name: "4K Action Camera Waterproof", brand: "TrailCam", price: 12999, discountPrice: 8999, type: "electronics", img: "photo-1526170375885-4d8ecf77b99f" },
    { sku: "MC-CAT-EL-08", name: "USB Hub 7-in-1 Multiport", brand: "Dockify", price: 3299, discountPrice: 2199, type: "electronics", img: "photo-1625842268584-8f3296236761" },
    { sku: "MC-CAT-EL-09", name: "Wireless Mechanical Keyboard", brand: "KeyCraft", price: 5499, discountPrice: 3799, type: "electronics", img: "photo-1511467687858-23d96c32e4ae" },
    { sku: "MC-CAT-EL-10", name: "Ergonomic Wireless Mouse", brand: "ClickPro", price: 1999, discountPrice: 1299, type: "electronics", img: "photo-1527864550417-7fd91fc51a46" },
  ],
  mobiles: [
    { sku: "MC-CAT-MB-01", name: "Galaxy A55 5G Dual SIM", brand: "Samsung", price: 39999, discountPrice: 34999, type: "mobile", img: "photo-1511707171634-5f897ff02aa9" },
    { sku: "MC-CAT-MB-02", name: "Pixel-Style Midrange 128GB", brand: "Nexa", price: 28999, discountPrice: 24999, type: "mobile", img: "photo-1592899677977-9c10ca588bbd" },
    { sku: "MC-CAT-MB-03", name: "Clear Shockproof Phone Case", brand: "ShieldCase", price: 799, discountPrice: 449, type: "mobile", img: "photo-1601784551446-20c9e07cdbdb" },
    { sku: "MC-CAT-MB-04", name: "9H Tempered Glass Screen Guard", brand: "GlassArmor", price: 499, discountPrice: 249, type: "mobile", img: "photo-1556656793-08538906a9f8" },
    { sku: "MC-CAT-MB-05", name: "Braided Type-C Cable 1.5m", brand: "CableNova", price: 599, discountPrice: 299, type: "mobile", img: "photo-1625948515291-69613efd103f" },
    { sku: "MC-CAT-MB-06", name: "Flexible Mobile Tripod Stand", brand: "ShotEase", price: 1299, discountPrice: 799, type: "mobile", img: "photo-1478720568477-152d9b164e26" },
    { sku: "MC-CAT-MB-07", name: "Magnetic Wireless Car Mount", brand: "DriveDock", price: 1999, discountPrice: 1299, type: "mobile", img: "photo-1492144534655-ae79c964c9d7" },
    { sku: "MC-CAT-MB-08", name: "Ring Light Clip for Selfies", brand: "GlowClip", price: 1499, discountPrice: 899, type: "mobile", img: "photo-1611162616475-46b635cb6868" },
    { sku: "MC-CAT-MB-09", name: "Fast MagSafe-Style Wireless Pad", brand: "ChargePad", price: 2499, discountPrice: 1699, type: "mobile", img: "photo-1586953208448-b95a79798f07" },
    { sku: "MC-CAT-MB-10", name: "Rugged Armor Bumper Case", brand: "FortCase", price: 999, discountPrice: 599, type: "mobile", img: "photo-1601784551446-20c9e07cdbdb" },
  ],
  fashion: [
    { sku: "MC-CAT-FA-01", name: "Premium Cotton Casual T-Shirt", brand: "UrbanThread", price: 1299, discountPrice: 699, type: "fashion", img: "photo-1521572163474-6864f9cf17ab" },
    { sku: "MC-CAT-FA-02", name: "Slim Fit Stretch Denim Jeans", brand: "DenimCo", price: 2799, discountPrice: 1699, type: "fashion", img: "photo-1542272604-787c3835535d" },
    { sku: "MC-CAT-FA-03", name: "Women Ethnic Printed Kurti", brand: "Rangriti", price: 1899, discountPrice: 999, type: "fashion", img: "photo-1594633312681-425c7b97ccd1" },
    { sku: "MC-CAT-FA-04", name: "Genuine Leather Card Wallet", brand: "HideCraft", price: 1599, discountPrice: 899, type: "fashion", img: "photo-1627123424574-724758594e93" },
    { sku: "MC-CAT-FA-05", name: "Classic Analog Wrist Watch", brand: "TimeArt", price: 3499, discountPrice: 2199, type: "fashion", img: "photo-1524592094714-0f0654e20314" },
    { sku: "MC-CAT-FA-06", name: "Aviator UV-Protect Sunglasses", brand: "ShadeLine", price: 1999, discountPrice: 1199, type: "fashion", img: "photo-1511499767150-a48a237f0083" },
    { sku: "MC-CAT-FA-07", name: "Oversized Hoodie Fleece", brand: "CozyLayer", price: 2499, discountPrice: 1499, type: "fashion", img: "photo-1556821840-3a63f95609a7" },
    { sku: "MC-CAT-FA-08", name: "Formal Oxford Belted Shoes", brand: "StrideForm", price: 3999, discountPrice: 2499, type: "fashion", img: "photo-1449505278894-297fdb3edbc1" },
    { sku: "MC-CAT-FA-09", name: "Silk Feel Scarf Soft Touch", brand: "LumenWear", price: 999, discountPrice: 549, type: "fashion", img: "photo-1601924994987-69e26d50dc26" },
    { sku: "MC-CAT-FA-10", name: "Casual Linen Blend Shirt", brand: "BreezyFit", price: 2199, discountPrice: 1299, type: "fashion", img: "photo-1521572163474-6864f9cf17ab" },
  ],
  home: [
    { sku: "MC-CAT-HM-01", name: "King Size Cotton Bedsheet Set", brand: "NestSoft", price: 2999, discountPrice: 1799, type: "generic", img: "photo-1631049307264-da0ec9d70304" },
    { sku: "MC-CAT-HM-02", name: "Memory Foam Contour Pillow", brand: "DreamFoam", price: 1999, discountPrice: 1199, type: "generic", img: "photo-1631889993959-41b4e9c6e3c5" },
    { sku: "MC-CAT-HM-03", name: "Adjustable LED Desk Lamp", brand: "LumenDesk", price: 1799, discountPrice: 1099, type: "generic", img: "photo-1507473885765-e6ed057f782c" },
    { sku: "MC-CAT-HM-04", name: "Non-Stick Frying Pan 24cm", brand: "CookWise", price: 1499, discountPrice: 899, type: "generic", img: "photo-1556910103-1c02745aae4d" },
    { sku: "MC-CAT-HM-05", name: "Insulated Steel Bottle 1L", brand: "HydroKeep", price: 999, discountPrice: 599, type: "generic", img: "photo-1602143407151-7111542de6e8" },
    { sku: "MC-CAT-HM-06", name: "Silent Sweep Wall Clock", brand: "TickQuiet", price: 1299, discountPrice: 749, type: "generic", img: "photo-1493663284031-b7e3aefcae8e" },
    { sku: "MC-CAT-HM-07", name: "Ceramic Planter with Tray", brand: "GreenNook", price: 899, discountPrice: 549, type: "generic", img: "photo-1416879595882-3373a0480b5b" },
    { sku: "MC-CAT-HM-08", name: "Cotton Throw Blanket Soft", brand: "WarmNest", price: 2199, discountPrice: 1399, type: "generic", img: "photo-1586075010923-2dd4570fb338" },
    { sku: "MC-CAT-HM-09", name: "Bamboo Cutting Board Set", brand: "PrepWood", price: 1299, discountPrice: 799, type: "generic", img: "photo-1556910103-1c02745aae4d" },
    { sku: "MC-CAT-HM-10", name: "Scented Candle Jar Pack", brand: "AuraHome", price: 799, discountPrice: 449, type: "generic", img: "photo-1600880292089-90a7e086ee0c" },
  ],
  appliances: [
    { sku: "MC-CAT-AP-01", name: "Handheld Vacuum Cleaner", brand: "DustAway", price: 4999, discountPrice: 3499, type: "appliance", img: "photo-1558317374-067fb5f30001" },
    { sku: "MC-CAT-AP-02", name: "Electric Kettle 1.5L Steel", brand: "BoilQuick", price: 1999, discountPrice: 1299, type: "appliance", img: "photo-1544787219-7f47ccb76574" },
    { sku: "MC-CAT-AP-03", name: "Mixer Grinder 500W Compact", brand: "BlendMaster", price: 3999, discountPrice: 2799, type: "appliance", img: "photo-1574269909862-7e1d70bb8078" },
    { sku: "MC-CAT-AP-04", name: "Steam Iron Press Ceramic", brand: "PressEase", price: 2499, discountPrice: 1699, type: "appliance", img: "photo-1610557892470-55d9e80c0bce" },
    { sku: "MC-CAT-AP-05", name: "PTC Fan Room Heater", brand: "WarmAir", price: 3299, discountPrice: 2299, type: "appliance", img: "photo-1545259741-2ea3ebf61fa3" },
    { sku: "MC-CAT-AP-06", name: "2-Slice Pop-up Toaster", brand: "ToastGo", price: 2199, discountPrice: 1499, type: "appliance", img: "photo-1509440159596-0249088772ff" },
    { sku: "MC-CAT-AP-07", name: "Sandwich Maker Grill Plate", brand: "SnackPress", price: 1899, discountPrice: 1199, type: "appliance", img: "photo-1565299507177-b0ac66763828" },
    { sku: "MC-CAT-AP-08", name: "Immersion Hand Blender", brand: "MixStick", price: 1699, discountPrice: 1099, type: "appliance", img: "photo-1574269909862-7e1d70bb8078" },
    { sku: "MC-CAT-AP-09", name: "Air Fryer 4L Digital", brand: "CrispAir", price: 7999, discountPrice: 5499, type: "appliance", img: "photo-1626804475297-41608ea09aeb" },
    { sku: "MC-CAT-AP-10", name: "Induction Cooktop Single", brand: "HeatPad", price: 3499, discountPrice: 2499, type: "appliance", img: "photo-1556911220-e15b29be8c8f" },
  ],
  beauty: [
    { sku: "MC-CAT-BE-01", name: "Neem Purifying Face Wash", brand: "HerbGlow", price: 399, discountPrice: 249, type: "generic", img: "photo-1556228578-8c89e6adf883" },
    { sku: "MC-CAT-BE-02", name: "Herbal Moisture Shampoo 400ml", brand: "RootCare", price: 499, discountPrice: 329, type: "generic", img: "photo-1535585209827-a15fcdbc4c2d" },
    { sku: "MC-CAT-BE-03", name: "Sunscreen Gel SPF 50 PA+++", brand: "SunShield", price: 699, discountPrice: 449, type: "generic", img: "photo-1556228720-195a672e8a03" },
    { sku: "MC-CAT-BE-04", name: "Natural Cocoa Lip Balm", brand: "SoftKiss", price: 199, discountPrice: 129, type: "generic", img: "photo-1596462502278-27bfdc403348" },
    { sku: "MC-CAT-BE-05", name: "Cocoa Butter Body Lotion", brand: "SilkSkin", price: 599, discountPrice: 379, type: "generic", img: "photo-1556228578-8c89e6adf883" },
    { sku: "MC-CAT-BE-06", name: "Vitamin C Serum 30ml", brand: "GlowLab", price: 899, discountPrice: 599, type: "generic", img: "photo-1556228720-195a672e8a03" },
    { sku: "MC-CAT-BE-07", name: "Charcoal Face Mask Sheet Pack", brand: "PurePore", price: 499, discountPrice: 299, type: "generic", img: "photo-1596462502278-27bfdc403348" },
    { sku: "MC-CAT-BE-08", name: "Rose Water Facial Toner", brand: "BloomMist", price: 349, discountPrice: 229, type: "generic", img: "photo-1612817288484-6f916006741a" },
    { sku: "MC-CAT-BE-09", name: "Beard Oil Grooming Kit", brand: "ForgeGroom", price: 799, discountPrice: 499, type: "generic", img: "photo-1571781926291-c477ebfd024b" },
    { sku: "MC-CAT-BE-10", name: "Matte Nail Polish Trio", brand: "ColorTip", price: 599, discountPrice: 349, type: "generic", img: "photo-1604654894610-df63bc536371" },
  ],
  sports: [
    { sku: "MC-CAT-SP-01", name: "Anti-Slip Yoga Mat 6mm", brand: "FlexMat", price: 1499, discountPrice: 899, type: "generic", img: "photo-1601925260368-ae2f83cf8b7f" },
    { sku: "MC-CAT-SP-02", name: "Dumbbell Pair 5kg Vinyl", brand: "IronEase", price: 2499, discountPrice: 1699, type: "generic", img: "photo-1517836357463-d25dfeac3438" },
    { sku: "MC-CAT-SP-03", name: "Adjustable Skipping Rope Pro", brand: "SkipFast", price: 699, discountPrice: 399, type: "generic", img: "photo-1518611012118-696072aa579a" },
    { sku: "MC-CAT-SP-04", name: "Sports Sipper Bottle 750ml", brand: "HydraSport", price: 799, discountPrice: 449, type: "generic", img: "photo-1526401485004-46910ecc8e51" },
    { sku: "MC-CAT-SP-05", name: "Badminton Racket Twin Pack", brand: "SmashAce", price: 2499, discountPrice: 1599, type: "generic", img: "photo-1531415074968-036ba1b575da" },
    { sku: "MC-CAT-SP-06", name: "Lightweight Running Shoes", brand: "RunLite", price: 3999, discountPrice: 2499, type: "fashion", img: "photo-1542291026-7eec264c27ff" },
    { sku: "MC-CAT-SP-07", name: "Resistance Band Set of 5", brand: "StretchPro", price: 999, discountPrice: 599, type: "generic", img: "photo-1517836357463-d25dfeac3438" },
    { sku: "MC-CAT-SP-08", name: "Foam Roller Recovery Tube", brand: "RecoverFit", price: 1299, discountPrice: 799, type: "generic", img: "photo-1518310383802-640c2de311b2" },
    { sku: "MC-CAT-SP-09", name: "Cricket Practice Ball Pack", brand: "PitchPro", price: 899, discountPrice: 549, type: "generic", img: "photo-1531415074968-036ba1b575da" },
    { sku: "MC-CAT-SP-10", name: "Gym Gloves Anti-Slip Grip", brand: "GripStrong", price: 799, discountPrice: 449, type: "generic", img: "photo-1518611012118-696072aa579a" },
  ],
  books: [
    { sku: "MC-CAT-BK-01", name: "Ruled Notebook A5 Hardcover", brand: "PageCraft", price: 299, discountPrice: 179, type: "generic", img: "photo-1544947950-fa07a98d237f" },
    { sku: "MC-CAT-BK-02", name: "Gel Pen Pack of 10 Assorted", brand: "InkFlow", price: 249, discountPrice: 149, type: "generic", img: "photo-1586075010923-2dd4570fb338" },
    { sku: "MC-CAT-BK-03", name: "Highlighter Marker Set of 5", brand: "MarkBright", price: 199, discountPrice: 119, type: "generic", img: "photo-1455390582262-044cdead277a" },
    { sku: "MC-CAT-BK-04", name: "2026 Planner Diary Weekly", brand: "PlanDay", price: 499, discountPrice: 299, type: "generic", img: "photo-1506784983877-45594efa4cbe" },
    { sku: "MC-CAT-BK-05", name: "Productivity Paperback Guide", brand: "InsightPress", price: 599, discountPrice: 399, type: "generic", img: "photo-1544947950-fa07a98d237f" },
    { sku: "MC-CAT-BK-06", name: "Sticky Notes Multi-Color Pack", brand: "NotePop", price: 179, discountPrice: 99, type: "generic", img: "photo-1517842645767-c639042777db" },
    { sku: "MC-CAT-BK-07", name: "Sketchbook Spiral 120 Sheets", brand: "ArtLeaf", price: 449, discountPrice: 279, type: "generic", img: "photo-1513364776144-60967b0f800f" },
    { sku: "MC-CAT-BK-08", name: "Classic Fiction Hardcover", brand: "StoryHouse", price: 799, discountPrice: 499, type: "generic", img: "photo-1512820790803-83ca734da794" },
    { sku: "MC-CAT-BK-09", name: "Index Cards Study Pack", brand: "FlashLearn", price: 149, discountPrice: 89, type: "generic", img: "photo-1434030216411-0b793f4b4173" },
    { sku: "MC-CAT-BK-10", name: "Ballpoint Pen Smooth Blue 20pc", brand: "WriteEase", price: 199, discountPrice: 119, type: "generic", img: "photo-1585336261022-680e295ce3fe" },
  ],
  bags: [
    { sku: "MC-CAT-BG-01", name: "School Backpack 25L Water Resist", brand: "CarryAll", price: 1999, discountPrice: 1199, type: "generic", img: "photo-1553062407-98eeb64c6a62" },
    { sku: "MC-CAT-BG-02", name: "Laptop Sleeve 15.6 inch Neoprene", brand: "SoftShell", price: 1299, discountPrice: 799, type: "generic", img: "photo-1548036328-c9fa89d128fa" },
    { sku: "MC-CAT-BG-03", name: "Travel Duffel Weekender Bag", brand: "GoFar", price: 2499, discountPrice: 1599, type: "generic", img: "photo-1584917865442-de89df76afd3" },
    { sku: "MC-CAT-BG-04", name: "Sling Crossbody Everyday Bag", brand: "CitySling", price: 1499, discountPrice: 899, type: "generic", img: "photo-1584917865442-de89df76afd3" },
    { sku: "MC-CAT-BG-05", name: "Laptop Backpack 30L USB Port", brand: "TechCarry", price: 3299, discountPrice: 2199, type: "generic", img: "photo-1622560480605-d83c853bc5c3" },
    { sku: "MC-CAT-BG-06", name: "Canvas Tote Shopping Bag", brand: "EcoTote", price: 699, discountPrice: 399, type: "generic", img: "photo-1553062407-98eeb64c6a62" },
    { sku: "MC-CAT-BG-07", name: "Hard Shell Cabin Suitcase 20\"", brand: "Voyager", price: 5999, discountPrice: 4299, type: "generic", img: "photo-1565026057447-bc90a3dceb87" },
    { sku: "MC-CAT-BG-08", name: "Leather Look Messenger Bag", brand: "OfficeStride", price: 2799, discountPrice: 1799, type: "generic", img: "photo-1544816155-12df9643f363" },
    { sku: "MC-CAT-BG-09", name: "Kids Cartoon School Bag", brand: "TinyTrail", price: 999, discountPrice: 599, type: "generic", img: "photo-1515488042361-ee00e0ddd4e4" },
    { sku: "MC-CAT-BG-10", name: "Gym Sports Duffel with Shoes Pocket", brand: "FitBag", price: 1899, discountPrice: 1199, type: "generic", img: "photo-1571902943202-507ec2618e8f" },
  ],
  toys: [
    { sku: "MC-CAT-TY-01", name: "Kids Building Blocks 120pc", brand: "BrickPlay", price: 1499, discountPrice: 899, type: "generic", img: "photo-1558611848-73f7eb4001a1" },
    { sku: "MC-CAT-TY-02", name: "Remote Control Stunt Car", brand: "RaceFun", price: 2499, discountPrice: 1599, type: "generic", img: "photo-1558618666-fcd25c85cd64" },
    { sku: "MC-CAT-TY-03", name: "Jigsaw Puzzle 500 Pieces Scenic", brand: "PieceTime", price: 799, discountPrice: 449, type: "generic", img: "photo-1566576912321-d58ddd7a6088" },
    { sku: "MC-CAT-TY-04", name: "Soft Plush Teddy Bear 40cm", brand: "Huggle", price: 999, discountPrice: 599, type: "generic", img: "photo-1515488042361-ee00e0ddd4e4" },
    { sku: "MC-CAT-TY-05", name: "Family Board Game Classic Pack", brand: "TableFun", price: 1299, discountPrice: 799, type: "generic", img: "photo-1560343090-f0409e92791a" },
    { sku: "MC-CAT-TY-06", name: "STEM Robot Coding Kit", brand: "ByteBot", price: 3499, discountPrice: 2499, type: "generic", img: "photo-1535378620166-273708d44e4c" },
    { sku: "MC-CAT-TY-07", name: "Wooden Train Set Wooden Track", brand: "TimberToys", price: 2199, discountPrice: 1399, type: "generic", img: "photo-1566576912321-d58ddd7a6088" },
    { sku: "MC-CAT-TY-08", name: "Magic Drawing Doodle Pad", brand: "SketchMagic", price: 699, discountPrice: 399, type: "generic", img: "photo-1513364776144-60967b0f800f" },
    { sku: "MC-CAT-TY-09", name: "Outdoor Frisbee Disc Pair", brand: "AirDisc", price: 499, discountPrice: 299, type: "generic", img: "photo-1551958219-acbc608c6377" },
    { sku: "MC-CAT-TY-10", name: "Card Game Strategy Night", brand: "DeckCraft", price: 899, discountPrice: 549, type: "generic", img: "photo-1617038260897-41a1f14a8ca0" },
  ],
};

const REVIEW_PHOTOS = [
  "photo-1607082348824-0a96f2a4b9da",
  "photo-1556742049-0cfed4f6a45d",
  "photo-1523275335684-37898b6baf30",
  "photo-1505740420928-5e00e15915f0",
  "photo-1542291026-7eec264c27ff",
  "photo-1526170375885-4d8ecf77b99f",
  "photo-1583394838336-acd977736f90",
  "photo-1560343090-f0409e92791a",
];

const REVIEW_TEMPLATES = [
  { rating: 5, title: "Excellent quality", comment: "Looks exactly like the photos. Packaging was neat and delivery was quick." },
  { rating: 5, title: "Worth every rupee", comment: "Using it daily — build quality feels premium for the price." },
  { rating: 4, title: "Very good buy", comment: "Happy with the product. Slight delay in shipping but support was helpful." },
  { rating: 4, title: "As described", comment: "Matches the listing. Sharing a photo of what I received." },
  { rating: 5, title: "Family loves it", comment: "Bought for home use and everyone is impressed. Will order again." },
  { rating: 3, title: "Decent overall", comment: "Good product, charging cable could be longer. Still recommend." },
];

function slugify(name, sku) {
  const base = String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${base}-${sku.toLowerCase()}`;
}

function guessCategorySlug(name) {
  for (const rule of CATEGORY_RULES) {
    if (rule.re.test(name)) return rule.slug;
  }
  return null;
}

async function syncProductRatings(productId) {
  const stats = await Review.aggregate([
    { $match: { product: productId } },
    {
      $group: {
        _id: "$product",
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);
  const averageRating = stats[0]
    ? Math.round(stats[0].averageRating * 10) / 10
    : 0;
  const totalReviews = stats[0]?.totalReviews || 0;
  await Product.findByIdAndUpdate(productId, { averageRating, totalReviews });
}

async function ensureCategories() {
  const map = {};
  for (const cat of CATEGORIES) {
    let doc = await Category.findOne({ slug: cat.slug });
    if (!doc) {
      doc = await Category.create({ ...cat, status: true });
      console.log("  + category", cat.slug);
    } else {
      doc.name = cat.name;
      doc.description = cat.description;
      doc.status = true;
      await doc.save();
    }
    map[cat.slug] = doc;
  }
  return map;
}

async function fixExistingCategories(categoryMap) {
  const products = await Product.find({}).select("name category sku");
  let fixed = 0;
  for (const p of products) {
    const guessed = guessCategorySlug(p.name);
    if (!guessed || !categoryMap[guessed]) continue;
    const targetId = categoryMap[guessed]._id;
    if (!p.category || String(p.category) !== String(targetId)) {
      // Don't move seeded MC-CAT products away from their intended category
      if (p.sku && String(p.sku).startsWith("MC-CAT-")) continue;
      p.category = targetId;
      await p.save();
      fixed += 1;
      console.log(`  ~ reclassified "${p.name}" → ${guessed}`);
    }
  }
  return fixed;
}

async function upsertCatalog(categoryMap, store, vendorId) {
  let upserted = 0;
  for (const [slug, items] of Object.entries(CATALOG)) {
    const category = categoryMap[slug];
    if (!category) continue;

    for (const item of items) {
      const imgUrl = u(item.img);
      const payload = {
        vendor: vendorId,
        store: store._id,
        category: category._id,
        name: item.name,
        slug: slugify(item.name, item.sku),
        sku: item.sku,
        description: `<p><strong>${item.name}</strong> from <em>${item.brand}</em>. Carefully selected for MultiCommerce shoppers — quality materials, clear specs, and everyday value.</p><ul><li>Brand: ${item.brand}</li><li>Category: ${category.name}</li><li>Ready to ship from ${store.storeName}</li></ul>`,
        shortDescription: `${item.brand} · ${category.name}`,
        aboutItems: [
          `Genuine ${item.brand} product listing on MultiCommerce`,
          `Sold by ${store.storeName} with tracked fulfillment`,
          "Easy returns after delivery where policy applies",
          "Secure checkout with Razorpay or COD",
        ],
        productType: item.type || "generic",
        specifications: [
          { label: "Brand", value: item.brand },
          { label: "Category", value: category.name },
          { label: "SKU", value: item.sku },
        ],
        price: item.price,
        discountPrice: item.discountPrice,
        stock: 40 + Math.floor(Math.random() * 60),
        brand: item.brand,
        // One clear hero image — avoid duplicate same-photo gallery spam
        images: [{ public_id: `seed/${item.sku}-1`, url: imgUrl }],
        tags: [slug, item.brand.toLowerCase(), "catalog"],
        isFeatured: item.sku.endsWith("01") || item.sku.endsWith("02"),
        status: "active",
      };

      const existing = await Product.findOne({ sku: item.sku });
      if (existing) {
        Object.assign(existing, payload);
        await existing.save();
      } else {
        // avoid slug collisions with non-catalog products
        const slugTaken = await Product.findOne({ slug: payload.slug, sku: { $ne: item.sku } });
        if (slugTaken) payload.slug = `${payload.slug}-${Date.now().toString(36)}`;
        await Product.create(payload);
      }
      upserted += 1;
    }
  }
  return upserted;
}

async function seedReviews(customers) {
  if (!customers.length) {
    console.log("  ! no verified customers — skip reviews");
    return 0;
  }

  const catalogProducts = await Product.find({ sku: /^MC-CAT-/ }).select("_id name");
  // ~40 products get 1–2 reviews with photos
  const targets = catalogProducts.filter((_, i) => i % 2 === 0).slice(0, 40);
  let created = 0;

  for (let i = 0; i < targets.length; i++) {
    const product = targets[i];
    const customer = customers[i % customers.length];
    const tpl = REVIEW_TEMPLATES[i % REVIEW_TEMPLATES.length];
    const photo = REVIEW_PHOTOS[i % REVIEW_PHOTOS.length];

    const existing = await Review.findOne({
      product: product._id,
      customer: customer._id,
    });
    if (existing) {
      existing.rating = tpl.rating;
      existing.title = tpl.title;
      existing.comment = tpl.comment;
      existing.images = [
        { public_id: `seed-review/${product._id}-${customer._id}`, url: u(photo, 600) },
      ];
      await existing.save();
    } else {
      await Review.create({
        product: product._id,
        customer: customer._id,
        rating: tpl.rating,
        title: tpl.title,
        comment: tpl.comment,
        images: [
          { public_id: `seed-review/${product._id}-${customer._id}`, url: u(photo, 600) },
        ],
      });
      created += 1;
    }
    await syncProductRatings(product._id);

    // second reviewer on every 3rd product
    if (i % 3 === 0 && customers.length > 1) {
      const customer2 = customers[(i + 1) % customers.length];
      if (String(customer2._id) === String(customer._id)) continue;
      const tpl2 = REVIEW_TEMPLATES[(i + 2) % REVIEW_TEMPLATES.length];
      const photo2 = REVIEW_PHOTOS[(i + 3) % REVIEW_PHOTOS.length];
      const existing2 = await Review.findOne({
        product: product._id,
        customer: customer2._id,
      });
      if (!existing2) {
        await Review.create({
          product: product._id,
          customer: customer2._id,
          rating: tpl2.rating,
          title: tpl2.title,
          comment: tpl2.comment,
          images: [
            {
              public_id: `seed-review/${product._id}-${customer2._id}`,
              url: u(photo2, 600),
            },
          ],
        });
        created += 1;
        await syncProductRatings(product._id);
      }
    }
  }
  return created;
}

async function printSummary(categoryMap) {
  console.log("\n=== Catalog summary ===");
  for (const slug of Object.keys(categoryMap)) {
    const count = await Product.countDocuments({
      category: categoryMap[slug]._id,
      status: "active",
    });
    const withImg = await Product.countDocuments({
      category: categoryMap[slug]._id,
      "images.0": { $exists: true },
    });
    console.log(`  ${slug.padEnd(12)} ${count} products (${withImg} with images)`);
  }
  const total = await Product.countDocuments({ status: "active" });
  const catalog = await Product.countDocuments({ sku: /^MC-CAT-/ });
  const reviews = await Review.countDocuments();
  const withPhotos = await Review.countDocuments({ "images.0": { $exists: true } });
  console.log(`\n  Active products: ${total}`);
  console.log(`  Catalog SKUs (MC-CAT-*): ${catalog}`);
  console.log(`  Reviews: ${reviews} (${withPhotos} with photos)`);
}

async function main() {
  if (!envConfig.MONGODB_URL) throw new Error("MONGODB_URL is not set");
  await connectDB();

  console.log("1) Ensuring categories…");
  const categoryMap = await ensureCategories();

  console.log("2) Verifying / fixing existing product categories…");
  const fixed = await fixExistingCategories(categoryMap);
  console.log(`  Fixed ${fixed} products`);

  let store = await Store.findOne({ isActive: true }).sort({ createdAt: 1 });
  if (!store) {
    throw new Error("No store found. Run npm run seed:demo first or create a vendor store.");
  }
  const vendorId = store.vendorId;
  console.log(`3) Using store "${store.storeName}" (${store._id})`);

  console.log("4) Upserting 100 catalog products with images…");
  const upserted = await upsertCatalog(categoryMap, store, vendorId);
  console.log(`  Upserted ${upserted} catalog products`);

  const customers = await User.find({
    role: "customer",
    isEmailVerified: true,
    isActive: true,
  })
    .limit(8)
    .select("_id firstName email");

  console.log("5) Seeding photo reviews…");
  const reviewCount = await seedReviews(customers);
  console.log(`  Created ${reviewCount} new reviews`);

  await printSummary(categoryMap);
  console.log("\nDone. Refresh /customer to browse.");
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
