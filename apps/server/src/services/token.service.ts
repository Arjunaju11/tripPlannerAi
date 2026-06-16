import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export class TokenService {
  signAccessToken(userId: string) {
    return jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: "15m" });
  }

  signRefreshToken(userId: string) {
    return jwt.sign({ sub: userId }, env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
  }

  verifyAccessToken(token: string) {
    return jwt.verify(token, env.JWT_SECRET) as { sub: string };
  }

  verifyRefreshToken(token: string) {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as { sub: string };
  }
}
