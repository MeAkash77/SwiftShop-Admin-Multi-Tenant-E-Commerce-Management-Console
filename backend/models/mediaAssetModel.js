/**
 * Vendor media library — reusable Cloudinary images (paginated).
 * Attach to products by reference without re-uploading.
 */
import mongoose from "mongoose";

const mediaAssetSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      default: null,
      index: true,
    },
    public_id: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    originalName: {
      type: String,
      default: "",
      trim: true,
    },
    bytes: {
      type: Number,
      default: 0,
    },
    width: {
      type: Number,
      default: null,
    },
    height: {
      type: Number,
      default: null,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

mediaAssetSchema.index({ vendor: 1, createdAt: -1 });
mediaAssetSchema.index({ vendor: 1, public_id: 1 }, { unique: true });
mediaAssetSchema.index({ originalName: "text", tags: "text" });

const MediaAsset = mongoose.model("MediaAsset", mediaAssetSchema);
export default MediaAsset;
