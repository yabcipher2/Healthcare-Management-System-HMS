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
const {
  listPatientAllergies,
  addPatientAllergy,
  removePatientAllergy,
} = require("../controllers/interactionController");

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

// Allergy list used by the prescribing safety screen
router
  .route("/:id/allergies")
  .get(
    protectRoute,
    authorizeRoles(
      "Administrator",
      "Receptionist",
      "Doctor",
      "Nurse",
      "Pharmacist",
      "Triage",
    ),
    listPatientAllergies,
  )
  .post(
    protectRoute,
    authorizeRoles("Administrator", "Doctor", "Nurse", "Receptionist"),
    addPatientAllergy,
  );

router.delete(
  "/:id/allergies/:allergen",
  protectRoute,
  authorizeRoles("Administrator", "Doctor", "Nurse", "Receptionist"),
  removePatientAllergy,
);

module.exports = router;
