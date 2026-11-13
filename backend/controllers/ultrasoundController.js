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
      "radiology.imagingStatus": { $in: ["Pending Ultrasound Scan", "Pending"] },
    })
      .select(
        "cardId patientName firstName middleName lastName age gender currentStatus radiology",
      )
      .sort({ updatedAt: -1 });

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
    const { reportText, imageUrls = [] } = req.body;

    if (!reportText || !String(reportText).trim()) {
      return res
        .status(400)
        .json({ success: false, message: "A signed report is required." });
    }

    const patient = await PatientRecord.findById(patientId);
    if (!patient) {
      return res
        .status(404)
        .json({ success: false, message: "Patient not found." });
    }

    // Update the radiology object with results and status
    // Images already stored by the upload route stay attached when the report
    // is signed without re-sending them in the JSON body.
    const submittedImages = Array.isArray(imageUrls)
      ? imageUrls.filter((url) => typeof url === "string" && url.trim())
      : [];

    patient.radiology = {
      ...patient.radiology, // Keep existing request details
      reportText: String(reportText).trim(),
      imageUrls: submittedImages.length
        ? submittedImages
        : patient.radiology?.imageUrls || [],
      imagingStatus: "Results Available", // Update status
      resultsTimestamp: new Date().toISOString(),
      releasedBy: req.user?.name || "Radiology Unit",
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

// Attach uploaded stills to the patient's imaging record. Files are already on
// disk (multer storage); this only stores their public URLs.
const uploadUltrasoundImages = async (req, res) => {
  try {
    const files = req.files || [];
    if (files.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Attach at least one scan image." });
    }

    const patient = await PatientRecord.findById(req.params.id);
    if (!patient) {
      return res
        .status(404)
        .json({ success: false, message: "Patient not found." });
    }

    const uploadedUrls = files.map(
      (file) => `/uploads/ultrasound/${file.filename}`,
    );

    // Never mix legacy base64 blobs with disk files in the same record.
    const existing = (patient.radiology?.imageUrls || []).filter(
      (url) => typeof url === "string" && url.startsWith("/uploads/"),
    );

    patient.radiology = {
      ...patient.radiology,
      imageUrls: [...existing, ...uploadedUrls].slice(-12),
      imagingStatus:
        patient.radiology?.imagingStatus || "Pending Ultrasound Scan",
    };
    await patient.save();

    res.status(201).json({
      success: true,
      message: `${uploadedUrls.length} scan image(s) attached.`,
      data: uploadedUrls,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getPendingUltrasoundRequests,
  submitUltrasoundResults,
  uploadUltrasoundImages,
};
