import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import type { IUserRepository } from "../interfaces/repositories.js";
import { AppError } from "../utils/app-error.js";
import { sha256 } from "../utils/hash.js";
import { toUserDto } from "../utils/mappers.js";
import { env } from "../config/env.js";
import { EmailService } from "./email.service.js";
import { TokenService } from "./token.service.js";

const PASSWORD_RESET_TTL_MINUTES = 30;

export class AuthService {
  private googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

  constructor(
    private userRepository: IUserRepository,
    private tokenService: TokenService,
    private emailService = new EmailService()
  ) {}

  async register(input: { name: string; email: string; password: string }) {
    const existing = await this.userRepository.findByEmail(input.email);
    if (existing) throw new AppError(409, "Email is already registered");
    const password = await bcrypt.hash(input.password, 12);
    const user = await this.userRepository.create({ ...input, password, authProvider: "local" });
    try {
      await this.emailService.sendWelcomeEmail(user.email, user.name);
      console.info(`Welcome email sent to ${user.email}`);
    } catch (error) {
      console.error(`Welcome email failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
    return this.createSession(String(user._id));
  }

  async login(input: { email: string; password: string }) {
    const user = await this.userRepository.findByEmail(input.email);
    if (!user?.password) throw new AppError(401, "Invalid credentials");
    const ok = await bcrypt.compare(input.password, user.password);
    if (!ok) throw new AppError(401, "Invalid credentials");
    return this.createSession(String(user._id));
  }

  async googleLogin(credential: string) {
    if (!env.GOOGLE_CLIENT_ID) throw new AppError(500, "Google login is not configured");
    const ticket = await this.googleClient.verifyIdToken({ idToken: credential, audience: env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    if (!payload?.email) throw new AppError(401, "Invalid Google credential");
    let user = await this.userRepository.findByEmail(payload.email);
    if (!user) {
      user = await this.userRepository.create({
        name: payload.name ?? payload.email.split("@")[0],
        email: payload.email,
        googleId: payload.sub,
        avatar: payload.picture,
        authProvider: "google"
      });
      try {
        await this.emailService.sendWelcomeEmail(user.email, user.name);
        console.info(`Welcome email sent to ${user.email}`);
      } catch (error) {
        console.error(`Welcome email failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }
    return this.createSession(String(user._id));
  }

  async forgotPassword(input: { email: string }) {
    if (env.NODE_ENV === "production" && !this.emailService.isConfigured()) {
      throw new AppError(503, "Password reset email is unavailable");
    }

    const user = await this.userRepository.findByEmail(input.email);
    if (!user?.password || user.authProvider !== "local") return;

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = sha256(rawToken);
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MINUTES * 60 * 1000);
    await this.userRepository.setPasswordResetToken(String(user._id), tokenHash, expiresAt);

    try {
      await this.emailService.sendPasswordResetEmail(user.email, `${env.CLIENT_URL}/reset-password/${rawToken}`);
    } catch (error) {
      await this.userRepository.clearPasswordReset(String(user._id));
      console.error(`Password reset email failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      throw new AppError(503, "Password reset email is unavailable");
    }
  }

  async resetPassword(input: { token: string; password: string }) {
    const tokenHash = sha256(input.token);
    const user = await this.userRepository.findByPasswordResetToken(tokenHash, new Date());
    if (!user?.password || user.authProvider !== "local") {
      throw new AppError(400, "Reset link is invalid or expired");
    }

    const password = await bcrypt.hash(input.password, 12);
    await this.userRepository.updatePasswordAndClearReset(String(user._id), password);
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.tokenService.verifyRefreshToken(refreshToken);
      return this.createSession(payload.sub);
    } catch {
      throw new AppError(401, "Invalid refresh token");
    }
  }

  async me(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new AppError(404, "User not found");
    return toUserDto(user);
  }

  private async createSession(userId: string) {
    const user = await this.me(userId);
    return {
      user,
      accessToken: this.tokenService.signAccessToken(userId),
      refreshToken: this.tokenService.signRefreshToken(userId)
    };
  }
}
