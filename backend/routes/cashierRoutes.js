const express = require("express");
const router = express.Router();
const {
  getLabCashierOrders,
  getPharmacyCashierOrders,
  payLabOrder,
  payPharmacyOrder,
  checkLabPaymentStatus,
  checkPharmacyPaymentStatus,
} = require("../controllers/cashierController");
const { protectRoute, authorizeRoles } = require("../middleware/authMiddleware");

// Lab Cashier routes
router.get(
  "/lab/orders",
  protectRoute,
  authorizeRoles("Laboratory Cashier", "Administrator"),
  getLabCashierOrders,
);
router.post(
  "/lab/:id/pay",
  protectRoute,
  authorizeRoles("Laboratory Cashier", "Administrator"),
  payLabOrder,
);
router.get(
  "/lab/status/:id",
  protectRoute,
  authorizeRoles("Laboratory", "Laboratory Cashier", "Administrator"),
  checkLabPaymentStatus,
);

// Pharmacy Cashier routes
router.get(
  "/pharmacy/orders",
  protectRoute,
  authorizeRoles("Pharmacy Cashier", "Administrator"),
  getPharmacyCashierOrders,
);
router.post(
  "/pharmacy/:id/pay",
  protectRoute,
  authorizeRoles("Pharmacy Cashier", "Administrator"),
  payPharmacyOrder,
);
router.get(
  "/pharmacy/status/:id",
  protectRoute,
  authorizeRoles("Pharmacist", "Pharmacy Cashier", "Administrator"),
  checkPharmacyPaymentStatus,
);

module.exports = router;
