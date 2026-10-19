const mongoose = require("mongoose");

const LabAgentSchema = new mongoose.Schema(
  {
    agentId: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, enum: ["Reagent", "Equipment", "Consumable", "Diagnostic Kit"], required: true },
    manufacturer: { type: String, trim: true, default: "" },
    location: { type: String, trim: true, default: "" },
    quantity: { type: Number, default: 0 },
    unit: { type: String, default: "units" },
    minThreshold: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["In Stock", "Low Stock", "Out of Stock", "Expired"],
      default: "In Stock",
    },
    expiryDate: { type: String, default: "" },
    labSection: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LabAgent", LabAgentSchema);
