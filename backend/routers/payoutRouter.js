import express from "express";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";
import {
  getMyBalance,
  getMyPayouts,
  requestPayout,
  cancelPayout,
  listPayouts,
  markPayoutPaid,
  rejectPayout,
} from "../controllers/payoutController.js";

const router = express.Router();

// Vendor
router.get("/balance", authenticate, authorize("vendor"), getMyBalance);
router.get("/mine", authenticate, authorize("vendor"), getMyPayouts);
router.post("/", authenticate, authorize("vendor"), requestPayout);
router.delete("/:id", authenticate, authorize("vendor"), cancelPayout);

// Admin
router.get("/", authenticate, authorize("superAdmin"), listPayouts);
router.put("/:id/pay", authenticate, authorize("superAdmin"), markPayoutPaid);
router.put("/:id/reject", authenticate, authorize("superAdmin"), rejectPayout);

export default router;
