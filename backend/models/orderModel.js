/**
 * Order + OrderItem — checkout snapshot per store.
 * Server sets money fields; paymentStatus + orderStatus drive fulfillment/invoice.
 * Invoice PDF allowed only when orderStatus === Delivered (see docs/02-PROJECT-FLOW.md).
 */
import mongoose from "mongoose";

// ==============================
// Order Item Schema
// ==============================

const orderItemSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: [1, "Quantity must be at least 1"],
    },

    price: {
      type: Number,
      required: true,
      min: [0, "Price cannot be negative"],
    },

    /** Snapshot of selected model/options at purchase time */
    variantOptions: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    variantLabel: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ==============================
// Order Schema
// ==============================

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },

    shippingAddress: {
      type: new mongoose.Schema(
        {
          fullName: { type: String, trim: true },
          phone: { type: String, trim: true },
          pincode: { type: String, trim: true },
          locality: { type: String, trim: true },
          addressLine: { type: String, trim: true },
          city: { type: String, trim: true },
          state: { type: String, trim: true },
          addressType: { type: String, default: "Home" },
        },
        { _id: false }
      ),
      // Validated in createOrder; optional here so older orders still update cleanly
      default: undefined,
    },

    subtotal: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    tax: {
      type: Number,
      default: 0,
      min: 0,
    },

    shippingFee: {
      type: Number,
      default: 0,
      min: 0,
    },

    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    couponCode: {
      type: String,
      default: null,
      trim: true,
      uppercase: true,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentStatus: {
      type: String,
      enum: [
        "Pending",
        "Paid",
        "Failed",
        "Refunded",
      ],
      default: "Pending",
    },

    paymentMethod: {
      type: String,
      enum: ["COD", "UPI", "Card", "NetBanking", "Wallet"],
      default: "COD",
    },

    paymentId: {
      type: String,
      default: null,
    },

    paidAt: {
      type: Date,
      default: null,
    },

    paymentNote: {
      type: String,
      default: null,
    },

    razorpayOrderId: {
      type: String,
      default: null,
    },

    orderStatus: {
      type: String,
      enum: [
        "Pending",
        "Confirmed",
        "Processing",
        "Shipped",
        "Delivered",
        "Cancelled",
        "Returned",
      ],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.index({ customerId: 1, createdAt: -1 });
orderSchema.index({ storeId: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ razorpayOrderId: 1 });

// ==============================
// Models
// ==============================

const Order = mongoose.model("Order", orderSchema);

const OrderItem = mongoose.model(
  "OrderItem",
  orderItemSchema
);

// ==============================
// Export Models
// ==============================

export { Order, OrderItem };