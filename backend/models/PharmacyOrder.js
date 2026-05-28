const mongoose = require("mongoose");

const MedicineLineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    formulation: { type: String, trim: true },
    strength: { type: String, trim: true },
    dosage: { type: String, trim: true },
    frequency: { type: String, trim: true },
    duration: { type: String, trim: true },
    quantityRequired: { type: Number, default: 0 },
  },
  { _id: false },
);

const PharmacyOrderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true },
    patientCardId: { type: String, required: true, trim: true },
    patientName: { type: String, required: true, trim: true },
    age: { type: Number },
    doctorName: { type: String, trim: true },
    timestamp: { type: String, trim: true },
    status: {
      type: String,
      enum: ["Pending", "Dispensed", "Cancelled"],
      default: "Pending",
    },
    medications: [MedicineLineSchema],
    dispenseStatus: {
      type: String,
      enum: ["Pending", "Dispensed"],
      default: "Pending",
    },
    linkedPatient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PatientRecord",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("PharmacyOrder", PharmacyOrderSchema);
