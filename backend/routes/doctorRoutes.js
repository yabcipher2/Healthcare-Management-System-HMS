const express = require("express");
const router = express.Router();
const {
  getDoctorCases,
  submitConsultation,
  getCompletedEncountersCount,
  getDoctorPatient,
  getDoctorsByDepartment,
  dispatchToDoctor,
  getAllDepartments,
} = require("../controllers/doctorController");
const {
  protectRoute,
  authorizeRoles,
} = require("../middleware/authMiddleware");

router.get(
  "/cases",
  protectRoute,
  authorizeRoles("Doctor", "Administrator"),
  getDoctorCases,
);
router.get(
  "/patient/:id",
  protectRoute,
  authorizeRoles("Doctor", "Administrator"),
  getDoctorPatient,
);
router.get(
  "/departments",
  protectRoute,
  authorizeRoles("Doctor", "Pharmacist", "Administrator", "Triage", "Nurse"),
  getAllDepartments,
);
router.get(
  "/doctors/department/:department",
  protectRoute,
  authorizeRoles("Doctor", "Pharmacist", "Administrator", "Triage"),
  getDoctorsByDepartment,
);
router.post(
  "/dispatch",
  protectRoute,
  authorizeRoles("Pharmacist", "Administrator"),
  dispatchToDoctor,
);
router.post(
  "/:id/consultation",
  protectRoute,
  authorizeRoles("Doctor", "Administrator"),
  submitConsultation,
);
router.get(
  "/completed-encounters-count",
  protectRoute,
  authorizeRoles("Doctor", "Administrator"),
  getCompletedEncountersCount,
);

module.exports = router;
