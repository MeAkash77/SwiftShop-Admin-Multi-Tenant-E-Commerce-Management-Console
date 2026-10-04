/**
 * Payout / withdrawal request — vendor asks to withdraw store earnings,
 * admin pays or rejects. Balance is derived from Paid orders minus
 * payouts in status Requested|Paid (see payoutController).
 */
import mongoose from "mongoose";

const payoutSchema = new mongoose.Schema(
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
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ["Requested", "Paid", "Rejected"],
      default: "Requested",
      index: true,
    },
    method: {
      type: String,
      enum: ["Bank", "UPI"],
      default: "Bank",
    },
    // Vendor-supplied destination (light KYC; not validated against a bank)
    accountName: { type: String, default: "", trim: true },
    accountNumber: { type: String, default: "", trim: true },
    ifsc: { type: String, default: "", trim: true },
    upiId: { type: String, default: "", trim: true },
    note: { type: String, default: "", trim: true },
    // Admin fields
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    processedAt: { type: Date, default: null },
    reference: { type: String, default: "", trim: true },
    adminNote: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

payoutSchema.index({ store: 1, createdAt: -1 });
payoutSchema.index({ status: 1, createdAt: -1 });

const Payout = mongoose.model("Payout", payoutSchema);
export default Payout;
