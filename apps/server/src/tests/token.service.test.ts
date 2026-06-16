import { describe, expect, it, vi } from "vitest";

vi.stubEnv("JWT_SECRET", "a".repeat(32));
vi.stubEnv("JWT_REFRESH_SECRET", "b".repeat(32));
vi.stubEnv("MONGO_URI", "mongodb://localhost/test");

describe("TokenService", () => {
  it("signs and verifies access and refresh tokens", async () => {
    const { TokenService } = await import("../services/token.service.js");
    const service = new TokenService();
    expect(service.verifyAccessToken(service.signAccessToken("u1")).sub).toBe("u1");
    expect(service.verifyRefreshToken(service.signRefreshToken("u1")).sub).toBe("u1");
  });
});
