import type { NextFunction, Request, Response } from "express";
import { isDatabaseConnected } from "../config/database.js";
import { AppError } from "../utils/app-error.js";

export function requireDatabase(_req: Request, _res: Response, next: NextFunction) {
  if (!isDatabaseConnected()) {
    return next(new AppError(503, "Database unavailable"));
  }

  return next();
}
