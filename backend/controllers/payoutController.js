/**
 * Payout / withdrawal — vendors request to withdraw earnings, admin pays or rejects.
 *
 * Available balance = SUM(Paid order totalAmount for the store)
 *                     − SUM(payout.amount where status in [Requested, Paid])
 * Rejected payouts release the amount back to the balance.
 */
import mongoose from "mongoose";
import Payout from "../models/payoutModel.js";
import Store from "../models/storeModel.js";
import { Order } from "../models/orderModel.js";
import { notifyAdmins, notifyVendor } from "../utils/createNotification.js";

async function resolveVendorStore(vendorId) {
  return Store.findOne({ vendorId }).select("_id storeName vendorId").lean();
}

/** Lifetime collected earnings for a store (customer-paid orders). */
async function collectedEarnings(storeId) {
  const rows = await Order.aggregate([
    {
      $match: {
        storeId: new mongoose.Types.ObjectId(String(storeId)),
        paymentStatus: "Paid",
      },
    },
    { $group: { _id: null, total: { $sum: "$totalAmount" } } },
  ]);
  return rows[0]?.total || 0;
}

/** Amount already withdrawn or reserved (Requested + Paid). */
async function reservedPayouts(storeId) {
  const rows = await Payout.aggregate([
    {
      $match: {
        store: new mongoose.Types.ObjectId(String(storeId)),
        status: { $in: ["Requested", "Paid"] },
      },
    },
    {
      $group: {
        _id: "$status",
        total: { $sum: "$amount" },
      },
    },
  ]);
  const map = { Requested: 0, Paid: 0 };
  rows.forEach((r) => {
    map[r._id] = r.total;
  });
  return map;
}

async function buildBalance(storeId) {
  const [earned, reserved] = await Promise.all([
    collectedEarnings(storeId),
    reservedPayouts(storeId),
  ]);
  const pending = reserved.Requested || 0;
  const paidOut = reserved.Paid || 0;
  const available = Math.max(0, earned - pending - paidOut);
  return { earned, pending, paidOut, available };
}

