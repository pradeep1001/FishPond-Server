import express from "express";
import db from "../server/db/connection.js";
import Device from "../models/Device.js";
import ProductDefinition from "../models/ProductDefinition.js";

const router = express.Router();

// Update Components (PATCH)
// 7th Endpoint
router.patch("/product/:productID/components", async (req, res) => {
  try {
    const productID = req.params.productID;
    const { updates } = req.body;

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No updates provided" });
    }

    // Get current product definition
    const productDef = await ProductDefinition.findOne({ productID });

    if (!productDef) {
      return res.status(404).json({ error: "Product definition not found" });
    }

    // Prepare the updates object according to schema
    const formattedUpdates = {};
    for (const [key, component] of Object.entries(updates)) {
      // Format the component according to schema
      const formattedComponent = {
        type: component.type || "sensor", // Use provided type or default to sensor
        unit: component.unit || null,
        range:
          component.unit !== "boolean"
            ? {
                min: parseInt(component.range?.split("-")[0]) || 0,
                max: parseInt(component.range?.split("-")[1]) || 100,
              }
            : undefined,
        state: component.unit === "boolean" ? [true, false] : undefined,
        power: component.type === "actuator" ? component.power : undefined,
      };

      formattedUpdates[key] = formattedComponent;
    }

    const existingComponents = Array.from(productDef.components).reduce(
      (obj, [key, value]) => {
        obj[key] = value;
        return obj;
      },
      {}
    );

    // Merge existing components with new updates
    const mergedComponents = {
      ...existingComponents,
      ...formattedUpdates,
    };

    // Update the product definition using $set with merged components
    await ProductDefinition.updateOne(
      { productID },
      {
        $set: {
          components: mergedComponents,
          updatedAt: new Date(),
        },
      }
    );

    res.status(200).json({
      message: "Components updated successfully",
      components: mergedComponents,
    });
  } catch (error) {
    console.error("Error updating components:", error);
    res.status(500).json({ error: "Failed to update components" });
  }
});

// Delete Complete Definition
//8th Endpoint
router.delete("/product/:productID/definition", async (req, res) => {
  try {
    const productID = req.params.productID;
    // const collection = await db.collection("ProductDefinition");

    const result = await ProductDefinition.deleteOne({ productID });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Product definition not found" });
    }

    res.status(200).json({
      message: "Product definition deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting product definition:", error);
    res.status(500).json({ error: "Failed to delete product definition" });
  }
});

//9th Endpoint
// Delete Particular Component
router.delete(
  "/product/:productID/components/:componentName",
  async (req, res) => {
    try {
      const { productID, componentName } = req.params;
      // console.log("componentName is :", componentName);
      // Get current product definition
      const productDef = await ProductDefinition.findOne({ productID });

      if (!productDef) {
        return res.status(404).json({ error: "Product definition not found" });
      }

      // console.log("productDef :", productDef);
      if (!productDef.components.has(componentName)) {
        return res
          .status(404)
          .json({ error: `Component '${componentName}' not found` });
      }

      // Convert Map to object, remove component, and update
      const updatedComponents = Object.fromEntries(productDef.components);
      delete updatedComponents[componentName];

      await ProductDefinition.updateOne(
        { productID },
        {
          $set: {
            components: updatedComponents,
            updatedAt: new Date(),
          },
        }
      );

      res.status(200).json({
        message: `Component '${componentName}' removed successfully`,
      });
    } catch (error) {
      console.error("Error deleting component:", error);
      res.status(500).json({ error: "Failed to delete component" });
    }
  }
);

// Get Components (Helper endpoint)
router.get("/product/:productID/components", async (req, res) => {
  try {
    const productID = req.params.productID;
    // const collection = await db.collection("ProductDefinition");

    const productDef = await ProductDefinition.findOne({ productID });

    if (!productDef) {
      return res.status(404).json({ error: "Product definition not found" });
    }

    res.status(200).json(productDef.components);
  } catch (error) {
    console.error("Error fetching components:", error);
    res.status(500).json({ error: "Failed to fetch components" });
  }
});

export default router;
