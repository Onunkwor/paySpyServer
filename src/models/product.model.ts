import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    productUrl: { type: String, required: true, unique: true },
    currency: { type: String, required: true },
    image: { type: String, required: true },
    title: { type: String, required: true },
    currentPrice: { type: String, required: true },
    originalPrice: { type: String },
    averagePrice: { type: String },
    priceHistory: [
      {
        currentPrice: { type: String },
        originalPrice: { type: String },
        discount: { type: String },
        date: { type: Date, default: Date.now },
      },
    ],
    lowestPrice: { type: String },
    highestPrice: { type: String },
    discount: { type: String },
    description: { type: Array<string> },
    category: { type: String },
    reviewsCount: { type: String },
    stars: { type: String },
    isOutOfStock: { type: Boolean, default: false },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const ProductModel = mongoose.model("Product", productSchema);

export default ProductModel;
