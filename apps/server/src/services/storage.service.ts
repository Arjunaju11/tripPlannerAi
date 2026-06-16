import fs from "fs/promises";
import path from "path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { env } from "../config/env.js";
import type { IStorageService, StoredFile } from "../interfaces/services.js";

export class LocalStorageService implements IStorageService {
  async save(file: Express.Multer.File): Promise<StoredFile> {
    const uploadsDir = path.resolve(process.cwd(), "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });
    const key = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
    const target = path.join(uploadsDir, key);
    await fs.writeFile(target, file.buffer);
    return { key, url: `/uploads/${key}` };
  }
}

function safeObjectName(originalName: string) {
  return originalName.replace(/[^a-zA-Z0-9._-]/g, "-");
}

export class S3StorageService implements IStorageService {
  private client = new S3Client({ region: env.AWS_REGION });

  async save(file: Express.Multer.File): Promise<StoredFile> {
    if (!env.AWS_BUCKET_NAME) throw new Error("AWS_BUCKET_NAME is required for S3 storage");
    const key = `uploads/${Date.now()}-${safeObjectName(file.originalname)}`;
    await this.client.send(
      new PutObjectCommand({
        Bucket: env.AWS_BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype
      })
    );
    return { key, url: `s3://${env.AWS_BUCKET_NAME}/${key}` };
  }
}
