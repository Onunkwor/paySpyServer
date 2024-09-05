import express from "express";
import {
  getRefreshToken,
  login,
  signup,
} from "../controllers/auth.controllers";
const router = express.Router();
router.post("/signup", signup);
router.post("/login", login);
router.post("/refresh", getRefreshToken);
export default router;
