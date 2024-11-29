import express from "express";
import db from "../server/db/connection.js";
import Product from "../models/Product.js";
import Device from "../models/Device.js";
import ProductDefinition from "../models/ProductDefinition.js";
import DevicesRunning from "../models/DevicesRunning.js";

const router = express.Router();
//10th Endpoint
router.post("/generate_data", async (req, res) => {
  //console.log("Endpoint hit with body:", req.body);
  try {
    const { productID } = req.body;

    const deviceDoc = await Device.findOne({ productID });

    const productDoc = await Product.findById(productID);
    if (!deviceDoc) {
      return res.status(404).json({
        error:
          "This Product has no devices or it has not been registered in the devices collection",
      });
    }

    if (!productDoc) {
      return res.status(404).json({ error: "This Product does not exist" });
    }

    const productName = productDoc.name;

    const runningDevices = Array.from(deviceDoc.active.entries())
      .filter(([_, isActive]) => isActive)
      .map(([deviceId]) => deviceId);

    if (runningDevices.length === 0) {
      return res.status(404).json({ error: "No running devices found" });
    }

    const deviceStatuses = runningDevices.map((deviceId) => ({
      deviceId,
      status: "start",
      timestamp: new Date(),
    }));

    await DevicesRunning.findOneAndUpdate(
      { productID },
      {
        $set: { productName }, // Use $set to update productName
        $push: {
          devices: {
            $each: deviceStatuses,
          },
        },
      },
      { upsert: true, new: true }
    );

    res.status(200).json({ message: "Data generated successfully" });
  } catch (error) {
    console.log("Error generating data:", error);
    console.error("Error generating data:", error);
    res.status(500).json({ error: "Failed to generate data" });
  }
});

//11th Endpoint
router.post("/get_data", async (req, res) => {
  try {
    const { productID } = req.body;

    const data = await DevicesRunning.findOne({
      productID,
      "devices.status": "start",
    }).select("devices");

    console.log("data is:", data);

    if (!data || !data.devices || data.devices.length === 0) {
      return res
        .status(404)
        .json({ error: "No running devices found for this product" });
    }

    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching running devices:", error);
    res.status(500).json({ error: "Failed to fetch running devices" });
  }
});

export default router;
