import type { Request, Response } from "express";
import { UserUpdateSchema } from "@trip-planner/shared";
import { UserRepository } from "../repositories/user.repository.js";
import { sendResponse } from "../utils/api-response.js";
import { AppError } from "../utils/app-error.js";
import { toUserDto } from "../utils/mappers.js";

export class UserController {
  constructor(private userRepository: UserRepository) {}

  me = async (req: Request, res: Response) => {
    if (!req.user) throw new AppError(401, "Authentication required");
    const user = await this.userRepository.findById(req.user.id);
    if (!user) throw new AppError(404, "User not found");
    return sendResponse(res, 200, "Current user", toUserDto(user));
  };

  updateMe = async (req: Request, res: Response) => {
    if (!req.user) throw new AppError(401, "Authentication required");
    const body = UserUpdateSchema.parse(req.body);
    const user = await this.userRepository.updateById(req.user.id, body);
    if (!user) throw new AppError(404, "User not found");
    return sendResponse(res, 200, "Profile updated", toUserDto(user));
  };
}
