const mongoose = require("mongoose");

const PatientRecordSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Patient name required"],
      trim: true,
    },
    age: { type: Number, required: [true, "Age parameter required"] },
    gender: {
      type: String,
      required: [true, "Gender flag required"],
      enum: ["Male", "Female", "Other"],
    },
    contactInfo: { type: String, trim: true, default: "" },
    regDate: { type: String, trim: true, default: "" },
    insuranceProvider: { type: String, trim: true, default: "" },
    policyNumber: { type: String, trim: true, default: "" },
    condition: {
      type: String,
      required: [true, "Clinical diagnosis required"],
      trim: true,
    },
    treatmentPlan: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: [
        "Admitted",
        "Under Observation",
        "Discharged",
        "Archived",
        "Triage Queue",
      ],
      default: "Under Observation",
    },
    avatarColor: { type: String, default: "bg-slate-500" },
  },
  {
    timestamps: true, // Tracks variations across the timeline entry
  },
);

module.exports = mongoose.model("PatientRecord", PatientRecordSchema);
