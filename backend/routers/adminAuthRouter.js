import express from "express";
import User from "../models/userModel.js";
import {
  adminLogin,
  adminLogout,
  createAdmin,
  getAdminPortalStatus,
  listAdmins,
} from "../controllers/adminAuthController.js";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";
import { loginValidation } from "../middlewares/emailMiddleware.js";

const router = express.Router();

/** First admin is public (setup secret). Extra admins need Super Admin JWT. */
const requireAdminUnlessBootstrap = async (req, res, next) => {
  try {
    const adminCount = await User.countDocuments({ role: "superAdmin" });
    if (adminCount === 0) {
      return next();
    }
    return authenticate(req, res, () =>
      authorize("superAdmin")(req, res, next)
    );
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Authorization check failed",
    });
  }
};

router.get("/status", getAdminPortalStatus);
router.post("/login", loginValidation, adminLogin);
router.post("/logout", adminLogout);
router.post("/create", requireAdminUnlessBootstrap, createAdmin);
router.get("/admins", authenticate, authorize("superAdmin"), listAdmins);

export default router;
