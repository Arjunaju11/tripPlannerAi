import crypto from "crypto";

export function sha256(value: Buffer | string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}
