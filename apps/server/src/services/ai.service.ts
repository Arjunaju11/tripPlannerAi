import OpenAI from "openai";
import { AIItinerarySchema, TravelDataSchema, type TravelData } from "@trip-planner/shared";
import type { IAIService } from "../interfaces/services.js";
import { env } from "../config/env.js";
import { AppError } from "../utils/app-error.js";

const emptyTravelData = {
  travelerName: null,
  departureCity: null,
  destinationCity: null,
  departureDate: null,
  returnDate: null,
  airline: null,
  flightNumber: null,
  hotelName: null,
  hotelAddress: null,
  flights: [],
  notes: []
};

const emptyRecommendations = {
  famousPlaces: [],
  restaurants: [],
  hotelsOrStayAreas: [],
  transport: [],
  tips: []
};

function canUseFallback() {
  return env.NODE_ENV !== "production" || env.ALLOW_AI_FALLBACK === "true";
}

function parseJsonObject(content: string | null | undefined) {
  if (!content) throw new Error("AI returned an empty response");
  const trimmed = content.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) throw new Error("AI response did not contain a JSON object");
  const parsed = JSON.parse(trimmed.slice(start, end + 1)) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("AI response JSON was not an object");
  return parsed as Record<string, unknown>;
}

function toIsoDate(value: string | null) {
  if (!value) return null;
  const compactDate = value.match(/^(\d{1,2})([A-Za-z]{3})(\d{4})$/);
  if (compactDate) return toIsoDate(`${compactDate[1]} ${compactDate[2]} ${compactDate[3]}`);
  const dateParts = value.match(/^(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})$/);
  if (dateParts) {
    const months: Record<string, string> = {
      jan: "01",
      january: "01",
      feb: "02",
      february: "02",
      mar: "03",
      march: "03",
      apr: "04",
      april: "04",
      may: "05",
      jun: "06",
      june: "06",
      jul: "07",
      july: "07",
      aug: "08",
      august: "08",
      sep: "09",
      september: "09",
      oct: "10",
      october: "10",
      nov: "11",
      november: "11",
      dec: "12",
      december: "12"
    };
    const month = months[dateParts[2].toLowerCase()];
    if (month) return `${dateParts[3]}-${month}-${dateParts[1].padStart(2, "0")}`;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toISOString().slice(0, 10);
}

function matchFirst(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return null;
}

function titleCaseCity(value: string | null) {
  if (!value) return null;
  const withKnownSpacing = value.replace(/\bNEWYORK\b/i, "NEW YORK").replace(/\bHONGKONG\b/i, "HONG KONG");
  return withKnownSpacing
    .trim()
    .toLowerCase()
    .replace(/\b[a-z]/g, (char) => char.toUpperCase());
}

function extractBoardingPassRoute(text: string) {
  const compact = text.replace(/\s+/g, " ").trim();
  const knownRoute = compact.match(/\b(NEW\s*YORK|HONG\s*KONG|KOCHI|DUBAI|DELHI|MUMBAI|BENGALURU|BANGALORE|CHENNAI|LONDON|PARIS|SINGAPORE|DOHA|ABU\s*DHABI)\b\s+(?:[✈=:\-–—>0-9]+\s*)?\b(NEW\s*YORK|HONG\s*KONG|KOCHI|DUBAI|DELHI|MUMBAI|BENGALURU|BANGALORE|CHENNAI|LONDON|PARIS|SINGAPORE|DOHA|ABU\s*DHABI)\b/i);
  if (knownRoute) {
    return {
      departureCity: titleCaseCity(knownRoute[1]),
      destinationCity: titleCaseCity(knownRoute[2])
    };
  }

  const route = compact.match(/\bFROM\s+([A-Z][A-Z ]{2,}?)\s+(?:TO|ARRIVAL|DESTINATION)\s+([A-Z][A-Z ]{2,}?)(?:\s+(?:FLIGHT|DATE|GATE|SEAT|BOARDING)|$)/i);
  return {
    departureCity: titleCaseCity(route?.[1] ?? null),
    destinationCity: titleCaseCity(route?.[2] ?? null)
  };
}

function hasUsefulTravelData(data: TravelData) {
  return Boolean(
    data.travelerName ||
      data.departureCity ||
      data.destinationCity ||
      data.departureDate ||
      data.returnDate ||
      data.airline ||
      data.flightNumber ||
      data.hotelName ||
      data.hotelAddress ||
      data.flights.length > 0
  );
}

