import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDatabase() {
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log("MongoDB connected");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error";
    console.error(`MongoDB connection failed: ${message}`);
    throw error;
  }
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}
