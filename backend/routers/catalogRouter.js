import { Router } from "express";
import {
  getCatalogBrands,
  listCatalogProducts,
  getCatalogProduct,
  createCatalogProduct,
  updateCatalogProduct,
  deleteCatalogProduct,
} from "../controllers/catalogController.js";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";

const router = Router();

// Browse — vendors and admins
router.get(
  "/brands",
  authenticate,
  authorize("vendor", "superAdmin"),
  getCatalogBrands
);
router.get(
  "/",
  authenticate,
  authorize("vendor", "superAdmin"),
  listCatalogProducts
);
router.get(
  "/:id",
  authenticate,
  authorize("vendor", "superAdmin"),
  getCatalogProduct
);

// Manage — admin only
router.post("/", authenticate, authorize("superAdmin"), createCatalogProduct);
router.put("/:id", authenticate, authorize("superAdmin"), updateCatalogProduct);
router.delete(
  "/:id",
  authenticate,
  authorize("superAdmin"),
  deleteCatalogProduct
);

export default router;
