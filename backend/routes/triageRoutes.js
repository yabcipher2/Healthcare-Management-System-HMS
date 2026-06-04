const express = require("express");
const router = express.Router();
const { getQueue, updateTriage, getRedCriticalsToday, getTotalAssessedToday, dispatchTriagePatient } = require("../controllers/triageController");
const {
  protectRoute,
  authorizeRoles,
} = require("../middleware/authMiddleware");

router.get(
  "/queue",
  protectRoute,
  authorizeRoles("Triage", "Administrator"),
  getQueue,
);
router.get(
  "/red-criticals-today",
  protectRoute,
  authorizeRoles("Triage", "Administrator"),
  getRedCriticalsToday,
);
router.get(
  "/total-assessed-today",
  protectRoute,
  authorizeRoles("Triage", "Administrator"),
  getTotalAssessedToday,
);
router.put(
  "/:id",
  protectRoute,
  authorizeRoles("Triage", "Administrator"),
  updateTriage,
);
router.put(
  "/:id/dispatch",
  protectRoute,
  authorizeRoles("Triage", "Administrator"),
  dispatchTriagePatient,
);

module.exports = router;
