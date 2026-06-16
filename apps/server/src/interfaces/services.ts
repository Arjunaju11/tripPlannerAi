export interface StoredFile {
  url: string;
  key: string;
}

export interface IStorageService {
  save(file: Express.Multer.File): Promise<StoredFile>;
  delete?(key: string): Promise<void>;
}

export interface IOCRService {
  extractText(file: Express.Multer.File): Promise<string>;
}

export interface IAIService {
  extractTravelData(text: string): Promise<import("@trip-planner/shared").TravelData>;
  generateItinerary(data: import("@trip-planner/shared").TravelData): Promise<import("@trip-planner/shared").AIItinerary>;
}

export interface IPlacesService {
  getRecommendations(destination: string): Promise<import("@trip-planner/shared").AIItinerary["placeRecommendations"]>;
}
