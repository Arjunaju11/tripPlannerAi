import type { Request, Response } from "express";
import { env } from "../config/env.js";
import { AppError } from "../utils/app-error.js";

export class PlacesController {
  photo = async (req: Request, res: Response) => {
    if (!env.GOOGLE_PLACES_API_KEY) throw new AppError(404, "Place photos are not configured");

    const photoReference = req.params.photoReference;
    if (!photoReference) throw new AppError(400, "Photo reference is required");

    const params = new URLSearchParams({
      maxwidth: "640",
      photo_reference: photoReference,
      key: env.GOOGLE_PLACES_API_KEY
    });
    const response = await fetch(`https://maps.googleapis.com/maps/api/place/photo?${params.toString()}`, {
      redirect: "follow"
    });

    if (!response.ok || !response.body) throw new AppError(502, "Could not load place photo");

    const contentType = response.headers.get("content-type") ?? "image/jpeg";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400");
    const buffer = Buffer.from(await response.arrayBuffer());
    res.send(buffer);
  };
}
