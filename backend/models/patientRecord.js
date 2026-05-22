const mongoose = require('mongoose');

const PatientRecordSchema = new mongoose.Schema({
  patientName: { type: String, required: true, trim: true },
  age: { type: Number, required: true },
  gender: { type: String, enum: ['Male', 'Female'], required: true },
  contactNumber: { type: String, required: true },
  
  // Linear Clinical Path Progression State Tracker
  currentStatus: { 
    type: String, 
    enum: ['Registration', 'Triage', 'Consultation', 'Laboratory', 'Pharmacy', 'Billing', 'Discharged'],
    default: 'Registration'
  },
  
  // Triage parameters checked by Nurses/Receptionists
  triage: {
    bloodPressure: String,
    heartRate: Number,
    temperature: Number,
    weight: Number
  },
  
  // Clinical updates populated by Doctors
  consultation: {
    symptoms: String,
    diagnosis: String,
    doctorNotes: String,
    assignedDoctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  
  // Laboratory module updates
  laboratory: {
    testRequests: [String],
    testResults: String,
    labStatus: { type: String, enum: ['None', 'Pending', 'Completed'], default: 'None' }
  },
  
  // Pharmacy inventory logs
  pharmacy: {
    prescribedDrugs: [String],
    dispenseStatus: { type: String, enum: ['Pending', 'Dispensed'], default: 'Pending' }
  },
  
  // Financial metrics
  billing: {
    totalCost: { type: Number, default: 0 },
    paymentStatus: { type: String, enum: ['Unpaid', 'Paid'], default: 'Unpaid' }
  }
}, { timestamps: true });

module.exports = mongoose.model('PatientRecord', PatientRecordSchema);