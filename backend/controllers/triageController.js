const PatientRecord = require("../models/PatientRecord");

const getQueue = async (req, res) => {
  try {
    const queue = await PatientRecord.find({
      currentStatus: { $in: ["Registration", "Triage"] },
    })
      .sort({ createdAt: -1 })
      .select(
        "cardId patientName firstName middleName lastName age gender chiefComplaint registrationTime currentStatus",
      );

    res.status(200).json({ success: true, count: queue.length, data: queue });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getRedCriticalsToday = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log(`[getRedCriticalsToday] Querying from ${today} to ${tomorrow}`);

    const count = await PatientRecord.countDocuments({
      $or: [
        {
          "triage.triageCategory": { $regex: /Red/i }
        },
        {
          triageCategory: { $regex: /Red/i }
        }
      ],
      updatedAt: { $gte: today, $lt: tomorrow },
    });

    console.log(`[getRedCriticalsToday] Found ${count} red criticals`);

    res.status(200).json({ success: true, count });
  } catch (error) {
    console.error("[getRedCriticalsToday] Error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
};

const getTotalAssessedToday = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log(`[getTotalAssessedToday] Querying from ${today} to ${tomorrow}`);

    const count = await PatientRecord.countDocuments({
      $or: [
        {
          "triage.triageCategory": { $ne: null }
        },
        {
          triageCategory: { $ne: null }
        }
      ],
      updatedAt: { $gte: today, $lt: tomorrow },
    });

    console.log(`[getTotalAssessedToday] Found ${count} assessed patients`);

    res.status(200).json({ success: true, count });
  } catch (error) {
    console.error("[getTotalAssessedToday] Error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
};

const updateTriage = async (req, res) => {
  try {
    const patient = await PatientRecord.findById(req.params.id);
    if (!patient) {
      return res
        .status(404)
        .json({ success: false, message: "Patient record not found." });
    }

    const {
      bpSystolic,
      bpDiastolic,
      heartRate,
      temperature,
      spo2,
      respiratoryRate,
      weight,
      randomBloodSugar,
      secondaryUrgencyNotes,
      triageCategory,
    } = req.body;

    patient.triage = {
      bloodPressure: `${bpSystolic || ""}/${bpDiastolic || ""}`.trim(),
      heartRate: heartRate || patient.triage?.heartRate,
      temperature: temperature || patient.triage?.temperature,
      weight: weight || patient.triage?.weight,
      respiratoryRate: respiratoryRate || patient.triage?.respiratoryRate,
      randomBloodSugar: randomBloodSugar || patient.triage?.randomBloodSugar,
      triageCategory:
        triageCategory ||
        patient.triage?.triageCategory ||
        "Green (Non-Urgent)",
      secondaryUrgencyNotes:
        secondaryUrgencyNotes || patient.triage?.secondaryUrgencyNotes,
    };

    patient.currentStatus = "Consultation";
    await patient.save();

    res.status(200).json({ success: true, data: patient });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const dispatchTriagePatient = async (req, res) => {
  try {
    const patient = await PatientRecord.findById(req.params.id);
    if (!patient) {
      return res
        .status(404)
        .json({ success: false, message: "Patient record not found." });
    }

    const {
      bpSystolic,
      bpDiastolic,
      heartRate,
      temperature,
      spo2,
      respiratoryRate,
      weight,
      randomBloodSugar,
      secondaryUrgencyNotes,
      triageCategory,
      department,
      doctorId,
      dispatchedBy,
      dispatchedAt,
    } = req.body;

    // Update vitals/triage data
    patient.triage = {
      bloodPressure: `${bpSystolic || ""}/${bpDiastolic || ""}`.trim(),
      heartRate: heartRate || patient.triage?.heartRate,
      temperature: temperature || patient.triage?.temperature,
      weight: weight || patient.triage?.weight,
      respiratoryRate: respiratoryRate || patient.triage?.respiratoryRate,
      randomBloodSugar: randomBloodSugar || patient.triage?.randomBloodSugar,
      triageCategory:
        triageCategory ||
        patient.triage?.triageCategory ||
        "Green (Non-Urgent)",
      secondaryUrgencyNotes:
        secondaryUrgencyNotes || patient.triage?.secondaryUrgencyNotes,
    };

    // Set the patient to consultation status and assign to the selected doctor
    patient.currentStatus = "Consultation";
    // Ensure consultation object exists
    if (!patient.consultation) {
      patient.consultation = {};
    }
    patient.consultation.assignedDoctor = doctorId;

    await patient.save();

    res.status(200).json({ success: true, data: patient });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { getQueue, getRedCriticalsToday, getTotalAssessedToday, updateTriage, dispatchTriagePatient };
