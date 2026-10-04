/**
 * Order controller — create (server pricing), Razorpay verify, status, invoice PDF.
 * Ownership: customer / store vendor / superAdmin. See docs/02-PROJECT-FLOW.md.
 */
import { randomInt } from "node:crypto";
import { Order, OrderItem } from "../models/orderModel.js";
import Product from "../models/productModel.js";
import User from "../models/userModel.js";
import Store from "../models/storeModel.js";
import {
  createRazorpayOrder,
  fetchRazorpayPayment,
  getRazorpayKeyId,
  isRazorpayConfigured,
  verifyRazorpaySignature,
} from "../services/razorpayService.js";
import { sendOrderConfirmation, sendPaymentReceipt } from "../services/emailService.js";
import { buildInvoicePdf } from "../services/invoicePdfService.js";
import { resolveShippingAddressForOrder } from "./addressController.js";
import {
  findMatchingVariantIndex,
  resolveOrderLinePricing,
  sumVariantStock,
} from "../utils/productPricing.js";
import { findApplicableCoupon } from "./couponController.js";
import {
  computeCouponDiscount,
  computeShippingFee,
} from "../utils/couponPricing.js";
import {
  notifyVendor,
  notifyAdmins,
  notifyCustomer,
} from "../utils/createNotification.js";

// Customer-friendly status notification copy
const CUSTOMER_STATUS_TITLE = {
  Confirmed: "Order confirmed",
  Processing: "Order is being prepared",
  Shipped: "Order shipped",
  Delivered: "Order delivered",
  Cancelled: "Order cancelled",
  Returned: "Return updated",
};

const CUSTOMER_STATUS_BODY = {
  Confirmed: (n) => `The seller confirmed order ${n}.`,
  Processing: (n) => `Order ${n} is being prepared for shipment.`,
  Shipped: (n) => `Order ${n} is on the way.`,
  Delivered: (n) => `Order ${n} was delivered. Enjoy! You can leave a review.`,
  Cancelled: (n) => `Order ${n} was cancelled.`,
  Returned: (n) => `Your return for order ${n} was processed.`,
};


// ===============================================
// HELPER FUNCTIONS
// ===============================================

// Validate Customer
const validateCustomer = async (customerId) => {
  const customer = await User.findById(customerId);

  if (!customer) {
    throw new Error("Customer not found.");
  }

  if (customer.role?.toLowerCase() !== "customer") {
    throw new Error("Only customers can place orders.");
  }

  return customer;
};

// Validate Store
const validateStore = async (storeId) => {
  const store = await Store.findById(storeId);

  if (!store) {
    throw new Error("Store not found.");
  }

  return store;
};

// Validate Products & Calculate Subtotal (server-side prices only)
const processOrderItems = async (items, storeId) => {
  let subtotal = 0;
  const orderItems = [];

  for (const item of items) {
    const quantity = Number(item.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new Error("Each item must have a valid quantity of at least 1.");
    }

    const product = await Product.findById(item.productId);

    if (!product) {
      throw new Error(`Product not found (${item.productId})`);
    }

    if (product.status !== "active") {
      throw new Error(`${product.name} is inactive.`);
    }

    if (product.store.toString() !== storeId.toString()) {
      throw new Error(`${product.name} does not belong to this store.`);
    }

    // Ignore any client-sent price / discountPrice — resolve from DB + selected model
    const line = resolveOrderLinePricing(product, item.options || item.variantOptions);

    if (line.availableStock < quantity) {
      throw new Error(
        `${product.name}${line.variantLabel ? ` (${line.variantLabel})` : ""} has only ${line.availableStock} item(s) left.`
      );
    }

    // Also guard aggregate product stock
    if ((Number(product.stock) || 0) < quantity) {
      throw new Error(
        `${product.name} has only ${product.stock} item(s) left.`
      );
    }

    const lineTotal = line.unitPrice * quantity;
    subtotal += lineTotal;

    orderItems.push({
      product,
      quantity,
      price: line.unitPrice,
      variantOptions: Object.keys(line.options).length ? line.options : null,
      variantLabel: line.variantLabel || null,
    });
  }

  return {
    subtotal,
    orderItems,
  };
};

