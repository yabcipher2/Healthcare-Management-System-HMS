const mongoose = require("mongoose");

const AdmissionRequestSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PatientRecord",
      required: true,
    },
    patientName: { type: String, required: true, trim: true },
    cardId: { type: String, required: true, trim: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true },
    doctorName: { type: String, required: true, trim: true },
    preferredWard: { type: String, default: "General Ward", trim: true },
    admissionUrgency: {
      type: String,
      enum: ["Routine", "Priority", "Emergent"],
      default: "Routine",
    },
    clinicalReason: { type: String, required: true, trim: true },
    admissionDate: { type: String, default: "" },
    dischargeDate: { type: String, default: "" },
    medicationIntake: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Pending", "Assigned", "Cancelled"],
      default: "Pending",
    },
    assignedBed: { type: mongoose.Schema.Types.ObjectId, ref: "Bed" },
    assignedAt: { type: Date },
  },
  { timestamps: true },
);

AdmissionRequestSchema.index({ patientId: 1, status: 1 });

module.exports = mongoose.model("AdmissionRequest", AdmissionRequestSchema);
