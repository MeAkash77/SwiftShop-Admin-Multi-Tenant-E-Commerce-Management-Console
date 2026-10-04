import express from "express";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";
import {
  createAddress,
  deleteAddress,
  listAddresses,
  setDefaultAddress,
  updateAddress,
} from "../controllers/addressController.js";

const router = express.Router();

router.use(authenticate, authorize("customer", "superAdmin"));

router.get("/", listAddresses);
router.post("/", createAddress);
router.put("/:id", updateAddress);
router.patch("/:id/default", setDefaultAddress);
router.delete("/:id", deleteAddress);

export default router;