function decrementProductStock(product, quantity, variantOptions) {
  if (variantOptions && Object.keys(variantOptions).length) {
    const idx = findMatchingVariantIndex(product.variants || [], variantOptions);
    if (idx >= 0) {
      const current = Number(product.variants[idx].stock) || 0;
      product.variants[idx].stock = Math.max(0, current - quantity);
      product.markModified("variants");
      product.stock = sumVariantStock(product);
      return;
    }
  }
  product.stock = Math.max(0, (Number(product.stock) || 0) - quantity);
}

function incrementProductStock(product, quantity, variantOptions) {
  if (variantOptions && Object.keys(variantOptions).length) {
    const idx = findMatchingVariantIndex(product.variants || [], variantOptions);
    if (idx >= 0) {
      const current = Number(product.variants[idx].stock) || 0;
      product.variants[idx].stock = current + quantity;
      product.markModified("variants");
      product.stock = sumVariantStock(product);
      return;
    }
  }
  product.stock = (Number(product.stock) || 0) + quantity;
}

// Save Order Items & Reduce Stock
const saveOrderItems = async (orderId, orderItems) => {
  for (const item of orderItems) {
    await OrderItem.create({
      orderId,
      productId: item.product._id,
      quantity: item.quantity,
      price: item.price,
      variantOptions: item.variantOptions,
      variantLabel: item.variantLabel,
    });

    decrementProductStock(item.product, item.quantity, item.variantOptions);
    await item.product.save();
  }
};

// Restore Product Stock
const restoreStock = async (orderId) => {
  const orderItems = await OrderItem.find({ orderId });

  for (const item of orderItems) {
    const product = await Product.findById(item.productId);

    if (product) {
      incrementProductStock(product, item.quantity, item.variantOptions);
      await product.save();
    }
  }
};
// ===============================================
// CREATE ORDER
// ===============================================

