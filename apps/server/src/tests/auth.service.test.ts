import bcrypt from "bcryptjs";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { IUserRepository } from "../interfaces/repositories.js";

vi.stubEnv("JWT_SECRET", "a".repeat(32));
vi.stubEnv("JWT_REFRESH_SECRET", "b".repeat(32));
vi.stubEnv("MONGO_URI", "mongodb://localhost/test");

const users = new Map<string, any>();
const repo = {
  async create(input: Parameters<IUserRepository["create"]>[0]) {
    const user = { ...input, _id: String(users.size + 1) };
    users.set(input.email, user);
    return user;
  },
  async findByEmail(email: string) {
    return users.get(email) ?? null;
  },
  async findById(id: string) {
    return [...users.values()].find((user) => String(user._id) === id) ?? null;
  },
  async setPasswordResetToken(id: string, tokenHash: string, expiresAt: Date) {
    const user = [...users.values()].find((item) => String(item._id) === id);
    if (!user) return null;
    user.passwordResetToken = tokenHash;
    user.passwordResetExpires = expiresAt;
    return user;
  },
  async findByPasswordResetToken(tokenHash: string, now: Date) {
    return [...users.values()].find((user) => user.passwordResetToken === tokenHash && user.passwordResetExpires > now) ?? null;
  },
  async clearPasswordReset(id: string) {
    const user = [...users.values()].find((item) => String(item._id) === id);
    if (!user) return null;
    delete user.passwordResetToken;
    delete user.passwordResetExpires;
    return user;
  },
  async updatePasswordAndClearReset(id: string, password: string) {
    const user = [...users.values()].find((item) => String(item._id) === id);
    if (!user) return null;
    user.password = password;
    delete user.passwordResetToken;
    delete user.passwordResetExpires;
    return user;
  }
} as unknown as IUserRepository;

describe("AuthService", () => {
  let AuthService: typeof import("../services/auth.service.js").AuthService;
  let TokenService: typeof import("../services/token.service.js").TokenService;

  beforeAll(async () => {
    AuthService = (await import("../services/auth.service.js")).AuthService;
    TokenService = (await import("../services/token.service.js")).TokenService;
  });

  beforeEach(() => users.clear());

  it("registers a local user and returns tokens", async () => {
    const emailService = {
      isConfigured: () => true,
      sendWelcomeEmail: vi.fn().mockResolvedValue("sent"),
      sendPasswordResetEmail: vi.fn()
    };
    const service = new AuthService(repo, new TokenService(), emailService as any);
    const session = await service.register({ name: "Test User", email: "test@example.com", password: "password123" });
    expect(session.user.email).toBe("test@example.com");
    expect(session.accessToken).toBeTruthy();
    expect(session.refreshToken).toBeTruthy();
    expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith("test@example.com", "Test User");
  });

  it("does not fail registration when the welcome email fails", async () => {
    const emailService = {
      isConfigured: () => true,
      sendWelcomeEmail: vi.fn().mockRejectedValue(new Error("SMTP failed")),
      sendPasswordResetEmail: vi.fn()
    };
    const service = new AuthService(repo, new TokenService(), emailService as any);

    const session = await service.register({ name: "Test User", email: "test@example.com", password: "password123" });

    expect(session.user.email).toBe("test@example.com");
    expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith("test@example.com", "Test User");
  });

  it("logs in and refreshes an existing user", async () => {
    const password = await bcrypt.hash("password123", 12);
    users.set("test@example.com", { _id: "1", name: "Test User", email: "test@example.com", password, authProvider: "local" });
    const service = new AuthService(repo, new TokenService());
    const login = await service.login({ email: "test@example.com", password: "password123" });
    const refreshed = await service.refresh(login.refreshToken);
    expect(refreshed.user.email).toBe("test@example.com");
  });

  it("rejects bad credentials", async () => {
    const service = new AuthService(repo, new TokenService());
    await expect(service.login({ email: "missing@example.com", password: "password123" })).rejects.toThrow("Invalid credentials");
  });

  it("returns the current user by id", async () => {
    users.set("test@example.com", { _id: "1", name: "Test User", email: "test@example.com", authProvider: "local" });
    const service = new AuthService(repo, new TokenService());
    await expect(service.me("1")).resolves.toMatchObject({ email: "test@example.com" });
  });

  it("creates a hashed reset token and sends a reset link for local users", async () => {
    const password = await bcrypt.hash("password123", 12);
    users.set("test@example.com", { _id: "1", name: "Test User", email: "test@example.com", password, authProvider: "local" });
    let resetUrl = "";
    const emailService = {
      isConfigured: () => true,
      sendWelcomeEmail: vi.fn(),
      sendPasswordResetEmail: async (_to: string, url: string) => {
        resetUrl = url;
        return "sent";
      }
    };
    const service = new AuthService(repo, new TokenService(), emailService as any);

    await service.forgotPassword({ email: "test@example.com" });

    const user = users.get("test@example.com");
    const rawToken = resetUrl.split("/reset-password/")[1];
    expect(rawToken).toBeTruthy();
    expect(user.passwordResetToken).toBeTruthy();
    expect(user.passwordResetToken).not.toBe(rawToken);
    expect(user.passwordResetExpires).toBeInstanceOf(Date);
  });

  it("uses a generic no-op for unknown and google-only forgot-password requests", async () => {
    users.set("google@example.com", { _id: "1", name: "Google User", email: "google@example.com", authProvider: "google" });
    const emailService = {
      isConfigured: () => true,
      sendWelcomeEmail: vi.fn(),
      sendPasswordResetEmail: vi.fn()
    };
    const service = new AuthService(repo, new TokenService(), emailService as any);

    await expect(service.forgotPassword({ email: "missing@example.com" })).resolves.toBeUndefined();
    await expect(service.forgotPassword({ email: "google@example.com" })).resolves.toBeUndefined();
    expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("resets a password once and clears the reset token", async () => {
    const password = await bcrypt.hash("password123", 12);
    users.set("test@example.com", { _id: "1", name: "Test User", email: "test@example.com", password, authProvider: "local" });
    let resetUrl = "";
    const service = new AuthService(repo, new TokenService(), {
      isConfigured: () => true,
      sendWelcomeEmail: vi.fn(),
      sendPasswordResetEmail: async (_to: string, url: string) => {
        resetUrl = url;
        return "sent";
      }
    } as any);
    await service.forgotPassword({ email: "test@example.com" });
    const rawToken = resetUrl.split("/reset-password/")[1];

    await service.resetPassword({ token: rawToken, password: "newpassword123" });

    const user = users.get("test@example.com");
    await expect(bcrypt.compare("newpassword123", user.password)).resolves.toBe(true);
    expect(user.passwordResetToken).toBeUndefined();
    await expect(service.resetPassword({ token: rawToken, password: "anotherpassword123" })).rejects.toThrow("Reset link is invalid or expired");
  });
});
