const mongoose = require("mongoose");

const StoreItemSchema = new mongoose.Schema(
  {
    itemId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    type: { type: String, enum: ["medicines", "non-medicines", "supplies"], required: true },
    stock: { type: Number, default: 0 },
    unit: { type: String, default: "units" },
    minThreshold: { type: Number, default: 0 },
    shelfLocation: { type: String, default: "" },
    status: { type: String, enum: ["In Stock", "Low Stock", "Out of Stock"], default: "In Stock" },
    batch: { type: String, default: "" },
    expiryDate: { type: String, default: "" },
    category: { type: String, default: "" },
    supplier: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("StoreItem", StoreItemSchema);
