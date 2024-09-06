import axios from "axios";
import * as cheerio from "cheerio";
import { Request, Response } from "express";
import {
  GMAIL_USER,
  BRIGHT_DATA_PASSWORD,
  BRIGHT_DATA_USERNAME,
  GMAIL_PASSWORD,
  SMTP_SERVICE,
  SMTP_HOST_NAME,
} from "../config";
import ProductModel from "../models/product.model";
import mongoose, { Document, Types } from "mongoose";
import nodemailer from "nodemailer";
import { userModel } from "../models/user.model";

export interface ProductRequest extends Request {
  senderID: string;
  // Add any other custom properties if needed
}
interface UserType {
  email: string;
}
interface PriceHistoryType {
  currentPrice: string;
  originalPrice?: string;
  discount?: string;
  date: Date;
}

interface ProductType extends Document {
  productUrl: string;
  currentPrice: string;
  originalPrice?: string;
  discount?: string;
  title: string;
  priceHistory: PriceHistoryType[];
  user: UserType | Types.ObjectId;
}
const transporter = nodemailer.createTransport({
  service: SMTP_SERVICE,
  host: SMTP_HOST_NAME,
  port: 587,
  secure: false,
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_PASSWORD,
  },
});

export const addProduct = async (req: Request, res: Response) => {
  class Product {
    currentPrice: string;
    currency: string;
    title: string;
    discount: string;
    description: string[];
    stars: string;
    reviewsCount: string;
    category: string;
    image: string;
    isOutOfStock: boolean;
    productUrl: string;
    user: any;

    constructor(
      currentPrice: string,
      currency: string,
      title: string,
      discount: string,
      description: string[],
      stars: string,
      reviewsCount: string,
      category: string,
      image: string,
      isOutOfStock: boolean,
      productUrl: string,
      user: any
    ) {
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

    cleanPrice(priceStr: string) {
      if (priceStr === "") {
        return "0.0";
      }
      return parseFloat(priceStr).toFixed(2);
    }
  }

  class ProductDataPipeline {
    constructor() {}

    async saveToDb(product: any) {
      const data = await ProductModel.create(product);
      return data;
    }

    cleanRawProduct(rawProduct: any) {
      return new Product(
        rawProduct.currentPrice,
        rawProduct.currency,
        rawProduct.title,
        rawProduct.discount,
        rawProduct.description,
        rawProduct.stars,
        rawProduct.reviewsCount,
        rawProduct.category,
        rawProduct.image,
        rawProduct.isOutOfStock,
        rawProduct.productUrl,
        rawProduct.user
      );
    }

    async addProduct(rawProduct: any) {
      const product = this.cleanRawProduct(rawProduct);
      return await this.saveToDb(product);
    }
  }

  try {
    const { url } = req.body;
    const { senderID: userID } = req as ProductRequest;
    const existingProducts = await ProductModel.find({ user: userID });
    const isFirstProduct = existingProducts.length === 0;

    const username = BRIGHT_DATA_USERNAME;
    const password = BRIGHT_DATA_PASSWORD;
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
    const response = await axios.get(url, options);

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
      const outOfStock =
        $("#availability span").text().trim().toLowerCase() ===
        "currently unavailable";
      const images =
        $("#imgBlkFront").attr("data-a-dynamic-image") ||
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
      const user = await userModel.findById(userID);
      const data = await productPipeline.addProduct(rawProduct);
      const mailOptions = {
        from: "Price Spy <raphael.onun@gmail.com>", // Your sender email
        to: user?.email, // The recipient's email
        subject: isFirstProduct
          ? "Welcome to Price Spy!"
          : "You're now tracking a new product!", // Subject based on whether it's the user's first product
        html: isFirstProduct
          ? `Hello ${user?.lastName || "User"},<br/><br/>` + // Personalized greeting if the user's name is available
            `Thank you for joining Price Spy! We're excited to help you track the best deals on your favorite products.<br/><br/>` +
            `You've successfully subscribed to price alerts for <b>${data.title}</b>. We'll keep an eye on the prices and notify you whenever there's a drop.<br/><br/>` +
            `Stay tuned for updates, and happy shopping!<br/><br/>` +
            `Best regards,<br/>` +
            `The Price Spy Team`
          : `Hello ${user?.lastName || "User"},<br/><br/>` +
            `You've added a new product (<b>${data.title}</b>) to your Price Spy watchlist. We'll notify you whenever the price drops.<br/><br/>` +
            `Best regards,<br/>` +
            `The Price Spy Team`, // Sign off based on the product addition
      };

      await transporter.sendMail(mailOptions);
      res.status(200).json({
        success: true,
        msg: "Product added successfully",
        data,
      });
    }
  } catch (error: any) {
    console.log(error?.message);
    res.status(500).json({
      success: false,
      msg: error.message,
    });
  }
};

