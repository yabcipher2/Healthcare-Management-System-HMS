const PatientRecord = require("../models/PatientRecord");

// @desc    Register Patient & Save to DB
// @route   POST /api/patients
const registerPatient = async (req, res) => {
  try {
    const { name, age, gender, condition, treatmentPlan, status } = req.body;
    const newRecord = await PatientRecord.create({
      name,
      age,
      gender,
      condition,
      treatmentPlan,
      status,
    });
    res
      .status(201)
      .json({
        success: true,
        message: "Synchronized to database.",
        data: newRecord,
      });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Fetch Real-time Records for Dashboard Widgets
// @route   GET /api/patients
const fetchRecords = async (req, res) => {
  try {
    const records = await PatientRecord.find({}).sort({ createdAt: -1 });
    res
      .status(200)
      .json({ success: true, count: records.length, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Modify Patient Workflow State
// @route   PUT /api/patients/:id
const modifyWorkflow = async (req, res) => {
  try {
    const updatedRecord = await PatientRecord.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    );
    if (!updatedRecord) {
      return res
        .status(404)
        .json({ success: false, message: "Record not found." });
    }
    res.status(200).json({ success: true, data: updatedRecord });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { registerPatient, fetchRecords, modifyWorkflow };
