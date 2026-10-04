/**
 * Product controller — CRUD, vendor list, search/filter, bulk mark/delete/import.
 * Always scoped to vendor ownership unless superAdmin. docs/02-PROJECT-FLOW.md (D).
 */
import Product from "../models/productModel.js";
import Category from "../models/categoryModel.js";
import Store from "../models/storeModel.js";
import uploadToCloudinary from "../utils/uploadToCloudinary.js";
import cloudinary from "../configs/cloudinary.js";
import { upsertMediaFromUpload } from "./mediaController.js";
import {
  ensureUniqueSku,
  generateProductSku,
  generateProductSlug,
} from "../utils/generateProductSku.js";
import {
  buildOptionGroups,
  buildVariantCombos,
  ensureHtmlDescription,
  parseImageUrls,
  parseSpecifications,
  rowsFromWorkbook,
  splitList,
  splitPiped,
  templateBuffer,
  validateProductType,
} from "../utils/bulkProductImport.js";
import {
  cacheGet,
  cacheSet,
  invalidateCatalogCache,
  setPublicCatalogHeaders,
} from "../configs/redis.js";
import {
  LIST_SELECT,
  listCacheKey,
  parsePageLimit,
  productCacheKey,
  searchCacheKey,
  toListProduct,
} from "../utils/catalogQuery.js";

const BULK_MAX_ROWS = 200;
const LIST_TTL = 90;
const SEARCH_TTL = 60;
const PRODUCT_TTL = 45;

