import express, { Application, NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { connectDB } from "./Database";
import cors from "cors";
import cookieParser from "cookie-parser";
import { PORT } from "./config";
import authRouter from "./routers/auth.router";
import productRouter from "./routers/product.router";
//App begins
const app: Application = express();

app.use(
  cors({
    origin: ["http://localhost:5173"], // Replace with your frontend URL
    credentials: true, // Allow cookies to be sent and received
  })
);

app.use(express.json());
app.use(cookieParser());

//Middlewares
//logger

app.use(async (req: Request, res: Response, next: NextFunction) => {
  console.log("logger", req.method, req.path, req.body, req.params);

  next();
});

app.use(async (req: Request, res: Response, next: NextFunction) => {
  let canProgress = true;
  let undefinedKey = "";

  Promise.all(
    Object.entries(req.body).map(([key, value]) => {
      if (value === undefined || value === "") {
        canProgress = false;
        undefinedKey = key;
        return res.status(400).json({
          success: canProgress,
          msg: `Please enter all inputs correctly ${undefinedKey}`,
        });
      }
    })
  );

  next();
});
app.use("/api/auth", authRouter);
app.use("/api/product", productRouter);
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
