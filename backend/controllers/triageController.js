const mongoose = require("mongoose");
const PatientRecord = require("../models/PatientRecord");
const AuditLog = require("../models/AuditLog");
const User = require("../models/User");

const logAudit = async (req, action, module, details, targetId = "", targetType = "PatientRecord") => {
  try {
    await AuditLog.create({
      action,
      module,
      userId: req.user?._id || req.user?.id || "unknown",
      userName: req.user?.name || "Unknown",
      userRole: req.user?.role || "unknown",
      department: req.user?.dept || "",
      targetId: targetId || "",
      targetType,
      details: details || "",
      ipAddress: req.ip || "",
    });
  } catch (err) {
    console.error("Audit log failed:", err.message);
  }
};

const getQueue = async (req, res) => {
  try {
    const queue = await PatientRecord.find({
      currentStatus: { $in: ["Registration", "Triage"] },
    })
      .sort({ createdAt: -1 })
      .select(
        "cardId patientName firstName middleName lastName age gender chiefComplaint registrationTime currentStatus",
      );

    res.status(200).json({ success: true, count: queue.length, data: queue });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getRedCriticalsToday = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const count = await PatientRecord.countDocuments({
      $or: [
        { "triage.triageCategory": { $regex: /Red/i } },
        { triageCategory: { $regex: /Red/i } },
      ],
      updatedAt: { $gte: today, $lt: tomorrow },
    });

    res.status(200).json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTotalAssessedToday = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const count = await PatientRecord.countDocuments({
      $or: [
        { "triage.triageCategory": { $ne: null } },
        { triageCategory: { $ne: null } },
      ],
      updatedAt: { $gte: today, $lt: tomorrow },
    });

    res.status(200).json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateTriage = async (req, res) => {
  try {
    const patient = await PatientRecord.findById(req.params.id);
    if (!patient) {
      return res
        .status(404)
        .json({ success: false, message: "Patient record not found." });
    }

    const {
      bpSystolic,
      bpDiastolic,
      heartRate,
      temperature,
      spo2,
      respiratoryRate,
      weight,
      randomBloodSugar,
      secondaryUrgencyNotes,
      triageCategory,
    } = req.body;

    patient.triage = {
      bloodPressure: `${bpSystolic || ""}/${bpDiastolic || ""}`.trim(),
      heartRate: heartRate || patient.triage?.heartRate,
      temperature: temperature || patient.triage?.temperature,
      weight: weight || patient.triage?.weight,
      respiratoryRate: respiratoryRate || patient.triage?.respiratoryRate,
      randomBloodSugar: randomBloodSugar || patient.triage?.randomBloodSugar,
      triageCategory:
        triageCategory ||
        patient.triage?.triageCategory ||
        "Green (Non-Urgent)",
      secondaryUrgencyNotes:
        secondaryUrgencyNotes || patient.triage?.secondaryUrgencyNotes,
    };

    patient.currentStatus = "Consultation";
    await patient.save();

    await logAudit(req, "UPDATE", "Triage", `Triage assessed for ${patient.patientName} (${patient.cardId}): ${triageCategory}`, patient._id);

    res.status(200).json({ success: true, data: patient });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const dispatchTriagePatient = async (req, res) => {
  try {
    const patient = await PatientRecord.findById(req.params.id);
    if (!patient) {
      return res
        .status(404)
        .json({ success: false, message: "Patient record not found." });
    }

    const {
      bpSystolic,
      bpDiastolic,
      heartRate,
      temperature,
      spo2,
      respiratoryRate,
      weight,
      randomBloodSugar,
      secondaryUrgencyNotes,
      triageCategory,
      doctorId,
      department,
    } = req.body;

    // Resolve the chosen physician to a real login account in the staffs
    // collection. A triage tab that was left open before the roster was rebuilt
    // can still submit ids from the old `users` collection, and no doctor
    // account can ever match those, which left the doctor dashboard empty.
    const resolveDoctorAccount = async (rawId) => {
      if (!rawId) return null;
      const id = rawId._id ? rawId._id.toString() : rawId.toString();
      if (!/^[0-9a-fA-F]{24}$/.test(id)) return null;

      const direct = await User.findById(id);
      if (direct) return direct;

      const legacy = await mongoose.connection.db
        .collection("users")
        .findOne({ _id: new mongoose.Types.ObjectId(id) })
        .catch(() => null);
      if (!legacy || !legacy.name) return null;

      const escapedName = legacy.name
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return User.findOne({
        role: "Doctor",
        name: { $regex: new RegExp(`^${escapedName}$`, "i") },
      });
    };

    const doctorAccount = await resolveDoctorAccount(doctorId);
    if (!doctorAccount) {
      return res.status(400).json({
        success: false,
        message:
          "The selected physician is not linked to an active doctor account. Reload the triage page, pick the physician again and retry.",
      });
    }
    const finalizedDoctorId = doctorAccount._id;

    patient.triage = {
      bloodPressure: `${bpSystolic || ""}/${bpDiastolic || ""}`.trim(),
      heartRate: heartRate || patient.triage?.heartRate,
      temperature: temperature || patient.triage?.temperature,
      weight: weight || patient.triage?.weight,
      respiratoryRate: respiratoryRate || patient.triage?.respiratoryRate,
      randomBloodSugar: randomBloodSugar || patient.triage?.randomBloodSugar,
      triageCategory:
        triageCategory ||
        patient.triage?.triageCategory ||
        "Green (Non-Urgent)",
      secondaryUrgencyNotes:
        secondaryUrgencyNotes || patient.triage?.secondaryUrgencyNotes,
    };

    patient.currentStatus = "Consultation";
    patient.triageDepartment = department || "";
    if (!patient.consultation) {
      patient.consultation = {};
    }

    patient.consultation.assignedDoctor = finalizedDoctorId;
    patient.consultation.assignedDoctorName = doctorAccount.name || "";
    patient.consultation.assignedDoctorEmail = doctorAccount.email || "";
    patient.consultation.dispatchedDepartment = department || "";
    patient.markModified("consultation");

    await patient.save();
    await logAudit(req, "UPDATE", "Triage", `Dispatched ${patient.patientName} (${patient.cardId}) to doctor consultation`, patient._id);
    res.status(200).json({ success: true, data: patient });
  } catch (error) {
    console.error("[dispatchTriagePatient] Error:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getQueue,
  getRedCriticalsToday,
  getTotalAssessedToday,
  updateTriage,
  dispatchTriagePatient,
};
