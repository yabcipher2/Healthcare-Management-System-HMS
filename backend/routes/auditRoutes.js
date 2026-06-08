const express = require("express");
const router = express.Router();

const {
  createAuditLog,
  getAuditLogs,
  getAuditAlertsCount,
} = require("../controllers/auditController");
const { protectRoute, authorizeRoles } = require("../middleware/authMiddleware");

router.post("/", protectRoute, createAuditLog);
router.get("/", protectRoute, getAuditLogs);
router.get(
  "/alerts/count",
  protectRoute,
  getAuditAlertsCount,
);

module.exports = router;
