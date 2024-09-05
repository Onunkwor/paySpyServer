import { Request, Response } from "express";
import validator from "validator";
import { userModel } from "../models/user.model";
import {
  confirmPassword,
  generateJwtToken,
  hashPassword,
} from "../helpers/encryption";
import { JWT_REFRESH_SECRET } from "../config";
import jsonwebtoken from "jsonwebtoken";
type signupDataType = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber?: string;
};
export const signup = async (req: Request, res: Response) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      phoneNumber,
      username,
    }: signupDataType = req.body;
    const passwordIsStrong = validator.isStrongPassword(password, {
      minLength: 5,
      pointsForContainingSymbol: 0,
      pointsForContainingUpper: 0,
    });
    const emailIsValid = validator.isEmail(email);
    if (!passwordIsStrong || !emailIsValid) {
      return res.status(400).json({
        success: false,
        msg: "Either password is not strong enough or email is invalid",
      });
    }
    const userExists = await userModel.findOne({ email: email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        msg: "User already exists!",
      });
    }
    const profilePic = `https://avatar.iran.liara.run/public/boy?username=${username}`;
    const newUser = await userModel.create({
      firstName,
      lastName,
      email,
      profilePicture: profilePic,
      phoneNumber,
      username,
      password: hashPassword(password),
      completedProfile: true,
    });
    const { accessToken } = generateJwtToken(
      res,
      { email: newUser.email },
      { _id: newUser._id },
      { username }
    );

    return res.status(201).json({
      msg: "User created successfully",
      success: true,
      accessToken,
    });
  } catch (error: any) {
    console.error(error?.message);
    res.status(500).json({
      success: false,
      msg: error?.message,
    });
  }
};

export const getRefreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      return res.status(403).json({
        msg: "Refresh token missing",
        success: false,
      });
    }
    const { _id } = jsonwebtoken.verify(
      refreshToken,
      JWT_REFRESH_SECRET
    ) as any;
    const user = await userModel.findById(_id);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({
        msg: "Log out at this point",
        success: false,
      });
    }
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      generateJwtToken(res, { _id: user._id });
    user.refreshToken = newRefreshToken;

    await user.save();
    return res.status(200).json({
      msg: "Token successfully refreshed",
      success: true,
      accessToken: newAccessToken,
    });
  } catch (error: any) {
    console.error(error?.message);
    res.status(500).json({
      success: false,
      msg: error?.message,
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password }: { email?: string; password: string } = req.body;
    const user = await userModel.findOne({
      email: email,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        msg: "User not found",
      });
    }
    const passwordMatch = confirmPassword(password, user.password || "");

    if (!passwordMatch) {
      return res.status(400).json({
        success: false,
        msg: "Invalid credentials",
      });
    }
    const { accessToken, refreshToken } = generateJwtToken(
      res,
      { email: user.email },
      { _id: user._id },
      { username: user.username }
    );
    user.refreshToken = refreshToken;

    await user.save();

    return res.status(200).json({
      success: true,
      msg: `Welcome ${user.firstName}`,
      accessToken,
    });
  } catch (error: any) {
    console.error(error?.message);
    res.status(500).json({
      success: false,
      msg: error?.message,
    });
  }
};
