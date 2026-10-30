const express = require("express");
const router = express.Router();
const {
  getBeds,
  updateBed,
  dischargeBed,
  getAdmissionRequests,
  createAdmissionRequest,
} = require("../controllers/wardController");
const { protectRoute, authorizeRoles } = require("../middleware/authMiddleware");

router.get("/", protectRoute, authorizeRoles("Administrator", "Nurse", "Triage"), getBeds);
router.put("/:bedId", protectRoute, authorizeRoles("Administrator", "Nurse"), updateBed);
router.put("/:bedId/discharge", protectRoute, authorizeRoles("Administrator", "Nurse"), dischargeBed);

// Admission request routes
router.get("/admission-requests", protectRoute, getAdmissionRequests);
router.post("/admission-requests", protectRoute, createAdmissionRequest);

module.exports = router;
