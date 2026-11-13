const mongoose = require("mongoose");

const diagnosisSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PatientRecord",
    required: true,
  },
  patientMrn: { type: String, required: true, index: true },
  doctorName: { type: String, required: true },

  // Snapshot of triage vitals at the time of consultation
  triageSnapshot: {
    bloodPressure: String,
    heartRate: Number,
    temperature: Number,
    respiratoryRate: Number,
    weight: Number,
    spo2: String,
    triageCategory: String,
  },

  // Subjective & Objective Documentation
  hpi: { type: String, required: true },
  physicalExamination: { type: String },
  pastMedicalHistory: { type: String },
  familyHistory: { type: String },
  allergies: { type: String },

  // Assessment
  icd11Diagnosis: { type: String, required: true },

  // Associated Requests & Results Snapshots
  labResultsSnapshot: mongoose.Schema.Types.Mixed,
  labRequests: [{ type: String }],
  prescriptions: [
    {
      name: String,
      dosage: String,
      frequency: String,
      duration: String,
    },
  ],
  radiologyRequest: {
    region: String,
    // A single encounter can request several imaging protocols.
    regions: [{ type: String }],
    indication: String,
    urgency: String,
    reportText: String,
    imageUrls: [{ type: String }],
  },

  // Nurse Coordination Snapshot
  nurseData: {
    assignedNurseId: { type: String },
    assignedNurseName: { type: String },
    doctorInstructions: { type: String },
    carePlan: { type: String },
    status: { type: String },
    nurseResponse: { type: String },
  },

  // Liaison & Admission Snapshot
  liaisonData: {
    preferredWard: { type: String },
    admissionUrgency: { type: String },
    clinicalReason: { type: String },
    admissionDate: { type: String },
    dischargeDate: { type: String },
    medicationIntake: { type: String },
  },

  // Transfer/Referral Snapshot
  transferData: {
    targetFacility: { type: String },
    clinicalReason: { type: String },
    admissionUrgency: { type: String },
  },

  timestamp: { type: Date, default: Date.now },
});

// Ensure we can query by MRN efficiently for history lookups
diagnosisSchema.index({ patientMrn: 1, timestamp: -1 });

module.exports = mongoose.model("Diagnosis", diagnosisSchema);
