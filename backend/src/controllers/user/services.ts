import { Request } from "express";
import { createHash } from "crypto";
import jwt from "jsonwebtoken";
import User, { UserDocument } from "@models/user/user";
import { OperationalError } from "@utils/error/errorInstances";
import { comparehash, hashString } from "@utils/helper/bcrypt";
import { MESSAGES, STATUS_CODES } from "@src/constants";
import { getGoogleOAuthToken } from "./helper";

export type PublicUser = {
  _id: string;
  name: string;
  email: string;
  userType: UserDocument["userType"];
};

const toPublicUser = (user: {
  _id: unknown;
  name: string;
  email: string;
  userType: UserDocument["userType"];
}): PublicUser => ({
  _id: String(user._id),
  name: user.name,
  email: user.email,
  userType: user.userType,
});

export const login = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<PublicUser> => {
  const findUser = await User.findOne({ email })
    .select("name email password userType")
    .lean()
    .exec();

  // Same message for unknown email and wrong password (API_CONTRACT §2).
  if (!findUser) {
    throw new OperationalError(
      STATUS_CODES.AUTH_FAILED,
      MESSAGES.invalidCredentials
    );
  }

  const comparePassword = await comparehash(password, findUser.password);

  if (!comparePassword) {
    throw new OperationalError(
      STATUS_CODES.AUTH_FAILED,
      MESSAGES.invalidCredentials
    );
  }

  return toPublicUser(findUser);
};

export const getUserById = async (userId: string): Promise<PublicUser> => {
  const findUser = await User.findById(userId)
    .select("name email userType")
    .lean()
    .exec();

  if (!findUser) {
    throw new OperationalError(STATUS_CODES.AUTH_FAILED, MESSAGES.invalidToken);
  }

  return toPublicUser(findUser);
};

// --- Google OAuth / password reset ------------------------------------
// Kept but intentionally NOT wired into any router (see routes/authRoutes.ts):
// out of scope for this phase and not part of API_CONTRACT. Left in place
// for a future phase.
export const loginWithGoogle = async (code: string, _req: Request) => {
  const data = await getGoogleOAuthToken({ code });
  const { id_token } = data;

  const googleUser = jwt.decode(id_token) as any;

  if (!googleUser?.email_verified) {
    throw new OperationalError(
      STATUS_CODES.AUTH_FAILED,
      "Email id not verified"
    );
  }

  const user = await User.findOne({ email: googleUser?.email });

  if (!user) {
    throw new OperationalError(
      STATUS_CODES.NOT_FOUND,
      "No account found for this Google email. Please register first."
    );
  }

  if (!user.googleId) {
    const upDatedUser = await User.findOneAndUpdate(
      { email: googleUser.email },
      { googleId: googleUser.sub },
      { new: true }
    );

    if (!upDatedUser)
      throw new OperationalError(STATUS_CODES.ACTION_FAILED, "Unable to login");

    return toPublicUser(upDatedUser);
  }

  return toPublicUser(user);
};

export const forgotPassword = async (email: string) => {
  const findUser = await User.findOne({ email });

  if (!findUser) {
    throw new OperationalError(STATUS_CODES.NOT_FOUND, "User Not Found !");
  }

  const resetToken = findUser.createResetPasswordToken();
  await findUser.save();

  const resetURL = `${process.env.FRONT_END_URL}/resetPassword/${resetToken}`;

  const options = {
    name: findUser.name,
    email: findUser.email,
    resetUrl: resetURL,
  };

  // await emailHelper.sendPasswordResetEmail(options);

  return { message: "Password reset link sent to your email" };
};

export const resetPassword = async (token: string, newPassword: string) => {
  const encryptedToken = createHash("sha256").update(token).digest("hex");

  const findUser = await User.findOne({
    passwordResetToken: encryptedToken,
    passwordResetTokenExpire: { $gt: new Date() },
  });

  if (!findUser) {
    throw new OperationalError(
      STATUS_CODES.ACTION_FAILED,
      MESSAGES.invalidToken
    );
  }

  findUser.password = await hashString(newPassword);
  findUser.passwordResetToken = undefined;
  findUser.passwordResetTokenExpire = undefined;

  await findUser.save();

  return "Password Reset Successfully";
};
