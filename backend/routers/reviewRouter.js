import express from "express";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";
import {
  createReview,
  deleteReview,
  getManagedReviews,
  getMyReviews,
  getProductReviews,
  updateReview,
} from "../controllers/reviewController.js";

const router = express.Router();

router.get("/product/:productId", getProductReviews);

router.get("/me", authenticate, authorize("customer"), getMyReviews);

router.get(
  "/manage",
  authenticate,
  authorize("vendor", "superAdmin"),
  getManagedReviews
);

router.post(
  "/",
  authenticate,
  authorize("customer"),
  upload.array("images", 4),
  createReview
);

router.put(
  "/:id",
  authenticate,
  authorize("customer", "superAdmin"),
  upload.array("images", 4),
  updateReview
);

router.delete(
  "/:id",
  authenticate,
  authorize("customer", "vendor", "superAdmin"),
  deleteReview
);

export default router;
