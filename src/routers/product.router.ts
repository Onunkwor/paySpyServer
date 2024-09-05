import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import {
  addProduct,
  checkAndUpdatePrices,
  deleteProduct,
  getProduct,
  getProductsHome,
} from "../controllers/product.controllers";

const router = express.Router();
router.use(authMiddleware);
router.post("/addProduct", addProduct);
router.get("/getProduct/:id", getProduct);
router.get("/getProductsHome", getProductsHome);
router.delete("/delete", deleteProduct);
router.post("/cron", checkAndUpdatePrices);
export default router;
