import express from "express";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";
import {
  listNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
} from "../controllers/notificationController.js";

const router = express.Router();

const roles = authorize("vendor", "superAdmin", "customer");

router.get("/", authenticate, roles, listNotifications);
router.get("/unread-count", authenticate, roles, getUnreadCount);
router.put("/read-all", authenticate, roles, markAllRead);
router.put("/:id/read", authenticate, roles, markRead);

export default router;
