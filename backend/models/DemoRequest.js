const mongoose = require("mongoose");

const DemoRequestSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    clinicName: { type: String, trim: true },
    message: { type: String, trim: true },
    status: {
      type: String,
      enum: ["new", "contacted", "scheduled", "completed"],
      default: "new",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DemoRequest", DemoRequestSchema);
