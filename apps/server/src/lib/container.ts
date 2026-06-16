import { env } from "../config/env.js";
import { AuthController } from "../controllers/auth.controller.js";
import { ItineraryController } from "../controllers/itinerary.controller.js";
import { PlacesController } from "../controllers/places.controller.js";
import { UserController } from "../controllers/user.controller.js";
import { ItineraryRepository } from "../repositories/itinerary.repository.js";
import { UserRepository } from "../repositories/user.repository.js";
import { OpenAIService } from "../services/ai.service.js";
import { AuthService } from "../services/auth.service.js";
import { EmailService } from "../services/email.service.js";
import { ItineraryService } from "../services/itinerary.service.js";
import { TesseractOCRService } from "../services/ocr.service.js";
import { PlacesService } from "../services/places.service.js";
import { LocalStorageService, S3StorageService } from "../services/storage.service.js";
import { TokenService } from "../services/token.service.js";

const userRepository = new UserRepository();
const itineraryRepository = new ItineraryRepository();
const tokenService = new TokenService();
const storageService = env.STORAGE_DRIVER === "s3" ? new S3StorageService() : new LocalStorageService();
const ocrService = new TesseractOCRService();
const aiService = new OpenAIService();
const placesService = new PlacesService();
const emailService = new EmailService();

export const authController = new AuthController(new AuthService(userRepository, tokenService, emailService));
export const userController = new UserController(userRepository);
export const placesController = new PlacesController();
export const itineraryController = new ItineraryController(
  new ItineraryService(itineraryRepository, storageService, ocrService, aiService, placesService)
);