export const createOrder = async (req, res) => {
  try {
    const {
      storeId,
      items,
      paymentMethod = "COD",
      addressId,
      shippingAddress,
      couponCode,
    } = req.body;

    // Never trust client identity or fee fields for payable amount
    const customerId =
      req.user.role === "superAdmin" && req.body.customerId
        ? req.body.customerId
        : req.user.id;
    const tax = 0;

    const allowedMethods = ["COD", "UPI", "Card", "NetBanking", "Wallet"];
    if (!allowedMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method.",
      });
    }

    // Validate Required Fields
    if (!customerId || !storeId) {
      return res.status(400).json({
        success: false,
        message: "Customer and Store are required.",
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order must contain at least one product.",
      });
    }

    let deliveryAddress;
    try {
      deliveryAddress = await resolveShippingAddressForOrder(customerId, {
        addressId,
        shippingAddress,
      });
    } catch (addressError) {
      return res.status(400).json({
        success: false,
        message: addressError.message,
      });
    }

    let store;
    try {
      await validateCustomer(customerId);
      store = await validateStore(storeId);
    } catch (validationError) {
      const statusCode =
        validationError.message === "Customer not found." ||
        validationError.message === "Store not found."
          ? 404
          : 400;

      return res.status(statusCode).json({
        success: false,
        message: validationError.message,
      });
    }

    let subtotal;
    let orderItems;

    try {
      const result = await processOrderItems(items, storeId);
      subtotal = result.subtotal;
      orderItems = result.orderItems;
    } catch (validationError) {
      const statusCode =
        validationError.message.includes("not found")
          ? 404
          : 400;

      return res.status(statusCode).json({
        success: false,
        message: validationError.message,
      });
    }

    let discountAmount = 0;
    let appliedCoupon = null;
    let appliedCouponCode = null;

    if (couponCode && String(couponCode).trim()) {
      appliedCoupon = await findApplicableCoupon(couponCode, storeId);
      if (!appliedCoupon) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired coupon.",
        });
      }
      try {
        discountAmount = computeCouponDiscount(appliedCoupon, subtotal);
        appliedCouponCode = appliedCoupon.code;
      } catch (couponErr) {
        return res.status(400).json({
          success: false,
          message: couponErr.message,
        });
      }
    }

    const shippingFee = computeShippingFee(store, subtotal);
    const totalAmount = Number(
      Math.max(0, subtotal - discountAmount + tax + shippingFee).toFixed(2)
    );

    // Secure Order Number
    const orderNumber = `ORD-${Date.now()}-${randomInt(1000, 10000)}`;

    // COD → Pending payment. Online → Razorpay checkout (Pending until verified).
    const isOnline = paymentMethod !== "COD";

    if (isOnline && !isRazorpayConfigured()) {
      return res.status(503).json({
        success: false,
        message:
          "Online payments require Razorpay. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET, or choose Cash on Delivery.",
      });
    }

    const order = await Order.create({
      orderNumber,
      customerId,
      storeId,
      shippingAddress: deliveryAddress,
      subtotal,
      tax,
      shippingFee,
      discountAmount,
      couponCode: appliedCouponCode,
      totalAmount,
      paymentMethod,
      paymentStatus: "Pending",
      paymentId: null,
      paidAt: null,
      paymentNote: isOnline ? "Awaiting Razorpay payment" : "Pay on delivery",
      orderStatus: "Pending",
    });

    let razorpay = null;
    if (isOnline) {
      try {
        razorpay = await createRazorpayOrder({
          amount: totalAmount,
          receipt: order.orderNumber,
          notes: {
            orderId: String(order._id),
            orderNumber: order.orderNumber,
          },
        });
        order.razorpayOrderId = razorpay.id;
        await order.save();
      } catch (rzpErr) {
        await Order.findByIdAndDelete(order._id);
        return res.status(502).json({
          success: false,
          message: rzpErr.message || "Failed to create Razorpay order.",
        });
      }
    }

    if (appliedCoupon) {
      appliedCoupon.usedCount = (appliedCoupon.usedCount || 0) + 1;
      await appliedCoupon.save();
    }

    await saveOrderItems(order._id, orderItems);

    try {
      const customer = await User.findById(customerId).select("email firstName");
      await sendOrderConfirmation({
        to: customer?.email,
        firstName: customer?.firstName,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
      });
    } catch (mailErr) {
      console.error("Order confirmation email failed:", mailErr.message);
    }

    if (store?.vendorId) {
      notifyVendor(store.vendorId, {
        type: "order.created",
        title: "New order",
        body: `Order ${order.orderNumber} · ₹${order.totalAmount} · ${order.paymentMethod}`,
        link: "/vendor/orders",
        entityType: "order",
        entityId: order._id,
        store: store._id || storeId,
      });
    }

    notifyCustomer(customerId, {
      type: "order.created",
      title: "Order placed",
      body: `We received your order ${order.orderNumber} · ₹${order.totalAmount}.`,
      link: "/customer/orders",
      entityType: "order",
      entityId: order._id,
      store: store?._id || storeId,
    });

    return res.status(201).json({
      success: true,
      message: isOnline
        ? "Order created. Complete payment with Razorpay."
        : "Order placed. Pay on delivery.",
      data: order,
      razorpay: razorpay
        ? {
            key: razorpay.keyId,
            orderId: razorpay.id,
            amount: razorpay.amount,
            currency: razorpay.currency,
          }
        : null,
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
      error: error.message,
    });

  }
};

// ===============================================
// GET ALL ORDERS
// ===============================================

export const getAllOrders = async (req, res) => {
  try {

    const orders = await Order.find()
      .populate("customerId", "firstName lastName email role")
      .populate("storeId", "storeName email vendorId")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      totalOrders: orders.length,
      data: orders,
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
      error: error.message,
    });

  }
};

// ===============================================
// GET ORDER BY ID
// ===============================================

export const getOrderById = async (req, res) => {

  try {

    const order = await Order.findById(req.params.id)
      .populate("customerId", "firstName lastName email")
      .populate("storeId", "storeName email vendorId");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    const role = req.user.role;
    if (role === "customer") {
      const ownerId = String(order.customerId?._id || order.customerId);
      if (ownerId !== String(req.user.id)) {
        return res.status(403).json({ success: false, message: "Access denied." });
      }
    } else if (role === "vendor") {
      const vendorId = String(order.storeId?.vendorId || "");
      if (vendorId !== String(req.user.id)) {
        return res.status(403).json({ success: false, message: "Access denied." });
      }
    }

    const orderItems = await OrderItem.find({
      orderId: order._id,
    }).populate(
      "productId",
      "name price images stock"
    );

    return res.status(200).json({
      success: true,
      order,
      items: orderItems,
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
      error: error.message,
    });

  }
};

