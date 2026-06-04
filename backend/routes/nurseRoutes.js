const express = require("express");
const router = express.Router();
const {
  getAssignments,
  createAssignment,
  updateNurseNotes,
  updateCareStatus,
} = require("../controllers/nurseController");
const { protectRoute, authorizeRoles } = require("../middleware/authMiddleware");

router.get("/", protectRoute, authorizeRoles("Triage", "Nurse", "Administrator"), getAssignments);
router.post("/", protectRoute, authorizeRoles("Doctor", "Administrator"), createAssignment);
router.put("/:id/notes", protectRoute, authorizeRoles("Triage", "Nurse", "Administrator"), updateNurseNotes);
router.put("/:id/status", protectRoute, authorizeRoles("Triage", "Nurse", "Administrator"), updateCareStatus);

module.exports = router;
