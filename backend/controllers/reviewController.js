/**
 * Review controller — customer reviews + vendor/admin moderation list.
 */
import mongoose from "mongoose";
import Review from "../models/reviewModel.js";
import Product from "../models/productModel.js";
import uploadToCloudinary from "../utils/uploadToCloudinary.js";
import cloudinary from "../configs/cloudinary.js";

async function syncProductRatings(productId) {
  const id =
    typeof productId === "string"
      ? new mongoose.Types.ObjectId(productId)
      : productId;

  const stats = await Review.aggregate([
    { $match: { product: id } },
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
  return { averageRating, totalReviews };
}

export const getProductReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate("customer", "firstName lastName email")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ customer: req.user.id })
      .populate("product", "name images price averageRating totalReviews")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/** Vendor: own products only. Admin: all products. */
export const getManagedReviews = async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === "vendor") {
      const products = await Product.find({ vendor: req.user.id }).select("_id");
      const ownedIds = products.map((p) => String(p._id));
      if (req.query.productId) {
        // Vendor may narrow to one product, but only if they own it.
        if (!ownedIds.includes(String(req.query.productId))) {
          return res.status(403).json({ success: false, message: "Access denied" });
        }
        filter.product = req.query.productId;
      } else {
        filter.product = { $in: ownedIds };
      }
    } else if (req.query.productId) {
      filter.product = req.query.productId;
    }

    const reviews = await Review.find(filter)
      .populate("customer", "firstName lastName email")
      .populate("product", "name images vendor store averageRating totalReviews")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createReview = async (req, res) => {
  try {
    if (req.user.role !== "customer") {
      return res.status(403).json({
        success: false,
        message: "Only customers can post reviews",
      });
    }

    const { productId, rating, comment, title } = req.body;
    if (!productId || !rating) {
      return res.status(400).json({
        success: false,
        message: "productId and rating are required",
      });
    }

    const product = await Product.findById(productId);
    if (!product || product.status !== "active") {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const existing = await Review.findOne({
      product: productId,
      customer: req.user.id,
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "You already reviewed this product. Edit your existing review instead.",
      });
    }

    const images = [];
    if (req.files?.length) {
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.buffer, "reviews");
        images.push({ public_id: result.public_id, url: result.secure_url });
      }
    }

    const review = await Review.create({
      product: productId,
      customer: req.user.id,
      rating: Number(rating),
      title: title || "",
      comment: comment || "",
      images,
    });

    const stats = await syncProductRatings(product._id);
    await review.populate("customer", "firstName lastName email");

    res.status(201).json({ success: true, review, ...stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    const isOwner = String(review.customer) === String(req.user.id);
    const isAdmin = req.user.role === "superAdmin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (req.body.rating != null) review.rating = Number(req.body.rating);
    if (req.body.title != null) review.title = req.body.title;
    if (req.body.comment != null) review.comment = req.body.comment;

    if (req.files?.length) {
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.buffer, "reviews");
        review.images.push({
          public_id: result.public_id,
          url: result.secure_url,
        });
      }
      if (review.images.length > 6) {
        review.images = review.images.slice(-6);
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
      const kept = [];
      for (const img of review.images) {
        if (toRemove.has(img.public_id)) {
          await cloudinary.uploader.destroy(img.public_id);
        } else {
          kept.push(img);
        }
      }
      review.images = kept;
    }

    await review.save();
    const stats = await syncProductRatings(review.product);
    await review.populate("customer", "firstName lastName email");

    res.status(200).json({ success: true, review, ...stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    const isOwner = String(review.customer) === String(req.user.id);
    const isAdmin = req.user.role === "superAdmin";

    let isVendorOwner = false;
    if (req.user.role === "vendor") {
      const product = await Product.findById(review.product).select("vendor");
      isVendorOwner = product && String(product.vendor) === String(req.user.id);
    }

    if (!isOwner && !isAdmin && !isVendorOwner) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    for (const img of review.images || []) {
      if (img.public_id) await cloudinary.uploader.destroy(img.public_id);
    }

    const productId = review.product;
    await review.deleteOne();
    const stats = await syncProductRatings(productId);

    res.status(200).json({ success: true, message: "Review deleted", ...stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