export const getProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const objectId = new mongoose.Types.ObjectId(id);
    console.log(id);

    const product = await ProductModel.findById(objectId);
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
  } catch (error: any) {
    console.log(error?.message);
    res.status(500).json({
      success: false,
      msg: error.message,
    });
  }
};

export const getProductsHome = async (req: Request, res: Response) => {
  try {
    const products = await ProductModel.find({})
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
    } else {
      res.status(404).json({
        success: false,
        msg: "No products found.",
      });
    }
  } catch (error: any) {
    console.log(error?.message);
    res.status(500).json({
      success: false,
      msg: error.message,
    });
  }
};

export const fetchAndStoreNewPrices = async (req: Request, res: Response) => {
  try {
    const products = await ProductModel.find({}).select(
      "productUrl currentPrice"
    );

    const fetchPromises = products.map(async (product) => {
      const { productUrl } = product;

      const username = BRIGHT_DATA_USERNAME;
      const password = BRIGHT_DATA_PASSWORD;
      const port = 22225;
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

      const response = await axios.get(productUrl, options);

      if (response.status === 200) {
        const html = response.data;
        const $ = cheerio.load(html);
        const newPrice = $(".a-price[data-a-color=base]")
          .text()
          .split("$")
          .filter((_, index) => index === 1)
          .join("");

        if (newPrice) {
          // Store the new price temporarily in a separate field
          await ProductModel.updateOne(
            { _id: product._id },
            { tempNewPrice: newPrice }
          );
        }
      }
    });

    await Promise.all(fetchPromises);

    res.status(200).json({
      success: true,
      message: `Price fetch completed and stored.`,
    });
  } catch (error: any) {
    console.log("Error fetching and storing prices:", error.message);
    res.status(500).json({
      success: false,
      msg: error.message,
    });
  }
};

export const updateProductPrices = async (req: Request, res: Response) => {
  try {
    const products = await ProductModel.find({
      tempNewPrice: { $exists: true },
    }).select("currentPrice tempNewPrice priceHistory discount");

    let updatedProductsCount = 0;

    const updatePromises = products.map(async (product) => {
      const { currentPrice, tempNewPrice } = product;

      if (tempNewPrice && tempNewPrice !== currentPrice) {
        const priceHistory = product.priceHistory || [];
        priceHistory.push({
          currentPrice,
          originalPrice: currentPrice,
          discount: product.discount || "0",
          date: new Date(),
        });

        await ProductModel.updateOne(
          { _id: product._id },
          {
            currentPrice: tempNewPrice,
            priceHistory,
            $unset: { tempNewPrice: 1 }, // Remove the temp field after updating
          }
        );

        updatedProductsCount++;
      }
    });

    await Promise.all(updatePromises);

    res.status(200).json({
      success: true,
      message: `Product prices updated. ${updatedProductsCount} products were updated.`,
    });
  } catch (error: any) {
    console.log("Error updating product prices:", error.message);
    res.status(500).json({
      success: false,
      msg: error.message,
    });
  }
};

export const sendPriceDropNotifications = async (
  req: Request,
  res: Response
) => {
  try {
    const products = await ProductModel.find({}).select(
      "user currentPrice priceHistory title productUrl"
    );

    const emailPromises = products.map(async (product) => {
      const user = await userModel.findById(product.user);

      if (user && product.priceHistory && product.priceHistory.length > 0) {
        const lastPriceEntry =
          product.priceHistory[product.priceHistory.length - 1];
        const previousPrice = lastPriceEntry?.currentPrice;
        const newPrice = product.currentPrice;
        if (!previousPrice) return;
        // Check if the price has dropped
        if (parseFloat(newPrice) < parseFloat(previousPrice)) {
          const mailOptions = {
            from: "Price Spy <raphael.onun@gmail.com>",
            to: user.email,
            subject: "Price Drop Alert",
            text: `The price of ${product.title} has dropped from ${previousPrice} to ${newPrice}. Check it out here: ${product.productUrl}`,
          };

          await transporter.sendMail(mailOptions);
        }
      }
    });

    await Promise.all(emailPromises);

    res.status(200).json({
      success: true,
      message: `Price drop notifications sent.`,
    });
  } catch (error: any) {
    console.log("Error sending notifications:", error.message);
    res.status(500).json({
      success: false,
      msg: error.message,
    });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    const del = await ProductModel.findByIdAndDelete(id);
    return res.status(200).json({
      success: true,
      msg: "Product deleted successfully",
    });
  } catch (error: any) {
    console.log(error.message);
    res.status(500).json({
      success: false,
      msg: error.message,
    });
  }
};
