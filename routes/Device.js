import express from "express";
import db from "../server/db/connection.js";
import { v4 as uuidv4 } from "uuid";
import Device from "../models/Device.js";
import Product from "../models/Product.js";

const router = express.Router();

// Create Devices for the already existing Product
// If you want to add devices again for the already existing Product, use "PUT" method
//2nd EndPoint
router.post("/product/:productID/devices", async (req, res) => {
  try {
    const productID = req.params.productID;
    const { deviceCount } = req.body;

    if (!deviceCount || deviceCount < 1) {
      return res.status(400).json({ error: "Invalid device count" });
    }

    // Check if devices exist for the product
    const deviceExists = await Device.findOne({ productID });
    if (deviceExists) {
      return res
        .status(500)
        .json({ error: "Cannot add devices for the same product" });
    }

    // Check if the product exists
    const productExists = await Product.findById(productID);
    if (!productExists) {
      return res.status(404).json({ error: "Product not found" });
    }

    const addedDevices = [];
    const actionMap = {};
    const activeMap = {};

    // Create specified number of devices
    for (let i = 0; i < deviceCount; i++) {
      const deviceID = uuidv4();
      addedDevices.push(deviceID);
      actionMap[deviceID] = "stop";
      activeMap[deviceID] = false;
    }

    const device = await Device.create({
      productID,
      action: actionMap,
      active: activeMap,
      createdAt: new Date(),
      updatedAt: new Date(),
      addedDevices,
    });

    res.status(200).json({ addedDevices });
  } catch (error) {
    console.error("Error creating devices:", error);
    res.status(500).json({ error: "Failed to create devices" });
  }
});

// Updating the device count to the already existing Product
router.put("/product/:productID/devices", async (req, res) => {
  try {
    const productID = req.params.productID;
    const { deviceCount } = req.body;
    if (!deviceCount || deviceCount < 1) {
      return res.status(400).json({ error: "Invalid device count" });
    }

    // Check if the product exists in the product table
    const productExists = await Product.findById(productID);
    if (!productExists) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Check if the device exists in the Device collection
    const deviceExists = await Device.findOne({ productID });
    if (!deviceExists) {
      return res.status(404).json({ error: "Device not found" });
    }

    const alreadyExistingDevices = await Device.find(
      { productID: productID },
      { addedDevices: 1, _id: 0 }
    );

    let addedDevices = [];
    for (let i in alreadyExistingDevices) {
      addedDevices.push(alreadyExistingDevices[i]);
    }

    // Create specified number of devices
    for (let i = 0; i < deviceCount; i++) {
      const deviceID = uuidv4();
      addedDevices.push(deviceID);
      actionMap[deviceID] = "stop";
      activeMap[deviceID] = false;
    }

    const updatedDevice = await Device.findOneAndUpdate(
      { productID },
      {
        productID,
        action: actionMap,
        active: activeMap,
        updatedAt: new Date(),
        addedDevices,
      },
      { new: true }
    );

    res.status(200).json({ device: updatedDevice });
  } catch (error) {
    console.log();
    console.error("Error updating devices:", error);
    res.status(500).json({ error: "Failed to update devices" });
  }
});

//3rd Endpoint
// Control Devices (Start/Stop)
router.post("/product/:productID/devices/control", async (req, res) => {
  try {
    const productID = req.params.productID;
    const { devices } = req.body;

    if (!Array.isArray(devices)) {
      return res.status(400).json({ error: "Invalid devices array" });
    }

    const updatedDevices = [];
    const notFoundDevices = [];

    // Get the deviceList document
    const deviceDoc = await Device.findOne({
      productID,
    });

    // Check if document exists and has addedDevices array
    if (!deviceDoc || !Array.isArray(deviceDoc.addedDevices)) {
      throw new Error(
        "Product with this productID does not exist or has no devices"
      );
    }

    // Convert Maps to regular objects
    const alreadyExistingActions = Object.fromEntries(deviceDoc.action);
    const alreadyExistingActives = Object.fromEntries(deviceDoc.active);

    // console.log("alreadyExistingActions is:", alreadyExistingActions);
    // console.log("alreadyExistingActives is:", alreadyExistingActives);

    // Create update objects for action and active
    const actionUpdates = {};
    const activeUpdates = {};

    for (const device of devices) {
      const { deviceID, action } = device;

      if (!["start", "stop"].includes(action)) {
        continue; // Skip invalid actions
      }

      const isDeviceInList = deviceDoc.addedDevices.includes(deviceID);

      if (!isDeviceInList) {
        notFoundDevices.push(deviceID);
        continue;
      }

      // Add to update objects
      actionUpdates[deviceID] = action;
      activeUpdates[deviceID] = action === "start" ? true : false;
      updatedDevices.push({ deviceID, action });
    }

    // Preserve existing values for devices not being updated
    deviceDoc.addedDevices.forEach((deviceID) => {
      if (!actionUpdates[deviceID]) {
        actionUpdates[deviceID] = alreadyExistingActions[deviceID];
        activeUpdates[deviceID] = alreadyExistingActives[deviceID];
      }
    });

    // Perform the update
    await Device.updateOne(
      { productID },
      {
        $set: {
          action: actionUpdates,
          active: activeUpdates,
          updatedAt: new Date(),
        },
      }
    );

    res.status(200).json({
      message: "Device control operation completed",
      updatedDevices,
      notFoundDevices,
    });
  } catch (error) {
    console.log("Error controlling devices:", error);
    res.status(500).json({ error: "Failed to control devices" });
  }
});

//4th Endpoint
// Check Running Devices
router.post("/devices/running", async (req, res) => {
  try {
    const { productID } = req.body;

    if (!productID) {
      return res.status(400).json({ error: "Product ID is required" });
    }

    const deviceDoc = await Device.findOne({ productID });

    if (!deviceDoc) {
      return res.status(404).json({ error: "Device not found" });
    }

    // Convert active object to array and filter true values

    const runningDeviceIds = Array.from(deviceDoc.active.keys()).filter(
      (deviceId) => deviceDoc.active.get(deviceId) === true
    );

    res.status(200).json({
      status: "success",
      runningDevicesCount: runningDeviceIds.length,
      runningDevices: runningDeviceIds.map((deviceId) => ({
        deviceID: deviceId,
        active: deviceDoc.active[deviceId],
        action: deviceDoc.action[deviceId],
      })),
    });
  } catch (error) {
    console.error("Error checking running devices:", error);
    res.status(500).json({ error: "Failed to check running devices" });
  }
});

// Additional helpful endpoints

// Get All Devices for a Product
router.get("/product/:productID/devices", async (req, res) => {
  try {
    const productID = req.params.productID;

    const devices = await Device.find({ productID });

    res.status(200).json(devices);
  } catch (error) {
    console.error("Error fetching devices:", error);
    res.status(500).json({ error: "Failed to fetch devices" });
  }
});

// Get Device by ID
router.get("/devices/:deviceID", async (req, res) => {
  try {
    const deviceID = req.params.deviceID;
    // const deviceCollection = await db.collection("Device");

    const device = await Device.findOne({ deviceID });

    if (!device) {
      return res.status(404).json({ error: "Device not found" });
    }

    res.status(200).json(device);
  } catch (error) {
    console.error("Error fetching device:", error);
    res.status(500).json({ error: "Failed to fetch device" });
  }
});

export default router;
