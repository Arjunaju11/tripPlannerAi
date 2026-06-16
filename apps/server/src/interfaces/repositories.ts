import type { AIItinerary, AuthProvider, TravelData } from "@trip-planner/shared";
import type { ItineraryDocument } from "../models/itinerary.model.js";
import type { UserDocument } from "../models/user.model.js";

export interface IUserRepository {
  create(input: { name: string; email: string; password?: string; googleId?: string; avatar?: string; authProvider: AuthProvider }): Promise<UserDocument>;
  findByEmail(email: string): Promise<UserDocument | null>;
  findById(id: string): Promise<UserDocument | null>;
  updateById(id: string, input: { name: string }): Promise<UserDocument | null>;
  setPasswordResetToken(id: string, tokenHash: string, expiresAt: Date): Promise<UserDocument | null>;
  findByPasswordResetToken(tokenHash: string, now: Date): Promise<UserDocument | null>;
  clearPasswordReset(id: string): Promise<UserDocument | null>;
  updatePasswordAndClearReset(id: string, password: string): Promise<UserDocument | null>;
}

export interface IItineraryRepository {
  create(input: {
    userId: string;
    fileHash: string;
    fileUrl: string;
    originalFileName: string;
    extractedText: string;
    travelData: TravelData;
    aiItinerary: AIItinerary;
  }): Promise<ItineraryDocument>;
  findById(id: string): Promise<ItineraryDocument | null>;
  findByUserAndHash(userId: string, fileHash: string): Promise<ItineraryDocument | null>;
  listByUser(userId: string, query: { page: number; limit: number; sort: string; q: string }): Promise<{ items: ItineraryDocument[]; total: number }>;
  updateGeneratedById(id: string, input: { extractedText: string; travelData: TravelData; aiItinerary: AIItinerary }): Promise<ItineraryDocument | null>;
  updateByIdForUser(id: string, userId: string, input: { aiItinerary: AIItinerary }): Promise<ItineraryDocument | null>;
  deleteByIdForUser(id: string, userId: string): Promise<boolean>;
  makePublic(id: string, userId: string, shareId: string, shareExpiresAt: Date): Promise<ItineraryDocument | null>;
  findPublicByShareId(shareId: string): Promise<ItineraryDocument | null>;
}
