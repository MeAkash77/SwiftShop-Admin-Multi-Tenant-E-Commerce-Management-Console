/**
 * Support chat — customer sessions with bot + vendor replies.
 * Used for order help and product requests linked to a store.
 */
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["customer", "bot", "vendor", "system"],
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 4000,
    },
    /** Structured payloads (order cards, quick replies, product request) */
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true, _id: true }
);

const chatSessionSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /** Primary store involved (from order or product request) */
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      default: null,
      index: true,
    },

    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
      index: true,
    },

    subject: {
      type: String,
      trim: true,
      default: "Order support",
      maxlength: 200,
    },

    topic: {
      type: String,
      enum: [
        "general",
        "track_order",
        "cancel_order",
        "return_order",
        "payment",
        "product_request",
        "shipping",
      ],
      default: "general",
    },

    status: {
      type: String,
      enum: ["open", "waiting_vendor", "resolved", "closed"],
      default: "open",
      index: true,
    },

    /** Product change / catalog request from customer via bot */
    productRequest: {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", default: null },
      productName: { type: String, default: null },
      requestType: {
        type: String,
        enum: ["info", "stock", "similar", "issue", "other"],
        default: "other",
      },
      details: { type: String, default: null },
      status: {
        type: String,
        enum: ["pending", "in_progress", "done", "declined"],
        default: "pending",
      },
    },

    messages: [messageSchema],

    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    unreadByVendor: {
      type: Number,
      default: 0,
      min: 0,
    },

    unreadByCustomer: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

chatSessionSchema.index({ customerId: 1, lastMessageAt: -1 });
chatSessionSchema.index({ storeId: 1, lastMessageAt: -1 });

export default mongoose.model("ChatSession", chatSessionSchema);
