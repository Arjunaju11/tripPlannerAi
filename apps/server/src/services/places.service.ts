import { PlaceRecommendationPackSchema, type AIItinerary } from "@trip-planner/shared";
import { env } from "../config/env.js";

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.rating",
  "places.userRatingCount",
  "places.googleMapsUri",
  "places.photos",
  "places.types"
].join(",");

type GooglePlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  photos?: Array<{ name?: string }>;
  types?: string[];
};

type GoogleSearchTextResponse = {
  places?: GooglePlace[];
};

type GooglePhotoMediaResponse = {
  photoUri?: string;
};

async function fetchPhotoUri(photoName: string) {
  const params = new URLSearchParams({
    maxWidthPx: "640",
    skipHttpRedirect: "true"
  });
  const response = await fetch(`https://places.googleapis.com/v1/${photoName}/media?${params.toString()}`, {
    headers: {
      "X-Goog-Api-Key": env.GOOGLE_PLACES_API_KEY ?? ""
    }
  });

  if (!response.ok) return null;
  const body = (await response.json()) as GooglePhotoMediaResponse;
  return body.photoUri ?? null;
}

async function normalizePlace(place: GooglePlace) {
  const placeId = place.id ?? "";
  const photoReference = place.photos?.[0]?.name ?? null;
  const photoUrl = photoReference ? await fetchPhotoUri(photoReference) : null;

  return {
    placeId,
    name: place.displayName?.text ?? "Unnamed place",
    address: place.formattedAddress ?? null,
    rating: place.rating ?? null,
    userRatingCount: place.userRatingCount ?? null,
    mapsUrl: place.googleMapsUri ?? (placeId ? `https://www.google.com/maps/place/?q=place_id:${placeId}` : null),
    photoUrl,
    photoReference,
    types: place.types ?? []
  };
}

export class PlacesService {
  async getRecommendations(destination: string) {
    if (!env.GOOGLE_PLACES_API_KEY) {
      console.info("GOOGLE_PLACES_API_KEY is missing. Returning empty Google Places recommendations.");
      return PlaceRecommendationPackSchema.parse({
        destination,
        attractions: [],
        restaurants: [],
        hotels: []
      });
    }

    try {
      const [attractions, restaurants, hotels] = await Promise.all([
        this.search(`${destination} famous tourist attractions`, "tourist_attraction"),
        this.search(`${destination} best restaurants`, "restaurant"),
        this.search(`${destination} best hotels`, "lodging")
      ]);

      return PlaceRecommendationPackSchema.parse({
        destination,
        attractions,
        restaurants,
        hotels
      });
    } catch (error) {
      console.warn("Google Places lookup failed. Continuing with AI text recommendations.", error instanceof Error ? error.message : error);
      return PlaceRecommendationPackSchema.parse({
        destination,
        attractions: [],
        restaurants: [],
        hotels: []
      });
    }
  }

  private async search(textQuery: string, includedType: string) {
    const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": env.GOOGLE_PLACES_API_KEY ?? "",
        "X-Goog-FieldMask": FIELD_MASK
      },
      body: JSON.stringify({
        textQuery,
        includedType,
        maxResultCount: 6
      })
    });

    if (!response.ok) throw new Error(`Google Places HTTP ${response.status}`);

    const body = (await response.json()) as GoogleSearchTextResponse;
    const places = await Promise.all((body.places ?? []).slice(0, 6).map(normalizePlace));
    return places.filter((place) => place.placeId);
  }
}

export function getItineraryDestination(aiItinerary: AIItinerary, fallback?: string | null) {
  return aiItinerary.destination ?? fallback ?? null;
}
