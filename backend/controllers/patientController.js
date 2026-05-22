const PatientRecord = require('../models/PatientRecord');

// Create a patient record (Receptionist role action)
exports.registerPatient = async (req, res, next) => {
  try {
    const patient = await PatientRecord.create(req.body);
    res.status(201).json({ success: true, data: patient });
  } catch (error) { next(error); }
};

// Update record dynamically based on clinic routing status
exports.updatePatientWorkflow = async (req, res, next) => {
  try {
    const patient = await PatientRecord.findById(req.params.id);
    if (!patient) {
      res.status(404);
      throw new Error('Medical Record target identity mismatch');
    }

    // Explicit payload property parsing or tracking can go here
    const updatedPatient = await PatientRecord.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.json({ success: true, data: updatedPatient });
  } catch (error) { next(error); }
};

// View all clinical track list
exports.getPatientRecords = async (req, res, next) => {
  try {
    const patients = await PatientRecord.find({});
    res.json({ success: true, count: patients.length, data: patients });
  } catch (error) { next(error); }
};