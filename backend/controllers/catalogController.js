/**
 * Master catalog controller.
 * Vendors browse (brands → products → models) to auto-fill listings.
 * Super admin manages the master entries.
 */
import mongoose from "mongoose";
import CatalogProduct from "../models/catalogProductModel.js";
import Category from "../models/categoryModel.js";

/** Escape user input before using it inside a RegExp to avoid crashes/ReDoS. */
function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeArray(value, fallback = []) {
  if (value == null) return fallback;
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function cleanSpecifications(list) {
  return normalizeArray(list)
    .map((row) => ({
      label: String(row.label || "").trim(),
      value: String(row.value || "").trim(),
    }))
    .filter((row) => row.label && row.value);
}

function cleanOptionGroups(list) {
  return normalizeArray(list)
    .map((g) => ({
      key: String(g.key || "").trim(),
      label: String(g.label || g.key || "").trim(),
      values: normalizeArray(g.values)
        .map((v) => String(v).trim())
        .filter(Boolean),
    }))
    .filter((g) => g.key && g.values.length);
}

function cleanImages(list) {
  return normalizeArray(list)
    .map((img) => ({
      public_id: String(img.public_id || img.url || "").trim(),
      url: String(img.url || "").trim(),
    }))
    .filter((img) => img.url);
}

async function buildCatalogPayload(body = {}) {
  const payload = {
    brand: String(body.brand || "").trim(),
    name: String(body.name || "").trim(),
    productType: String(body.productType || "generic").trim() || "generic",
    description: String(body.description || "").trim(),
    shortDescription: String(body.shortDescription || "").trim(),
    aboutItems: normalizeArray(body.aboutItems)
      .map((s) => String(s).trim())
      .filter(Boolean),
    specifications: cleanSpecifications(body.specifications),
    optionGroups: cleanOptionGroups(body.optionGroups),
    images: cleanImages(body.images),
    tags: normalizeArray(body.tags)
      .map((s) => String(s).trim().toLowerCase())
      .filter(Boolean),
    status: body.status === "inactive" ? "inactive" : "active",
  };

  if (body.suggestedPrice != null && body.suggestedPrice !== "") {
    payload.suggestedPrice = Number(body.suggestedPrice);
  }
  if (body.suggestedDiscountPrice != null && body.suggestedDiscountPrice !== "") {
    payload.suggestedDiscountPrice = Number(body.suggestedDiscountPrice);
  }

  // Resolve category by id or slug
  if (body.category && mongoose.Types.ObjectId.isValid(body.category)) {
    payload.category = body.category;
    const cat = await Category.findById(body.category).select("slug").lean();
    if (cat?.slug) payload.categorySlug = cat.slug;
  } else if (body.categorySlug) {
    const slug = String(body.categorySlug).trim();
    payload.categorySlug = slug;
    const cat = await Category.findOne({ slug }).select("_id").lean();
    if (cat?._id) payload.category = cat._id;
  }

  return payload;
}

/** GET /catalog/brands — distinct brands with product counts (active for vendors). */
export const getCatalogBrands = async (req, res) => {
  try {
    const match = req.user?.role === "superAdmin" ? {} : { status: "active" };
    const brands = await CatalogProduct.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$brand",
          count: { $sum: 1 },
          categories: { $addToSet: "$categorySlug" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({
      success: true,
      brands: brands.map((b) => ({
        brand: b._id,
        count: b.count,
        categories: b.categories.filter(Boolean),
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/** GET /catalog — list master products (filters: brand, category, productType, q, page). */
export const listCatalogProducts = async (req, res) => {
  try {
    const isAdmin = req.user?.role === "superAdmin";
    const filter = isAdmin ? {} : { status: "active" };

    if (req.query.status && isAdmin) filter.status = req.query.status;
    if (req.query.brand) filter.brand = req.query.brand;
    if (req.query.category) filter.categorySlug = req.query.category;
    if (req.query.productType) filter.productType = req.query.productType;
    if (req.query.q) {
      const rx = new RegExp(escapeRegex(String(req.query.q).trim()), "i");
      filter.$or = [{ name: rx }, { brand: rx }, { tags: rx }];
    }

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 24));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      CatalogProduct.find(filter)
        .populate("category", "name slug")
        .sort({ brand: 1, name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CatalogProduct.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/** GET /catalog/:id — one master product with all models/specs. */
export const getCatalogProduct = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: "Not found" });
    }
    const item = await CatalogProduct.findById(req.params.id).populate(
      "category",
      "name slug"
    );
    if (!item) {
      return res.status(404).json({ success: false, message: "Not found" });
    }
    if (item.status !== "active" && req.user?.role !== "superAdmin") {
      return res.status(404).json({ success: false, message: "Not found" });
    }
    res.status(200).json({ success: true, item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/** POST /catalog — admin create master product. */
export const createCatalogProduct = async (req, res) => {
  try {
    const payload = await buildCatalogPayload(req.body);
    if (!payload.brand || !payload.name) {
      return res
        .status(400)
        .json({ success: false, message: "Brand and name are required." });
    }
    payload.createdBy = req.user.id;
    const item = await CatalogProduct.create(payload);
    res.status(201).json({ success: true, item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/** PUT /catalog/:id — admin update master product. */
export const updateCatalogProduct = async (req, res) => {
  try {
    const item = await CatalogProduct.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: "Not found" });
    }
    const payload = await buildCatalogPayload({ ...item.toObject(), ...req.body });
    Object.assign(item, payload);
    await item.save();
    res.status(200).json({ success: true, item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/** DELETE /catalog/:id — admin remove master product. */
export const deleteCatalogProduct = async (req, res) => {
  try {
    const item = await CatalogProduct.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: "Not found" });
    }
    res.status(200).json({ success: true, message: "Catalog item removed." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
