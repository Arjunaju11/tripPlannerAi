import { describe, expect, it } from "vitest";
import type { IItineraryRepository } from "../interfaces/repositories.js";
import type { IAIService, IOCRService, IStorageService } from "../interfaces/services.js";
import { OpenAIService } from "../services/ai.service.js";
import { ItineraryService } from "../services/itinerary.service.js";

describe("ItineraryService", () => {
  it("returns an existing itinerary for duplicate file hashes", async () => {
    const existing: any = {
      _id: "1",
      userId: "u1",
      fileUrl: "/uploads/a.pdf",
      travelData: {
        travelerName: null,
        departureCity: null,
        destinationCity: "Dubai",
        departureDate: null,
        returnDate: null,
        airline: null,
        flightNumber: null,
        hotelName: null,
        hotelAddress: null,
        flights: [],
        notes: []
      },
      aiItinerary: { title: "Dubai", summary: "Trip", days: [] },
      isPublic: false,
      revoked: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const repo: Partial<IItineraryRepository> = {
      findByUserAndHash: async () => existing
    };
    const storage: IStorageService = { save: async () => ({ key: "x", url: "x" }) };
    const ocr: IOCRService = { extractText: async () => "text" };
    const ai: IAIService = {
      extractTravelData: async () => existing.travelData,
      generateItinerary: async () => existing.aiItinerary
    };
    const service = new ItineraryService(repo as IItineraryRepository, storage, ocr, ai);
    const result = await service.uploadAndGenerate("u1", {
      buffer: Buffer.from("same file"),
      originalname: "ticket.pdf",
      mimetype: "application/pdf"
    } as Express.Multer.File);
    expect(result.id).toBe("1");
  });

  it("creates an itinerary when the file is new", async () => {
    const created: any = {
      _id: "2",
      userId: "u1",
      fileUrl: "/uploads/new.pdf",
      travelData: { travelerName: null, departureCity: "Kochi", destinationCity: "Dubai", departureDate: "2026-06-25", returnDate: null, airline: null, flightNumber: "AI247", hotelName: null, hotelAddress: null, flights: [], notes: [] },
      aiItinerary: { title: "Dubai", summary: "Trip", days: [] },
      isPublic: false,
      revoked: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const repo: Partial<IItineraryRepository> = {
      findByUserAndHash: async () => null,
      create: async () => created
    };
    const service = new ItineraryService(
      repo as IItineraryRepository,
      { save: async () => ({ key: "new.pdf", url: "/uploads/new.pdf" }) },
      { extractText: async () => "Flight AI247 Kochi to Dubai on 2026-06-25" },
      {
        extractTravelData: async () => created.travelData,
        generateItinerary: async () => created.aiItinerary
      }
    );
    await expect(service.uploadAndGenerate("u1", { buffer: Buffer.from("new"), originalname: "new.pdf", mimetype: "application/pdf" } as Express.Multer.File)).resolves.toMatchObject({ id: "2" });
  });

  it("enforces owner access and sharing rules through repository results", async () => {
    const doc: any = {
      _id: "3",
      userId: "u1",
      fileUrl: "/uploads/a.pdf",
      travelData: { travelerName: null, departureCity: null, destinationCity: "Paris", departureDate: null, returnDate: null, airline: null, flightNumber: null, hotelName: null, hotelAddress: null, flights: [], notes: [] },
      aiItinerary: { title: "Paris", summary: "Trip", days: [] },
      shareId: "share-1",
      isPublic: true,
      revoked: false,
      shareExpiresAt: new Date(Date.now() + 10000),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const repo: Partial<IItineraryRepository> = {
      listByUser: async () => ({ items: [doc], total: 1 }),
      findById: async () => doc,
      deleteByIdForUser: async () => true,
      makePublic: async () => doc,
      findPublicByShareId: async () => doc
    };
    const service = new ItineraryService(
      repo as IItineraryRepository,
      { save: async () => ({ key: "x", url: "x" }) },
      { extractText: async () => "text" },
      { extractTravelData: async () => doc.travelData, generateItinerary: async () => doc.aiItinerary }
    );
    await expect(service.list("u1", {})).resolves.toMatchObject({ total: 1 });
    await expect(service.get("u1", "3")).resolves.toMatchObject({ id: "3" });
    await expect(service.remove("u1", "3")).resolves.toEqual({ id: "3" });
    await expect(service.share("u1", "3", {})).resolves.toMatchObject({ shareId: "share-1" });
    await expect(service.getShared("share-1")).resolves.toMatchObject({ id: "3" });
  });

  it("extracts boarding-pass style OCR text with local AI fallback", async () => {
    const service = new OpenAIService();
    const result = await service.extractTravelData("= me ase owas no SULLHTHTH = JOHN DOE g — = = NEWYORK 3 HONG KONG JS = GATE BOARDING TIME 07APR2018 E = 12 07:30 = = GATE CLOSES 40 MINUTES BEFORE DEPARTURE b12 =");

    expect(result).toMatchObject({
      travelerName: "JOHN DOE",
      departureCity: "New York",
      destinationCity: "Hong Kong",
      departureDate: "2018-04-07"
    });
    expect(result.flights[0]).toMatchObject({
      departureCity: "New York",
      destinationCity: "Hong Kong",
      departureDate: "2018-04-07"
    });
  });
});
