const AuditLog = require("../models/AuditLog");
const PatientRecord = require("../models/PatientRecord");
const {
  checkDrugSafety,
  getCacheStats,
  clearCache,
} = require("../services/drugInteractions");

const splitAllergies = (value) =>
  String(value || "")
    .split(/[,;/\n]/)
    .map((entry) => entry.trim())
    .filter(Boolean);

// A patient keeps a dedicated allergy list; older records only carry the free
// text consultation field, so both are merged for the safety check.
const allergiesForPatient = (patient) => {
  const list = Array.isArray(patient?.allergyList) ? patient.allergyList : [];
  const legacy = splitAllergies(patient?.consultation?.allergies);
  return [...new Set([...list, ...legacy].map((entry) => entry.trim()).filter(Boolean))];
};

// @desc   Run interaction + allergy checks for a set of drugs
// @route  POST /api/interactions/check
const checkInteractions = async (req, res) => {
  try {
    const drugs = Array.isArray(req.body?.drugs) ? req.body.drugs : [];
    let allergies = Array.isArray(req.body?.allergies) ? req.body.allergies : [];

    if (req.body?.patientId) {
      const patient = await PatientRecord.findById(req.body.patientId).select(
        "allergyList consultation.allergies",
      );
      if (patient) allergies = [...allergies, ...allergiesForPatient(patient)];
    }

    if (!drugs.length) {
      return res.status(400).json({
        success: false,
        message: "At least one drug is required for an interaction check.",
      });
    }

    const result = await checkDrugSafety({ drugs, allergies });
    res.status(200).json({
      success: true,
      ...result,
      // Kept for the prescribing screens: a major alert needs a reason.
      overrideRequired: result.blocking,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Record a clinician's override of a major alert (reason mandatory)
// @route  POST /api/interactions/override
const recordOverride = async (req, res) => {
  try {
    const reason = String(req.body?.reason || "").trim();
    const drugs = Array.isArray(req.body?.drugs) ? req.body.drugs : [];
    const alerts = Array.isArray(req.body?.alerts) ? req.body.alerts : [];

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "An override reason is required to save this prescription.",
      });
    }
    if (reason.length < 4) {
      return res.status(400).json({
        success: false,
        message: "The override reason is too short — state the clinical justification.",
      });
    }
    if (!drugs.length) {
      return res.status(400).json({
        success: false,
        message: "The overridden drugs must be listed.",
      });
    }

    await AuditLog.create({
      action: "UPDATE",
      module: "Drug Interaction",
      userId: String(req.user?._id || ""),
      userName: req.user?.name || "Unknown",
      userRole: req.user?.role || "Unknown",
      department: req.user?.dept || "",
      targetId: String(req.body?.patientId || ""),
      targetType: "Prescription",
      details: `Major drug alert overridden: ${alerts
        .map((alert) => `${alert.severity || "alert"} ${(alert.drugs || []).join(" + ")}`)
        .join("; ")} | Reason: ${reason} | Drugs: ${drugs.join(", ")}`,
      ipAddress: req.ip || "",
    });

    res.status(200).json({
      success: true,
      override: { reason, drugs, at: new Date().toISOString() },
      message: "Override recorded in the audit trail.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Cache statistics for the interaction engine
// @route  GET /api/interactions/cache/stats
const getCacheStatistics = async (req, res) => {
  try {
    res.status(200).json({ success: true, stats: getCacheStats() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Empty the interaction cache
// @route  DELETE /api/interactions/cache
const clearInteractionCache = async (req, res) => {
  try {
    const cleared = clearCache();
    await AuditLog.create({
      action: "DELETE",
      module: "Drug Interaction",
      userId: String(req.user?._id || ""),
      userName: req.user?.name || "Unknown",
      userRole: req.user?.role || "Unknown",
      department: req.user?.dept || "",
      details: `Interaction cache cleared (${cleared} entries).`,
      ipAddress: req.ip || "",
    });
    res.status(200).json({
      success: true,
      cleared,
      stats: getCacheStats(),
      message: "Interaction cache emptied.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   List a patient's recorded allergies
// @route  GET /api/patients/:id/allergies
const listPatientAllergies = async (req, res) => {
  try {
    const patient = await PatientRecord.findById(req.params.id).select(
      "allergyList consultation.allergies patientName cardId",
    );
    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found." });
    }
    res.status(200).json({
      success: true,
      patientId: patient._id,
      allergies: allergiesForPatient(patient),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Add an allergy to a patient record
// @route  POST /api/patients/:id/allergies
const addPatientAllergy = async (req, res) => {
  try {
    const allergen = String(req.body?.allergen || req.body?.allergy || "").trim();
    if (!allergen) {
      return res.status(400).json({ success: false, message: "Allergen is required." });
    }

    const patient = await PatientRecord.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found." });
    }

    const existing = allergiesForPatient(patient);
    const already = existing.some(
      (entry) => entry.toLowerCase() === allergen.toLowerCase(),
    );
    if (!already) {
      patient.allergyList = [...(patient.allergyList || []), allergen];
      await patient.save();
      await AuditLog.create({
        action: "UPDATE",
        module: "Patient",
        userId: String(req.user?._id || ""),
        userName: req.user?.name || "Unknown",
        userRole: req.user?.role || "Unknown",
        department: req.user?.dept || "",
        targetId: String(patient._id),
        targetType: "Allergy",
        details: `Allergy recorded for ${patient.patientName} (${patient.cardId}): ${allergen}`,
        ipAddress: req.ip || "",
      });
    }

    res.status(200).json({
      success: true,
      allergies: allergiesForPatient(patient),
      message: already ? "Allergy already recorded." : "Allergy saved.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Remove an allergy from a patient record
// @route  DELETE /api/patients/:id/allergies/:allergen
const removePatientAllergy = async (req, res) => {
  try {
    const allergen = decodeURIComponent(req.params.allergen || "").trim();
    const patient = await PatientRecord.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found." });
    }

    const before = (patient.allergyList || []).length;
    patient.allergyList = (patient.allergyList || []).filter(
      (entry) => String(entry).toLowerCase() !== allergen.toLowerCase(),
    );
    if (patient.allergyList.length !== before) {
      await patient.save();
      await AuditLog.create({
        action: "UPDATE",
        module: "Patient",
        userId: String(req.user?._id || ""),
        userName: req.user?.name || "Unknown",
        userRole: req.user?.role || "Unknown",
        department: req.user?.dept || "",
        targetId: String(patient._id),
        targetType: "Allergy",
        details: `Allergy removed for ${patient.patientName} (${patient.cardId}): ${allergen}`,
        ipAddress: req.ip || "",
      });
    }

    res.status(200).json({
      success: true,
      allergies: allergiesForPatient(patient),
      message: "Allergy removed.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  checkInteractions,
  recordOverride,
  getCacheStatistics,
  clearInteractionCache,
  listPatientAllergies,
  addPatientAllergy,
  removePatientAllergy,
  allergiesForPatient,
};
