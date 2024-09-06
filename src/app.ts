import express, { Application, NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { connectDB } from "./Database";
import cors from "cors";
import cookieParser from "cookie-parser";
import { PORT } from "./config";
import authRouter from "./routers/auth.router";
import productRouter from "./routers/product.router";
import {
  fetchAndUpdatePrices,
  sendPriceDropNotifications,
} from "./controllers/product.controllers";

//App begins
const app: Application = express();

app.use(
  cors({
    origin: ["http://localhost:5173", "https://pricespyy.vercel.app"], // Replace with your frontend URL
    credentials: true, // Allow cookies to be sent and received
  })
);

app.use(express.json());
app.use(cookieParser());

//Middlewares
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log("logger", req.method, req.path, req.body, req.params);
  next();
});

app.use((req: Request, res: Response, next: NextFunction) => {
  for (const [key, value] of Object.entries(req.body)) {
    if (value === undefined || value === "") {
      return res.status(400).json({
        success: false,
        msg: `Please enter all inputs correctly. Missing: ${key}`,
      });
    }
  }
  next();
});

app
  .route("/api/product/fetchAndUpdate")
  .get(fetchAndUpdatePrices)
  .post(fetchAndUpdatePrices);
app
  .route("/api/product/sendEmail")
  .get(sendPriceDropNotifications)
  .post(sendPriceDropNotifications);

// Auth and Product routes
app.use("/api/auth", authRouter);
app.use("/api/product", productRouter);

// Home route
app.get("/", (_, res: Response) => {
  res.status(200).json({
    status: "OK",
    msg: "You have hit the home route",
  });
});

app.listen(PORT, () => {
  console.log(`App is listening on ${PORT}`);
  connectDB();
});
