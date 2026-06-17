import mongoose from "mongoose";
import { env } from "./env.js";

mongoose.set("bufferCommands", false);

let memoryServer: import("mongodb-memory-server").MongoMemoryServer | undefined;

function getConnectionHint(error: unknown) {
  if (!(error instanceof Error)) return undefined;
  if (!env.MONGO_URI.startsWith("mongodb+srv://")) return undefined;
  if (!error.message.includes("querySrv")) return undefined;

  return "Node could not resolve the MongoDB Atlas SRV record. Fix local DNS for Node, or use a mongodb:// seed-list URI instead of mongodb+srv://.";
}

async function connectMongo(uri: string) {
  await mongoose.connect(uri, {
    bufferCommands: false,
    serverSelectionTimeoutMS: 5000
  });
}

async function connectMemoryDatabase() {
  const { MongoMemoryServer } = await import("mongodb-memory-server");
  memoryServer = await MongoMemoryServer.create();
  await connectMongo(memoryServer.getUri());
  console.warn("MongoDB connected using in-memory development database. Data resets when the server stops.");
}

export async function connectDatabase() {
  try {
    if (env.USE_MEMORY_MONGO === "true") {
      await connectMemoryDatabase();
      return;
    }

    await connectMongo(env.MONGO_URI);
    console.log("MongoDB connected");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error";
    console.error(`MongoDB connection failed: ${message}`);
    const hint = getConnectionHint(error);
    if (hint) console.error(`MongoDB connection hint: ${hint}`);

    if (env.NODE_ENV !== "production" && env.USE_MEMORY_MONGO === "false") {
      console.error("Set USE_MEMORY_MONGO=true to run local development without Atlas connectivity.");
    }

    throw error;
  }
}

export function isDatabaseConnected() {
  return mongoose.connection.readyState === 1;
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = undefined;
  }
}
