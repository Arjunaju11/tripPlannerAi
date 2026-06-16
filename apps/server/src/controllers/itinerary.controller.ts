import type { Request, Response } from "express";
import { ItineraryService } from "../services/itinerary.service.js";
import { sendResponse } from "../utils/api-response.js";
import { AppError } from "../utils/app-error.js";

export class ItineraryController {
  constructor(private itineraryService: ItineraryService) {}

  upload = async (req: Request, res: Response) => {
    if (!req.user) throw new AppError(401, "Authentication required");
    if (!req.file) throw new AppError(400, "File is required");
    const itinerary = await this.itineraryService.uploadAndGenerate(req.user.id, req.file);
    return sendResponse(res, 201, "Itinerary generated", itinerary);
  };

  generate = async (req: Request, res: Response) => {
    if (!req.user) throw new AppError(401, "Authentication required");
    if (!req.file) throw new AppError(400, "Send a travel document as multipart field `file`");
    const itinerary = await this.itineraryService.uploadAndGenerate(req.user.id, req.file);
    return sendResponse(res, 201, "Itinerary generated", itinerary);
  };

  list = async (req: Request, res: Response) => {
    if (!req.user) throw new AppError(401, "Authentication required");
    const data = await this.itineraryService.list(req.user.id, req.query);
    return sendResponse(res, 200, "Itineraries", data);
  };

  get = async (req: Request, res: Response) => {
    if (!req.user) throw new AppError(401, "Authentication required");
    return sendResponse(res, 200, "Itinerary", await this.itineraryService.get(req.user.id, req.params.id));
  };

  remove = async (req: Request, res: Response) => {
    if (!req.user) throw new AppError(401, "Authentication required");
    return sendResponse(res, 200, "Itinerary deleted", await this.itineraryService.remove(req.user.id, req.params.id));
  };

  update = async (req: Request, res: Response) => {
    if (!req.user) throw new AppError(401, "Authentication required");
    return sendResponse(res, 200, "Itinerary updated", await this.itineraryService.update(req.user.id, req.params.id, req.body));
  };

  share = async (req: Request, res: Response) => {
    if (!req.user) throw new AppError(401, "Authentication required");
    return sendResponse(res, 200, "Share link created", await this.itineraryService.share(req.user.id, req.params.id, req.body));
  };

  shared = async (req: Request, res: Response) => {
    return sendResponse(res, 200, "Shared itinerary", await this.itineraryService.getShared(req.params.shareId));
  };
}
