const express = require("express");
const router = express.Router();
const {
  getBeds,
  updateBed,
  dischargeBed,
} = require("../controllers/wardController");
const { protectRoute, authorizeRoles } = require("../middleware/authMiddleware");

router.get("/", protectRoute, authorizeRoles("Administrator", "Nurse", "Triage"), getBeds);
router.put("/:bedId", protectRoute, authorizeRoles("Administrator", "Nurse"), updateBed);
router.put("/:bedId/discharge", protectRoute, authorizeRoles("Administrator", "Nurse"), dischargeBed);

module.exports = router;
