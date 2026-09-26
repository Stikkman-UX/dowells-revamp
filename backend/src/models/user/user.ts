import crypto from "crypto";
import { Schema, Document, model } from "mongoose";
import * as interfaces from "./interface";

export interface IUser
  extends interfaces.IUserInterface,
    interfaces.IUserMethods,
    Document {}

export type UserDocument = Document & IUser & interfaces.IUserMethods;

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    profilePic: { type: String, required: false },

    password: { type: String, required: true, default: "" },
    googleId: { type: String, required: false, default: "" },

    userType: {
      type: String,
      required: true,
      enum: Object.values(interfaces.EUserType),
      default: interfaces.EUserType.Moderator,
    },

    passwordResetToken: { type: String, required: false },
    passwordResetTokenExpire: { type: Date, required: false },
  },
  { timestamps: true }
);

userSchema.methods.createResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetTokenExpire = Date.now() + 1000 * 60 * 10; // 10mins from now

  return resetToken;
};

userSchema.index({ email: 1 }, { unique: true });

const User = model<IUser>("User", userSchema);

export default User;
