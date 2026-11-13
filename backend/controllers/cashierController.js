const LabOrder = require("../models/LabOrder");
const PharmacyOrder = require("../models/PharmacyOrder");
const MedicineStock = require("../models/MedicineStock");
const AuditLog = require("../models/AuditLog");
const {
  resolveMedicationLines,
} = require("../config/medicinePrices");

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

// @desc    Get pharmacy orders awaiting payment for the cashier queue
// @route   GET /api/cashier/pharmacy/orders
// @access  Pharmacy Cashier, Administrator
const getPharmacyCashierOrders = async (req, res) => {
  try {
    // Only prescriptions that still need settlement: cancelled/already
    // dispensed orders and settled bills must not clutter the desk.
    const orders = await PharmacyOrder.find({
      status: { $nin: ["Dispensed", "Cancelled"] },
      dispenseStatus: { $ne: "Dispensed" },
      cashierStatus: { $ne: "PAID" },
    })
      .sort({ createdAt: -1 })
      .select(
        "_id orderId patientCardId patientName age doctorName timestamp medications status dispenseStatus cashierStatus paymentStatus paymentMethod referenceNumber amountPaid paidAt linkedPatient",
      )
      .lean();

    // Prescription lines carry a drug name but no tariff, so price them here.
    const inventory = await MedicineStock.find({})
      .select("name price stock")
      .lean();

    const priced = orders.map((order) => {
      const { lines, totalAmount } = resolveMedicationLines(
        order.medications,
        inventory,
      );
      return { ...order, medications: lines, totalAmount };
    });

    res
      .status(200)
      .json({ success: true, count: priced.length, data: priced });
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

    if (order.cashierStatus === "PAID") {
      return res.status(400).json({ success: false, message: "Order is already paid." });
    }

    // Bill from the same tariff the cashier screens show, never from a
    // zero stored price.
    const inventory = await MedicineStock.find({})
      .select("name price stock")
      .lean();
    const { lines, totalAmount } = resolveMedicationLines(
      order.medications,
      inventory,
    );
    const billed = Number(amountPaid) > 0 ? Number(amountPaid) : totalAmount;

    order.medications = lines;
    order.totalAmount = billed;
    order.cashierStatus = "PAID";
    order.paymentStatus = "Paid";
    order.paymentMethod = paymentMethod || "Cash";
    order.referenceNumber = referenceNumber || "";
    order.amountPaid = billed;
    order.paidAt = new Date().toISOString();
    await order.save();

    await logAudit(req, "UPDATE", "Cashier", `Pharmacy order ${order.orderId} marked as PAID for patient ${order.patientName} (${order.patientCardId}) - ${billed.toFixed(2)} ETB via ${order.paymentMethod}`, order._id);

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