// ===============================================
// GET ORDERS BY CUSTOMER
// ===============================================

export const getOrdersByCustomer = async (req, res) => {

  try {

    const customer = await User.findById(
      req.params.customerId
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    if (
      req.user.role !== "superAdmin" &&
      String(req.user.id) !== String(req.params.customerId)
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    const orders = await Order.find({
      customerId: req.params.customerId,
    })
      .populate("storeId", "storeName email phone")
      .sort({ createdAt: -1 });

    const orderIds = orders.map((o) => o._id);
    const allItems = await OrderItem.find({
      orderId: { $in: orderIds },
    }).populate("productId", "name images slug price discountPrice status");

    const itemsByOrder = new Map();
    for (const item of allItems) {
      const key = String(item.orderId);
      if (!itemsByOrder.has(key)) itemsByOrder.set(key, []);
      itemsByOrder.get(key).push(item);
    }

    const data = orders.map((order) => {
      const plain = order.toObject();
      plain.items = itemsByOrder.get(String(order._id)) || [];
      return plain;
    });

    return res.status(200).json({
      success: true,
      totalOrders: data.length,
      data,
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
      error: error.message,
    });

  }
};

// ===============================================
// GET ORDERS BY STORE
// ===============================================

export const getOrdersByStore = async (req, res) => {

  try {

    const store = await Store.findById(
      req.params.storeId
    );

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found.",
      });
    }

    if (
      req.user.role === "vendor" &&
      String(store.vendorId) !== String(req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only view orders for your own store.",
      });
    }

    const orders = await Order.find({
      storeId: req.params.storeId,
    })
      .populate("customerId", "firstName lastName email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      totalOrders: orders.length,
      data: orders,
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
      error: error.message,
    });

  }
};

// ===============================================
// UPDATE ORDER STATUS
// ===============================================

