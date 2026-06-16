import type { NextFunction, Request, Response } from "express";
import { UserRepository } from "../repositories/user.repository.js";
import { TokenService } from "../services/token.service.js";
import { AppError } from "../utils/app-error.js";
import { toUserDto } from "../utils/mappers.js";

const tokenService = new TokenService();
const userRepository = new UserRepository();

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
    if (!token) throw new AppError(401, "Authentication required");
    const payload = tokenService.verifyAccessToken(token);
    const user = await userRepository.findById(payload.sub);
    if (!user) throw new AppError(401, "Authentication required");
    req.user = toUserDto(user);
    next();
  } catch (error) {
    next(error instanceof AppError ? error : new AppError(401, "Authentication required"));
  }
}
