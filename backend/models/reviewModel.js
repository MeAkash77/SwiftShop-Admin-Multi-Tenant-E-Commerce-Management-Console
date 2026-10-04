/**
 * Product review — unique per (product, customer).
 */
import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    title: {
      type: String,
      trim: true,
      maxlength: 120,
    },

    comment: {
      type: String,
      trim: true,
      maxlength: 2000,
    },

    images: [
      {
        public_id: String,
        url: String,
      },
    ],
  },
  { timestamps: true }
);

reviewSchema.index({ product: 1, customer: 1 }, { unique: true });

export default mongoose.model("Review", reviewSchema);
