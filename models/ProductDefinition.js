import mongoose from "mongoose";

const componentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["sensor"], // Allow both types
    },
    unit: String,
    range: {
      min: Number,
      max: Number,
    },
    state: [mongoose.Schema.Types.Mixed],
    power: String, // For actuators
  },
  { _id: false }
);

const productDefinitionSchema = new mongoose.Schema({
  productID: {
    type: String,
    required: true,
    unique: true,
  },
  productName: {
    type: String,
    required: true,
  },
  components: {
    type: Map,
    of: componentSchema,
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

const ProductDefinition = mongoose.model(
  "ProductDefinition",
  productDefinitionSchema
);
export default ProductDefinition;
