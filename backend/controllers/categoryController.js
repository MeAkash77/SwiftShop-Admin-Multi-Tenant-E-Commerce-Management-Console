/**
 * Category controller — list/create/update product categories (admin).
 */
import Category from "../models/categoryModel.js";
import { cacheGet, cacheSet, invalidateCatalogCache, setPublicCatalogHeaders } from "../configs/redis.js";

export const getAllCategories = async (req, res) => {
  try {
    const query = req.query.all === "true" ? {} : { status: true };
    const cacheKey =
      req.query.all === "true" ? "categories:all" : "categories:active";

    if (req.query.all !== "true") {
      const cached = await cacheGet(cacheKey);
      if (cached) {
        setPublicCatalogHeaders(res, { hit: true, maxAge: 120 });
        return res.status(200).json(cached);
      }
    }

    const categories = await Category.find(query)
      .select("name slug description status")
      .sort({ name: 1 })
      .lean();
    const payload = {
      success: true,
      data: categories,
    };
    if (req.query.all !== "true") {
      await cacheSet(cacheKey, payload, 300);
      setPublicCatalogHeaders(res, { hit: false, maxAge: 120 });
    }
    return res.status(200).json(payload);
  } catch (err) {
    return res.status(500).json({
      message: err.message || "Failed to load categories",
    });
  }
};

export const getCategoryBySlug = async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug, status: true });
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    return res.status(200).json({
      success: true,
      data: category,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message || "Failed to load category",
    });
  }
};

export const createCategory = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const description = String(req.body.description || "").trim();
    if (!name) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const slug =
      String(req.body.slug || name)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || `cat-${Date.now()}`;

    const category = await Category.create({
      name,
      slug,
      description,
      status: req.body.status !== false,
    });

    await invalidateCatalogCache();

    return res.status(201).json({
      success: true,
      message: "Category created",
      data: category,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Category slug already exists" });
    }
    return res.status(500).json({
      message: err.message || "Failed to create category",
    });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const updates = {};
    if (req.body.name !== undefined) updates.name = String(req.body.name).trim();
    if (req.body.description !== undefined) {
      updates.description = String(req.body.description).trim();
    }
    if (req.body.status !== undefined) updates.status = Boolean(req.body.status);
    if (req.body.slug !== undefined) {
      updates.slug = String(req.body.slug)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    }

    const category = await Category.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    });
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    await invalidateCatalogCache();
    return res.status(200).json({
      success: true,
      message: "Category updated",
      data: category,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message || "Failed to update category",
    });
  }
};
