/**
 * Home marketing banner (slider | offer | category tile).
 * Managed by vendor/admin; served publicly on shop home.
 */
import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subtitle: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ["slider", "offer", "category"],
      default: "slider",
      index: true,
    },
    image: {
      public_id: String,
      url: String,
    },
    linkUrl: {
      type: String,
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    creatorRole: {
      type: String,
      enum: ["vendor", "superAdmin"],
      required: true,
    },
    badgeText: {
      type: String,
      trim: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    startsAt: Date,
    endsAt: Date,
  },
  { timestamps: true }
);

bannerSchema.index({ type: 1, isActive: 1, sortOrder: 1 });

export default mongoose.model("Banner", bannerSchema);
