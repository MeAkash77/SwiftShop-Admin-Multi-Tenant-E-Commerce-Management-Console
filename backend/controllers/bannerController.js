/**
 * Banner CMS — public shop banners + vendor/admin manage CRUD.
 */
import Banner from "../models/bannerModel.js";
import uploadToCloudinary from "../utils/uploadToCloudinary.js";
import cloudinary from "../configs/cloudinary.js";

function isLive(banner, now = new Date()) {
  if (!banner.isActive) return false;
  if (banner.startsAt && banner.startsAt > now) return false;
  if (banner.endsAt && banner.endsAt < now) return false;
  return true;
}

export const getPublicBanners = async (req, res) => {
  try {
    const query = { isActive: true };
    if (req.query.type) query.type = req.query.type;

    const banners = await Banner.find(query)
      .populate("category", "name slug")
      .populate("store", "storeName")
      .sort({ sortOrder: 1, createdAt: -1 });

    const now = new Date();
    const live = banners.filter((b) => isLive(b, now));

    res.status(200).json({ success: true, banners: live });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getManagedBanners = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === "vendor") {
      filter.createdBy = req.user.id;
    }
    if (req.query.type) filter.type = req.query.type;

    const banners = await Banner.find(filter)
      .populate("category", "name slug")
      .populate("store", "storeName")
      .sort({ sortOrder: 1, createdAt: -1 });

    res.status(200).json({ success: true, banners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createBanner = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Banner image is required",
      });
    }

    const result = await uploadToCloudinary(req.file.buffer, "banners");

    const banner = await Banner.create({
      title: req.body.title,
      subtitle: req.body.subtitle || "",
      type: req.body.type || "slider",
      linkUrl: req.body.linkUrl || "",
      category: req.body.category || undefined,
      store: req.body.store || undefined,
      badgeText: req.body.badgeText || "",
      sortOrder: Number(req.body.sortOrder) || 0,
      isActive: req.body.isActive !== "false" && req.body.isActive !== false,
      startsAt: req.body.startsAt || undefined,
      endsAt: req.body.endsAt || undefined,
      image: { public_id: result.public_id, url: result.secure_url },
      createdBy: req.user.id,
      creatorRole: req.user.role === "superAdmin" ? "superAdmin" : "vendor",
    });

    res.status(201).json({ success: true, banner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ success: false, message: "Banner not found" });
    }

    if (
      req.user.role === "vendor" &&
      String(banner.createdBy) !== String(req.user.id)
    ) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const fields = [
      "title",
      "subtitle",
      "type",
      "linkUrl",
      "category",
      "store",
      "badgeText",
      "sortOrder",
      "isActive",
      "startsAt",
      "endsAt",
    ];

    for (const field of fields) {
      if (req.body[field] !== undefined) {
        if (field === "sortOrder") banner.sortOrder = Number(req.body.sortOrder) || 0;
        else if (field === "isActive") {
          banner.isActive =
            req.body.isActive === true ||
            req.body.isActive === "true" ||
            req.body.isActive === "1";
        } else if (field === "category" || field === "store") {
          banner[field] = req.body[field] || undefined;
        } else {
          banner[field] = req.body[field];
        }
      }
    }

    if (req.file) {
      if (banner.image?.public_id) {
        await cloudinary.uploader.destroy(banner.image.public_id);
      }
      const result = await uploadToCloudinary(req.file.buffer, "banners");
      banner.image = { public_id: result.public_id, url: result.secure_url };
    }

    await banner.save();
    res.status(200).json({ success: true, banner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ success: false, message: "Banner not found" });
    }

    if (
      req.user.role === "vendor" &&
      String(banner.createdBy) !== String(req.user.id)
    ) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (banner.image?.public_id) {
      await cloudinary.uploader.destroy(banner.image.public_id);
    }

    await banner.deleteOne();
    res.status(200).json({ success: true, message: "Banner deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
