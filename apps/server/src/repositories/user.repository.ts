import type { IUserRepository } from "../interfaces/repositories.js";
import { UserModel } from "../models/user.model.js";

export class UserRepository implements IUserRepository {
  create(input: Parameters<IUserRepository["create"]>[0]) {
    return UserModel.create(input);
  }

  findByEmail(email: string) {
    return UserModel.findOne({ email: email.toLowerCase() });
  }

  findById(id: string) {
    return UserModel.findById(id);
  }

  updateById(id: string, input: Parameters<IUserRepository["updateById"]>[1]) {
    return UserModel.findByIdAndUpdate(id, input, { new: true });
  }

  setPasswordResetToken(id: string, tokenHash: string, expiresAt: Date) {
    return UserModel.findByIdAndUpdate(
      id,
      { passwordResetToken: tokenHash, passwordResetExpires: expiresAt },
      { new: true }
    );
  }

  findByPasswordResetToken(tokenHash: string, now: Date) {
    return UserModel.findOne({ passwordResetToken: tokenHash, passwordResetExpires: { $gt: now } });
  }

  clearPasswordReset(id: string) {
    return UserModel.findByIdAndUpdate(id, { $unset: { passwordResetToken: "", passwordResetExpires: "" } }, { new: true });
  }

  updatePasswordAndClearReset(id: string, password: string) {
    return UserModel.findByIdAndUpdate(
      id,
      { password, $unset: { passwordResetToken: "", passwordResetExpires: "" } },
      { new: true }
    );
  }
}
