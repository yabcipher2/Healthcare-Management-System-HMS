const mongoose = require("mongoose");

const NurseAssignmentSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "PatientRecord", required: true },
    cardId: { type: String, required: true },
    patientName: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true },
    assignedStation: { type: String, required: true },
    assignedDoctor: { type: String, default: "" },
    status: { type: String, default: "Pending Meds" },
    carePlan: { type: String, default: "" },
    medicationAdministered: { type: Boolean, default: false },
    nurseNotes: { type: String, default: "" },
    triageCategory: { type: String, default: "" },
    vitals: {
      bp: { type: String, default: "" },
      pr: { type: String, default: "" },
      temp: { type: String, default: "" },
      spo2: { type: String, default: "" },
    },
    assignedBy: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("NurseAssignment", NurseAssignmentSchema);
