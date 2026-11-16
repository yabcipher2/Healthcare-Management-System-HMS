const express = require("express");
const router = express.Router();
const {
  checkInteractions,
  recordOverride,
  getCacheStatistics,
  clearInteractionCache,
} = require("../controllers/interactionController");
const {
  protectRoute,
  authorizeRoles,
} = require("../middleware/authMiddleware");

// Prescribing desk, dispensary and administration can run checks.
router.post(
  "/check",
  protectRoute,
  authorizeRoles("Doctor", "Pharmacist", "Pharmacy Cashier", "Administrator", "Nurse"),
  checkInteractions,
);

// Only prescribing/dispensing clinicians may override a major alert.
// Nurses are deliberately excluded: they must escalate to a doctor (403).
router.post(
  "/override",
  protectRoute,
  authorizeRoles("Doctor", "Pharmacist", "Administrator"),
  recordOverride,
);

// Cache observability is an administration task.
router.get(
  "/cache/stats",
  protectRoute,
  authorizeRoles("Administrator"),
  getCacheStatistics,
);

router.delete(
  "/cache",
  protectRoute,
  authorizeRoles("Administrator"),
  clearInteractionCache,
);

module.exports = router;