function fallbackExtractTravelData(text: string) {
  const normalized = text.replace(/\s+/g, " ").trim();
  const boardingRoute = extractBoardingPassRoute(normalized);
  const travelerName = matchFirst(normalized, [
    /Passenger Name:\s*(.+?)\s+Booking Reference/i,
    /Passenger Name:\s*(.+?)\s+Passport Number/i,
    /NAME OF PASSENGER\s+(.+?)\s+FLIGHT/i,
    /(?:^|[^A-Z])([A-Z]{2,}(?:\s+[A-Z]{2,}){1,3})\s+[^A-Z]{0,30}(?=(?:NEW\s*YORK|HONG\s*KONG|KOCHI|DUBAI|DELHI|MUMBAI|BENGALURU|BANGALORE|CHENNAI|LONDON|PARIS|SINGAPORE|DOHA|ABU\s*DHABI)\b)/,
    /\b([A-Z][A-Z]+(?:\s+[A-Z][A-Z]+){1,3})\s+(?:NEW\s*YORK|HONG\s*KONG|KOCHI|DUBAI|DELHI|MUMBAI|BENGALURU|BANGALORE|CHENNAI|LONDON|PARIS|SINGAPORE|DOHA|ABU\s*DHABI)\b/i
  ]);
  const hotelName = matchFirst(normalized, [/Hotel Name:\s*([^:]+?)\s+Address:/i]);
  const hotelAddress = matchFirst(normalized, [/Address:\s*([^:]+?)\s+Check-in:/i]);
  const departureDate = toIsoDate(matchFirst(normalized, [
    /Departure Arrival .*?(\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4})/i,
    /Check-in:\s*(\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4})/i,
    /DATE\s+(\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4})/i,
    /\b(\d{1,2}[A-Za-z]{3}\d{4})\b/i
  ]));
  const returnDate = toIsoDate(matchFirst(normalized, [/Check-out:\s*(\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4})/i]));
  const firstFlight = normalized.match(/([A-Za-z]+)\s+([A-Z]{2}\d+)\s+([A-Za-z ]+?)\s+\(([A-Z]{3})\)\s+([A-Za-z ]+?)\s+\(([A-Z]{3})\)\s+(\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4})/);
  const departureCity = firstFlight?.[3]?.trim() ?? boardingRoute.departureCity;
  const destinationCity = firstFlight?.[5]?.trim() ?? boardingRoute.destinationCity ?? matchFirst(normalized, [/Hotel Name:.*?\b([A-Za-z]+)\s+Address:/i]);
  const airline = firstFlight?.[1]?.trim() ?? null;
  const flightNumber = firstFlight?.[2]?.trim() ?? matchFirst(normalized, [/FLIGHT\s+([A-Z]{1,3}\d{2,5})/i]);

  return TravelDataSchema.parse({
    ...emptyTravelData,
    travelerName,
    departureCity,
    destinationCity,
    departureDate,
    returnDate,
    airline,
    flightNumber,
    hotelName,
    hotelAddress,
    flights: firstFlight || flightNumber || departureCity || destinationCity
      ? [
          {
            departureCity,
            destinationCity,
            departureDate: firstFlight ? toIsoDate(firstFlight[7]) : departureDate,
            airline,
            flightNumber
          }
        ]
      : [],
    notes: ["Generated with local fallback because AI extraction was unavailable"]
  });
}

function fallbackGenerateItinerary(data: TravelData) {
  const destination = data.destinationCity ?? data.hotelName ?? null;
  if (!destination) {
    return AIItinerarySchema.parse({
      title: "Travel Itinerary",
      summary: "Destination details were not found in the uploaded document.",
      destination: null,
      travelDates: { start: data.departureDate, end: data.returnDate },
      days: [],
      recommendations: emptyRecommendations,
      generatedAt: new Date().toISOString()
    });
  }

  return AIItinerarySchema.parse({
    title: `Trip to ${destination}`,
    summary: `A draft itinerary generated from the uploaded travel document for ${destination}.`,
    destination,
    travelDates: { start: data.departureDate, end: data.returnDate },
    days: [
      {
        day: 1,
        date: data.departureDate,
        title: `Arrive in ${destination}`,
        attractions: [`Explore central ${destination}`, "Visit a highly rated local landmark"],
        restaurants: ["Try a well-reviewed local restaurant near your stay", "Keep one flexible meal slot for local recommendations"],
        hotelRecommendations: data.hotelName ? [`Confirmed stay: ${data.hotelName}`] : [`Stay in a central, transit-friendly area of ${destination}`],
        foodRecommendations: ["Try local cuisine near your hotel"],
        transportSuggestions: data.hotelName ? [`Check in at ${data.hotelName}`] : [],
        travelTips: ["Verify flight, hotel, and transfer timings against the original booking document."]
      }
    ],
    recommendations: {
      famousPlaces: [
        {
          name: `Central ${destination}`,
          description: `A practical starting point for exploring ${destination}.`,
          bestTimeToVisit: "Morning or late afternoon",
          estimatedVisitDuration: "2-3 hours",
          category: "Sightseeing"
        },
        {
          name: `${destination} local market or waterfront`,
          description: "Recommended for a short cultural walk, local food, and photos.",
          bestTimeToVisit: "Evening",
          estimatedVisitDuration: "1-2 hours",
          category: "Local experience"
        }
      ],
      restaurants: [
        {
          name: "Well-reviewed local restaurant near your stay",
          description: "Choose a nearby restaurant with strong recent reviews and local cuisine.",
          cuisine: "Local",
          area: data.hotelAddress ?? data.hotelName,
          category: "Recommendation"
        }
      ],
      hotelsOrStayAreas: [
        {
          name: data.hotelName ?? `Central ${destination}`,
          description: data.hotelName ? "Confirmed hotel from uploaded booking." : "Recommended stay area near transit and major attractions.",
          area: data.hotelAddress,
          category: data.hotelName ? "Confirmed booking" : "Stay area"
        }
      ],
      transport: [
        {
          mode: "Airport transfer",
          description: "Pre-book pickup or use official airport taxi/app-based ride services."
        },
        {
          mode: "Local transport",
          description: "Use public transit for predictable routes and rideshare/taxi for late-night transfers."
        }
      ],
      tips: [
        "Keep flight and hotel confirmations available offline.",
        "Confirm check-in time and airport transfer before arrival.",
        "Carry local currency or an enabled international payment card."
      ]
    },
    generatedAt: new Date().toISOString()
  });
}

