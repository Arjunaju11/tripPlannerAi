import { Schema, Types, model, type HydratedDocument, type InferSchemaType } from "mongoose";

const ItinerarySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    fileHash: { type: String, required: true, index: true },
    fileUrl: { type: String, required: true },
    originalFileName: { type: String, required: true },
    extractedText: { type: String, required: true },
    travelData: { type: Schema.Types.Mixed, required: true },
    aiItinerary: { type: Schema.Types.Mixed, required: true },
    shareId: { type: String, index: true, sparse: true },
    isPublic: { type: Boolean, default: false },
    shareExpiresAt: { type: Date },
    revoked: { type: Boolean, default: false }
  },
  { timestamps: true }
);

ItinerarySchema.index({ userId: 1, fileHash: 1 }, { unique: true });

export type ItineraryDocument = HydratedDocument<InferSchemaType<typeof ItinerarySchema> & { _id: Types.ObjectId }>;
export const ItineraryModel = model("Itinerary", ItinerarySchema);
