import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  // productID: {
  //     type: String,
  //     required: true,
  //     unique: true
  // },
  name: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Product = mongoose.model("Product", productSchema);
export default Product;
