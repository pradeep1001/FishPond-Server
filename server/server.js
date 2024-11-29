import express from "express";
import cors from "cors";
import product from "../routes/Product.js";
import device from "../routes/Device.js";
import component from "../routes/Component.js";
import devicesRunning from "../routes/DevicesRunning.js";
import connectDB from "./db/connection.js";

const PORT = process.env.PORT || 5050;
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

// Routes
app.use("/product", product);
app.use("/", device);
app.use("/", component);
app.use("/", devicesRunning);

// Start server

const start_app = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port: ${PORT}`);
    });
  } catch (error) {
    console.log("error connecting to DB", error);
  }
};

start_app();
