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
import { env } from "./config/env.js";
import { swaggerSpec } from "./config/swagger.js";
import { errorHandler, notFound } from "./middleware/error.middleware.js";
import { authRouter } from "./routes/auth.routes.js";
import { itineraryRouter } from "./routes/itinerary.routes.js";
import { placesRouter } from "./routes/places.routes.js";
import { userRouter } from "./routes/user.routes.js";

export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 200 }));
  app.use(compression());
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(mongoSanitize());
  app.use(xssClean());
  app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get("/api/v1/health", (_req, res) => {
    res.json({ success: true, message: "API running" });
  });
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/users", userRouter);
  app.use("/api/v1/places", placesRouter);
  app.use("/api/v1", itineraryRouter);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
