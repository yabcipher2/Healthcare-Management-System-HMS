const express = require("express");
const router = express.Router();
const {
  getDoctorCases,
  submitConsultation,
} = require("../controllers/doctorController");
const {
  protectRoute,
  authorizeRoles,
} = require("../middleware/authMiddleware");

router.get(
  "/cases",
  protectRoute,
  authorizeRoles("Doctor", "Administrator"),
  getDoctorCases,
);
router.post(
  "/:id/consultation",
  protectRoute,
  authorizeRoles("Doctor", "Administrator"),
  submitConsultation,
);

module.exports = router;
