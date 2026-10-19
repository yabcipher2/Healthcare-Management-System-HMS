const express = require("express");
const router = express.Router();
const {
  getPendingUltrasoundRequests,
  submitUltrasoundResults,
} = require("../controllers/ultrasoundController");
const {
  protectRoute,
  authorizeRoles,
} = require("../middleware/authMiddleware");

// @desc    Fetch patients waiting for ultrasound scans
// @access  Private (Radiology, Administrator)
router.get(
  "/pending",
  protectRoute,
  authorizeRoles("Radiology", "Administrator"),
  getPendingUltrasoundRequests,
);

// @desc    Submit scan results and reports back to Doctor EMR
// @access  Private (Radiology, Administrator)
router.put(
  "/:id/results",
  protectRoute,
  authorizeRoles("Radiology", "Administrator"),
  submitUltrasoundResults,
);

module.exports = router;
