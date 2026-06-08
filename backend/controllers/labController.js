const LabOrder = require("../models/LabOrder");
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
      targetType: "LabOrder",
      details,
      ipAddress: req.ip || "",
    });
  } catch (err) {
    console.error("Audit log failed:", err.message);
  }
};

const getLabPanels = async (req, res) => {
  try {
    const panels = [
      {
        code: "LAB-CBC",
        name: "Complete Blood Count (CBC)",
        section: "Hematology",
        turnaround: "45 Mins",
        cost: "Local Sync",
        status: "Operational",
      },
      {
        code: "LAB-LFT",
        name: "Liver Function Test (LFT)",
        section: "Clinical Chemistry",
        turnaround: "2 Hours",
        cost: "Local Sync",
        status: "Operational",
      },
      {
        code: "LAB-RBS",
        name: "Random Blood Sugar (RBS)",
        section: "Enzymology",
        turnaround: "15 Mins",
        cost: "Local Sync",
        status: "Operational",
      },
      {
        code: "LAB-WID",
        name: "Widal & Weil-Felix Test",
        section: "Serology",
        turnaround: "1 Hour",
        cost: "Local Sync",
        status: "Operational",
      },
      {
        code: "LAB-UA",
        name: "Urinalysis Routine",
        section: "Microscopy",
        turnaround: "30 Mins",
        cost: "Local Sync",
        status: "Operational",
      },
      {
        code: "LAB-CR",
        name: "Serum Creatinine",
        section: "Renal Panel",
        turnaround: "1 Hour",
        cost: "Local Sync",
        status: "Operational",
      },
    ];

    res.status(200).json({ success: true, count: panels.length, data: panels });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getLabOrders = async (req, res) => {
  try {
    const orders = await LabOrder.find({}).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createLabOrder = async (req, res) => {
  try {
    const {
      patientCardId,
      patientName,
      age,
      gender,
      requestedBy,
      panels,
      specimen,
      urgency,
    } = req.body;
    const order = await LabOrder.create({
      accessionId: `LAB-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      patientCardId,
      patientName,
      age,
      gender,
      requestedBy,
      timestamp: new Date().toISOString(),
      urgency: urgency || "Routine",
      panels: panels || [],
      specimen: specimen || "Pending Specimen",
      status: "Pending",
    });

    if (req.body.linkedPatient) {
      await PatientRecord.findByIdAndUpdate(req.body.linkedPatient, {
        "laboratory.testRequests": panels || [],
        "laboratory.labStatus": "Pending",
        currentStatus: "Laboratory",
      });
    }

    await logAudit(req, "CREATE", "Laboratory", `Lab order ${order.accessionId} created for ${order.patientName}`, order._id);

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const submitLabResults = async (req, res) => {
  try {
    const { results, diagnosisReport } = req.body;
    const updatePayload = {
      status: "Completed",
      updatedAt: new Date(),
    };
    if (results !== undefined) {
      updatePayload.results = results;
    }
    if (diagnosisReport !== undefined) {
      updatePayload.diagnosisReport = diagnosisReport;
    }

    const order = await LabOrder.findByIdAndUpdate(
      req.params.id,
      updatePayload,
      { returnDocument: "after", runValidators: true },
    );

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Lab order not found." });
    }

    if (order.linkedPatient) {
      await PatientRecord.findByIdAndUpdate(order.linkedPatient, {
        "laboratory.testResults": results || {},
        "laboratory.diagnosisReport": diagnosisReport || "",
        "laboratory.labStatus": "Completed",
        currentStatus: "Consultation",
      });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error("Error submitting lab results:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getLabPanels,
  getLabOrders,
  createLabOrder,
  submitLabResults,
};
