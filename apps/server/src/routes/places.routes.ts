import { Router } from "express";
import { placesController } from "../lib/container.js";
import { asyncHandler } from "../utils/async-handler.js";

export const placesRouter = Router();

placesRouter.get("/photo/:photoReference", asyncHandler(placesController.photo));
