import express from "express";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";
import {
  createCoupon,
  deleteCoupon,
  listActiveCoupons,
  listManagedCoupons,
  updateCoupon,
  validateCoupon,
} from "../controllers/couponController.js";

const router = express.Router();

router.get("/active", listActiveCoupons);

router.post(
  "/validate",
  authenticate,
  authorize("customer", "superAdmin"),
  validateCoupon
);

router.get(
  "/manage",
  authenticate,
  authorize("vendor", "superAdmin"),
  listManagedCoupons
);

router.post(
  "/",
  authenticate,
  authorize("vendor", "superAdmin"),
  createCoupon
);

router.put(
  "/:id",
  authenticate,
  authorize("vendor", "superAdmin"),
  updateCoupon
);

router.delete(
  "/:id",
  authenticate,
  authorize("vendor", "superAdmin"),
  deleteCoupon
);

export default router;
