import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
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
  },
  {
    timestamps: true,
  }
);

export const userModel = mongoose.model("User", userSchema);
