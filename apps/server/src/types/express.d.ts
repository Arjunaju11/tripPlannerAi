import type { UserDto } from "@trip-planner/shared";

declare global {
  namespace Express {
    interface Request {
      user?: UserDto;
      uploadId?: string;
    }
  }
}
