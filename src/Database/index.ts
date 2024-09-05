import mongoose from "mongoose";
import { MONGODB_URI } from "../config";

export const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("App is connected to database");
  } catch (error) {
    console.log("Error connecting to DB", error);
  }
};
