import { z } from "zod";

export const AuthProviderSchema = z.enum(["local", "google"]);
export type AuthProvider = z.infer<typeof AuthProviderSchema>;

export const NullableString = z.string().trim().min(1).nullable();

export const TravelDataSchema = z.object({
  travelerName: NullableString,
  departureCity: NullableString,
  destinationCity: NullableString,
  departureDate: NullableString,
  returnDate: NullableString,
  airline: NullableString,
  flightNumber: NullableString,
  hotelName: NullableString,
  hotelAddress: NullableString,
  flights: z
    .array(
      z.object({
        departureCity: NullableString,
        destinationCity: NullableString,
        departureDate: NullableString,
        airline: NullableString,
        flightNumber: NullableString
      })
    )
    .default([]),
  notes: z.array(z.string()).default([])
});
export type TravelData = z.infer<typeof TravelDataSchema>;

export const ItineraryDaySchema = z.object({
  day: z.number().int().positive(),
  date: NullableString,
  title: z.string(),
  attractions: z.array(z.string()).default([]),
  restaurants: z.array(z.string()).default([]),
  hotelRecommendations: z.array(z.string()).default([]),
  foodRecommendations: z.array(z.string()).default([]),
  transportSuggestions: z.array(z.string()).default([]),
  travelTips: z.array(z.string()).default([])
});

export const FamousPlaceRecommendationSchema = z.object({
  name: z.string(),
  description: z.string(),
  bestTimeToVisit: NullableString.default(null),
  estimatedVisitDuration: NullableString.default(null),
  category: z.string()
});

export const RestaurantRecommendationSchema = z.object({
  name: z.string(),
  description: z.string(),
  cuisine: NullableString.default(null),
  area: NullableString.default(null),
  category: z.string()
});

export const StayAreaRecommendationSchema = z.object({
  name: z.string(),
  description: z.string(),
  area: NullableString.default(null),
  category: z.string()
});

export const TransportRecommendationSchema = z.object({
  mode: z.string(),
  description: z.string()
});

export const PlaceRecommendationSchema = z.object({
  placeId: z.string(),
  name: z.string(),
  address: NullableString.default(null),
  rating: z.number().nullable().default(null),
  userRatingCount: z.number().nullable().default(null),
  mapsUrl: NullableString.default(null),
  photoUrl: NullableString.default(null),
  photoReference: NullableString.default(null),
  types: z.array(z.string()).default([])
});

export const PlaceRecommendationPackSchema = z.object({
  destination: z.string(),
  attractions: z.array(PlaceRecommendationSchema).default([]),
  restaurants: z.array(PlaceRecommendationSchema).default([]),
  hotels: z.array(PlaceRecommendationSchema).default([])
});

export const AIRecommendationsSchema = z.object({
  famousPlaces: z.array(FamousPlaceRecommendationSchema).default([]),
  restaurants: z.array(RestaurantRecommendationSchema).default([]),
  hotelsOrStayAreas: z.array(StayAreaRecommendationSchema).default([]),
  transport: z.array(TransportRecommendationSchema).default([]),
  tips: z.array(z.string()).default([])
});

export const AIItinerarySchema = z.object({
  title: z.string(),
  summary: z.string(),
  destination: NullableString.default(null),
  travelDates: z
    .object({
      start: NullableString.default(null),
      end: NullableString.default(null)
    })
    .default({ start: null, end: null }),
  days: z.array(ItineraryDaySchema).default([]),
  recommendations: AIRecommendationsSchema.default({
    famousPlaces: [],
    restaurants: [],
    hotelsOrStayAreas: [],
    transport: [],
    tips: []
  }),
  placeRecommendations: PlaceRecommendationPackSchema.nullable().default(null),
  generatedAt: z.string().nullable().default(null)
});
export type AIItinerary = z.infer<typeof AIItinerarySchema>;

export const ApiResponseSchema = <T extends z.ZodTypeAny>(data: T) =>
  z.object({
    success: z.boolean(),
    message: z.string(),
    data
  });

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export const UserDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  avatar: z.string().url().nullable(),
  authProvider: AuthProviderSchema,
  createdAt: z.string().nullable().optional()
});
export type UserDto = z.infer<typeof UserDtoSchema>;

export const ItineraryDtoSchema = z.object({
  id: z.string(),
  userId: z.string(),
  fileUrl: z.string(),
  travelData: TravelDataSchema,
  aiItinerary: AIItinerarySchema,
  shareId: z.string().nullable(),
  isPublic: z.boolean(),
  shareExpiresAt: z.string().nullable(),
  revoked: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string()
});
export type ItineraryDto = z.infer<typeof ItineraryDtoSchema>;

export const RegisterSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().email(),
  password: z.string().min(8)
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email()
});

export const ResetPasswordSchema = z
  .object({
    token: z.string().min(32),
    password: z.string().min(8),
    confirmPassword: z.string().min(8)
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match"
  });

export const GoogleLoginSchema = z.object({
  credential: z.string().min(20)
});

export const UserUpdateSchema = z.object({
  name: z.string().trim().min(2).max(80)
});

export const GenerateItinerarySchema = z.object({
  uploadId: z.string().min(1)
});

export const ShareCreateSchema = z.object({
  expiresInDays: z.number().int().min(1).max(30).default(7)
});

export const ItineraryUpdateSchema = z.object({
  aiItinerary: AIItinerarySchema
});

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  sort: z.string().default("-createdAt"),
  q: z.string().optional().default("")
});

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const SUPPORTED_UPLOAD_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg"
] as const;
