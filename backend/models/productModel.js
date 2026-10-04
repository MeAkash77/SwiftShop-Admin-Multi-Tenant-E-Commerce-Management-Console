/**
 * Product catalog item owned by a vendor/store.
 * Supports productType templates, optionGroups, variants, images, active|inactive.
 * See docs/03-DATABASE-MODULES.md and docs/02-PROJECT-FLOW.md (product lifecycle).
 */
import mongoose from "mongoose";
import { PRODUCT_TYPE_IDS } from "../utils/productTypeTemplates.js";

const variantSchema = new mongoose.Schema(
  {
    color: String,
    size: String,
    storage: String,
    ram: String,
    connectivity: String,
    capacity: String,
    chipset: String,
    stock: { type: Number, default: 0 },
    /** Version MRP (optional — falls back to product price) */
    price: Number,
    /** Version selling / discount price */
    discountPrice: Number,
  },
  { _id: false }
);

const optionGroupSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    values: [String],
  },
  { _id: false }
);

const specSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    value: { type: String, required: true },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },

    name: {
      type: String,
      required: true,
    },

    slug: {
      type: String,
      unique: true,
    },

    /** HTML description from vendor rich editor */
    description: {
      type: String,
      required: true,
    },

    shortDescription: String,

    /** Amazon-style “About this item” bullets */
    aboutItems: [String],

    productType: {
      type: String,
      enum: PRODUCT_TYPE_IDS,
      default: "generic",
      index: true,
    },

    /** Key/value technical details */
    specifications: [specSchema],

    /** Customer-facing choices (color, storage, …) */
    optionGroups: [optionGroupSchema],

    price: {
      type: Number,
      required: true,
    },

    discountPrice: Number,

    stock: {
      type: Number,
      default: 0,
    },

    sku: {
      type: String,
      unique: true,
    },

    brand: String,

    images: [
      {
        public_id: String,
        url: String,
      },
    ],

    variants: [variantSchema],

    tags: [String],

    averageRating: {
      type: Number,
      default: 0,
    },

    totalReviews: {
      type: Number,
      default: 0,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

productSchema.index({ store: 1, status: 1 });
productSchema.index({ vendor: 1 });
productSchema.index({ category: 1 });
productSchema.index({ status: 1, category: 1, createdAt: -1 });
productSchema.index({ status: 1, isFeatured: 1, createdAt: -1 });
productSchema.index({
  name: "text",
  brand: "text",
  shortDescription: "text",
  tags: "text",
});

export default mongoose.model("Product", productSchema);
