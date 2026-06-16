import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/app-error.js";

export function notFound(req: Request, _res: Response, next: NextFunction) {
  next(new AppError(404, `Route not found: ${req.method} ${req.path}`));
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ZodError) {
    return res.status(400).json({ success: false, message: "Validation failed", data: error.flatten() });
  }
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ success: false, message: error.message, data: error.details ?? null });
  }
  if (process.env.NODE_ENV !== "test") {
    console.error("Unhandled API error:", error);
  }
  return res.status(500).json({ success: false, message: "Internal server error", data: null });
}
