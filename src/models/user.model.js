"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const userSchema = new mongoose_1.default.Schema({
    username: {
        type: String,
        unique: true,
    },
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    phoneNumber: {
        type: String,
    },
    password: {
        type: String,
        minlength: 6,
    },
    profilePicture: {
        type: String,
        default: "",
    },
    completedProfile: {
        type: Boolean,
        default: false,
    },
    refreshToken: {
        type: String,
    },
}, {
    timestamps: true,
});
exports.userModel = mongoose_1.default.model("User", userSchema);
