export enum EUserType {
  Admin = "Admin",
  Moderator = "Moderator",
}

export interface IUserInterface {
  name: string;
  email: string;
  profilePic?: string;

  password: string;
  googleId?: string;

  userType: EUserType;

  passwordResetToken?: string;
  passwordResetTokenExpire?: Date;
}

export interface IUserMethods {
  createResetPasswordToken(): string;
}
