const mongoose = require("mongoose");

const PatientRecordSchema = new mongoose.Schema(
  {
    cardId: { type: String, required: true, unique: true, trim: true },
    patientName: { type: String, required: true, trim: true },
    firstName: { type: String, trim: true },
    middleName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    age: { type: Number, required: true },
    ageUnit: {
      type: String,
      enum: ["Years", "Months", "Days"],
      default: "Years",
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true,
    },
    bloodGroup: { type: String, trim: true },
    maritalStatus: { type: String, trim: true },
    subCity: { type: String, trim: true },
    woreda: { type: String, trim: true },
    houseNumber: { type: String, trim: true },
    nationality: { type: String, trim: true },
    contactNumber: { type: String, trim: true },
    alternativePhone: { type: String, trim: true },
    emergencyContactName: { type: String, trim: true },
    emergencyContactPhone: { type: String, trim: true },
    guardianFullName: { type: String, trim: true },
    guardianRelationship: { type: String, trim: true },
    guardianPhone: { type: String, trim: true },
    chiefComplaint: { type: String, trim: true },
    admissionType: {
      type: String,
      enum: ["OPD", "IPD", "Emergency", "Referral"],
      default: "OPD",
    },
    paymentType: {
      type: String,
      enum: ["Cash", "Credit/Insurance", "Prepaid", "Other"],
      default: "Cash",
    },
    companyName: { type: String, trim: true },
    policyNumber: { type: String, trim: true },
    referredFrom: { type: String, trim: true },
    registrationTime: { type: String, trim: true },

    // Linear Clinical Path Progression State Tracker
    currentStatus: {
      type: String,
      enum: [
        "Registration",
        "Triage",
        "Consultation",
        "Laboratory",
        "Pharmacy",
        "Billing",
        "Discharged",
      ],
      default: "Registration",
    },

    // Triage parameters checked by Nurses/Receptionists
    triage: {
      bloodPressure: String,
      heartRate: Number,
      temperature: Number,
      respiratoryRate: Number,
      weight: Number,
      randomBloodSugar: Number,
      triageCategory: String,
      secondaryUrgencyNotes: String,
    },

    triageDepartment: { type: String, trim: true },

    // Clinical updates populated by Doctors
    consultation: {
      symptoms: String,
      diagnosis: String,
      doctorNotes: String,
      assignedDoctor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      historyPresentIllness: { type: String, default: "" },
      physicalExamination: { type: String, default: "" },
      icd11Diagnosis: { type: String, default: "" },
      pastMedicalHistory: { type: String, default: "" },
      familyHistory: { type: String, default: "" },
      allergies: { type: String, default: "" },
    },

    // Laboratory module updates
    laboratory: {
      testRequests: [String],
      testResults: mongoose.Schema.Types.Mixed,
      clinicalSummary: { type: String, default: "" },
      labStatus: {
        type: String,
        enum: ["None", "Pending", "Completed"],
        default: "None",
      },
    },

    // Radiology/Ultrasound module updates
    radiology: {
      imagingStatus: { type: String, default: "None" },
      requestedModalities: [String],
      clinicalIndication: { type: String, default: "" },
      urgencyLevel: { 
        type: String, 
        enum: ["Routine", "Urgent", "STAT"], 
        default: "Routine" 
      },
      authorizingPhysician: String,
    },

    // Pharmacy inventory logs
    pharmacy: {
      prescribedDrugs: [String],
      dispenseStatus: {
        type: String,
        enum: ["Pending", "Dispensed"],
        default: "Pending",
      },
    },

    // Financial metrics
    billing: {
      totalCost: { type: Number, default: 0 },
      paymentStatus: {
        type: String,
        enum: ["Unpaid", "Paid"],
        default: "Unpaid",
      },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("PatientRecord", PatientRecordSchema);
