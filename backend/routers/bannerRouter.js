import express from "express";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";
import {
  createBanner,
  deleteBanner,
  getManagedBanners,
  getPublicBanners,
  updateBanner,
} from "../controllers/bannerController.js";

const router = express.Router();

router.get("/", getPublicBanners);

router.get(
  "/manage",
  authenticate,
  authorize("vendor", "superAdmin"),
  getManagedBanners
);

router.post(
  "/",
  authenticate,
  authorize("vendor", "superAdmin"),
  upload.single("image"),
  createBanner
);

router.put(
  "/:id",
  authenticate,
  authorize("vendor", "superAdmin"),
  upload.single("image"),
  updateBanner
);

router.delete(
  "/:id",
  authenticate,
  authorize("vendor", "superAdmin"),
  deleteBanner
);

export default router;
