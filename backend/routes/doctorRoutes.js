const express = require("express");
const router = express.Router();

const User = require("../models/User");
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
router.post(
  "/:id/radiology",
  protectRoute,
  authorizeRoles("Doctor", "Administrator"),
  createDoctorRadiologyOrder,
);

router.get("/departments", async (req, res) => {
  try {
    // Looks for all unique 'dept' strings among active Doctors in Staff collection
    const departments = await Staff.distinct("dept", {
      jobTitle: "Doctor",
      contractStatus: "Active",
    });

    const cleanDepartments = departments.filter(Boolean); // removes null or empty items

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

    const activeStaffDoctors = await Staff.find({
      jobTitle: "Doctor",
      contractStatus: "Active",
      dept: { $regex: new RegExp("^" + department + "$", "i") },
    });

    if (!activeStaffDoctors || activeStaffDoctors.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    const staffNames = activeStaffDoctors.map((doctor) => doctor.name);

    const matchingUsers = await User.find({
      role: "Doctor",
      name: { $in: staffNames },
    }).select("_id name email");

    const availablePractitioners = matchingUsers.map((user) => {
      const staffProfile = activeStaffDoctors.find(
        (staff) => staff.name.toLowerCase() === user.name.toLowerCase(),
      );

      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        dept: staffProfile ? staffProfile.dept : department,
        qualification: staffProfile
          ? staffProfile.qualification
          : "Medical Practitioner",
        staffId: staffProfile ? staffProfile.id : null,
      };
    });

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
