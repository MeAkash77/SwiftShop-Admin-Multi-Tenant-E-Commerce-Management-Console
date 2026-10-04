import express from "express";

import {
  createOrder,
  getAllOrders,
  getOrderById,
  getOrdersByCustomer,
  getOrdersByStore,
  updateOrderStatus,
  cancelOrder,
  returnOrder,
  deleteOrder,
  payOrder,
  updatePaymentStatus,
  verifyRazorpayPayment,
  getRazorpayConfig,
  downloadInvoice,
} from "../controllers/orderController.js";

import { authenticate, authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/create", authenticate, authorize("customer", "superAdmin"), createOrder);

router.get(
  "/customer/:customerId",
  authenticate,
  authorize("customer", "superAdmin"),
  getOrdersByCustomer
);

router.get(
  "/store/:storeId",
  authenticate,
  authorize("vendor", "superAdmin"),
  getOrdersByStore
);

router.put(
  "/status/:id",
  authenticate,
  authorize("vendor", "superAdmin"),
  updateOrderStatus
);

router.get("/razorpay/config", getRazorpayConfig);

router.post(
  "/pay/:id",
  authenticate,
  authorize("customer", "superAdmin"),
  payOrder
);

router.post(
  "/verify-payment",
  authenticate,
  authorize("customer", "superAdmin"),
  verifyRazorpayPayment
);

router.put(
  "/payment/:id",
  authenticate,
  authorize("vendor", "superAdmin"),
  updatePaymentStatus
);

router.get("/", authenticate, authorize("superAdmin"), getAllOrders);

router.get(
  "/:id/invoice",
  authenticate,
  authorize("customer", "vendor", "superAdmin"),
  downloadInvoice
);

router.get(
  "/:id",
  authenticate,
  authorize("customer", "vendor", "superAdmin"),
  getOrderById
);

router.put(
  "/cancel/:id",
  authenticate,
  authorize("customer", "superAdmin"),
  cancelOrder
);

router.put(
  "/return/:id",
  authenticate,
  authorize("customer", "superAdmin"),
  returnOrder
);

router.delete("/:id", authenticate, authorize("superAdmin"), deleteOrder);

export default router;
