/**
 * Root API router — mounts domain routers under /api.
 * Full path map: docs/04-API-MODULES.md
 */
import { Router } from "express";
import userRouter from "./userRouter.js";
import storeRouter from "./storeRouter.js";
import productRouter from "./productRouter.js";
import orderRouter from "./orderRouter.js";
import authRouter from "./authRouter.js";
import adminAuthRouter from "./adminAuthRouter.js";
import vendorAuthRouter from "./vendorAuthRouter.js";
import dashboardRouter from "./dashboardRouter.js";
import categoryRouter from "./categoryRouter.js";
import reviewRouter from "./reviewRouter.js";
import bannerRouter from "./bannerRouter.js";
import addressRouter from "./addressRouter.js";
import couponRouter from "./couponRouter.js";
import chatRouter from "./chatRouter.js";
import mediaRouter from "./mediaRouter.js";
import payoutRouter from "./payoutRouter.js";
import notificationRouter from "./notificationRouter.js";
import catalogRouter from "./catalogRouter.js";
const router = Router();

router.use("/user", userRouter);
router.use("/auth",authRouter);
router.use("/admin/auth", adminAuthRouter);
router.use("/vendor/auth", vendorAuthRouter);
router.use("/store", storeRouter);
router.use("/product", productRouter);
router.use("/order", orderRouter);
router.use("/dashboard", dashboardRouter);
router.use("/category", categoryRouter);
router.use("/review", reviewRouter);
router.use("/banner", bannerRouter);
router.use("/address", addressRouter);
router.use("/coupon", couponRouter);
router.use("/chat", chatRouter);
router.use("/media", mediaRouter);
router.use("/payout", payoutRouter);
router.use("/notification", notificationRouter);
router.use("/catalog", catalogRouter);


export default router;