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
router.post("/cron", checkAndUpdatePrices);

router.use(authMiddleware);
router.post("/addProduct", addProduct);
router.get("/getProduct/:id", getProduct);
router.get("/getProductsHome", getProductsHome);
router.delete("/delete", deleteProduct);
export default router;
