import { Router } from "express";
import { itineraryController } from "../lib/container.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";

export const itineraryRouter = Router();

itineraryRouter.post("/upload", requireAuth, upload.single("file"), asyncHandler(itineraryController.upload));
itineraryRouter.post("/itinerary/generate", requireAuth, upload.single("file"), asyncHandler(itineraryController.generate));
itineraryRouter.get("/itinerary", requireAuth, asyncHandler(itineraryController.list));
itineraryRouter.patch("/itinerary/:id", requireAuth, asyncHandler(itineraryController.update));
itineraryRouter.get("/itinerary/:id", requireAuth, asyncHandler(itineraryController.get));
itineraryRouter.delete("/itinerary/:id", requireAuth, asyncHandler(itineraryController.remove));
itineraryRouter.post("/share/:id", requireAuth, asyncHandler(itineraryController.share));
itineraryRouter.get("/share/:shareId", asyncHandler(itineraryController.shared));
