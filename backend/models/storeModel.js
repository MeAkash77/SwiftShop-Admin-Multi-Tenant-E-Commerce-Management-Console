/**
 * Store model — one shopfront per vendor (vendorId is unique).
 * Holds contact info and default shipping/return policy for orders.
 */
import mongoose from "mongoose";

const storeSchema = new mongoose.Schema(
  {
    storeName: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      required: true,
    },

    shippingFee: {
      type: Number,
      default: 0,
      min: 0,
    },

    freeShippingAbove: {
      type: Number,
      default: null,
    },

    shippingPolicy: {
      type: String,
      default: "",
      trim: true,
    },

    returnPolicy: {
      type: String,
      default: "",
      trim: true,
    },

    estimatedDeliveryDays: {
      type: Number,
      default: 5,
      min: 1,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

storeSchema.index({ isActive: 1 });
storeSchema.index({ storeName: "text", description: "text" });

const storeModel = mongoose.model("Store", storeSchema);

export default storeModel;
