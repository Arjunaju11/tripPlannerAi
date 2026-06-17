import path from "path";
import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import mongoSanitize from "express-mongo-sanitize";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import xssClean from "xss-clean";
import { isDatabaseConnected } from "./config/database.js";
import { env } from "./config/env.js";
import { swaggerSpec } from "./config/swagger.js";
import { requireDatabase } from "./middleware/database.middleware.js";
import { errorHandler, notFound } from "./middleware/error.middleware.js";
import { authRouter } from "./routes/auth.routes.js";
import { itineraryRouter } from "./routes/itinerary.routes.js";
import { placesRouter } from "./routes/places.routes.js";
import { userRouter } from "./routes/user.routes.js";

const allowedOrigins = env.CLIENT_URL.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error(`Origin ${origin} is not allowed by CORS`));
      },
      credentials: true
    })
  );
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 200 }));
  app.use(compression());
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(mongoSanitize());
  app.use(xssClean());
  app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get("/api/v1/health", (_req, res) => {
    res.json({
      success: true,
      message: "API running",
      database: isDatabaseConnected() ? "connected" : "disconnected"
    });
  });
  app.use("/api/v1/auth", requireDatabase, authRouter);
  app.use("/api/v1/users", requireDatabase, userRouter);
  app.use("/api/v1/places", placesRouter);
  app.use("/api/v1", requireDatabase, itineraryRouter);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