export class OpenAIService implements IAIService {
  private client = env.OPENAI_API_KEY ? new OpenAI({ apiKey: env.OPENAI_API_KEY }) : null;

  async extractTravelData(text: string) {
    if (!this.client) {
      if (!canUseFallback()) throw new AppError(500, "OPENAI_API_KEY is required for AI extraction in production");
      return fallbackExtractTravelData(text);
    }
    const prompt = `Extract travel data as strict JSON. Missing values must be null. Dates must be ISO 8601 dates. Do not hallucinate.
Example OCR: "Flight AI247 Kochi to Dubai on 2026-06-25"
Expected JSON: {"travelerName":null,"departureCity":"Kochi","destinationCity":"Dubai","departureDate":"2026-06-25","returnDate":null,"airline":null,"flightNumber":"AI247","hotelName":null,"hotelAddress":null,"flights":[{"departureCity":"Kochi","destinationCity":"Dubai","departureDate":"2026-06-25","airline":null,"flightNumber":"AI247"}],"notes":[]}
OCR:
${text}`;
    try {
      const response = await this.client.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [{ role: "user", content: prompt }]
      });
      const parsed = TravelDataSchema.parse(parseJsonObject(response.choices[0]?.message.content));
      if (hasUsefulTravelData(parsed)) return parsed;

      const fallback = fallbackExtractTravelData(text);
      return hasUsefulTravelData(fallback) ? fallback : parsed;
    } catch (error) {
      if (!canUseFallback()) throw new AppError(502, "AI travel data extraction failed");
      console.warn("AI travel data extraction failed. Using local fallback.", error instanceof Error ? error.message : error);
      return fallbackExtractTravelData(text);
    }
  }

  async generateItinerary(data: TravelData) {
    if (!this.client) {
      if (!canUseFallback()) throw new AppError(500, "OPENAI_API_KEY is required for AI itinerary generation in production");
      return fallbackGenerateItinerary(data);
    }
    const prompt = `Return valid JSON only. No markdown. No explanation outside JSON.

Generate a practical AI travel itinerary and destination recommendation pack using this exact JSON shape:
{
  "title": string,
  "summary": string,
  "destination": string | null,
  "travelDates": { "start": string | null, "end": string | null },
  "days": [
    {
      "day": number,
      "date": string | null,
      "title": string,
      "attractions": string[],
      "restaurants": string[],
      "hotelRecommendations": string[],
      "transportSuggestions": string[],
      "travelTips": string[]
    }
  ],
  "recommendations": {
    "famousPlaces": [
      { "name": string, "description": string, "bestTimeToVisit": string | null, "estimatedVisitDuration": string | null, "category": string }
    ],
    "restaurants": [
      { "name": string, "description": string, "cuisine": string | null, "area": string | null, "category": string }
    ],
    "hotelsOrStayAreas": [
      { "name": string, "description": string, "area": string | null, "category": string }
    ],
    "transport": [
      { "mode": string, "description": string }
    ],
    "tips": string[]
  }
}

Rules:
- Use confirmed booking facts only for flights, hotels, passenger names, check-in/check-out, and ticket details.
- Do not invent booking confirmations.
- Recommendations may use destination knowledge, but keep them clearly as recommendations.
- Do not claim a recommended hotel or restaurant is booked unless it exists in extracted data.
- Do not include image URLs.
- Keep recommendations concise and useful.
- If destination is missing, return destination null, empty days if needed, and empty recommendation arrays.

Extracted travel data:
${JSON.stringify(data)}`;
    try {
      const response = await this.client.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [{ role: "user", content: prompt }]
      });
      return AIItinerarySchema.parse({ ...parseJsonObject(response.choices[0]?.message.content), generatedAt: new Date().toISOString() });
    } catch (error) {
      if (!canUseFallback()) throw new AppError(502, "AI itinerary generation failed");
      console.warn("AI itinerary generation failed. Using local fallback.", error instanceof Error ? error.message : error);
      return fallbackGenerateItinerary(data);
    }
  }
}
