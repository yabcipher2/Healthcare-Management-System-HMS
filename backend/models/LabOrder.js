const mongoose = require("mongoose");

const LabOrderSchema = new mongoose.Schema(
  {
    accessionId: { type: String, required: true, unique: true },
    patientCardId: { type: String, required: true, trim: true },
    patientName: { type: String, required: true, trim: true },
    age: { type: Number },
    gender: { type: String, trim: true },
    requestedBy: { type: String, trim: true },
    timestamp: { type: String, trim: true },
    urgency: { type: String, default: "Routine", trim: true },
    panels: [{ type: String, trim: true }],
    specimen: { type: String, trim: true },
    results: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Completed"],
      default: "Pending",
    },
    linkedPatient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PatientRecord",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("LabOrder", LabOrderSchema);
