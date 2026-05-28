const express = require("express");
const router = express.Router();
const {
  getInventory,
  getPrescriptionOrders,
  createPrescriptionOrder,
  markPrescriptionDispensed,
} = require("../controllers/pharmacyController");
const {
  protectRoute,
  authorizeRoles,
} = require("../middleware/authMiddleware");

router.get(
  "/inventory",
  protectRoute,
  authorizeRoles("Pharmacist", "Administrator"),
  getInventory,
);
router.get(
  "/orders",
  protectRoute,
  authorizeRoles("Pharmacist", "Administrator"),
  getPrescriptionOrders,
);
router.post(
  "/orders",
  protectRoute,
  authorizeRoles("Pharmacist", "Doctor", "Administrator"),
  createPrescriptionOrder,
);
router.put(
  "/orders/:id/dispense",
  protectRoute,
  authorizeRoles("Pharmacist", "Administrator"),
  markPrescriptionDispensed,
);

module.exports = router;
