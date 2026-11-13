const express = require("express");
const router = express.Router();

const User = require("../models/User");
const PatientRecord = require("../models/PatientRecord");
const AuditLog = require("../models/AuditLog");
const Staff = require("../models/StaffProfile");
const Appointment = require("../models/Appointment");
const {
  getDoctorCases,
  getDoctorPatient,
  getCompletedEncountersCount,
  getDoctorsByDepartment,
  getAllDepartments,
  submitConsultation,
  getPatientHistory,
  getRecommendedNurse,
  createDoctorLabOrder,
  createDoctorRadiologyOrder,
} = require("../controllers/doctorController");
const { protectRoute, authorizeRoles } = require("../middleware/authMiddleware");
const { logAudit } = require("../controllers/auditController");

router.get(
  "/cases",
  protectRoute,
  authorizeRoles("Doctor", "Administrator"),
  getDoctorCases,
);
router.get(
  "/completed-encounters-count",
  protectRoute,
  authorizeRoles("Doctor", "Administrator"),
  getCompletedEncountersCount,
);
router.get(
  "/patient/:id",
  protectRoute,
  authorizeRoles("Doctor", "Administrator"),
  getDoctorPatient,
);
router.get(
  "/patient/:id/history",
  protectRoute,
  authorizeRoles("Doctor", "Administrator"),
  getPatientHistory,
);
router.get(
  "/patient/:id/recommended-nurse",
  protectRoute,
  authorizeRoles("Doctor", "Administrator"),
  getRecommendedNurse,
);

/**
 * @route   GET /api/doctor/patients/lookup?name=<patient name>
 * @desc    Resolve a registered patient's card ID from their name
 * @access  Private (Doctor, Administrator)
 */
