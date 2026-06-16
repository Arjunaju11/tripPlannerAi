import type { ItineraryDto, UserDto } from "@trip-planner/shared";
import type { ItineraryDocument } from "../models/itinerary.model.js";
import type { UserDocument } from "../models/user.model.js";

export function toUserDto(user: UserDocument): UserDto {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    avatar: user.avatar ?? null,
    authProvider: user.authProvider,
    createdAt: user.createdAt?.toISOString() ?? null
  };
}

export function toItineraryDto(itinerary: ItineraryDocument): ItineraryDto {
  return {
    id: String(itinerary._id),
    userId: String(itinerary.userId),
    fileUrl: itinerary.fileUrl,
    travelData: itinerary.travelData as ItineraryDto["travelData"],
    aiItinerary: itinerary.aiItinerary as ItineraryDto["aiItinerary"],
    shareId: itinerary.shareId ?? null,
    isPublic: itinerary.isPublic,
    shareExpiresAt: itinerary.shareExpiresAt?.toISOString() ?? null,
    revoked: itinerary.revoked,
    createdAt: itinerary.createdAt.toISOString(),
    updatedAt: itinerary.updatedAt.toISOString()
  };
}

export function toPublicItineraryDto(itinerary: ItineraryDocument): ItineraryDto {
  return {
    ...toItineraryDto(itinerary),
    userId: "",
    fileUrl: ""
  };
}
