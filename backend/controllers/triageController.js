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

module.exports = { getQueue, updateTriage };
