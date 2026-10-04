/**
 * Vendor media library — upload once, reuse across products (paginated list).
 */
import MediaAsset from "../models/mediaAssetModel.js";
import Store from "../models/storeModel.js";
import Product from "../models/productModel.js";
import uploadToCloudinary from "../utils/uploadToCloudinary.js";
import cloudinary from "../configs/cloudinary.js";

async function resolveStoreId(vendorId) {
  const store = await Store.findOne({ vendorId }).select("_id").lean();
  return store?._id || null;
}

export const listMedia = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(48, Math.max(1, Number(req.query.limit) || 24));
    const q = String(req.query.q || "").trim();

    const filter = { vendor: req.user.id };
    if (q) {
      filter.$or = [
        { originalName: { $regex: q, $options: "i" } },
        { tags: { $regex: q, $options: "i" } },
      ];
    }

    const total = await MediaAsset.countDocuments(filter);
    const data = await MediaAsset.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.status(200).json({
      success: true,
      data,
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit) || 1),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const uploadMedia = async (req, res) => {
  try {
    const files = req.files || [];
    if (!files.length) {
      return res.status(400).json({
        success: false,
        message: "Choose at least one image",
      });
    }

    const storeId = await resolveStoreId(req.user.id);
    const created = [];

    for (const file of files) {
      const result = await uploadToCloudinary(
        file.buffer,
        `vendor-media/${req.user.id}`
      );

      const existing = await MediaAsset.findOne({
        vendor: req.user.id,
        public_id: result.public_id,
      });
      if (existing) {
        created.push(existing);
        continue;
      }

      const doc = await MediaAsset.create({
        vendor: req.user.id,
        store: storeId,
        public_id: result.public_id,
        url: result.secure_url,
        originalName: file.originalname || "",
        bytes: result.bytes || file.size || 0,
        width: result.width || null,
        height: result.height || null,
      });
      created.push(doc);
    }

    res.status(201).json({
      success: true,
      data: created,
      message: `Uploaded ${created.length} image(s)`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteMedia = async (req, res) => {
  try {
    const asset = await MediaAsset.findById(req.params.id);
    if (!asset) {
      return res.status(404).json({ success: false, message: "Image not found" });
    }
    if (String(asset.vendor) !== String(req.user.id) && req.user.role !== "superAdmin") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const inUse = await Product.exists({
      vendor: asset.vendor,
      "images.public_id": asset.public_id,
    });
    if (inUse) {
      return res.status(400).json({
        success: false,
        message:
          "This image is used on a product. Remove it from products first, or keep it in the library.",
      });
    }

    if (asset.public_id && !String(asset.public_id).startsWith("bulk_import_")) {
      await cloudinary.uploader.destroy(asset.public_id);
    }
    await MediaAsset.findByIdAndDelete(asset._id);

    res.status(200).json({ success: true, message: "Image deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/** Save product Cloudinary uploads into the vendor library (deduped). */
export async function upsertMediaFromUpload(vendorId, image, originalName = "") {
  if (!image?.public_id || !image?.url) return null;
  const storeId = await resolveStoreId(vendorId);
  return MediaAsset.findOneAndUpdate(
    { vendor: vendorId, public_id: image.public_id },
    {
      $setOnInsert: {
        vendor: vendorId,
        store: storeId,
        public_id: image.public_id,
        url: image.url,
        originalName,
        bytes: image.bytes || 0,
        width: image.width || null,
        height: image.height || null,
      },
    },
    { upsert: true, new: true }
  );
}
