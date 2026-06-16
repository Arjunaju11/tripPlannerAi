import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authController } from "../lib/container.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";

export const authRouter = Router();

const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false
});

authRouter.post("/register", asyncHandler(authController.register));
authRouter.post("/login", asyncHandler(authController.login));
authRouter.post("/google", asyncHandler(authController.google));
authRouter.post("/forgot-password", passwordResetLimiter, asyncHandler(authController.forgotPassword));
authRouter.post("/reset-password", passwordResetLimiter, asyncHandler(authController.resetPassword));
authRouter.post("/refresh", asyncHandler(authController.refresh));
authRouter.post("/logout", asyncHandler(authController.logout));
authRouter.get("/me", requireAuth, asyncHandler(authController.me));
