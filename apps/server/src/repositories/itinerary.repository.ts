import type { FilterQuery } from "mongoose";
import type { IItineraryRepository } from "../interfaces/repositories.js";
import { ItineraryModel, type ItineraryDocument } from "../models/itinerary.model.js";

export class ItineraryRepository implements IItineraryRepository {
  create(input: Parameters<IItineraryRepository["create"]>[0]) {
    return ItineraryModel.create(input);
  }

  findById(id: string) {
    return ItineraryModel.findById(id);
  }

  findByUserAndHash(userId: string, fileHash: string) {
    return ItineraryModel.findOne({ userId, fileHash });
  }

  async listByUser(userId: string, query: { page: number; limit: number; sort: string; q: string }) {
    const filter: FilterQuery<ItineraryDocument> = { userId };
    if (query.q) {
      filter.$or = [
        { "aiItinerary.title": { $regex: query.q, $options: "i" } },
        { "travelData.destinationCity": { $regex: query.q, $options: "i" } },
        { originalFileName: { $regex: query.q, $options: "i" } }
      ];
    }
    const [items, total] = await Promise.all([
      ItineraryModel.find(filter)
        .sort(query.sort)
        .skip((query.page - 1) * query.limit)
        .limit(query.limit),
      ItineraryModel.countDocuments(filter)
    ]);
    return { items, total };
  }

  async deleteByIdForUser(id: string, userId: string) {
    const result = await ItineraryModel.deleteOne({ _id: id, userId });
    return result.deletedCount === 1;
  }

  updateGeneratedById(id: string, input: Parameters<IItineraryRepository["updateGeneratedById"]>[1]) {
    return ItineraryModel.findByIdAndUpdate(id, input, { new: true });
  }

  updateByIdForUser(id: string, userId: string, input: Parameters<IItineraryRepository["updateByIdForUser"]>[2]) {
    return ItineraryModel.findOneAndUpdate({ _id: id, userId }, { aiItinerary: input.aiItinerary }, { new: true });
  }

  makePublic(id: string, userId: string, shareId: string, shareExpiresAt: Date) {
    return ItineraryModel.findOneAndUpdate(
      { _id: id, userId },
      { shareId, shareExpiresAt, isPublic: true, revoked: false },
      { new: true }
    );
  }

  findPublicByShareId(shareId: string) {
    return ItineraryModel.findOne({
      shareId,
      isPublic: true,
      revoked: false,
      shareExpiresAt: { $gt: new Date() }
    });
  }
}