async function resolveCategory(categorySlug) {
  const value = String(categorySlug || "").trim();
  if (!value) return null;
  if (/^[0-9a-fA-F]{24}$/.test(value)) {
    return Category.findById(value);
  }
  return Category.findOne({
    $or: [
      { slug: new RegExp(`^${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
      { name: new RegExp(`^${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
    ],
  });
}

function parseJsonField(value, fallback) {
  if (value == null || value === "") return fallback;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

/** Library picks: [{ public_id, url }] from vendor media gallery */
function parseGalleryImages(raw) {
  const parsed = parseJsonField(raw, []);
  if (!Array.isArray(parsed)) return [];
  const out = [];
  const seen = new Set();
  for (const item of parsed) {
    const public_id = String(item?.public_id || "").trim();
    const url = String(item?.url || "").trim();
    if (!public_id || !url || seen.has(public_id)) continue;
    seen.add(public_id);
    out.push({ public_id, url });
  }
  return out;
}

function normalizeProductPayload(body = {}) {
  const data = { ...body };
  delete data.images;
  delete data.removeImages;
  delete data.imageOrder;
  delete data.galleryImages;
  delete data.sku;
  delete data.slug;
  delete data.vendor;

  data.variants = parseJsonField(data.variants, []);
  data.aboutItems = parseJsonField(data.aboutItems, []);
  data.specifications = parseJsonField(data.specifications, []);
  data.optionGroups = parseJsonField(data.optionGroups, []);
  data.tags = parseJsonField(data.tags, data.tags ? [data.tags] : []);

  if (Array.isArray(data.aboutItems)) {
    data.aboutItems = data.aboutItems.map((s) => String(s).trim()).filter(Boolean);
  }
  if (Array.isArray(data.specifications)) {
    data.specifications = data.specifications
      .map((row) => ({
        label: String(row.label || "").trim(),
        value: String(row.value || "").trim(),
      }))
      .filter((row) => row.label && row.value);
  }
  if (Array.isArray(data.optionGroups)) {
    data.optionGroups = data.optionGroups
      .map((g) => ({
        key: String(g.key || "").trim(),
        label: String(g.label || g.key || "").trim(),
        values: Array.isArray(g.values)
          ? g.values.map((v) => String(v).trim()).filter(Boolean)
          : [],
      }))
      .filter((g) => g.key && g.values.length);
  }
  if (Array.isArray(data.variants)) {
    data.variants = data.variants.map((v) => ({
      ...v,
      stock: Number(v.stock) || 0,
      price: v.price != null && v.price !== "" ? Number(v.price) : undefined,
      discountPrice:
        v.discountPrice != null && v.discountPrice !== ""
          ? Number(v.discountPrice)
          : undefined,
    }));
    const variantStock = data.variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
    if (variantStock > 0 && (data.stock == null || data.stock === "")) {
      data.stock = variantStock;
    }
  }

  if (data.price != null) data.price = Number(data.price);
  if (data.discountPrice != null && data.discountPrice !== "") {
    data.discountPrice = Number(data.discountPrice);
  } else if (data.discountPrice === "") {
    data.discountPrice = undefined;
  }
  if (data.stock != null) data.stock = Number(data.stock);
  if (data.isFeatured != null) {
    data.isFeatured =
      data.isFeatured === true ||
      data.isFeatured === "true" ||
      data.isFeatured === "1";
  }

  return data;
}

export const createProduct = async (req, res) => {
  try {
    const fromGallery = parseGalleryImages(req.body.galleryImages);
    let images = [...fromGallery];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.buffer, "products");
        const img = {
          public_id: result.public_id,
          url: result.secure_url,
          bytes: result.bytes,
          width: result.width,
          height: result.height,
        };
        images.push({ public_id: img.public_id, url: img.url });
        await upsertMediaFromUpload(req.user.id, img, file.originalname || "");
      }
    }

    // Dedupe by public_id
    const seen = new Set();
    images = images.filter((img) => {
      if (!img.public_id || seen.has(img.public_id)) return false;
      seen.add(img.public_id);
      return true;
    });

    if (images.length > 8) {
      return res.status(400).json({
        success: false,
        message: "Maximum 8 product images allowed",
      });
    }

    if (!images.length) {
      return res.status(400).json({
        success: false,
        message: "Add at least one image from upload or Media library",
      });
    }

    const body = normalizeProductPayload(req.body);

    if (!body.store) {
      return res.status(400).json({
        success: false,
        message: "A store is required to create a product.",
      });
    }

    // Ensure the target store belongs to the vendor creating the product.
    const targetStore = await Store.findById(body.store).select("vendorId");
    if (!targetStore) {
      return res.status(404).json({
        success: false,
        message: "Store not found.",
      });
    }
    if (
      req.user.role === "vendor" &&
      String(targetStore.vendorId) !== String(req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only add products to your own store.",
      });
    }

    const variants = body.variants || [];

    const baseSku = generateProductSku({
      name: body.name,
      brand: body.brand,
      storeId: body.store,
      variants,
    });
    const sku = await ensureUniqueSku(Product, baseSku);
    const slug = generateProductSlug(body.name);

    const product = await Product.create({
      ...body,
      vendor: req.user.id,
      images,
      variants,
      sku,
      slug,
    });

    await invalidateCatalogCache(product._id);

    res.status(201).json({
      success: true,
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getVendorProducts = async (req, res) => {
  try {
    const products = await Product.find({
      vendor: req.user.id,
    }).populate("category");

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const getProduct = async (req, res) => {
  try {
    const id = req.params.id;
    const key = productCacheKey(id);
    const cached = await cacheGet(key);
    if (cached) {
      setPublicCatalogHeaders(res, { hit: true, maxAge: 30 });
      return res.status(200).json(cached);
    }

    const product = await Product.findById(id)
      .populate("category")
      .populate("store");

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    await cacheSet(key, product, PRODUCT_TTL);
    setPublicCatalogHeaders(res, { hit: false, maxAge: 30 });
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (
      req.user.role === "vendor" &&
      String(product.vendor) !== String(req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const body = normalizeProductPayload(req.body);

    Object.assign(product, body);

    // Reorder existing gallery images (drag-and-drop from vendor panel)
    if (req.body.imageOrder != null) {
      const order = parseJsonField(req.body.imageOrder, null);
      if (Array.isArray(order) && order.length) {
        const byId = new Map(
          (product.images || []).map((img) => [img.public_id, img])
        );
        const ordered = [];
        for (const id of order) {
          const img = byId.get(id);
          if (img) {
            ordered.push(img);
            byId.delete(id);
          }
        }
        // Keep any images not listed (shouldn't normally happen)
        for (const img of byId.values()) ordered.push(img);
        product.images = ordered;
      }
    }

    if (req.files?.length) {
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.buffer, "products");
        const img = {
          public_id: result.public_id,
          url: result.secure_url,
          bytes: result.bytes,
          width: result.width,
          height: result.height,
        };
        product.images.push({
          public_id: img.public_id,
          url: img.url,
        });
        await upsertMediaFromUpload(req.user.id, img, file.originalname || "");
      }
    }

    // Attach images already in vendor Media library (no re-upload)
    if (req.body.galleryImages != null) {
      const fromGallery = parseGalleryImages(req.body.galleryImages);
      const have = new Set((product.images || []).map((i) => i.public_id));
      for (const img of fromGallery) {
        if (have.has(img.public_id)) continue;
        product.images.push(img);
        have.add(img.public_id);
      }
    }

    if (req.body.removeImages) {
      let removeIds = req.body.removeImages;
      if (typeof removeIds === "string") {
        try {
          removeIds = JSON.parse(removeIds);
        } catch {
          removeIds = [removeIds];
        }
      }
      const toRemove = new Set(Array.isArray(removeIds) ? removeIds : []);
      // Detach only — keep Cloudinary file if it lives in Media library
      const MediaAsset = (await import("../models/mediaAssetModel.js")).default;
      const kept = [];
      for (const image of product.images) {
        if (!toRemove.has(image.public_id)) {
          kept.push(image);
          continue;
        }
        const inLibrary = await MediaAsset.exists({
          vendor: product.vendor,
          public_id: image.public_id,
        });
        if (
          !inLibrary &&
          image.public_id &&
          !String(image.public_id).startsWith("bulk_import_")
        ) {
          await cloudinary.uploader.destroy(image.public_id);
        }
      }
      product.images = kept;
    }

    if (product.images.length > 8) {
      return res.status(400).json({
        success: false,
        message: "Maximum 8 product images allowed",
      });
    }

    await product.save();
    await product.populate("category");
    await product.populate("store");
    await invalidateCatalogCache(product._id);

    res.status(200).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (
      req.user.role === "vendor" &&
      String(product.vendor) !== String(req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Delete images from Cloudinary
    if (product.images && product.images.length > 0) {
      for (const image of product.images) {
        if (image.public_id && !String(image.public_id).startsWith("bulk_import_")) {
          await cloudinary.uploader.destroy(image.public_id);
        }
      }
    }

    // Delete product from database
    await Product.findByIdAndDelete(req.params.id);
    await invalidateCatalogCache(req.params.id);

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

function vendorProductFilter(req) {
  if (req.user.role === "superAdmin") return {};
  return { vendor: req.user.id };
}

/** Bulk mark products active / inactive */
export const bulkMarkProducts = async (req, res) => {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids.filter(Boolean) : [];
    const status =
      String(req.body.status || "").toLowerCase() === "inactive"
        ? "inactive"
        : "active";

    if (!ids.length) {
      return res.status(400).json({
        success: false,
        message: "Select at least one product.",
      });
    }

    const result = await Product.updateMany(
      { _id: { $in: ids }, ...vendorProductFilter(req) },
      { $set: { status } }
    );

    await invalidateCatalogCache();

    return res.status(200).json({
      success: true,
      message: `Marked ${result.modifiedCount} product(s) as ${status}.`,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      status,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/** Bulk delete products owned by vendor */
export const bulkDeleteProducts = async (req, res) => {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids.filter(Boolean) : [];
    if (!ids.length) {
      return res.status(400).json({
        success: false,
        message: "Select at least one product.",
      });
    }

    const products = await Product.find({
      _id: { $in: ids },
      ...vendorProductFilter(req),
    });

    for (const product of products) {
      if (product.images?.length) {
        for (const image of product.images) {
          if (
            image.public_id &&
            !String(image.public_id).startsWith("bulk_import_")
          ) {
            try {
              await cloudinary.uploader.destroy(image.public_id);
            } catch {
              /* continue */
            }
          }
        }
      }
    }

    const result = await Product.deleteMany({
      _id: { $in: products.map((p) => p._id) },
    });

    await invalidateCatalogCache();

    return res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} product(s).`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const { page, limit, skip } = parsePageLimit(req.query);
    const query = {};

    if (req.query.store) {
      query.store = req.query.store;
    }

    if (req.query.status) {
      query.status = req.query.status;
    }

    let categoryKey = req.query.category || "";
    if (req.query.category) {
      const categoryParam = req.query.category;
      if (/^[0-9a-fA-F]{24}$/.test(categoryParam)) {
        query.category = categoryParam;
      } else {
        const categoryDoc = await Category.findOne({ slug: categoryParam });
        if (categoryDoc) {
          query.category = categoryDoc._id;
          categoryKey = categoryDoc.slug || categoryParam;
        } else {
          return res.status(200).json({
            data: [],
            page,
            limit,
            total: 0,
            totalPages: 0,
          });
        }
      }
    }

    const sortKey = String(req.query.sort || "newest");
    const cacheKey = listCacheKey({
      status: query.status || "",
      category: categoryKey,
      store: query.store || "",
      page,
      limit,
      sort: sortKey,
    });

    const cached = await cacheGet(cacheKey);
    if (cached) {
      setPublicCatalogHeaders(res, { hit: true, maxAge: 90 });
      return res.status(200).json(cached);
    }

    let sort = { createdAt: -1 };
    if (sortKey === "price-asc") sort = { discountPrice: 1, price: 1 };
    else if (sortKey === "price-desc") sort = { discountPrice: -1, price: -1 };
    else if (sortKey === "rating") sort = { averageRating: -1, totalReviews: -1 };

    // Fetch limit+1 to know if another page exists without a full count every time
    const rows = await Product.find(query)
      .select(LIST_SELECT)
      .populate("category", "name slug")
      .populate("store", "storeName")
      .sort(sort)
      .skip(skip)
      .limit(limit + 1)
      .lean();

    const hasMore = rows.length > limit;
    const pageRows = hasMore ? rows.slice(0, limit) : rows;

    let total;
    let totalPages;
    if (page === 1 && !hasMore) {
      total = pageRows.length;
      totalPages = total ? 1 : 0;
    } else {
      total = await Product.countDocuments(query);
      totalPages = total ? Math.ceil(total / limit) : 0;
    }

    const payload = {
      data: pageRows.map(toListProduct),
      page,
      limit,
      total,
      totalPages,
    };

    await cacheSet(cacheKey, payload, LIST_TTL);
    setPublicCatalogHeaders(res, { hit: false, maxAge: 90 });
    res.status(200).json(payload);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const searchProducts = async (req, res) => {
  try {
    const keyword = String(req.query.keyword || "").trim();
    const { page, limit, skip } = parsePageLimit(req.query);

    if (!keyword) {
      return res.status(200).json({
        data: [],
        page,
        limit,
        total: 0,
        totalPages: 0,
      });
    }

    let categoryKey = "";
    const filter = { status: "active" };
    if (req.query.category) {
      const categoryParam = req.query.category;
      categoryKey = categoryParam;
      if (/^[0-9a-fA-F]{24}$/.test(categoryParam)) {
        filter.category = categoryParam;
      } else {
        const categoryDoc = await Category.findOne({ slug: categoryParam });
        if (categoryDoc) {
          filter.category = categoryDoc._id;
          categoryKey = categoryDoc.slug || categoryParam;
        } else {
          return res.status(200).json({
            data: [],
            page,
            limit,
            total: 0,
            totalPages: 0,
          });
        }
      }
    }

    const cacheKey = searchCacheKey({
      keyword,
      category: categoryKey,
      page,
      limit,
    });
    const cached = await cacheGet(cacheKey);
    if (cached) {
      setPublicCatalogHeaders(res, { hit: true, maxAge: 30 });
      return res.status(200).json(cached);
    }

    const textQuery = { ...filter, $text: { $search: keyword } };
    const regex = {
      ...filter,
      $or: [
        { name: { $regex: keyword, $options: "i" } },
        { brand: { $regex: keyword, $options: "i" } },
        { shortDescription: { $regex: keyword, $options: "i" } },
        { tags: { $regex: keyword, $options: "i" } },
      ],
    };

    let total = 0;
    let products = [];
    try {
      products = await Product.find(textQuery, { score: { $meta: "textScore" } })
        .select(LIST_SELECT)
        .populate("category", "name slug")
        .populate("store", "storeName")
        .sort({ score: { $meta: "textScore" } })
        .skip(skip)
        .limit(limit + 1)
        .lean();
      const hasMore = products.length > limit;
      if (hasMore) products = products.slice(0, limit);
      if (page === 1 && !hasMore) {
        total = products.length;
      } else {
        total = await Product.countDocuments(textQuery);
      }
    } catch {
      products = await Product.find(regex)
        .select(LIST_SELECT)
        .populate("category", "name slug")
        .populate("store", "storeName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit + 1)
        .lean();
      const hasMore = products.length > limit;
      if (hasMore) products = products.slice(0, limit);
      if (page === 1 && !hasMore) {
        total = products.length;
      } else {
        total = await Product.countDocuments(regex);
      }
    }

    const payload = {
      data: products.map(toListProduct),
      page,
      limit,
      total,
      totalPages: total ? Math.ceil(total / limit) : 0,
    };

    await cacheSet(cacheKey, payload, SEARCH_TTL);
    setPublicCatalogHeaders(res, { hit: false, maxAge: 30 });
    res.status(200).json(payload);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const filterProducts = async (req, res) => {
  try {
    const { category, minPrice, maxPrice } = req.query;

    const query = { status: "active" };

    if (category) query.category = category;

    const min = Number(minPrice);
    const max = Number(maxPrice);
    const priceFilter = {};
    if (minPrice !== undefined && !Number.isNaN(min)) priceFilter.$gte = min;
    if (maxPrice !== undefined && !Number.isNaN(max)) priceFilter.$lte = max;
    if (Object.keys(priceFilter).length) query.price = priceFilter;

    const products = await Product.find(query);

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const downloadBulkTemplate = async (req, res) => {
  try {
    const format = String(req.query.format || "xlsx").toLowerCase() === "csv" ? "csv" : "xlsx";
    const buffer = templateBuffer(format);
    const filename =
      format === "csv" ? "product-bulk-template.csv" : "product-bulk-template.xlsx";
    const contentType =
      format === "csv"
        ? "text/csv; charset=utf-8"
        : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const bulkImportProducts = async (req, res) => {
  try {
    if (!req.file?.buffer) {
      return res.status(400).json({
        success: false,
        message: "Please upload a CSV or Excel file",
      });
    }

    const store = await Store.findOne({ vendorId: req.user.id });
    if (!store) {
      return res.status(400).json({
        success: false,
        message: "Create your store before importing products",
      });
    }

    const rows = rowsFromWorkbook(req.file.buffer);
    if (!rows.length) {
      return res.status(400).json({
        success: false,
        message: "No product rows found in the file",
      });
    }
    if (rows.length > BULK_MAX_ROWS) {
      return res.status(400).json({
        success: false,
        message: `Too many rows. Import at most ${BULK_MAX_ROWS} products per file.`,
      });
    }

    const created = [];
    const errors = [];

    for (let i = 0; i < rows.length; i += 1) {
      const rowNumber = i + 2; // header is row 1
      const row = rows[i];

      try {
        const name = String(row.name || "").trim();
        const description = ensureHtmlDescription(row.description);
        const price = Number(row.price);
        const productType = validateProductType(row.productType);

        if (!name) throw new Error("name is required");
        if (!description) throw new Error("description is required");
        if (!Number.isFinite(price) || price < 0) throw new Error("valid price is required");
        if (!productType) {
          throw new Error("productType must be a supported type (see template Instructions)");
        }

        const categoryDoc = await resolveCategory(row.categorySlug);
        if (!categoryDoc) {
          throw new Error("categorySlug must match an existing category slug or name");
        }

        const discountPrice =
          row.discountPrice != null && String(row.discountPrice).trim() !== ""
            ? Number(row.discountPrice)
            : undefined;
        if (discountPrice != null && !Number.isFinite(discountPrice)) {
          throw new Error("discountPrice must be a number");
        }

        const stock = Number(row.stock);
        const stockValue = Number.isFinite(stock) && stock >= 0 ? stock : 0;
        const status =
          String(row.status || "active").trim().toLowerCase() === "inactive"
            ? "inactive"
            : "active";

        const optionGroups = buildOptionGroups(row);
        const variants = buildVariantCombos(optionGroups, {
          stock: stockValue,
          price,
          discountPrice,
        });
        const totalStock = variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
        const aboutItems = splitPiped(row.aboutItems);
        const specifications = parseSpecifications(row.specifications);
        const tags = splitList(row.tags);
        const images = parseImageUrls(row.imageUrls);

        const payload = {
          name,
          description,
          shortDescription: String(row.shortDescription || "").trim() || undefined,
          brand: String(row.brand || "").trim() || undefined,
          productType,
          category: categoryDoc._id,
          store: store._id,
          price,
          discountPrice,
          stock: totalStock,
          status,
          aboutItems,
          specifications,
          optionGroups,
          variants,
          tags,
          images,
        };

        const baseSku = generateProductSku({
          name: payload.name,
          brand: payload.brand,
          storeId: payload.store,
          variants,
        });
        const sku = await ensureUniqueSku(Product, baseSku);
        const slug = generateProductSlug(payload.name);

        const product = await Product.create({
          ...payload,
          vendor: req.user.id,
          sku,
          slug,
        });

        created.push({
          row: rowNumber,
          id: product._id,
          name: product.name,
          sku: product.sku,
        });
      } catch (err) {
        errors.push({
          row: rowNumber,
          name: String(row?.name || "").trim() || undefined,
          message: err.message || "Failed to import row",
        });
      }
    }

    if (created.length) {
      await invalidateCatalogCache();
    }

    res.status(created.length ? 201 : 400).json({
      success: created.length > 0,
      createdCount: created.length,
      errorCount: errors.length,
      created,
      errors,
      message:
        created.length > 0
          ? `Imported ${created.length} product(s)${errors.length ? `, ${errors.length} row(s) failed` : ""}`
          : "No products were imported",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
