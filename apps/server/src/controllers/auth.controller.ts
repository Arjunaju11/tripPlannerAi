import type { Request, Response } from "express";
import { ForgotPasswordSchema, GoogleLoginSchema, LoginSchema, RegisterSchema, ResetPasswordSchema } from "@trip-planner/shared";
import { AuthService } from "../services/auth.service.js";
import { env } from "../config/env.js";
import { sendResponse } from "../utils/api-response.js";
import { AppError } from "../utils/app-error.js";

const cookieOptions = {
  httpOnly: true,
  sameSite: env.NODE_ENV === "production" ? ("none" as const) : ("lax" as const),
  secure: env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000
};

export class AuthController {
  constructor(private authService: AuthService) {}

  register = async (req: Request, res: Response) => {
    const session = await this.authService.register(RegisterSchema.parse(req.body));
    res.cookie("refreshToken", session.refreshToken, cookieOptions);
    return sendResponse(res, 201, "Registered successfully", { user: session.user, accessToken: session.accessToken });
  };

  login = async (req: Request, res: Response) => {
    const session = await this.authService.login(LoginSchema.parse(req.body));
    res.cookie("refreshToken", session.refreshToken, cookieOptions);
    return sendResponse(res, 200, "Logged in successfully", { user: session.user, accessToken: session.accessToken });
  };

  google = async (req: Request, res: Response) => {
    const session = await this.authService.googleLogin(GoogleLoginSchema.parse(req.body).credential);
    res.cookie("refreshToken", session.refreshToken, cookieOptions);
    return sendResponse(res, 200, "Logged in with Google", { user: session.user, accessToken: session.accessToken });
  };

  forgotPassword = async (req: Request, res: Response) => {
    await this.authService.forgotPassword(ForgotPasswordSchema.parse(req.body));
    return sendResponse(res, 200, "If an account exists with this email, a reset link has been sent.", null);
  };

  resetPassword = async (req: Request, res: Response) => {
    const input = ResetPasswordSchema.parse(req.body);
    await this.authService.resetPassword({ token: input.token, password: input.password });
    return sendResponse(res, 200, "Password reset successfully", null);
  };

  refresh = async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken as string | undefined;
    if (!refreshToken) throw new AppError(401, "Refresh token missing");
    const session = await this.authService.refresh(refreshToken);
    res.cookie("refreshToken", session.refreshToken, cookieOptions);
    return sendResponse(res, 200, "Token refreshed", { user: session.user, accessToken: session.accessToken });
  };

  logout = async (_req: Request, res: Response) => {
    res.clearCookie("refreshToken", cookieOptions);
    return sendResponse(res, 200, "Logged out", null);
  };

  me = async (req: Request, res: Response) => {
    if (!req.user) throw new AppError(401, "Authentication required");
    return sendResponse(res, 200, "Current user", req.user);
  };
}
