const express = require("express");
const router = express.Router();
const {
  getLabPanels,
  getLabOrders,
  createLabOrder,
  submitLabResults,
} = require("../controllers/labController");
const {
  protectRoute,
  authorizeRoles,
} = require("../middleware/authMiddleware");

router.get(
  "/panels",
  protectRoute,
  authorizeRoles("Laboratory", "Administrator", "Doctor"),
  getLabPanels,
);
router.get(
  "/orders",
  protectRoute,
  authorizeRoles("Laboratory", "Administrator", "Doctor"),
  getLabOrders,
);
router.post(
  "/orders",
  protectRoute,
  authorizeRoles("Laboratory", "Administrator", "Doctor"),
  createLabOrder,
);
router.put(
  "/orders/:id/result",
  protectRoute,
  authorizeRoles("Laboratory", "Administrator"),
  submitLabResults,
);

module.exports = router;
