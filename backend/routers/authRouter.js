import express from "express";
import { registerUser, verifyEmail, loggedIn, refreshToken, logout, forgotPassword, changePassword ,resetPassword } from "../controllers/authController.js";
import { verifyAccessToken } from "../middlewares/authMiddleware.js";
import { loginValidation, forgotPasswordValidation } from "../middlewares/emailMiddleware.js";
const router = express.Router();

router.post("/register", registerUser);
router.post("/verify-email", verifyEmail);
router.post('/login', loginValidation, loggedIn);
router.post("/refresh", refreshToken);
router.post("/logout", logout);
router.post("/forgotPassword", forgotPasswordValidation, forgotPassword);
router.patch("/changePassword", verifyAccessToken, changePassword);
router.patch("/resetPassword/:token",resetPassword);
export default router;