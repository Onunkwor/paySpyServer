"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const productSchema = new mongoose_1.default.Schema({
    productUrl: { type: String, required: true, unique: true },
    currency: { type: String, required: true },
    image: { type: String, required: true },
    title: { type: String, required: true },
    currentPrice: { type: String, required: true },
    priceHistory: [
        {
            currentPrice: { type: String },
            originalPrice: { type: String },
            discount: { type: String },
            date: { type: Date, default: Date.now },
        },
    ],
    discount: { type: String },
    description: { type: (Array) },
    category: { type: String },
    reviewsCount: { type: String },
    stars: { type: String },
    isOutOfStock: { type: Boolean, default: false },
    user: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });
const ProductModel = mongoose_1.default.model("Product", productSchema);
exports.default = ProductModel;
