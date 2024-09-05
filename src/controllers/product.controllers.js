"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProduct = exports.checkAndUpdatePrices = exports.getProductsHome = exports.getProduct = exports.addProduct = void 0;
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const config_1 = require("../config");
const product_model_1 = __importDefault(require("../models/product.model"));
const mongoose_1 = __importDefault(require("mongoose"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const user_model_1 = require("../models/user.model");
const transporter = nodemailer_1.default.createTransport({
    service: config_1.SMTP_SERVICE,
    host: config_1.SMTP_HOST_NAME,
    port: 587,
    secure: false,
    auth: {
        user: config_1.GMAIL_USER,
        pass: config_1.GMAIL_PASSWORD,
    },
});
const addProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    class Product {
        constructor(currentPrice, currency, title, discount, description, stars, reviewsCount, category, image, isOutOfStock, productUrl, user) {
            this.title = title;
            this.currency = currency;
            this.currentPrice = this.cleanPrice(currentPrice);
            this.discount = discount;
            this.description = description;
            this.stars = stars;
            this.reviewsCount = reviewsCount;
            this.category = category;
            this.image = image;
            this.isOutOfStock = isOutOfStock;
            this.productUrl = productUrl;
            this.user = user;
        }
        cleanPrice(priceStr) {
            if (priceStr === "") {
                return "0.0";
            }
            return parseFloat(priceStr).toFixed(2);
        }
    }
    class ProductDataPipeline {
        constructor() { }
        saveToDb(product) {
            return __awaiter(this, void 0, void 0, function* () {
                const data = yield product_model_1.default.create(product);
                return data;
            });
        }
        cleanRawProduct(rawProduct) {
            return new Product(rawProduct.currentPrice, rawProduct.currency, rawProduct.title, rawProduct.discount, rawProduct.description, rawProduct.stars, rawProduct.reviewsCount, rawProduct.category, rawProduct.image, rawProduct.isOutOfStock, rawProduct.productUrl, rawProduct.user);
        }
        addProduct(rawProduct) {
            return __awaiter(this, void 0, void 0, function* () {
                const product = this.cleanRawProduct(rawProduct);
                return yield this.saveToDb(product);
            });
        }
    }
    try {
        const { url } = req.body;
        const { senderID: userID } = req;
        const existingProducts = yield product_model_1.default.find({ user: userID });
        const isFirstProduct = existingProducts.length === 0;
        const username = config_1.BRIGHT_DATA_USERNAME;
        const password = config_1.BRIGHT_DATA_PASSWORD;
        const port = 2225;
        const session_id = (1000000 * Math.random()) | 0;
        const options = {
            auth: {
                username: `${username}-session-${session_id}`,
                password,
            },
            host: "brd.superproxy.io",
            port,
            rejectUnauthorized: false,
        };
        const response = yield axios_1.default.get(url, options);
        if (response.status == 200) {
            const html = response.data;
            const $ = cheerio.load(html);
            const title = $("#productTitle").text().trim();
            const price = $(".a-price[data-a-color=base]")
                .text()
                .split("$")
                .filter((_, index) => index == 1)
                .join("");
            const discount = $(".savingPriceOverride").text();
            const outOfStock = $("#availability span").text().trim().toLowerCase() ===
                "currently unavailable";
            const images = $("#imgBlkFront").attr("data-a-dynamic-image") ||
                $("#landingImage").attr("data-a-dynamic-image") ||
                "{}";
            const imageUrls = Object.keys(JSON.parse(images));
            const category = $("span.a-list-item a.a-link-normal.a-color-tertiary")
                .text()
                .trim()
                .replace(/[\n+]/g, "")
                .split(/\s{2,}/)
                .filter((word) => word.trim() !== "")
                .slice(-2)
                .join("");
            const reviewsCount = $("#acrCustomerReviewText")
                .text()
                .trim()
                .replace(/[,]/g, "")
                .split(" ")
                .slice(0, 1)
                .join("");
            const stars = $('[data-hook="rating-out-of-text"]')
                .text()
                .trim()
                .split(" ")
                .slice(0, 1)
                .join("");
            const description = $("#feature-bullets")
                .text()
                .trim()
                .replace(/[n]/g, "")
                .split(/\s{2,}/)
                .slice(1)
                .filter((desc) => desc !== "Show more");
            const productPipeline = new ProductDataPipeline();
            const rawProduct = {
                title,
                currentPrice: price,
                currency: "USD",
                discount,
                description,
                stars,
                reviewsCount,
                category,
                image: imageUrls[0],
                isOutOfStock: outOfStock,
                productUrl: url,
                user: userID,
            };
            const user = yield user_model_1.userModel.findById(userID);
            const data = yield productPipeline.addProduct(rawProduct);
            const mailOptions = {
                from: "Price Spy <raphael.onun@gmail.com>", // Your sender email
                to: user === null || user === void 0 ? void 0 : user.email, // The recipient's email
                subject: isFirstProduct
                    ? "Welcome to Price Spy!"
                    : "You're now tracking a new product!", // Subject based on whether it's the user's first product
                html: isFirstProduct
                    ? `Hello ${(user === null || user === void 0 ? void 0 : user.lastName) || "User"},<br/><br/>` + // Personalized greeting if the user's name is available
                        `Thank you for joining Price Spy! We're excited to help you track the best deals on your favorite products.<br/><br/>` +
                        `You've successfully subscribed to price alerts for <b>${data.title}</b>. We'll keep an eye on the prices and notify you whenever there's a drop.<br/><br/>` +
                        `Stay tuned for updates, and happy shopping!<br/><br/>` +
                        `Best regards,<br/>` +
                        `The Price Spy Team`
                    : `Hello ${(user === null || user === void 0 ? void 0 : user.lastName) || "User"},<br/><br/>` +
                        `You've added a new product (<b>${data.title}</b>) to your Price Spy watchlist. We'll notify you whenever the price drops.<br/><br/>` +
                        `Best regards,<br/>` +
                        `The Price Spy Team`, // Sign off based on the product addition
            };
            yield transporter.sendMail(mailOptions);
            res.status(200).json({
                success: true,
                msg: "Product added successfully",
                data,
            });
        }
    }
    catch (error) {
        console.log(error === null || error === void 0 ? void 0 : error.message);
        res.status(500).json({
            success: false,
            msg: error.message,
        });
    }
});
exports.addProduct = addProduct;
const getProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const objectId = new mongoose_1.default.Types.ObjectId(id);
        console.log(id);
        const product = yield product_model_1.default.findById(objectId);
        if (!product) {
            return res.status(404).json({
                success: false,
                msg: "Product Not found",
            });
        }
        return res.status(200).json({
            success: true,
            msg: "Product found successfully",
            data: product,
        });
    }
    catch (error) {
        console.log(error === null || error === void 0 ? void 0 : error.message);
        res.status(500).json({
            success: false,
            msg: error.message,
        });
    }
});
exports.getProduct = getProduct;
const getProductsHome = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const products = yield product_model_1.default.find({})
            .select("title image currency currentPrice category")
            .lean(); // Convert the result to plain JavaScript objects
        console.log(products);
        if (products.length > 0) {
            // Check if products were found
            res.status(200).json({
                success: true,
                msg: "Products found!",
                data: products,
            });
        }
        else {
            res.status(404).json({
                success: false,
                msg: "No products found.",
            });
        }
    }
    catch (error) {
        console.log(error === null || error === void 0 ? void 0 : error.message);
        res.status(500).json({
            success: false,
            msg: error.message,
        });
    }
});
exports.getProductsHome = getProductsHome;
const checkAndUpdatePrices = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const products = (yield product_model_1.default.find({}).populate({
            path: "user",
            model: user_model_1.userModel,
        }));
        for (const product of products) {
            const { productUrl, currentPrice } = product;
            // Fetch the latest price from the product URL
            const username = config_1.BRIGHT_DATA_USERNAME;
            const password = config_1.BRIGHT_DATA_PASSWORD;
            const port = 2225;
            const session_id = (1000000 * Math.random()) | 0;
            const options = {
                auth: {
                    username: `${username}-session-${session_id}`,
                    password,
                },
                host: "brd.superproxy.io",
                port,
                rejectUnauthorized: false,
            };
            const response = yield axios_1.default.get(productUrl, options);
            if (response.status == 200) {
                const html = response.data;
                const $ = cheerio.load(html);
                const newPrice = $(".a-price[data-a-color=base]")
                    .text()
                    .split("$")
                    .filter((_, index) => index == 1)
                    .join("");
                // Check if the price has changed
                if (newPrice && newPrice !== currentPrice) {
                    // Update the price history
                    const priceHistory = product.priceHistory || [];
                    priceHistory.push({
                        currentPrice: currentPrice,
                        originalPrice: product.originalPrice || currentPrice,
                        discount: product.discount || "0",
                        date: new Date(),
                    });
                    // Update the product with the new price and price history
                    yield product_model_1.default.findByIdAndUpdate(product._id, {
                        currentPrice: newPrice,
                        priceHistory,
                    });
                    const userEmail = product.user.email;
                    // Send an email if the price is reduced
                    if (parseFloat(newPrice) < parseFloat(currentPrice)) {
                        const mailOptions = {
                            from: "Price Spy '<raphael.onun@gmail.com>'",
                            to: userEmail,
                            subject: "Price Drop Alert",
                            text: `The price of ${product.title} has dropped from ${currentPrice} to ${newPrice}. Check it out here: ${productUrl}`,
                        };
                        yield transporter.sendMail(mailOptions);
                    }
                }
            }
        }
    }
    catch (error) {
        console.log("Error updating prices:", error.message);
        res.status(500).json({
            success: false,
            msg: error.message,
        });
    }
});
exports.checkAndUpdatePrices = checkAndUpdatePrices;
const deleteProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.body;
        const del = yield product_model_1.default.findByIdAndDelete(id);
        return res.status(200).json({
            success: true,
            msg: "Product deleted successfully",
        });
    }
    catch (error) {
        console.log(error.message);
        res.status(500).json({
            success: false,
            msg: error.message,
        });
    }
});
exports.deleteProduct = deleteProduct;
