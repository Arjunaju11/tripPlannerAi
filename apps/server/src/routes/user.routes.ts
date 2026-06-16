import { Router } from "express";
import { userController } from "../lib/container.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";

export const userRouter = Router();

userRouter.get("/me", requireAuth, asyncHandler(userController.me));
userRouter.patch("/me", requireAuth, asyncHandler(userController.updateMe));
