const express = require("express");
const router = express.Router();
const {
  getAssignments,
  createAssignment,
  updateNurseNotes,
  updateCareStatus,
  updateDoctorObservation,
  updateNurseResponse,
} = require("../controllers/nurseController");
const { protectRoute, authorizeRoles } = require("../middleware/authMiddleware");

router.get("/", protectRoute, authorizeRoles("Triage", "Nurse", "Administrator"), getAssignments);
router.get("/assignments", protectRoute, authorizeRoles("Triage", "Nurse", "Administrator"), getAssignments);
router.post("/", protectRoute, authorizeRoles("Doctor", "Administrator"), createAssignment);
router.put("/:id/notes", protectRoute, authorizeRoles("Triage", "Nurse", "Administrator"), updateNurseNotes);
router.put("/:id/status", protectRoute, authorizeRoles("Triage", "Nurse", "Administrator"), updateCareStatus);
router.put("/:id/doctor-observation", protectRoute, authorizeRoles("Doctor", "Administrator"), updateDoctorObservation);
router.put("/:id/nurse-response", protectRoute, authorizeRoles("Triage", "Nurse", "Administrator"), updateNurseResponse);

module.exports = router;
