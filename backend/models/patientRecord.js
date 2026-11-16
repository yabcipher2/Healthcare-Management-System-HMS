const mongoose = require("mongoose");

// NOTE: this schema must stay in sync with the fields written by the patient,
// reception, triage, doctor, lab, pharmacy, radiology and ward controllers.
// It previously contained only the old demo fields (name/condition/status), so
// Mongoose silently stripped `currentStatus` and hospital-wide workflow updates
// (e.g. reception sending a patient to triage) became no-ops.
const PatientRecordSchema = new mongoose.Schema(
  {
    cardId: { type: String, trim: true },
    patientName: { type: String, trim: true },

    firstName: { type: String, trim: true, default: "" },
    middleName: { type: String, trim: true, default: "" },
    lastName: { type: String, trim: true, default: "" },

    age: { type: Number },
    ageUnit: { type: String, trim: true, default: "Years" },
    gender: { type: String, trim: true },
    bloodGroup: { type: String, trim: true, default: "" },
    maritalStatus: { type: String, trim: true, default: "" },

    subCity: { type: String, trim: true, default: "" },
    woreda: { type: String, trim: true, default: "" },
    houseNumber: { type: String, trim: true, default: "" },
    nationality: { type: String, trim: true, default: "" },

    contactNumber: { type: String, trim: true, default: "" },
    alternativePhone: { type: String, trim: true, default: "" },

    emergencyContactName: { type: String, trim: true, default: "" },
    emergencyContactPhone: { type: String, trim: true, default: "" },
    guardianFullName: { type: String, trim: true, default: "" },
    guardianRelationship: { type: String, trim: true, default: "" },
    guardianPhone: { type: String, trim: true, default: "" },

    chiefComplaint: { type: String, trim: true, default: "" },
    admissionType: { type: String, trim: true, default: "OPD" },
    paymentType: { type: String, trim: true, default: "Cash" },
    companyName: { type: String, trim: true, default: "" },
    referredFrom: { type: String, trim: true, default: "" },
    registrationTime: { type: String, trim: true, default: "" },

    // Workflow position: Registration -> Triage -> Consultation -> Laboratory /
    // Radiology / Pharmacy -> Billing -> Admitted / Discharged
    currentStatus: { type: String, trim: true, default: "Registration" },
    triageDepartment: { type: String, trim: true, default: "" },

    pastDiagnoses: { type: [mongoose.Schema.Types.Mixed], default: [] },
    // Structured allergy list used by the prescribing safety screen.
    allergyList: { type: [String], default: [] },

    triage: { type: mongoose.Schema.Types.Mixed, default: undefined },
    consultation: { type: mongoose.Schema.Types.Mixed, default: undefined },
    laboratory: { type: mongoose.Schema.Types.Mixed, default: undefined },
    radiology: { type: mongoose.Schema.Types.Mixed, default: undefined },
    pharmacy: { type: mongoose.Schema.Types.Mixed, default: undefined },
    billing: { type: mongoose.Schema.Types.Mixed, default: undefined },

    nurseAccepted: { type: mongoose.Schema.Types.Mixed, default: undefined },
    nurseResponse: { type: mongoose.Schema.Types.Mixed, default: undefined },
    doctorInstructions: { type: mongoose.Schema.Types.Mixed, default: undefined },
    // Ward admission / transfer coordination written by the ward module.
    liaison: { type: mongoose.Schema.Types.Mixed, default: undefined },
  },
  {
    timestamps: true,
    // Keep unknown fields written by department modules instead of dropping them.
    strict: false,
  },
);

module.exports = mongoose.model("PatientRecord", PatientRecordSchema);
