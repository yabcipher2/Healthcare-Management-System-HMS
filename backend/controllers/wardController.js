const Bed = require("../models/Bed");
const AuditLog = require("../models/AuditLog");
const PatientRecord = require("../models/PatientRecord");

const logAudit = async (req, action, module, details, targetId = "", targetType = "Bed") => {
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

// Liaison data lives on a Mixed field, so copy it into a plain object before it
// is merged back into the patient record.
const plainLiaison = (record) =>
  JSON.parse(JSON.stringify(record?.liaison || {}));

const getBeds = async (req, res) => {
  try {
    let beds = await Bed.find({}).sort({ bedId: 1 });
    if (beds.length === 0) {
      const defaultBeds = [
        { bedId: "B-101", room: "Room 01 (ICU)", type: "Critical Care", status: "Available" },
        { bedId: "B-102", room: "Room 01 (ICU)", type: "Critical Care", status: "Available" },
        { bedId: "B-201", room: "Room 02 (General)", type: "General Ward", status: "Available" },
        { bedId: "B-202", room: "Room 02 (General)", type: "General Ward", status: "Available" },
        { bedId: "B-301", room: "Room 03 (Pediatric)", type: "Children's Block", status: "Available" },
        { bedId: "B-302", room: "Room 03 (Pediatric)", type: "Children's Block", status: "Available" },
      ];
      beds = await Bed.insertMany(defaultBeds);
    }
    res.status(200).json({ success: true, count: beds.length, data: beds });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateBed = async (req, res) => {
  try {
    const bed = await Bed.findOneAndUpdate({ bedId: req.params.bedId }, req.body, { returnDocument: "after", runValidators: true });
    if (!bed) return res.status(404).json({ success: false, message: "Bed not found." });

    // A bed filled from the ward's own admission form still has to move the
    // patient into the ward, otherwise the doctor keeps a stale status.
    if (bed.status === "Occupied" && bed.patientCardId) {
      const patient = await PatientRecord.findOne({ cardId: bed.patientCardId });
      if (patient) {
        const liaison = plainLiaison(patient);
        patient.currentStatus = "Ward";
        patient.liaison = {
          ...liaison,
          status: "Bed Assigned",
          bedId: bed.bedId,
          room: bed.room || bed.type || "",
          assignedAt: new Date(),
        };
        await patient.save();
      }
    }

    await logAudit(req, "UPDATE", "Ward", `Bed ${bed.bedId} updated (patient: ${bed.patientName || "none"}, status: ${bed.status})`, bed._id);
    res.status(200).json({ success: true, data: bed });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Closing a bed sends the patient back to the doctor who requested the
// admission, so the ward -> doctor leg of the handoff is not a dead end.
const dischargeBed = async (req, res) => {
  try {
    const bed = await Bed.findOne({ bedId: req.params.bedId });
    if (!bed) return res.status(404).json({ success: false, message: "Bed not found." });

    const patient = bed.patientCardId
      ? await PatientRecord.findOne({ cardId: bed.patientCardId })
      : null;

    bed.status = "Available";
    bed.patientName = "";
    bed.admissionTime = "";
    bed.attendingDoctor = "";
    bed.severity = "";
    bed.patientCardId = "";
    await bed.save();

    let returnedPatient = null;
    if (patient) {
      const liaison = plainLiaison(patient);
      patient.currentStatus = "Consultation";
      patient.liaison = {
        ...liaison,
        status: "Discharged from Ward",
        dischargedAt: new Date(),
        returnedToDoctor: true,
      };
      await patient.save();
      returnedPatient = {
        _id: patient._id,
        patientName: patient.patientName,
        cardId: patient.cardId,
        currentStatus: patient.currentStatus,
      };
    }

    await logAudit(req, "UPDATE", "Ward", `Discharged patient from bed ${bed.bedId}${patient ? ` (${patient.patientName}) back to consultation` : ""}`, bed._id);
    res.status(200).json({ success: true, data: { bed, patient: returnedPatient } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getAdmissionRequests = async (req, res) => {
  try {
    // Admission requests raised by doctors are stored on the patient record's
    // liaison block, so the ward hub reads them from there instead of the
    // (unused) AdmissionRequest collection.
    const records = await PatientRecord.find({
      "liaison.status": { $in: ["Pending Ward Assignment", "Bed Assigned"] },
    })
      .select("cardId patientName age gender consultation liaison currentStatus updatedAt")
      .sort({ updatedAt: -1 });

    const data = records.map((record) => ({
      _id: record._id,
      patientId: String(record._id),
      patientName: record.patientName,
      cardId: record.cardId,
      age: record.age,
      gender: record.gender,
      doctorName:
        record.liaison?.doctorName ||
        record.consultation?.assignedDoctorName ||
        "",
      selectedDepartment: record.liaison?.selectedDepartment || "",
      selectedWardNurse: record.liaison?.selectedWardNurse || "",
      admissionUrgency: record.liaison?.admissionUrgency || "Routine",
      clinicalReason: record.liaison?.clinicalReason || "",
      admissionDate: record.liaison?.admissionDate || "",
      dischargeDate: record.liaison?.dischargeDate || "",
      medicationIntake: record.liaison?.medicationIntake || "",
      bedId: record.liaison?.bedId || "",
      room: record.liaison?.room || "",
      status: record.liaison?.status === "Bed Assigned" ? "Assigned" : "Pending",
      createdAt: record.liaison?.requestedAt || record.updatedAt,
    }));

    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createAdmissionRequest = async (req, res) => {
  try {
    const {
      patientId,
      doctorName,
      selectedDepartment,
      selectedWardNurse,
      admissionUrgency,
      clinicalReason,
      admissionDate,
      dischargeDate,
      medicationIntake,
    } = req.body;

    if (!patientId) {
      return res.status(400).json({ success: false, message: "Patient is required." });
    }

    const patient = await PatientRecord.findById(patientId);
    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient record not found." });
    }

    const liaison = plainLiaison(patient);
    patient.liaison = {
      ...liaison,
      selectedDepartment,
      selectedWardNurse,
      admissionUrgency,
      clinicalReason,
      admissionDate,
      dischargeDate,
      medicationIntake,
      doctorName: doctorName || req.user?.name || "",
      requestedAt: new Date(),
      requestedBy: req.user?._id || "",
      status: "Pending Ward Assignment",
    };
    // The ward admission hub only lists patients that are in the ward workflow.
    patient.currentStatus = "Admitted";
    await patient.save();

    await logAudit(req, "CREATE", "Ward", `Admission request created for ${patient.patientName} (${patient.cardId}) - ${selectedDepartment} / ${selectedWardNurse}`, patient._id, "AdmissionRequest");

    res.status(201).json({
      success: true,
      message: "Admission request created successfully",
      data: {
        _id: patient._id,
        patientId: String(patient._id),
        patientName: patient.patientName,
        cardId: patient.cardId,
        status: "Pending",
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const assignBed = async (req, res) => {
  try {
    const { bedId, patientId, admissionRequestId, admissionDate, dischargeDate, medicationIntake } = req.body;
    const recordId = patientId || admissionRequestId;

    if (!bedId || !recordId) {
      return res.status(400).json({ success: false, message: "A bed and a patient are required." });
    }

    const bed = await Bed.findOne({ bedId });
    if (!bed) {
      return res.status(404).json({ success: false, message: "Bed not found." });
    }
    if (bed.status === "Occupied") {
      return res.status(409).json({ success: false, message: "That bed is already occupied." });
    }

    const patient = await PatientRecord.findById(recordId);
    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient record not found." });
    }

    const liaison = plainLiaison(patient);
    const attendingDoctor =
      liaison.doctorName || patient.consultation?.assignedDoctorName || "";

    bed.status = "Occupied";
    bed.patientName = patient.patientName || "";
    bed.patientCardId = patient.cardId || "";
    bed.admissionTime =
      liaison.admissionDate || admissionDate || new Date().toISOString();
    bed.attendingDoctor = attendingDoctor;
    bed.severity = liaison.admissionUrgency || "Routine";
    await bed.save();

    patient.currentStatus = "Ward";
    patient.liaison = {
      ...liaison,
      admissionDate: liaison.admissionDate || admissionDate || "",
      dischargeDate: liaison.dischargeDate || dischargeDate || "",
      medicationIntake: liaison.medicationIntake || medicationIntake || "",
      status: "Bed Assigned",
      bedId: bed.bedId,
      room: bed.room || bed.type || "",
      assignedAt: new Date(),
    };
    if (!patient.consultation) patient.consultation = {};
    if (!patient.consultation.assignedDoctorName && attendingDoctor) {
      patient.consultation.assignedDoctorName = attendingDoctor;
    }
    await patient.save();

    await logAudit(req, "UPDATE", "Ward", `Bed ${bed.bedId} assigned to ${patient.patientName} (${patient.cardId})`, bed._id);

    res.status(200).json({
      success: true,
      message: "Patient assigned to bed.",
      data: {
        bed,
        patient: {
          _id: patient._id,
          patientName: patient.patientName,
          cardId: patient.cardId,
          currentStatus: patient.currentStatus,
        },
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const rejectAdmissionRequest = async (req, res) => {
  try {
    const patient = await PatientRecord.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, message: "Admission request not found." });
    }

    const liaison = plainLiaison(patient);
    patient.currentStatus = "Consultation";
    patient.liaison = {
      ...liaison,
      status: "Rejected by Ward",
      rejectedAt: new Date(),
      rejectedBy: req.user?.name || "",
    };
    await patient.save();

    await logAudit(req, "UPDATE", "Ward", `Admission request rejected for ${patient.patientName} (${patient.cardId})`, patient._id, "AdmissionRequest");

    res.status(200).json({
      success: true,
      message: "Admission request rejected and patient returned to the physician.",
      data: { _id: patient._id, currentStatus: patient.currentStatus },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getBeds,
  updateBed,
  dischargeBed,
  getAdmissionRequests,
  createAdmissionRequest,
  assignBed,
  rejectAdmissionRequest,
};
