"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmPassword = exports.generateJwtToken = exports.hashPassword = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const hashPassword = (password) => {
    try {
        const salt = bcryptjs_1.default.genSaltSync(10);
        return bcryptjs_1.default.hashSync(password, salt);
    }
    catch (error) {
        throw error;
    }
};
exports.hashPassword = hashPassword;
const generateJwtToken = (res, ...rest) => {
    try {
        const accessToken = jsonwebtoken_1.default.sign(Object.assign({}, ...rest), config_1.JWT_SECRET, {
            expiresIn: "1hr",
        });
        const refreshToken = jsonwebtoken_1.default.sign(Object.assign({}, ...rest), config_1.JWT_REFRESH_SECRET, {
            expiresIn: "1d",
        });
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true, // only accessible via http and prevent xss attach
            maxAge: 24 * 60 * 60 * 1000, //1 day
            sameSite: "strict", // prevent csfr attach
            secure: true, //NODE_ENV === "production"
        });
        return { accessToken, refreshToken };
    }
    catch (error) {
        throw error;
    }
};
exports.generateJwtToken = generateJwtToken;
const confirmPassword = (password, passwordHash) => {
    try {
        return bcryptjs_1.default.compareSync(password, passwordHash);
    }
    catch (error) {
        throw error;
    }
};
exports.confirmPassword = confirmPassword;
