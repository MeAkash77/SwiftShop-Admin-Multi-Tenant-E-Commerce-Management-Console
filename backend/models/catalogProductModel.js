/**
 * Company master catalog — brand → product → models.
 * Vendors browse these and auto-fill their own listing (set price/stock, publish).
 * Admin-managed only. This is NOT a sellable product; it is a template.
 */
import mongoose from "mongoose";
import { PRODUCT_TYPE_IDS } from "../utils/productTypeTemplates.js";

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

const catalogProductSchema = new mongoose.Schema(
  {
    brand: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },

    /** Denormalized for filtering + bulk seeding */
    categorySlug: {
      type: String,
      trim: true,
      index: true,
    },

    productType: {
      type: String,
      enum: PRODUCT_TYPE_IDS,
      default: "generic",
      index: true,
    },

    /** HTML description auto-filled into vendor listing */
    description: String,

    shortDescription: String,

    aboutItems: [String],

    specifications: [specSchema],

    /** Selectable models/variants (color, storage, size, …) */
    optionGroups: [optionGroupSchema],

    images: [
      {
        public_id: String,
        url: String,
      },
    ],

    /** Company reference pricing; vendor overrides on publish */
    suggestedPrice: Number,
    suggestedDiscountPrice: Number,

    tags: [String],

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

catalogProductSchema.index({ name: "text", brand: "text", tags: "text" });

export default mongoose.model("CatalogProduct", catalogProductSchema);
