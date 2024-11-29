import express from "express";
import db from "../server/db/connection.js";
import { ObjectId } from "mongodb";
import { v4 as uuidv4 } from "uuid";
import Product from "../models/Product.js";
import ProductDefinition from "../models/ProductDefinition.js";

const router = express.Router();

//1st EndPoint
// Create Product
router.post("/", async (req, res) => {
  try {
    let newProduct = {
      //   productID: uuidv4(),
      name: req.body.name,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const product = await Product.create(newProduct);
    res.status(201).json(product);
  } catch (error) {
    // console.log("Error creating product:", error);
    console.error("Error creating product:", error);
    res.status(500).json({ error: "Failed to create product" });
  }
});

//5th Endpoint
// Create/Update Product Definition
router.post("/:productID/definition", async (req, res) => {
  try {
    const { productID, productName, components } = req.body;

    // Validate the product ID from URL matches the body
    if (req.params.productID !== productID) {
      return res.status(400).json({ error: "Product ID mismatch" });
    }

    // Validate components structure
    for (const [key, component] of Object.entries(components)) {
      if (component.type !== "sensor") {
        return res.status(400).json({
          error: `Invalid component type for ${key}. Must be 'sensor'`,
          //error: `Invalid component type for ${key}. Must be 'sensor' or 'actuator'`,
        });
      }

      if (component.type === "sensor") {
        if (component.unit === "boolean" && !component.state) {
          return res.status(400).json({
            error: `Boolean sensor ${key} must have state defined`,
          });
        }
        // if (component.unit !== "boolean" && !component.range) {
        //   return res.status(400).json({
        //     error: `Numeric sensor ${key} must have range defined`,
        //   });
        // }
      }
    }

    // Check if definition already exists
    const existingDefinition = await ProductDefinition.findOne({ productID });
    // console.log(existingDefinition);
    if (existingDefinition) {
      // Update existing definition
      await ProductDefinition.updateOne(
        { productID },
        {
          productName,
          components,
          updatedAt: new Date(),
        }
      );
    } else {
      // Create new definition
      await ProductDefinition.create({
        productID,
        productName,
        components,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    res
      .status(200)
      .json({ message: "Product definition updated successfully" });
  } catch (error) {
    console.error("Error updating product definition:", error);
    res.status(500).json({ error: "Failed to update product definition" });
  }
});

// Get All Products
router.get("/", async (req, res) => {
  try {
    let collection = await db.collection("Product");
    let results = await collection.find({}).toArray();
    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// Get Product by ID
router.get("/:productID", async (req, res) => {
  try {
    let collection = await db.collection("Product");
    const productID = req.params.productID;

    let result = await collection.findOne({ productID });

    if (!result) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

//6th Endpoint
// Get Product Definition by Product ID
router.get("/:productID/definition", async (req, res) => {
  try {
    const productID = req.params.productID;

    let result = await ProductDefinition.findOne({ productID });

    if (!result) {
      return res.status(404).json({ error: "Product definition not found" });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching product definition:", error);
    res.status(500).json({ error: "Failed to fetch product definition" });
  }
});

// Update Product
router.patch("/:productID", async (req, res) => {
  try {
    let collection = await db.collection("Product");
    const productID = req.params.productID;

    const updateDocument = {
      name: req.body.name,
      updatedAt: new Date(),
    };

    let result = await collection.updateOne(
      { productID },
      { $set: updateDocument }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.status(200).json({ message: "Product updated successfully" });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ error: "Failed to update product" });
  }
});

// Delete Product and its Definition
router.delete("/:productID", async (req, res) => {
  try {
    const productID = req.params.productID;

    // Delete product
    let productCollection = await db.collection("Product");
    let productResult = await productCollection.deleteOne({ productID });

    // Delete product definition
    let definitionCollection = await db.collection("ProductDefinition");
    await definitionCollection.deleteOne({ productID });

    if (productResult.deletedCount === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res
      .status(200)
      .json({ message: "Product and its definition deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

export default router;
