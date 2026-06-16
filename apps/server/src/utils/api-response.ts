import type { Response } from "express";
import type { ApiResponse } from "@trip-planner/shared";

export function sendResponse<T>(res: Response, status: number, message: string, data: T) {
  const body: ApiResponse<T> = { success: status < 400, message, data };
  return res.status(status).json(body);
}
