const PatientRecord = require("../models/PatientRecord");
const LabOrder = require("../models/LabOrder");
const PharmacyOrder = require("../models/PharmacyOrder");

const getDoctorCases = async (req, res) => {
  try {
    const cases = await PatientRecord.find({
      currentStatus: { $in: ["Triage", "Consultation"] },
    })
      .sort({ updatedAt: -1 })
      .select(
        "cardId patientName firstName middleName lastName age gender triage consultation currentStatus",
      );

    res.status(200).json({ success: true, count: cases.length, data: cases });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const submitConsultation = async (req, res) => {
  try {
    const patient = await PatientRecord.findById(req.params.id);
    if (!patient) {
      return res
        .status(404)
        .json({ success: false, message: "Patient record not found." });
    }

    const {
      historyPresentIllness,
      physicalExamination,
      icd11Diagnosis,
      labRequests,
      prescriptionLines,
    } = req.body;

    const consultationUpdate = {
      symptoms: historyPresentIllness || patient.consultation?.symptoms,
      doctorNotes: physicalExamination || patient.consultation?.doctorNotes,
      diagnosis: icd11Diagnosis || patient.consultation?.diagnosis,
      assignedDoctor: req.user?._id || patient.consultation?.assignedDoctor,
    };

    patient.consultation = consultationUpdate;

    let nextStatus = "Consultation";
    if (Array.isArray(labRequests) && labRequests.length > 0) {
      patient.laboratory = {
        ...(patient.laboratory || {}),
        testRequests: labRequests,
        labStatus: "Pending",
      };
      nextStatus = "Laboratory";

      await LabOrder.create({
        accessionId: `LAB-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        patientCardId: patient.cardId,
        patientName: patient.patientName,
        age: patient.age,
        gender: patient.gender,
        requestedBy: req.user?.name || "Unknown Physician",
        timestamp: new Date().toISOString(),
        urgency: "Routine",
        panels: labRequests,
        specimen: "Pending Specimen",
        linkedPatient: patient._id,
      });
    }

    if (Array.isArray(prescriptionLines) && prescriptionLines.length > 0) {
      patient.pharmacy = {
        ...(patient.pharmacy || {}),
        prescribedDrugs: prescriptionLines,
        dispenseStatus: "Pending",
      };
      if (nextStatus !== "Laboratory") {
        nextStatus = "Pharmacy";
      }

      await PharmacyOrder.create({
        orderId: `RX-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        patientCardId: patient.cardId,
        patientName: patient.patientName,
        age: patient.age,
        doctorName: req.user?.name || "Unknown Physician",
        timestamp: new Date().toISOString(),
        medications: prescriptionLines.map((line) => ({ name: line })),
        linkedPatient: patient._id,
      });
    }

    patient.currentStatus = nextStatus;
    await patient.save();

    res.status(200).json({ success: true, data: patient });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { getDoctorCases, submitConsultation };
