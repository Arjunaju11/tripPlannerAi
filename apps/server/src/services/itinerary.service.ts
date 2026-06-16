import { v4 as uuid } from "uuid";
import { ItineraryUpdateSchema, PaginationQuerySchema, ShareCreateSchema } from "@trip-planner/shared";
import type { IItineraryRepository } from "../interfaces/repositories.js";
import type { IAIService, IOCRService, IPlacesService, IStorageService } from "../interfaces/services.js";
import { AppError } from "../utils/app-error.js";
import { sha256 } from "../utils/hash.js";
import { toItineraryDto, toPublicItineraryDto } from "../utils/mappers.js";

function hasUsefulTravelData(data: unknown) {
  const travelData = data as {
    travelerName?: unknown;
    departureCity?: unknown;
    destinationCity?: unknown;
    departureDate?: unknown;
    returnDate?: unknown;
    airline?: unknown;
    flightNumber?: unknown;
    hotelName?: unknown;
    hotelAddress?: unknown;
    flights?: unknown[];
  };

  return Boolean(
    travelData.travelerName ||
      travelData.departureCity ||
      travelData.destinationCity ||
      travelData.departureDate ||
      travelData.returnDate ||
      travelData.airline ||
      travelData.flightNumber ||
      travelData.hotelName ||
      travelData.hotelAddress ||
      travelData.flights?.length
  );
}

export class ItineraryService {
  constructor(
    private itineraryRepository: IItineraryRepository,
    private storageService: IStorageService,
    private ocrService: IOCRService,
    private aiService: IAIService,
    private placesService?: IPlacesService
  ) {}

  async uploadAndGenerate(userId: string, file: Express.Multer.File) {
    const fileHash = sha256(file.buffer);
    const existing = await this.itineraryRepository.findByUserAndHash(userId, fileHash);
    if (existing && hasUsefulTravelData(existing.travelData)) return toItineraryDto(existing);
    const stored = existing ? { url: existing.fileUrl } : await this.storageService.save(file);
    const extractedText = await this.ocrService.extractText(file);
    if (!extractedText) throw new AppError(422, "Could not extract text from document");
    const travelData = await this.aiService.extractTravelData(extractedText);
    const aiItinerary = await this.aiService.generateItinerary(travelData);
    const destination = aiItinerary.destination ?? travelData.destinationCity;
    const placeRecommendations = destination ? await this.placesService?.getRecommendations(destination) : null;
    const generated = {
      extractedText,
      travelData,
      aiItinerary: { ...aiItinerary, placeRecommendations: placeRecommendations ?? aiItinerary.placeRecommendations ?? null }
    };
    const itinerary = existing
      ? await this.itineraryRepository.updateGeneratedById(String(existing._id), generated)
      : await this.itineraryRepository.create({
      userId,
      fileHash,
      fileUrl: stored.url,
      originalFileName: file.originalname,
      ...generated
    });
    if (!itinerary) throw new AppError(500, "Could not save itinerary");
    return toItineraryDto(itinerary);
  }

  async list(userId: string, rawQuery: unknown) {
    const query = PaginationQuerySchema.parse(rawQuery);
    const result = await this.itineraryRepository.listByUser(userId, query);
    return { ...result, items: result.items.map(toItineraryDto), page: query.page, limit: query.limit };
  }

  async get(userId: string, id: string) {
    const itinerary = await this.itineraryRepository.findById(id);
    if (!itinerary || String(itinerary.userId) !== userId) throw new AppError(404, "Itinerary not found");
    return toItineraryDto(itinerary);
  }

  async remove(userId: string, id: string) {
    const deleted = await this.itineraryRepository.deleteByIdForUser(id, userId);
    if (!deleted) throw new AppError(404, "Itinerary not found");
    return { id };
  }

  async update(userId: string, id: string, rawBody: unknown) {
    const body = ItineraryUpdateSchema.parse(rawBody);
    const itinerary = await this.itineraryRepository.updateByIdForUser(id, userId, body);
    if (!itinerary) throw new AppError(404, "Itinerary not found");
    return toItineraryDto(itinerary);
  }

  async share(userId: string, id: string, rawBody: unknown) {
    const body = ShareCreateSchema.parse(rawBody);
    const expires = new Date(Date.now() + body.expiresInDays * 24 * 60 * 60 * 1000);
    const itinerary = await this.itineraryRepository.makePublic(id, userId, uuid(), expires);
    if (!itinerary) throw new AppError(404, "Itinerary not found");
    return toItineraryDto(itinerary);
  }

  async getShared(shareId: string) {
    const itinerary = await this.itineraryRepository.findPublicByShareId(shareId);
    if (!itinerary) throw new AppError(404, "Shared itinerary not found");
    return toPublicItineraryDto(itinerary);
  }
}
