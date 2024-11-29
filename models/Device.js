import mongoose from "mongoose";

const deviceSchema = new mongoose.Schema({
  productID: {
    type: String,
    required: true,
  },
  action: {
    type: Map,
    of: {
      type: String,
      enum: ["start", "stop"],
      default: "stop",
    },
    default: {},
  },
  active: {
    type: Map,
    of: {
      type: Boolean,
      default: false,
    },
    default: {},
  },
  addedDevices: {
    type: [String],
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

const Device = mongoose.model("Device", deviceSchema);
export default Device;
