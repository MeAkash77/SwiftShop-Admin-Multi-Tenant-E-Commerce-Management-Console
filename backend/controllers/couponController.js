/**
 * Coupon controller — vendor/admin CRUD; customers list/validate active codes.
 */
import Coupon from "../models/couponModel.js";
import Store from "../models/storeModel.js";
import { computeCouponDiscount } from "../utils/couponPricing.js";

async function resolveVendorStore(userId) {
  return Store.findOne({ vendorId: userId });
}

function isCouponCurrentlyValid(coupon, now = new Date()) {
  if (!coupon.isActive) return false;
  if (coupon.startsAt && now < new Date(coupon.startsAt)) return false;
  if (coupon.expiresAt && now > new Date(coupon.expiresAt)) return false;
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) return false;
  return true;
}

/** Active coupons for customers (optionally filtered by store). */
export const listActiveCoupons = async (req, res) => {
  try {
    const now = new Date();
    const filter = {
      isActive: true,
      $and: [
        {
          $or: [{ startsAt: null }, { startsAt: { $lte: now } }],
        },
        {
          $or: [{ expiresAt: null }, { expiresAt: { $gte: now } }],
        },
      ],
    };

    if (req.query.storeId) {
      filter.$or = [{ store: null }, { store: req.query.storeId }];
    } else {
      filter.store = null;
    }

    const coupons = await Coupon.find(filter)
      .select("-createdBy")
      .sort({ createdAt: -1 })
      .lean();

    const usable = coupons.filter((c) =>
      c.maxUses == null ? true : c.usedCount < c.maxUses
    );

    return res.status(200).json({ success: true, data: usable });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/** Vendor: own store. Admin: all or ?storeId=. */
export const listManagedCoupons = async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === "vendor") {
      const store = await resolveVendorStore(req.user.id);
      if (!store) {
        return res.status(400).json({
          success: false,
          message: "Create your store before managing coupons.",
        });
      }
      filter.store = store._id;
    } else if (req.query.storeId) {
      filter.store = req.query.storeId;
    }

    const coupons = await Coupon.find(filter).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: coupons });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createCoupon = async (req, res) => {
  try {
    const code = String(req.body.code || "")
      .trim()
      .toUpperCase();
    const type = req.body.type === "fixed" ? "fixed" : "percent";
    const value = Number(req.body.value);
    const minOrder = Number(req.body.minOrder) || 0;
    const maxUses =
      req.body.maxUses != null && req.body.maxUses !== ""
        ? Number(req.body.maxUses)
        : null;

    if (!code) {
      return res.status(400).json({ success: false, message: "Code is required." });
    }
    if (!Number.isFinite(value) || value < 0) {
      return res.status(400).json({ success: false, message: "Invalid discount value." });
    }
    if (type === "percent" && value > 100) {
      return res.status(400).json({
        success: false,
        message: "Percent discount cannot exceed 100.",
      });
    }

    let storeId = null;
    if (req.user.role === "vendor") {
      const store = await resolveVendorStore(req.user.id);
      if (!store) {
        return res.status(400).json({
          success: false,
          message: "Create your store before creating coupons.",
        });
      }
      storeId = store._id;
    } else if (req.body.storeId) {
      storeId = req.body.storeId;
    }

    const coupon = await Coupon.create({
      code,
      type,
      value,
      minOrder,
      maxUses,
      store: storeId,
      createdBy: req.user.id,
      startsAt: req.body.startsAt || null,
      expiresAt: req.body.expiresAt || null,
      isActive: req.body.isActive !== false,
    });

    return res.status(201).json({ success: true, data: coupon });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A coupon with this code already exists for this store.",
      });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found." });
    }

    if (req.user.role === "vendor") {
      const store = await resolveVendorStore(req.user.id);
      if (!store || String(coupon.store) !== String(store._id)) {
        return res.status(403).json({ success: false, message: "Access denied." });
      }
    }

    if (req.body.type != null) {
      coupon.type = req.body.type === "fixed" ? "fixed" : "percent";
    }
    if (req.body.value != null) {
      const value = Number(req.body.value);
      if (!Number.isFinite(value) || value < 0) {
        return res.status(400).json({ success: false, message: "Invalid value." });
      }
      if (coupon.type === "percent" && value > 100) {
        return res.status(400).json({
          success: false,
          message: "Percent discount cannot exceed 100.",
        });
      }
      coupon.value = value;
    }
    if (req.body.minOrder != null) coupon.minOrder = Number(req.body.minOrder) || 0;
    if (req.body.maxUses !== undefined) {
      coupon.maxUses =
        req.body.maxUses === null || req.body.maxUses === ""
          ? null
          : Number(req.body.maxUses);
    }
    if (req.body.expiresAt !== undefined) coupon.expiresAt = req.body.expiresAt || null;
    if (req.body.startsAt !== undefined) coupon.startsAt = req.body.startsAt || null;
    if (req.body.isActive != null) coupon.isActive = Boolean(req.body.isActive);

    await coupon.save();
    return res.status(200).json({ success: true, data: coupon });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found." });
    }

    if (req.user.role === "vendor") {
      const store = await resolveVendorStore(req.user.id);
      if (!store || String(coupon.store) !== String(store._id)) {
        return res.status(403).json({ success: false, message: "Access denied." });
      }
    }

    await coupon.deleteOne();
    return res.status(200).json({ success: true, message: "Coupon deleted." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Preview / validate a code for a store + subtotal (does not consume uses).
 * Body: { code, storeId, subtotal }
 */
export const validateCoupon = async (req, res) => {
  try {
    const code = String(req.body.code || "")
      .trim()
      .toUpperCase();
    const { storeId } = req.body;
    const subtotal = Number(req.body.subtotal);

    if (!code || !storeId || !Number.isFinite(subtotal)) {
      return res.status(400).json({
        success: false,
        message: "code, storeId, and subtotal are required.",
      });
    }

    const coupon = await findApplicableCoupon(code, storeId);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Invalid or expired coupon.",
      });
    }

    try {
      const discount = computeCouponDiscount(coupon, subtotal);
      return res.status(200).json({
        success: true,
        data: {
          code: coupon.code,
          type: coupon.type,
          value: coupon.value,
          discount,
          minOrder: coupon.minOrder,
        },
      });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/** Prefer store-scoped code, then platform-wide. */
export async function findApplicableCoupon(code, storeId) {
  const normalized = String(code || "")
    .trim()
    .toUpperCase();
  if (!normalized) return null;

  const candidates = await Coupon.find({
    code: normalized,
    $or: [{ store: storeId }, { store: null }],
  }).sort({ store: -1 });

  const now = new Date();
  for (const coupon of candidates) {
    if (isCouponCurrentlyValid(coupon, now)) return coupon;
  }
  return null;
}

export { isCouponCurrentlyValid };
