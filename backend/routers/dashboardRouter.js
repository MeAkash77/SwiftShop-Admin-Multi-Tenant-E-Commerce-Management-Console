import express from "express";
import {
  getDashboardStats,
  getDailyReport,
} from "../controllers/dashboardController.js";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get(
  "/stats",
  authenticate,
  authorize("superAdmin"),
  getDashboardStats
);

router.get(
  "/daily-report",
  authenticate,
  authorize("superAdmin", "vendor"),
  getDailyReport
);

export default router;
