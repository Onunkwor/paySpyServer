"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.getRefreshToken = exports.signup = void 0;
const validator_1 = __importDefault(require("validator"));
const user_model_1 = require("../models/user.model");
const encryption_1 = require("../helpers/encryption");
const config_1 = require("../config");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const signup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { firstName, lastName, email, password, confirmPassword, phoneNumber, username, } = req.body;
        const passwordIsStrong = validator_1.default.isStrongPassword(password, {
            minLength: 5,
            pointsForContainingSymbol: 0,
            pointsForContainingUpper: 0,
        });
        const emailIsValid = validator_1.default.isEmail(email);
        if (!passwordIsStrong || !emailIsValid) {
            return res.status(400).json({
                success: false,
                msg: "Either password is not strong enough or email is invalid",
            });
        }
        const userExists = yield user_model_1.userModel.findOne({ email: email });
        if (userExists) {
            return res.status(400).json({
                success: false,
                msg: "User already exists!",
            });
        }
        const profilePic = `https://avatar.iran.liara.run/public/boy?username=${username}`;
        const newUser = yield user_model_1.userModel.create({
            firstName,
            lastName,
            email,
            profilePicture: profilePic,
            phoneNumber,
            username,
            password: (0, encryption_1.hashPassword)(password),
            completedProfile: true,
        });
        const { accessToken } = (0, encryption_1.generateJwtToken)(res, { email: newUser.email }, { _id: newUser._id }, { username });
        return res.status(201).json({
            msg: "User created successfully",
            success: true,
            accessToken,
        });
    }
    catch (error) {
        console.error(error === null || error === void 0 ? void 0 : error.message);
        res.status(500).json({
            success: false,
            msg: error === null || error === void 0 ? void 0 : error.message,
        });
    }
});
exports.signup = signup;
const getRefreshToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { refreshToken } = req.cookies;
        if (!refreshToken) {
            return res.status(403).json({
                msg: "Refresh token missing",
                success: false,
            });
        }
        const { _id } = jsonwebtoken_1.default.verify(refreshToken, config_1.JWT_REFRESH_SECRET);
        const user = yield user_model_1.userModel.findById(_id);
        if (!user || user.refreshToken !== refreshToken) {
            return res.status(403).json({
                msg: "Log out at this point",
                success: false,
            });
        }
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = (0, encryption_1.generateJwtToken)(res, { _id: user._id });
        user.refreshToken = newRefreshToken;
        yield user.save();
        return res.status(200).json({
            msg: "Token successfully refreshed",
            success: true,
            accessToken: newAccessToken,
        });
    }
    catch (error) {
        console.error(error === null || error === void 0 ? void 0 : error.message);
        res.status(500).json({
            success: false,
            msg: error === null || error === void 0 ? void 0 : error.message,
        });
    }
});
exports.getRefreshToken = getRefreshToken;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        const user = yield user_model_1.userModel.findOne({
            email: email,
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                msg: "User not found",
            });
        }
        const passwordMatch = (0, encryption_1.confirmPassword)(password, user.password || "");
        if (!passwordMatch) {
            return res.status(400).json({
                success: false,
                msg: "Invalid credentials",
            });
        }
        const { accessToken, refreshToken } = (0, encryption_1.generateJwtToken)(res, { email: user.email }, { _id: user._id }, { username: user.username });
        user.refreshToken = refreshToken;
        yield user.save();
        return res.status(200).json({
            success: true,
            msg: `Welcome ${user.firstName}`,
            accessToken,
        });
    }
    catch (error) {
        console.error(error === null || error === void 0 ? void 0 : error.message);
        res.status(500).json({
            success: false,
            msg: error === null || error === void 0 ? void 0 : error.message,
        });
    }
});
exports.login = login;