/** GET /api/payout/balance — vendor's own balance summary. */
export const getMyBalance = async (req, res) => {
  try {
    const store = await resolveVendorStore(req.user.id);
    if (!store) {
      return res
        .status(404)
        .json({ success: false, message: "No store found for this vendor." });
    }
    const balance = await buildBalance(store._id);
    return res.status(200).json({
      success: true,
      data: { store: { _id: store._id, storeName: store.storeName }, ...balance },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/** GET /api/payout/mine — vendor's own payout history. */
export const getMyPayouts = async (req, res) => {
  try {
    const store = await resolveVendorStore(req.user.id);
    if (!store) {
      return res
        .status(404)
        .json({ success: false, message: "No store found for this vendor." });
    }
    const data = await Payout.find({ store: store._id })
      .sort({ createdAt: -1 })
      .lean();
    return res.status(200).json({ success: true, totalPayouts: data.length, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/** POST /api/payout — vendor requests a withdrawal. */
export const requestPayout = async (req, res) => {
  try {
    const store = await resolveVendorStore(req.user.id);
    if (!store) {
      return res
        .status(404)
        .json({ success: false, message: "No store found for this vendor." });
    }

    const amount = Number(req.body.amount);
    if (!Number.isFinite(amount) || amount < 1) {
      return res
        .status(400)
        .json({ success: false, message: "Enter a valid amount." });
    }

    const method = req.body.method === "UPI" ? "UPI" : "Bank";
    if (method === "UPI" && !String(req.body.upiId || "").trim()) {
      return res
        .status(400)
        .json({ success: false, message: "UPI ID is required for UPI payouts." });
    }
    if (
      method === "Bank" &&
      (!String(req.body.accountNumber || "").trim() ||
        !String(req.body.ifsc || "").trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Account number and IFSC are required for bank payouts.",
      });
    }

    const balance = await buildBalance(store._id);
    if (amount > balance.available) {
      return res.status(400).json({
        success: false,
        message: `Amount exceeds available balance (₹${balance.available}).`,
      });
    }

    const payout = await Payout.create({
      vendor: req.user.id,
      store: store._id,
      amount,
      method,
      accountName: String(req.body.accountName || "").trim(),
      accountNumber: method === "Bank" ? String(req.body.accountNumber || "").trim() : "",
      ifsc: method === "Bank" ? String(req.body.ifsc || "").trim() : "",
      upiId: method === "UPI" ? String(req.body.upiId || "").trim() : "",
      note: String(req.body.note || "").trim(),
    });

    notifyAdmins({
      type: "payout.requested",
      title: "New payout request",
      body: `${store.storeName || "A vendor"} requested ₹${amount} (${method}).`,
      link: "/admin/payouts",
      entityType: "payout",
      entityId: payout._id,
      store: store._id,
    });

    return res.status(201).json({ success: true, data: payout });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/** DELETE /api/payout/:id — vendor cancels a pending request. */
export const cancelPayout = async (req, res) => {
  try {
    const store = await resolveVendorStore(req.user.id);
    if (!store) {
      return res
        .status(404)
        .json({ success: false, message: "No store found for this vendor." });
    }
    const payout = await Payout.findById(req.params.id);
    if (!payout || String(payout.store) !== String(store._id)) {
      return res.status(404).json({ success: false, message: "Payout not found." });
    }
    if (payout.status !== "Requested") {
      return res.status(400).json({
        success: false,
        message: "Only pending requests can be cancelled.",
      });
    }
    await payout.deleteOne();
    return res.status(200).json({ success: true, message: "Payout request cancelled." });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/** GET /api/payout — admin: list all payouts (optional ?status=). */
export const listPayouts = async (req, res) => {
  try {
    const filter = {};
    const status = String(req.query.status || "").trim();
    if (["Requested", "Paid", "Rejected"].includes(status)) {
      filter.status = status;
    }
    const data = await Payout.find(filter)
      .populate("store", "storeName")
      .populate("vendor", "firstName lastName email")
      .populate("processedBy", "firstName lastName")
      .sort({ createdAt: -1 })
      .lean();
    return res.status(200).json({ success: true, totalPayouts: data.length, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/** PUT /api/payout/:id/pay — admin marks a payout as paid. */
export const markPayoutPaid = async (req, res) => {
  try {
    const payout = await Payout.findById(req.params.id);
    if (!payout) {
      return res.status(404).json({ success: false, message: "Payout not found." });
    }
    if (payout.status !== "Requested") {
      return res.status(400).json({
        success: false,
        message: "Only pending requests can be paid.",
      });
    }
    payout.status = "Paid";
    payout.processedBy = req.user.id;
    payout.processedAt = new Date();
    payout.reference = String(req.body.reference || "").trim();
    payout.adminNote = String(req.body.adminNote || "").trim();
    await payout.save();

    notifyVendor(payout.vendor, {
      type: "payout.paid",
      title: "Payout paid",
      body: `Your withdrawal of ₹${payout.amount} was marked as paid.${
        payout.reference ? ` Ref: ${payout.reference}` : ""
      }`,
      link: "/vendor/payouts",
      entityType: "payout",
      entityId: payout._id,
      store: payout.store,
    });

    return res.status(200).json({ success: true, data: payout });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/** PUT /api/payout/:id/reject — admin rejects a payout (releases balance). */
export const rejectPayout = async (req, res) => {
  try {
    const payout = await Payout.findById(req.params.id);
    if (!payout) {
      return res.status(404).json({ success: false, message: "Payout not found." });
    }
    if (payout.status !== "Requested") {
      return res.status(400).json({
        success: false,
        message: "Only pending requests can be rejected.",
      });
    }
    payout.status = "Rejected";
    payout.processedBy = req.user.id;
    payout.processedAt = new Date();
    payout.adminNote = String(req.body.adminNote || req.body.reason || "").trim();
    await payout.save();

    notifyVendor(payout.vendor, {
      type: "payout.rejected",
      title: "Payout rejected",
      body: `Your withdrawal of ₹${payout.amount} was rejected.${
        payout.adminNote ? ` Reason: ${payout.adminNote}` : ""
      }`,
      link: "/vendor/payouts",
      entityType: "payout",
      entityId: payout._id,
      store: payout.store,
    });

    return res.status(200).json({ success: true, data: payout });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
