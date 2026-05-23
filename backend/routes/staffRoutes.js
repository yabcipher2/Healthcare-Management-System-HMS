const express = require("express");
const router = express.Router();
const {
  getStaffList,
  createStaff,
  updateStaff,
} = require("../controllers/staffController");

router.get("/", getStaffList);
router.post("/", createStaff);
router.put("/:id", updateStaff);

module.exports = router;
