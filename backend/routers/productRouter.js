import express from "express";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";
import {
  bulkDeleteProducts,
  bulkImportProducts,
  bulkMarkProducts,
  createProduct,
  deleteProduct,
  downloadBulkTemplate,
  filterProducts,
  getAllProducts,
  getProduct,
  getVendorProducts,
  searchProducts,
  updateProduct,
} from "../controllers/productController.js";
import upload from "../middlewares/uploadMiddleware.js";
import uploadSpreadsheet from "../middlewares/uploadSpreadsheet.js";
import { catalogBrowseLimiter } from "../middlewares/catalogRateLimit.js";

const router = express.Router();

router.post(
  "/create",
  authenticate,
  authorize("vendor", "superAdmin"),
  upload.array("images", 8),
  createProduct
);

router.get("/vendor", authenticate, authorize("vendor", "superAdmin"), getVendorProducts);

router.get(
  "/bulk/template",
  authenticate,
  authorize("vendor", "superAdmin"),
  downloadBulkTemplate
);

router.post(
  "/bulk/import",
  authenticate,
  authorize("vendor", "superAdmin"),
  uploadSpreadsheet.single("file"),
  bulkImportProducts
);

router.post(
  "/bulk/mark",
  authenticate,
  authorize("vendor", "superAdmin"),
  bulkMarkProducts
);

router.post(
  "/bulk/delete",
  authenticate,
  authorize("vendor", "superAdmin"),
  bulkDeleteProducts
);

router.get("/", catalogBrowseLimiter, getAllProducts);
router.get("/search", catalogBrowseLimiter, searchProducts);
router.get("/filter", catalogBrowseLimiter, filterProducts);
router.get("/:id", catalogBrowseLimiter, getProduct);

router.put(
  "/:id",
  authenticate,
  authorize("vendor", "superAdmin"),
  upload.array("images", 8),
  updateProduct
);
router.delete("/:id", authenticate, authorize("vendor", "superAdmin"), deleteProduct);

export default router;
