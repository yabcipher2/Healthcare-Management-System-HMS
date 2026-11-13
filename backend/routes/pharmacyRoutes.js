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
  authorizeRoles("Pharmacist", "Pharmacy Cashier", "Administrator"),
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
router.put(
  "/orders/:id/payment",
  protectRoute,
  authorizeRoles("Pharmacist", "Pharmacy Cashier", "Administrator"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { paymentStatus, paymentMethod, referenceNumber, totalAmount } = req.body;
      
      const order = await require("../models/PharmacyOrder").findById(id);
      if (!order) {
        return res.status(404).json({ success: false, message: "Order not found" });
      }
      
      order.paymentStatus = paymentStatus || "Paid";
      order.paymentMethod = paymentMethod;
      order.referenceNumber = referenceNumber;
      order.totalAmount = totalAmount;
      order.paidAt = new Date();
      
      await order.save();
      
      res.json({ success: true, data: order });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
);

module.exports = router;
