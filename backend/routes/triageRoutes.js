const express = require("express");
const router = express.Router();
const { getQueue, updateTriage } = require("../controllers/triageController");
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
router.put(
  "/:id",
  protectRoute,
  authorizeRoles("Triage", "Administrator"),
  updateTriage,
);

module.exports = router;
