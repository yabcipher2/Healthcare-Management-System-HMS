const mongoose = require("mongoose");

const BedSchema = new mongoose.Schema(
  {
    bedId: { type: String, required: true, unique: true },
    room: { type: String, required: true },
    type: { type: String, required: true },
    status: { type: String, enum: ["Occupied", "Available", "Reserved", "Maintenance"], default: "Available" },
    patientName: { type: String, default: "" },
    admissionTime: { type: String, default: "" },
    attendingDoctor: { type: String, default: "" },
    severity: { type: String, default: "" },
    patientCardId: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Bed", BedSchema);
