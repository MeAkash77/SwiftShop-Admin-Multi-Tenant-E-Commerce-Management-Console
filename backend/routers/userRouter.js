import express from "express";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";
import {
  getAllUsers,
  getUserById,
  updateUserById,
  deleteUserById,
  toggleUserStatus,
} from "../controllers/userController.js";

const router = express.Router();

router.get("/admin/users", authenticate, authorize("superAdmin"), getAllUsers);
router.patch(
  "/admin/users/:id/status",
  authenticate,
  authorize("superAdmin"),
  toggleUserStatus
);
router.get("/:id", authenticate, getUserById);
router.put("/updateUser/:id", authenticate, updateUserById);
router.delete("/deleteUser/:id", authenticate, authorize("superAdmin"), deleteUserById);

export default router;
