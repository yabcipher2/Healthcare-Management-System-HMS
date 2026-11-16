const PharmacyOrder = require("../models/PharmacyOrder");
const MedicineStock = require("../models/MedicineStock");
const PatientRecord = require("../models/PatientRecord");
const AuditLog = require("../models/AuditLog");
const {
  medicinePrice,
  resolveMedicationLines,
} = require("../config/medicinePrices");
const { checkDrugSafety } = require("../services/drugInteractions");
const { allergiesForPatient } = require("./interactionController");

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
          price: 45,
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
          price: 25,
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
          price: 150,
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
          price: 320,
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
          price: 85,
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
          price: 410,
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

    // Stock rows seeded before the tariff was wired up have no price, which
    // would price every prescription at 0.00 ETB. Backfill them once.
    const unpriced = inventory.filter((item) => !(Number(item.price) > 0));
    if (unpriced.length > 0) {
      for (const item of unpriced) {
        item.price = medicinePrice(item.name, []);
        await MedicineStock.updateOne(
          { _id: item._id },
          { $set: { price: item.price } },
        );
      }
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
    const overrideReason = String(req.body?.overrideReason || "").trim();

    // Every prescription is screened before it reaches the dispensary: allergy
    // contraindications and drug-drug interactions, with major alerts blocked
    // until the prescriber records a justification.
    let allergies = Array.isArray(req.body?.allergies) ? req.body.allergies : [];
    if (linkedPatient) {
      const patient = await PatientRecord.findById(linkedPatient).select(
        "allergyList consultation.allergies",
      );
      if (patient) allergies = [...allergies, ...allergiesForPatient(patient)];
    }
    const drugNames = (medications || []).map((line) => line.name || line);
    const safety = await checkDrugSafety({ drugs: drugNames, allergies });
    const blockingAlerts = safety.alerts.filter(
      (alert) => alert.severity === "major",
    );

    if (blockingAlerts.length > 0 && !overrideReason) {
      return res.status(409).json({
        success: false,
        code: "INTERACTION_OVERRIDE_REQUIRED",
        message:
          "Major drug interaction or allergy alert — an override reason is required to save this prescription.",
        alerts: safety.alerts,
        overrideRequired: true,
      });
    }

    if (blockingAlerts.length > 0 && overrideReason) {
      await logAudit(
        req,
        "UPDATE",
        "Drug Interaction",
        `Major alert overridden for ${patientName} (${patientCardId}): ${blockingAlerts
          .map((alert) => `${(alert.drugs || []).join(" + ")} [${alert.severity}]`)
          .join("; ")} | Reason: ${overrideReason}`,
        linkedPatient || "",
      );
    }

    // Price the lines at write time so the pharmacy desk, the cashier queue and
    // the final bill all agree on what the prescription costs.
    const inventory = await MedicineStock.find({})
      .select("name price stock")
      .lean();
    const { lines, totalAmount } = resolveMedicationLines(
      medications || [],
      inventory,
    );

    const order = await PharmacyOrder.create({
      orderId: `RX-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      patientCardId,
      patientName,
      age,
      doctorName,
      timestamp: new Date().toISOString(),
      medications: lines,
      totalAmount,
      status: "Pending",
      dispenseStatus: "Pending",
      linkedPatient,
      interactionAlerts: safety.alerts,
      overrideReason,
      interactionCheckedAt: new Date(),
    });

    if (linkedPatient) {
      await PatientRecord.findByIdAndUpdate(linkedPatient, {
        "pharmacy.prescribedDrugs": lines.map((m) => m.name || m) || [],
        "pharmacy.prescriptionLines": lines,
        "pharmacy.dispenseStatus": "Pending",
        "pharmacy.interactionAlerts": safety.alerts,
        "pharmacy.overrideReason": overrideReason,
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
    const order = await PharmacyOrder.findById(req.params.id);

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Prescription order not found." });
    }

    // Re-price at dispense time from the live tariff (stock prices may have
    // changed since the script was written).
    if (order.medications && order.medications.length > 0) {
      const inventory = await MedicineStock.find({})
        .select("name price stock")
        .lean();
      const { lines, totalAmount } = resolveMedicationLines(
        order.medications,
        inventory,
      );
      order.medications = lines;
      order.totalAmount = totalAmount;
    }
    
    order.status = "Dispensed";
    order.dispenseStatus = "Dispensed";
    order.updatedAt = new Date();
    
    await order.save();

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
