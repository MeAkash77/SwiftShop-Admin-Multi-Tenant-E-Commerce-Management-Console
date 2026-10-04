import { Router } from "express";
import {
  createStore,
  deleteStore,
  getAllStores,
  getStore,
  getStoreByVendor,
  updateStore,
} from "../controllers/storeController.js";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/", authenticate, authorize("vendor", "superAdmin"), createStore);
router.get("/", getAllStores);
router.get("/vendor/:vendorId", authenticate, authorize("vendor", "superAdmin"), getStoreByVendor);
router.get("/:id", getStore);
router.put("/:id", authenticate, authorize("vendor", "superAdmin"), updateStore);
router.delete("/:id", authenticate, authorize("vendor", "superAdmin"), deleteStore);

export default router;
