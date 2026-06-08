const NurseAssignment = require("../models/NurseAssignment");
const PatientRecord = require("../models/PatientRecord");

const getAssignments = async (req, res) => {
  try {
    const assignments = await NurseAssignment.find({}).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: assignments.length, data: assignments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createAssignment = async (req, res) => {
  try {
    const { patientId, cardId, patientName, age, gender, assignedStation, assignedDoctor, status, carePlan, vitals, assignedBy } = req.body;

    const existing = await NurseAssignment.findOne({ patientId });
    if (existing) {
      return res.status(400).json({ success: false, message: "Patient already assigned to a nurse." });
    }

    const assignment = await NurseAssignment.create({
      patientId,
      cardId,
      patientName,
      age,
      gender,
      assignedStation,
      assignedDoctor,
      status,
      carePlan,
      vitals,
      assignedBy,
    });

    if (patientId) {
      await PatientRecord.findByIdAndUpdate(patientId, { currentStatus: "Consultation" });
    }

    res.status(201).json({ success: true, data: assignment });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateNurseNotes = async (req, res) => {
  try {
    const { nurseNotes, medicationAdministered } = req.body;
    const assignment = await NurseAssignment.findByIdAndUpdate(
      req.params.id,
      { nurseNotes, medicationAdministered },
      { returnDocument: "after", runValidators: true }
    );
    if (!assignment) return res.status(404).json({ success: false, message: "Assignment not found." });
    res.status(200).json({ success: true, data: assignment });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateCareStatus = async (req, res) => {
  try {
    const { careStatusUpdate } = req.body;
    const assignment = await NurseAssignment.findByIdAndUpdate(
      req.params.id,
      { status: careStatusUpdate },
      { returnDocument: "after", runValidators: true }
    );
    if (!assignment) return res.status(404).json({ success: false, message: "Assignment not found." });
    res.status(200).json({ success: true, data: assignment });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { getAssignments, createAssignment, updateNurseNotes, updateCareStatus };
