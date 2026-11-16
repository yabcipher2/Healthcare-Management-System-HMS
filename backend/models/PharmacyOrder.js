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
    quantity: { type: Number, default: 1 },
    price: { type: Number, default: 0 },
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
    paymentStatus: {
      type: String,
      enum: ["Unpaid", "Paid"],
      default: "Unpaid",
    },
    paymentMethod: { type: String, trim: true },
    referenceNumber: { type: String, trim: true },
    totalAmount: { type: Number, default: 0 },
    paidAt: { type: Date },
    // Set by the pharmacy cashier desk, read by the pharmacist before dispense.
    cashierStatus: {
      type: String,
      enum: ["UNPAID", "PAID"],
      default: "UNPAID",
    },
    amountPaid: { type: Number, default: 0 },
    linkedPatient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PatientRecord",
    },
    // Output of the drug-interaction / allergy screen at prescribing time.
    // The pharmacist sees these alerts (and the doctor's override reason)
    // before dispensing.
    interactionAlerts: { type: [mongoose.Schema.Types.Mixed], default: [] },
    overrideReason: { type: String, trim: true, default: "" },
    interactionCheckedAt: { type: Date },
  },
  { timestamps: true },
);

module.exports = mongoose.model("PharmacyOrder", PharmacyOrderSchema);
