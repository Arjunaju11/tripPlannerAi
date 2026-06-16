import { Schema, Types, model, type HydratedDocument, type InferSchemaType } from "mongoose";

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String },
    googleId: { type: String },
    avatar: { type: String },
    authProvider: { type: String, enum: ["local", "google"], required: true },
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date }
  },
  { timestamps: true }
);

export type UserDocument = HydratedDocument<InferSchemaType<typeof UserSchema> & { _id: Types.ObjectId }>;
export const UserModel = model("User", UserSchema);
