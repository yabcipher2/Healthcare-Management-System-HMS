const PatientRecord = require("../models/PatientRecord");
const AuditLog = require("../models/AuditLog");

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

const normalizePatientName = (firstName, middleName, lastName) => {
  return [firstName, middleName, lastName].filter(Boolean).join(" ").trim();
};

// @desc    Register Patient & Save to DB
// @route   POST /api/patients
const registerPatient = async (req, res) => {
  try {
    const {
      cardId,
      firstName,
      middleName,
      lastName,
      age,
      ageUnit,
      gender,
      bloodGroup,
      maritalStatus,
      subCity,
      woreda,
      houseNumber,
      nationality,
      phoneNumber,
      alternativePhone,
      emergencyContactName,
      emergencyContactPhone,
      guardianFullName,
      guardianRelationship,
      guardianPhone,
      chiefComplaint,
      admissionType,
      paymentType,
      companyName,
      referredFrom,
      registrationTime,
    } = req.body;

    const resolvedCardId =
      cardId || `MR-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const patientName = normalizePatientName(firstName, middleName, lastName);

    const newRecord = await PatientRecord.create({
      cardId: resolvedCardId,
      patientName: patientName || "Unknown Patient",
      firstName,
      middleName,
      lastName,
      age: age ? Number(age) : undefined,
      ageUnit: ageUnit || "Years",
      gender,
      bloodGroup,
      maritalStatus,
      subCity,
      woreda,
      houseNumber,
      nationality,
      contactNumber: phoneNumber,
      alternativePhone,
      emergencyContactName,
      emergencyContactPhone,
      guardianFullName,
      guardianRelationship,
      guardianPhone,
      chiefComplaint,
      admissionType: admissionType || "OPD",
      paymentType: paymentType || "Cash",
      companyName,
      referredFrom,
      registrationTime,
      currentStatus: "Registration",
    });

    await logAudit(req, "CREATE", "Patient", `Registered patient ${patientName} (${resolvedCardId})`, newRecord._id);

    res.status(201).json({ success: true, data: newRecord });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Fetch Real-time Records for Dashboard Widgets
// @route   GET /api/patients
const fetchRecords = async (req, res) => {
  try {
    const records = await PatientRecord.find({}).sort({ createdAt: -1 });
    res
      .status(200)
      .json({ success: true, count: records.length, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Fetch Patients by Current Workflow Status
// @route   GET /api/patients/status/:status
const fetchRecordsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const records = await PatientRecord.find({ currentStatus: status }).sort({
      createdAt: -1,
    });
    res
      .status(200)
      .json({ success: true, count: records.length, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Modify Patient Workflow State
// @route   PUT /api/patients/:id
const modifyWorkflow = async (req, res) => {
  try {
    const {
      phoneNumber,
      _id,
      ...body
    } = req.body;

    const updatePayload = {
      ...body,
      contactNumber: phoneNumber || body.contactNumber,
    };

    if (updatePayload.admissionType && !["OPD", "IPD", "Emergency", "Referral"].includes(updatePayload.admissionType)) {
      delete updatePayload.admissionType;
    }
    if (updatePayload.paymentType && !["Cash", "Credit/Insurance", "Prepaid", "Other"].includes(updatePayload.paymentType)) {
      delete updatePayload.paymentType;
    }
    if (updatePayload.age !== undefined) {
      updatePayload.age = Number(updatePayload.age);
    }

    const updatedRecord = await PatientRecord.findByIdAndUpdate(
      req.params.id,
      updatePayload,
      { returnDocument: "after", runValidators: true },
    );
    if (!updatedRecord) {
      return res
        .status(404)
        .json({ success: false, message: "Record not found." });
    }
    await logAudit(req, "UPDATE", "Patient", `Updated patient record ${updatedRecord.cardId}`, updatedRecord._id);
    res.status(200).json({ success: true, data: updatedRecord });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerPatient,
  fetchRecords,
  fetchRecordsByStatus,
  modifyWorkflow,
};
