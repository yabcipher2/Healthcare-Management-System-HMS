const LabOrder = require("../models/LabOrder");
const PharmacyOrder = require("../models/PharmacyOrder");
const AuditLog = require("../models/AuditLog");

const logAudit = async (req, action, module, details, targetId = "") => {
  try {
    await AuditLog.create({
      action,
      module,
      userId: req.user?._id || req.user?.id || "unknown",
      userName: req.user?.name || "Unknown",
      userRole: req.user?.role || "unknown",
      department: req.user?.dept || "",
      targetId,
      targetType: "CashierTransaction",
      details,
      ipAddress: req.ip || "",
    });
  } catch (err) {
    console.error("Audit log failed:", err.message);
  }
};

// @desc    Get all lab orders for cashier queue
// @route   GET /api/cashier/lab/orders
// @access  Laboratory Cashier, Administrator
const getLabCashierOrders = async (req, res) => {
  try {
    const orders = await LabOrder.find({})
      .sort({ createdAt: -1 })
      .select(
        "_id accessionId patientCardId patientName age gender requestedBy timestamp panels status cashierStatus paymentMethod referenceNumber amountPaid paidAt linkedPatient",
      );
    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all pharmacy orders for cashier queue
// @route   GET /api/cashier/pharmacy/orders
// @access  Pharmacy Cashier, Administrator
const getPharmacyCashierOrders = async (req, res) => {
  try {
    const orders = await PharmacyOrder.find({})
      .sort({ createdAt: -1 })
      .select(
        "_id orderId patientCardId patientName age doctorName timestamp medications status dispenseStatus cashierStatus paymentMethod referenceNumber amountPaid paidAt linkedPatient",
      );
    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark lab order as paid / send payment signal
// @route   POST /api/cashier/lab/:id/pay
// @access  Laboratory Cashier, Administrator
const payLabOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod, referenceNumber, amountPaid } = req.body;

    const order = await LabOrder.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Lab order not found." });
    }

    if (order.status === "Completed") {
      return res.status(400).json({ success: false, message: "Order already completed." });
    }

    order.cashierStatus = "PAID";
    order.paymentMethod = paymentMethod || "Cash";
    order.referenceNumber = referenceNumber || "";
    order.amountPaid = amountPaid || 0;
    order.paidAt = new Date().toISOString();
    await order.save();

    await logAudit(req, "UPDATE", "Cashier", `Lab order ${order.accessionId} marked as PAID for patient ${order.patientName} (${order.patientCardId})`, order._id);

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Mark pharmacy order as paid / send payment signal
// @route   POST /api/cashier/pharmacy/:id/pay
// @access  Pharmacy Cashier, Administrator
const payPharmacyOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod, referenceNumber, amountPaid } = req.body;

    const order = await PharmacyOrder.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Pharmacy order not found." });
    }

    if (order.dispenseStatus === "Dispensed") {
      return res.status(400).json({ success: false, message: "Order already dispensed." });
    }

    order.cashierStatus = "PAID";
    order.paymentMethod = paymentMethod || "Cash";
    order.referenceNumber = referenceNumber || "";
    order.amountPaid = amountPaid || 0;
    order.paidAt = new Date().toISOString();
    await order.save();

    await logAudit(req, "UPDATE", "Cashier", `Pharmacy order ${order.orderId} marked as PAID for patient ${order.patientName} (${order.patientCardId})`, order._id);

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Check payment status for a lab order
// @route   GET /api/cashier/lab/status/:id
// @access  Laboratory, Administrator
const checkLabPaymentStatus = async (req, res) => {
  try {
    const order = await LabOrder.findById(req.params.id).select("cashierStatus");
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }
    res.status(200).json({ success: true, isPaid: order.cashierStatus === "PAID", cashierStatus: order.cashierStatus });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Check payment status for a pharmacy order
// @route   GET /api/cashier/pharmacy/status/:id
// @access  Pharmacy, Administrator
const checkPharmacyPaymentStatus = async (req, res) => {
  try {
    const order = await PharmacyOrder.findById(req.params.id).select("cashierStatus");
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }
    res.status(200).json({ success: true, isPaid: order.cashierStatus === "PAID", cashierStatus: order.cashierStatus });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getLabCashierOrders,
  getPharmacyCashierOrders,
  payLabOrder,
  payPharmacyOrder,
  checkLabPaymentStatus,
  checkPharmacyPaymentStatus,
};
