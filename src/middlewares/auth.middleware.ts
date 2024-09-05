import { Request, Response, NextFunction } from "express";
import jsonwebtoken from "jsonwebtoken";
import { JWT_SECRET } from "../config";

export const authMiddleware = async (
  req: Request | any,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(" ")[1] as string;

    const { _id, username }: any = jsonwebtoken.verify(token, JWT_SECRET);

    if (!_id) {
      return res.status(401).json({
        success: false,
        msg: "Unauthorized",
      });
    }

    req.senderID = _id;
    req.username = username;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      msg: "Unauthorized",
    });
  }
};
