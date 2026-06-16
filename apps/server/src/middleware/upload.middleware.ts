import multer from "multer";
import type { NextFunction, Request, Response } from "express";
import { MAX_UPLOAD_BYTES, SUPPORTED_UPLOAD_MIME_TYPES } from "@trip-planner/shared";
import { AppError } from "../utils/app-error.js";

const multerUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES },
  fileFilter: (_req, file, cb) => {
    if (![...SUPPORTED_UPLOAD_MIME_TYPES].includes(file.mimetype as (typeof SUPPORTED_UPLOAD_MIME_TYPES)[number])) {
      cb(new AppError(400, "Unsupported file type"));
      return;
    }
    cb(null, true);
  }
});

export const upload = {
  single(fieldName: string) {
    const middleware = multerUpload.single(fieldName);
    return (req: Request, res: Response, next: NextFunction) => {
      middleware(req, res, (error: unknown) => {
        if (error instanceof multer.MulterError) {
          const message = error.code === "LIMIT_FILE_SIZE" ? "File is too large" : error.message;
          next(new AppError(400, message));
          return;
        }
        next(error);
      });
    };
  }
};