export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = [
      "Pending",
      "Confirmed",
      "Processing",
      "Shipped",
      "Delivered",
      "Cancelled",
      "Returned",
    ];

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    if (req.user?.role === "vendor") {
      const ownStore = await Store.findById(order.storeId).select("vendorId");
      if (!ownStore || String(ownStore.vendorId) !== String(req.user.id)) {
        return res.status(403).json({
          success: false,
          message: "You can only update orders for your own store.",
        });
      }
    }

    const allowedTransitions = {
      Pending: ["Confirmed", "Cancelled"],
      Confirmed: ["Processing", "Cancelled"],
      Processing: ["Shipped"],
      Shipped: ["Delivered"],
      Delivered: ["Returned"],
      Cancelled: [],
      Returned: [],
    };

    const isAdmin = req.user?.role === "superAdmin";
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status.",
      });
    }

    if (!isAdmin && !allowedTransitions[order.orderStatus]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from ${order.orderStatus} to ${status}.`,
      });
    }

    const wasClosed = ["Cancelled", "Returned"].includes(order.orderStatus);
    order.orderStatus = status;

    await order.save();

    // Return items to inventory when an order is closed (variant-aware).
    if (["Cancelled", "Returned"].includes(status) && !wasClosed) {
      await restoreStock(order._id);
    }

    notifyCustomer(order.customerId, {
      type: `order.${String(status).toLowerCase()}`,
      title: CUSTOMER_STATUS_TITLE[status] || "Order updated",
      body:
        CUSTOMER_STATUS_BODY[status]?.(order.orderNumber) ||
        `Order ${order.orderNumber} is now ${status}.`,
      link: "/customer/orders",
      entityType: "order",
      entityId: order._id,
      store: order.storeId,
    });

    if (["Cancelled", "Returned"].includes(status)) {
      const storeDoc = await Store.findById(order.storeId).select("vendorId storeName");
      if (storeDoc?.vendorId) {
        notifyVendor(storeDoc.vendorId, {
          type: status === "Returned" ? "order.returned" : "order.cancelled",
          title: status === "Returned" ? "Order returned" : "Order cancelled",
          body: `Order ${order.orderNumber} is now ${status}.`,
          link: "/vendor/orders",
          entityType: "order",
          entityId: order._id,
          store: order.storeId,
        });
      }
      if (status === "Returned") {
        notifyAdmins({
          type: "order.returned",
          title: "Order returned",
          body: `${storeDoc?.storeName || "A store"} · ${order.orderNumber}`,
          link: "/admin/orders",
          entityType: "order",
          entityId: order._id,
          store: order.storeId,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully.",
      data: order,
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
      error: error.message,
    });

  }
};

// ===============================================
// CANCEL ORDER
// ===============================================

export const cancelOrder = async (req, res) => {
  try {

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    if (
      req.user.role !== "superAdmin" &&
      String(order.customerId) !== String(req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    if (
      order.orderStatus !== "Pending" &&
      order.orderStatus !== "Confirmed"
    ) {
      return res.status(400).json({
        success: false,
        message: "Only Pending or Confirmed orders can be cancelled.",
      });
    }

    await restoreStock(order._id);

    order.orderStatus = "Cancelled";

    await order.save();

    const cancelStore = await Store.findById(order.storeId).select("vendorId storeName");
    if (cancelStore?.vendorId) {
      notifyVendor(cancelStore.vendorId, {
        type: "order.cancelled",
        title: "Order cancelled by customer",
        body: `Order ${order.orderNumber} was cancelled by the customer.`,
        link: "/vendor/orders",
        entityType: "order",
        entityId: order._id,
        store: order.storeId,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully.",
      data: order,
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
      error: error.message,
    });

  }
};

// ===============================================
// RETURN ORDER
// ===============================================

export const returnOrder = async (req, res) => {
  try {

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    if (
      req.user.role !== "superAdmin" &&
      String(order.customerId) !== String(req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    if (order.orderStatus !== "Delivered") {
      return res.status(400).json({
        success: false,
        message: "Only Delivered orders can be returned.",
      });
    }

    await restoreStock(order._id);

    order.orderStatus = "Returned";
    // Do not mark gateway "Refunded" without a real Razorpay refund
    order.paymentNote =
      "Return requested — refund is handled by the store offline (no automatic gateway refund).";

    await order.save();

    const returnStore = await Store.findById(order.storeId).select("vendorId storeName");
    if (returnStore?.vendorId) {
      notifyVendor(returnStore.vendorId, {
        type: "order.returned",
        title: "Return requested",
        body: `Customer requested a return for order ${order.orderNumber}.`,
        link: "/vendor/orders",
        entityType: "order",
        entityId: order._id,
        store: order.storeId,
      });
    }
    notifyAdmins({
      type: "order.returned",
      title: "Return requested",
      body: `${returnStore?.storeName || "A store"} · ${order.orderNumber}`,
      link: "/admin/orders",
      entityType: "order",
      entityId: order._id,
      store: order.storeId,
    });

    return res.status(200).json({
      success: true,
      message: "Return requested. The store will process any refund offline.",
      data: order,
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
      error: error.message,
    });

  }
};

// ===============================================
// DELETE ORDER
// ===============================================

export const deleteOrder = async (req, res) => {
  try {

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    // Only closed orders should have had stock consumed; restore variant-aware
    // stock for still-open orders before removing their line items.
    if (!["Cancelled", "Returned"].includes(order.orderStatus)) {
      await restoreStock(order._id);
    }

    await OrderItem.deleteMany({
      orderId: order._id,
    });

    await order.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Order deleted successfully.",
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
      error: error.message,
    });

  }
};

// ===============================================
// PAY ORDER (start / resume Razorpay for pending)
// ===============================================

export const payOrder = async (req, res) => {
  try {
    const { paymentMethod = "UPI" } = req.body;
    const allowedMethods = ["UPI", "Card", "NetBanking", "Wallet"];

    if (!allowedMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Choose UPI, Card, NetBanking, or Wallet.",
      });
    }

    if (!isRazorpayConfigured()) {
      return res.status(503).json({
        success: false,
        message:
          "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    if (
      req.user.role !== "superAdmin" &&
      String(order.customerId) !== String(req.user.id)
    ) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    if (["Cancelled", "Returned"].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "Cannot pay for cancelled or returned orders.",
      });
    }

    if (order.paymentStatus === "Paid") {
      return res.status(400).json({
        success: false,
        message: "Order is already paid.",
      });
    }

    order.paymentMethod = paymentMethod;

    let razorpay;
    try {
      razorpay = await createRazorpayOrder({
        amount: order.totalAmount,
        receipt: order.orderNumber,
        notes: {
          orderId: String(order._id),
          orderNumber: order.orderNumber,
        },
      });
    } catch (rzpErr) {
      return res.status(502).json({
        success: false,
        message: rzpErr.message || "Failed to create Razorpay order.",
      });
    }

    order.razorpayOrderId = razorpay.id;
    order.paymentNote = "Awaiting Razorpay payment";
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Razorpay order created. Complete payment.",
      data: order,
      razorpay: {
        key: razorpay.keyId,
        orderId: razorpay.id,
        amount: razorpay.amount,
        currency: razorpay.currency,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Payment failed.",
    });
  }
};

// ===============================================
// VERIFY RAZORPAY PAYMENT
// ===============================================

export const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !orderId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing Razorpay payment details.",
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    if (
      req.user.role !== "superAdmin" &&
      String(order.customerId) !== String(req.user.id)
    ) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    if (order.paymentStatus === "Paid") {
      return res.status(200).json({
        success: true,
        message: "Order already paid.",
        data: order,
      });
    }

    if (
      order.razorpayOrderId &&
      order.razorpayOrderId !== razorpay_order_id
    ) {
      return res.status(400).json({
        success: false,
        message: "Razorpay order mismatch.",
      });
    }

    const valid = verifyRazorpaySignature({
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    });

    if (!valid) {
      order.paymentStatus = "Failed";
      order.paymentNote = "Razorpay signature verification failed";
      await order.save();
      return res.status(400).json({
        success: false,
        message: "Payment verification failed.",
      });
    }

    // Confirm paid amount matches order total (paise)
    try {
      const payment = await fetchRazorpayPayment(razorpay_payment_id);
      const expectedPaise = Math.round(Number(order.totalAmount) * 100);
      if (Number(payment.amount) !== expectedPaise) {
        order.paymentStatus = "Failed";
        order.paymentNote = `Razorpay amount mismatch (paid ${payment.amount}, expected ${expectedPaise})`;
        await order.save();
        return res.status(400).json({
          success: false,
          message: "Paid amount does not match order total.",
        });
      }
      if (payment.order_id && payment.order_id !== razorpay_order_id) {
        order.paymentStatus = "Failed";
        order.paymentNote = "Razorpay payment/order mismatch";
        await order.save();
        return res.status(400).json({
          success: false,
          message: "Payment order mismatch.",
        });
      }
      if (payment.status && !["authorized", "captured"].includes(payment.status)) {
        return res.status(400).json({
          success: false,
          message: `Payment status is ${payment.status}.`,
        });
      }
    } catch (amountErr) {
      console.error("Razorpay payment fetch failed:", amountErr.message);
      return res.status(502).json({
        success: false,
        message: "Could not confirm payment amount with Razorpay.",
      });
    }

    order.paymentStatus = "Paid";
    order.paymentId = razorpay_payment_id;
    order.razorpayOrderId = razorpay_order_id;
    order.paidAt = new Date();
    order.paymentNote = `Paid via Razorpay (${order.paymentMethod})`;
    if (order.orderStatus === "Pending") {
      order.orderStatus = "Confirmed";
    }
    await order.save();

    try {
      const customer = await User.findById(order.customerId).select(
        "email firstName"
      );
      await sendPaymentReceipt({
        to: customer?.email,
        firstName: customer?.firstName,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        paymentId: order.paymentId,
      });
    } catch (mailErr) {
      console.error("Payment receipt email failed:", mailErr.message);
    }

    notifyCustomer(order.customerId, {
      type: "payment.paid",
      title: "Payment successful",
      body: `Payment of ₹${order.totalAmount} for order ${order.orderNumber} was received.`,
      link: "/customer/orders",
      entityType: "order",
      entityId: order._id,
      store: order.storeId,
    });

    const paidStore = await Store.findById(order.storeId).select("vendorId");
    if (paidStore?.vendorId) {
      notifyVendor(paidStore.vendorId, {
        type: "payment.paid",
        title: "Payment received",
        body: `Order ${order.orderNumber} is paid (₹${order.totalAmount}).`,
        link: "/vendor/payments",
        entityType: "order",
        entityId: order._id,
        store: order.storeId,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully.",
      data: order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Payment verification failed.",
    });
  }
};

export const getRazorpayConfig = async (req, res) => {
  return res.status(200).json({
    success: true,
    configured: isRazorpayConfigured(),
    keyId: getRazorpayKeyId(),
  });
};

// ===============================================
// UPDATE PAYMENT STATUS (vendor/admin)
// ===============================================

export const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus, paymentNote } = req.body;
    const allowed = ["Pending", "Paid", "Failed", "Refunded"];

    if (!allowed.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment status.",
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    if (req.user.role === "vendor") {
      const store = await Store.findById(order.storeId);
      if (!store || String(store.vendorId) !== String(req.user.id)) {
        return res.status(403).json({
          success: false,
          message: "You can only update payments for your store orders.",
        });
      }
    }

    order.paymentStatus = paymentStatus;
    if (paymentNote) order.paymentNote = paymentNote;

    if (paymentStatus === "Paid") {
      order.paidAt = order.paidAt || new Date();
      order.paymentId = order.paymentId || `PAY-${Date.now()}-${randomInt(1000, 10000)}`;
      if (order.orderStatus === "Pending") order.orderStatus = "Confirmed";
      order.paymentNote = order.paymentNote || "Marked paid by store/admin";
    }

    if (paymentStatus === "Refunded") {
      order.paymentNote = paymentNote || "Refunded by store/admin";
    }

    await order.save();

    if (paymentStatus === "Refunded") {
      notifyCustomer(order.customerId, {
        type: "payment.refunded",
        title: "Refund issued",
        body: `₹${order.totalAmount} for order ${order.orderNumber} was refunded.${
          order.paymentNote ? ` ${order.paymentNote}` : ""
        }`,
        link: "/customer/orders",
        entityType: "order",
        entityId: order._id,
        store: order.storeId,
      });
    }

    if (paymentStatus === "Paid") {
      notifyCustomer(order.customerId, {
        type: "payment.paid",
        title: "Payment confirmed",
        body: `Payment of ₹${order.totalAmount} for order ${order.orderNumber} was confirmed.`,
        link: "/customer/orders",
        entityType: "order",
        entityId: order._id,
        store: order.storeId,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Payment status updated.",
      data: order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update payment.",
    });
  }
};

// ===============================================
// DOWNLOAD TAX INVOICE (PDF)
// ===============================================

export const downloadInvoice = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("customerId", "firstName lastName email phoneNumber")
      .populate("storeId", "storeName email phone address");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    const role = req.user.role;
    const isOwner =
      String(order.customerId?._id || order.customerId) === String(req.user.id);

    if (role === "customer" && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    if (role === "vendor") {
      const store = await Store.findOne({ vendorId: req.user.id }).select("_id");
      if (!store || String(order.storeId?._id || order.storeId) !== String(store._id)) {
        return res.status(403).json({
          success: false,
          message: "Access denied.",
        });
      }
    }

    if (
      order.orderStatus !== "Delivered" ||
      ["Cancelled", "Returned"].includes(order.orderStatus)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invoice is available only after the order is delivered. Cancelled or returned orders have no invoice.",
      });
    }

    const items = await OrderItem.find({ orderId: order._id }).populate(
      "productId",
      "name images sku"
    );

    const pdfBuffer = await buildInvoicePdf({
      order,
      items,
      store: order.storeId,
      customer: order.customerId,
    });

    const safeName = String(order.orderNumber || order._id)
      .replace(/[^a-zA-Z0-9-_]/g, "_");
    const filename = `Invoice-${safeName}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    return res.send(pdfBuffer);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to generate invoice.",
    });
  }
};
