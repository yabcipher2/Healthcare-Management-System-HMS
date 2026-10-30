const express = require("express");
const router = express.Router();
const {
  getStaffList,
  createStaff,
  updateStaff,
  getNurseDepartments,
  getNursesByDepartment,
} = require("../controllers/staffController");
const {
  protectRoute,
  authorizeRoles,
} = require("../middleware/authMiddleware");

router.get("/", protectRoute, authorizeRoles("Administrator"), getStaffList);
router.post("/", protectRoute, authorizeRoles("Administrator"), createStaff);
router.put("/:id", protectRoute, authorizeRoles("Administrator"), updateStaff);

// Nurse-specific endpoints - accessible by doctors
router.get("/nurses/departments", protectRoute, getNurseDepartments);
router.get("/nurses", protectRoute, getNursesByDepartment);

module.exports = router;
