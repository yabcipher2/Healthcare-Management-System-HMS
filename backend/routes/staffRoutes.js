const express = require("express");
const router = express.Router();
const {
  getStaffList,
  createStaff,
  updateStaff,
} = require("../controllers/staffController");
const {
  protectRoute,
  authorizeRoles,
} = require("../middleware/authMiddleware");

router.get("/", protectRoute, authorizeRoles("Administrator"), getStaffList);
router.post("/", protectRoute, authorizeRoles("Administrator"), createStaff);
router.put("/:id", protectRoute, authorizeRoles("Administrator"), updateStaff);

module.exports = router;
