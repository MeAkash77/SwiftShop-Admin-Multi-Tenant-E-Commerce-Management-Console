import { Router } from "express";
import {
  getAllCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
} from "../controllers/categoryController.js";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/", getAllCategories);
router.post("/", authenticate, authorize("superAdmin"), createCategory);
router.put("/:id", authenticate, authorize("superAdmin"), updateCategory);
router.get("/:slug", getCategoryBySlug);

export default router;
