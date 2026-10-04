import express from "express";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";
import {
  customerSendMessage,
  getSession,
  listMySessions,
  resolveSession,
  startOrGetSession,
  vendorListSessions,
  vendorProductRequestHistory,
  vendorReply,
} from "../controllers/chatController.js";

const router = express.Router();

router.get(
  "/session",
  authenticate,
  authorize("customer"),
  startOrGetSession
);

router.get(
  "/sessions/me",
  authenticate,
  authorize("customer"),
  listMySessions
);

router.get(
  "/vendor/sessions",
  authenticate,
  authorize("vendor", "superAdmin"),
  vendorListSessions
);

router.get(
  "/vendor/product-requests",
  authenticate,
  authorize("vendor", "superAdmin"),
  vendorProductRequestHistory
);

router.get(
  "/:id",
  authenticate,
  authorize("customer", "vendor", "superAdmin"),
  getSession
);

router.post(
  "/:id/message",
  authenticate,
  authorize("customer"),
  customerSendMessage
);

router.post(
  "/:id/vendor-reply",
  authenticate,
  authorize("vendor", "superAdmin"),
  vendorReply
);

router.put(
  "/:id/resolve",
  authenticate,
  authorize("customer", "vendor", "superAdmin"),
  resolveSession
);

export default router;
