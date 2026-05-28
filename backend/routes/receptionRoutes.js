const express = require("express");
const router = express.Router();
const {
  registerPatient,
  fetchRecords,
  modifyWorkflow,
  fetchRecordsByStatus,
} = require("../controllers/patientController");
const {
  protectRoute,
  authorizeRoles,
} = require("../middleware/authMiddleware");

router.post(
  "/patients",
  protectRoute,
  authorizeRoles("Receptionist", "Administrator"),
  registerPatient,
);
router.get(
  "/patients",
  protectRoute,
  authorizeRoles("Receptionist", "Administrator", "Doctor", "Triage"),
  fetchRecords,
);
router.get(
  "/patients/status/:status",
  protectRoute,
  authorizeRoles("Receptionist", "Administrator", "Doctor", "Triage"),
  fetchRecordsByStatus,
);
router.put(
  "/patients/:id",
  protectRoute,
  authorizeRoles("Receptionist", "Administrator"),
  modifyWorkflow,
);

module.exports = router;
