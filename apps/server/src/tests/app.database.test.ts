import request from "supertest";
import { describe, expect, it, vi } from "vitest";

vi.stubEnv("JWT_SECRET", "a".repeat(32));
vi.stubEnv("JWT_REFRESH_SECRET", "b".repeat(32));
vi.stubEnv("MONGO_URI", "mongodb://localhost/test");
vi.stubEnv("CLIENT_URL", "http://localhost:5173");

describe("App database availability", () => {
  it("keeps health available and rejects database routes while disconnected", async () => {
    const { createApp } = await import("../app.js");
    const app = createApp();

    await expect(request(app).get("/api/v1/health")).resolves.toMatchObject({
      status: 200,
      body: { success: true, message: "API running", database: "disconnected" }
    });
    await expect(request(app).post("/api/v1/auth/login").send({ email: "test@example.com", password: "password123" })).resolves.toMatchObject({
      status: 503,
      body: { success: false, message: "Database unavailable", data: null }
    });
  });
});
