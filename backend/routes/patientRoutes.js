const express = require("express");
const router = express.Router();
const {
  registerPatient,
  fetchRecords,
  fetchRecordsByStatus,
  modifyWorkflow,
} = require("../controllers/patientController");
const {
  protectRoute,
  authorizeRoles,
} = require("../middleware/authMiddleware");

router
  .route("/")
  .post(
    protectRoute,
    authorizeRoles("Receptionist", "Administrator"),
    registerPatient,
  )
  .get(
    protectRoute,
    authorizeRoles(
      "Administrator",
      "Receptionist",
      "Doctor",
      "Pharmacist",
      "Laboratory",
      "Triage",
    ),
    fetchRecords,
  );

router
  .route("/status/:status")
  .get(
    protectRoute,
    authorizeRoles(
      "Administrator",
      "Receptionist",
      "Doctor",
      "Pharmacist",
      "Laboratory",
      "Triage",
    ),
    fetchRecordsByStatus,
  );

router
  .route("/:id")
  .put(
    protectRoute,
    authorizeRoles(
      "Administrator",
      "Receptionist",
      "Doctor",
      "Laboratory",
      "Pharmacist",
      "Triage",
    ),
    modifyWorkflow,
  );

module.exports = router;
