const mongoose = require("mongoose");

const MedicineStockSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    formulation: { type: String, trim: true },
    strength: { type: String, trim: true },
    batch: { type: String, trim: true },
    stock: { type: Number, default: 0 },
    minLevel: { type: Number, default: 0 },
    shelf: { type: String, trim: true },
    price: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["In Stock", "Low Stock", "Out of Stock"],
      default: "In Stock",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("MedicineStock", MedicineStockSchema);
