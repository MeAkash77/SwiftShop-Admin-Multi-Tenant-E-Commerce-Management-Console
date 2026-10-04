import express from "express";
import {
  registerVendor,
  vendorLogin,
  vendorLogout,
} from "../controllers/vendorAuthController.js";
import { loginValidation } from "../middlewares/emailMiddleware.js";

const router = express.Router();

router.post("/register", registerVendor);
router.post("/login", loginValidation, vendorLogin);
router.post("/logout", vendorLogout);

export default router;
