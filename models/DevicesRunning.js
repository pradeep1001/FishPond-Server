import mongoose from "mongoose";

const deviceStatusSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["start", "stop"],
    default: "start",
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
  },
});

const devicesRunningSchema = new mongoose.Schema(
  {
    productID: {
      type: String,
      required: true,
      index: true,
    },
    productName: {
      type: String,
      required: true,
    },
    devices: [deviceStatusSchema],
  },
  {
    timestamps: true,
  }
);

const DevicesRunning = mongoose.model("DevicesRunning", devicesRunningSchema);
export default DevicesRunning;
