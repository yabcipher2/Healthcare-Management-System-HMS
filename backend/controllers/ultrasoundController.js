const PatientRecord = require("../models/PatientRecord");
const AuditLog = require("../models/AuditLog");

const logAudit = async (
  req,
  action,
  module,
  details,
  targetId = "",
  targetType = "PatientRecord",
) => {
  try {
    await AuditLog.create({
      action,
      module,
      userId: req.user?._id || req.user?.id || "unknown",
      userName: req.user?.name || "Unknown",
      userRole: req.user?.role || "unknown",
      department: req.user?.dept || "",
      targetId: targetId || "",
      targetType,
      details: details || "",
      ipAddress: req.ip || "",
    });
  } catch (err) {
    console.error("Audit log failed:", err.message);
  }
};

const getPendingUltrasoundRequests = async (req, res) => {
  try {
    // Find patient records that have a radiology request with imagingStatus "Pending Ultrasound Scan"
    const pendingRequests = await PatientRecord.find({
      "radiology.imagingStatus": "Pending Ultrasound Scan",
    }).select(
      "cardId patientName firstName middleName lastName age gender radiology",
    );

    res
      .status(200)
      .json({
        success: true,
        count: pendingRequests.length,
        data: pendingRequests,
      });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const submitUltrasoundResults = async (req, res) => {
  try {
    const patientId = req.params.id;
    const { reportText, imageUrls } = req.body;

    const patient = await PatientRecord.findById(patientId);
    if (!patient) {
      return res
        .status(404)
        .json({ success: false, message: "Patient not found." });
    }

    // Update the radiology object with results and status
    patient.radiology = {
      ...patient.radiology, // Keep existing request details
      reportText: reportText,
      imageUrls: imageUrls,
      imagingStatus: "Results Available", // Update status
      resultsTimestamp: new Date().toISOString(),
    };
    patient.currentStatus = "Consultation"; // Return to doctor for review

    await patient.save();

    await logAudit(
      req,
      "UPDATE",
      "Ultrasound",
      `Ultrasound results submitted for patient ${patient.patientName} (${patient.cardId})`,
      patient._id,
    );

    res
      .status(200)
      .json({
        success: true,
        message: "Ultrasound results submitted successfully.",
        data: patient,
      });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getPendingUltrasoundRequests,
  submitUltrasoundResults,
};