router.get(
  "/patients/lookup",
  protectRoute,
  authorizeRoles("Doctor", "Administrator"),
  async (req, res) => {
    try {
      const name = String(req.query.name || "").trim();
      if (name.length < 2) {
        return res.status(200).json({ success: true, data: [] });
      }

      // Escape the search text so a name cannot be read as a regex pattern.
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      const matches = await PatientRecord.find({
        patientName: { $regex: escaped, $options: "i" },
        cardId: { $nin: [null, ""] },
      })
        .select("cardId patientName firstName middleName lastName age gender currentStatus")
        .sort({ updatedAt: -1 })
        .limit(8);

      return res.status(200).json({ success: true, data: matches });
    } catch (error) {
      console.error("Error looking up patient by name:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  },
);
router.post(
  "/:id/consultation",
  protectRoute,
  authorizeRoles("Doctor", "Administrator"),
  submitConsultation,
);
router.post(
  "/:id/laboratory",
  protectRoute,
  authorizeRoles("Doctor", "Administrator"),
  createDoctorLabOrder,
);

/**
 * @route   POST /api/doctor/lab-results
 * @desc    Laboratory releases finalized results back into the physician EMR
 * @access  Private (Laboratory, Doctor, Administrator)
 */
router.post(
  "/lab-results",
  protectRoute,
  authorizeRoles("Laboratory", "Doctor", "Administrator"),
  async (req, res) => {
    try {
      const { cardId, linkedPatient, resultsLogged, diagnosisReport } = req.body;

      const patient = linkedPatient
        ? await PatientRecord.findById(linkedPatient)
        : cardId
          ? await PatientRecord.findOne({ cardId })
          : null;

      if (!patient) {
        return res.status(404).json({
          success: false,
          message: "Patient record not found for these laboratory results.",
        });
      }

      const laboratory = JSON.parse(JSON.stringify(patient.laboratory || {}));
      patient.laboratory = {
        ...laboratory,
        testResults: resultsLogged || laboratory.testResults || {},
        diagnosisReport: diagnosisReport || laboratory.diagnosisReport || "",
        labStatus: "Completed",
        releasedAt: new Date(),
        releasedBy: req.user?.name || req.user?.email || "Laboratory",
      };
      // Results are back, so the patient returns to the requesting physician.
      patient.currentStatus = "Consultation";
      await patient.save();

      await AuditLog.create({
        action: "UPDATE",
        module: "Laboratory",
        userId: req.user?._id || req.user?.id || "unknown",
        userName: req.user?.name || "Unknown",
        userRole: req.user?.role || "unknown",
        department: req.user?.dept || "",
        targetId: patient._id,
        targetType: "LabOrder",
        details: `Lab results released to physician EMR for ${patient.patientName} (${patient.cardId})`,
        ipAddress: req.ip || "",
      });

      return res.status(200).json({
        success: true,
        message: "Laboratory results released to the physician EMR.",
        data: {
          _id: patient._id,
          patientName: patient.patientName,
          cardId: patient.cardId,
          currentStatus: patient.currentStatus,
          labStatus: patient.laboratory.labStatus,
        },
      });
    } catch (error) {
      console.error("Error releasing lab results to doctor:", error);
      return res.status(400).json({ success: false, message: error.message });
    }
  },
);
router.post(
  "/:id/radiology",
  protectRoute,
  authorizeRoles("Doctor", "Administrator"),
  createDoctorRadiologyOrder,
);

router.get("/departments", async (req, res) => {
  try {
    // Derive the clinic/unit options from the doctor login accounts. The
    // StaffProfile collection is empty in this deployment, so reading it here
    // returned no departments and the triage dispatch dropdown stayed empty.
    const departments = await User.distinct("dept", { role: "Doctor" });

    const cleanDepartments = [
      ...new Set(departments.filter(Boolean).map((dept) => dept.trim())),
    ].sort();

    return res.status(200).json({
      success: true,
      data: cleanDepartments,
    });
  } catch (error) {
    console.error("Error fetching departments:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching departments.",
    });
  }
});

/**
 * @route   GET /api/doctor/doctors/department/:department
 * @desc    Dynamically fetch active doctors by department from Staff data
 * @access  Public/Private
 */
router.get("/doctors/department/:department", async (req, res) => {
  try {
    const { department } = req.params;

    if (!department || department.includes("[object Object]")) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid department parameter" });
    }

    // Resolve physicians from their login accounts (role Doctor + dept).
    // StaffProfile has no records here, which previously produced an empty
    // physician list and blocked the triage -> doctor handoff entirely.
    const escapedDept = department
      .trim()
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const matchingUsers = await User.find({
      role: "Doctor",
      dept: { $regex: new RegExp(`^${escapedDept}$`, "i") },
    }).select("_id name email dept");

    // Login lowercases the email, so only a lowercase-email record can sign in.
    // Collapse duplicates that differ only by letter case (e.g. Haile@doc.com
    // vs haile@doc.com) so triage cannot assign a patient to an unusable twin.
    const byIdentity = new Map();
    for (const user of matchingUsers) {
      const key = (user.email || user.name || user._id.toString()).toLowerCase();
      const loggable = Boolean(user.email) && user.email === user.email.toLowerCase();
      const current = byIdentity.get(key);
      if (!current || (loggable && !current.loggable)) {
        byIdentity.set(key, { user, loggable });
      }
    }

    // Current caseload per physician, so triage can see who is free before
    // handing a patient over. Discharged records are excluded.
    const activeStatuses = [
      "Consultation",
      "Laboratory",
      "Radiology",
      "Pharmacy",
      "Billing",
      "Admitted",
      "Ward",
    ];

    const availablePractitioners = await Promise.all(
      [...byIdentity.values()].map(async ({ user }) => {
        const activePatients = await PatientRecord.countDocuments({
          "consultation.assignedDoctor": {
            $in: [user._id, user._id.toString()],
          },
          currentStatus: { $in: activeStatuses },
        });

        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          dept: user.dept || department,
          qualification: "Medical Practitioner",
          staffId: null,
          activePatients,
          availability:
            activePatients === 0
              ? "Free"
              : activePatients <= 2
                ? "Moderate"
                : "Busy",
        };
      }),
    );

    return res.status(200).json({
      success: true,
      data: availablePractitioners,
    });
  } catch (error) {
    console.error("Error fetching doctors:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// =====================================================
// APPOINTMENT MANAGEMENT ROUTES
// =====================================================

/**
 * @route   GET /api/doctor/appointments
 * @desc    Get all appointments for the logged-in doctor
 * @access  Private (Doctor)
 */
router.get(
  "/appointments",
  protectRoute,
  authorizeRoles("Doctor", "Administrator"),
  async (req, res) => {
    try {
      const doctorId = req.user._id;
      const appointments = await Appointment.find({ doctorId })
        .sort({ appointmentDate: 1, appointmentTime: 1 });
      
      res.status(200).json({
        success: true,
        count: appointments.length,
        data: appointments,
      });
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch appointments",
      });
    }
  }
);

/**
 * @route   POST /api/doctor/appointments
 * @desc    Create a new appointment
 * @access  Private (Doctor)
 */
router.post(
  "/appointments",
  protectRoute,
  authorizeRoles("Doctor", "Administrator"),
  async (req, res) => {
    try {
      const doctorId = req.user._id;
      const appointmentData = {
        ...req.body,
        doctorId,
        createdBy: req.user.name || req.user.email,
      };
      
      const appointment = await Appointment.create(appointmentData);
      
      res.status(201).json({
        success: true,
        data: appointment,
      });
    } catch (error) {
      console.error("Error creating appointment:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to create appointment",
      });
    }
  }
);

/**
 * @route   PUT /api/doctor/appointments/:id
 * @desc    Update an existing appointment
 * @access  Private (Doctor)
 */
router.put(
  "/appointments/:id",
  protectRoute,
  authorizeRoles("Doctor", "Administrator"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const appointment = await Appointment.findById(id);
      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: "Appointment not found",
        });
      }
      
      // Update fields
      Object.keys(updateData).forEach(key => {
        appointment[key] = updateData[key];
      });
      
      await appointment.save();
      
      res.status(200).json({
        success: true,
        data: appointment,
      });
    } catch (error) {
      console.error("Error updating appointment:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to update appointment",
      });
    }
  }
);

/**
 * @route   DELETE /api/doctor/appointments/:id
 * @desc    Delete an appointment
 * @access  Private (Doctor)
 */
router.delete(
  "/appointments/:id",
  protectRoute,
  authorizeRoles("Doctor", "Administrator"),
  async (req, res) => {
    try {
      const { id } = req.params;
      
      const appointment = await Appointment.findByIdAndDelete(id);
      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: "Appointment not found",
        });
      }
      
      res.status(200).json({
        success: true,
        message: "Appointment deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting appointment:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to delete appointment",
      });
    }
  }
);

module.exports = router;
