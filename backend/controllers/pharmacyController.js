const PharmacyOrder = require("../models/PharmacyOrder");
const MedicineStock = require("../models/MedicineStock");
const PatientRecord = require("../models/PatientRecord");
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
      targetType: "PharmacyOrder",
      details,
      ipAddress: req.ip || "",
    });
  } catch (err) {
    console.error("Audit log failed:", err.message);
  }
};

const getInventory = async (req, res) => {
  try {
    const inventory = await MedicineStock.find({}).sort({ name: 1 });

    if (inventory.length === 0) {
      const defaultItems = [
        {
          code: "MED-001",
          name: "Amoxicillin",
          formulation: "Capsule",
          strength: "500mg",
          batch: "AMX-2026",
          stock: 1420,
          minLevel: 300,
          shelf: "Rack A-3",
          status: "In Stock",
        },
        {
          code: "MED-002",
          name: "Paracetamol (Panadol)",
          formulation: "Tablet",
          strength: "500mg",
          batch: "PAR-9912",
          stock: 4500,
          minLevel: 500,
          shelf: "Rack A-1",
          status: "In Stock",
        },
        {
          code: "MED-003",
          name: "Metformin",
          formulation: "Tablet",
          strength: "850mg",
          batch: "MET-4401",
          stock: 180,
          minLevel: 250,
          shelf: "Rack B-2",
          status: "Low Stock",
        },
        {
          code: "MED-004",
          name: "Ceftriaxone",
          formulation: "Injection",
          strength: "1g",
          batch: "CEF-7721",
          stock: 95,
          minLevel: 100,
          shelf: "Cold Fridge 1",
          status: "Low Stock",
        },
        {
          code: "MED-005",
          name: "Omeprazole",
          formulation: "Capsule",
          strength: "20mg",
          batch: "OMP-1102",
          stock: 2400,
          minLevel: 400,
          shelf: "Rack C-1",
          status: "In Stock",
        },
        {
          code: "MED-006",
          name: "Atorvastatin",
          formulation: "Tablet",
          strength: "20mg",
          batch: "ATR-5562",
          stock: 0,
          minLevel: 200,
          shelf: "Rack B-4",
          status: "Out of Stock",
        },
        {
          code: "MED-007",
          name: "Salbutamol Inhaler",
          formulation: "Inhaler",
          strength: "100mcg",
          batch: "SAL-8890",
          stock: 320,
          minLevel: 50,
          shelf: "Rack D-2",
          status: "In Stock",
        },
        {
          code: "MED-008",
          name: "Insulin Glargine",
          formulation: "Injection Pen",
          strength: "100 U/mL",
          batch: "INS-0023",
          stock: 42,
          minLevel: 30,
          shelf: "Cold Fridge 2",
          status: "In Stock",
        },
      ];
      const seeded = await MedicineStock.insertMany(defaultItems);
      return res
        .status(200)
        .json({ success: true, count: seeded.length, data: seeded });
    }

    res
      .status(200)
      .json({ success: true, count: inventory.length, data: inventory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPrescriptionOrders = async (req, res) => {
  try {
    const orders = await PharmacyOrder.find({}).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createPrescriptionOrder = async (req, res) => {
  try {
    const {
      patientCardId,
      patientName,
      age,
      doctorName,
      medications,
      linkedPatient,
    } = req.body;
    const order = await PharmacyOrder.create({
      orderId: `RX-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      patientCardId,
      patientName,
      age,
      doctorName,
      timestamp: new Date().toISOString(),
      medications: medications || [],
      status: "Pending",
      dispenseStatus: "Pending",
      linkedPatient,
    });

    if (linkedPatient) {
      await PatientRecord.findByIdAndUpdate(linkedPatient, {
        "pharmacy.prescribedDrugs": medications || [],
        "pharmacy.dispenseStatus": "Pending",
        currentStatus: "Pharmacy",
      });
    }

    await logAudit(req, "CREATE", "Pharmacy", `Prescription order ${order.orderId} created for order ${order.patientName}`, order._id);

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const markPrescriptionDispensed = async (req, res) => {
  try {
    const order = await PharmacyOrder.findByIdAndUpdate(
      req.params.id,
      {
        status: "Dispensed",
        dispenseStatus: "Dispensed",
        updatedAt: new Date(),
      },
      { returnDocument: "after", runValidators: true },
    );

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Prescription order not found." });
    }

    if (order.linkedPatient) {
      await PatientRecord.findByIdAndUpdate(order.linkedPatient, {
        "pharmacy.dispenseStatus": "Dispensed",
        currentStatus: "Billing",
      });
    }

    await logAudit(req, "UPDATE", "Pharmacy", `Prescription ${order.orderId} dispensed to ${order.patientName}`, order._id);

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getInventory,
  getPrescriptionOrders,
  createPrescriptionOrder,
  markPrescriptionDispensed,
};
