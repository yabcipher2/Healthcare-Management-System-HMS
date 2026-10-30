const express = require("express");
const router = express.Router();

const User = require("../models/User");
const Staff = require("../models/StaffProfile");
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

module.exports = router;
