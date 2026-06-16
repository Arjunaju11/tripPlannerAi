import { connectDatabase } from "./config/database.js";
import { env } from "./config/env.js";
import { createApp } from "./app.js";

try {
  try {
    await connectDatabase();
  } catch (error) {
    if (env.NODE_ENV === "production") throw error;
    console.warn("Continuing without MongoDB in development. Database-backed routes will fail until MongoDB is reachable.");
  }

  createApp().listen(env.PORT, () => {
    console.log(`TripPlannerAI API listening on ${env.PORT}`);
  });
} catch (error) {
  const message = error instanceof Error ? error.message : "Unknown startup error";
  console.error(`Server startup failed: ${message}`);
  process.exit(1);
}
