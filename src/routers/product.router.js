"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const product_controllers_1 = require("../controllers/product.controllers");
const router = express_1.default.Router();
router.use(auth_middleware_1.authMiddleware);
router.post("/addProduct", product_controllers_1.addProduct);
router.get("/getProduct/:id", product_controllers_1.getProduct);
router.get("/getProductsHome", product_controllers_1.getProductsHome);
router.delete("/delete", product_controllers_1.deleteProduct);
router.post("/cron", product_controllers_1.checkAndUpdatePrices);
exports.default = router;
