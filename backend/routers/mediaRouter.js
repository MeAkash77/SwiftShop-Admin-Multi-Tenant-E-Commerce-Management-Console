import express from "express";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";
import {
  deleteMedia,
  listMedia,
  uploadMedia,
} from "../controllers/mediaController.js";

const router = express.Router();

router.get("/", authenticate, authorize("vendor", "superAdmin"), listMedia);

router.post(
  "/",
  authenticate,
  authorize("vendor", "superAdmin"),
  upload.array("images", 20),
  uploadMedia
);

router.delete(
  "/:id",
  authenticate,
  authorize("vendor", "superAdmin"),
  deleteMedia
);

export default router;
