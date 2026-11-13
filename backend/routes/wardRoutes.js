const express = require("express");
const router = express.Router();
const {
  getBeds,
  updateBed,
  dischargeBed,
  getAdmissionRequests,
  createAdmissionRequest,
  assignBed,
  rejectAdmissionRequest,
} = require("../controllers/wardController");
const { protectRoute, authorizeRoles } = require("../middleware/authMiddleware");

// The ward desk runs on a "Ward" / "Ward Manager" account, so those roles must
// be allowed here or the ward dashboard cannot even read its own beds.
const WARD_ROLES = ["Administrator", "Nurse", "Triage", "Ward", "Ward Manager"];

router.get("/", protectRoute, authorizeRoles(...WARD_ROLES), getBeds);
router.put("/:bedId", protectRoute, authorizeRoles(...WARD_ROLES), updateBed);
router.put("/:bedId/discharge", protectRoute, authorizeRoles(...WARD_ROLES), dischargeBed);

// Admission request routes
router.get("/admission-requests", protectRoute, getAdmissionRequests);
router.post("/admission-requests", protectRoute, createAdmissionRequest);

// Doctor -> ward -> doctor handoff actions
router.post("/assign-bed", protectRoute, authorizeRoles(...WARD_ROLES), assignBed);
router.post(
  "/admission-requests/:id/reject",
  protectRoute,
  authorizeRoles(...WARD_ROLES),
  rejectAdmissionRequest,
);

module.exports = router;
