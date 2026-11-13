const PatientRecord = require("../models/PatientRecord");
const Diagnosis = require("../models/Diagnosis");
const NurseAssignment = require("../models/NurseAssignment");
const LabOrder = require("../models/LabOrder");
const PharmacyOrder = require("../models/PharmacyOrder");
const StaffProfile = require("../models/StaffProfile");
const User = require("../models/User");
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

const getDoctorCases = async (req, res) => {
  try {
    const doctorUserId = req.user._id;
    const NurseAssignment = require("../models/NurseAssignment");
    const staffProfile = await StaffProfile.findOne({ profileId: doctorUserId, jobTitle: "Doctor" });
    const doctorDept = staffProfile?.dept || "";

    const query = {
      "consultation.assignedDoctor": {
        $in: [doctorUserId, doctorUserId.toString()],
      },
      // A card handed back to reception leaves the doctor's active caseload.
      currentStatus: {
        $in: [
          "Consultation",
          "Laboratory",
          "Radiology",
          "Pharmacy",
          "Billing",
          "Admitted",
          "Ward",
        ],
      },
    };

    if (doctorDept) {
      query.triageDepartment = doctorDept;
    }

    const cases = await PatientRecord.find(query)
      .sort({ updatedAt: -1 })
      .select(
        "cardId patientName firstName middleName lastName age gender triage consultation currentStatus laboratory pharmacy radiology triageDepartment liaison",
      );

    // Enrich with nurse assignment data
    const enrichedCases = await Promise.all(
      cases.map(async (patientCase) => {
        const nurseAssignment = await NurseAssignment.findOne({ patientId: patientCase._id });
        return {
          ...patientCase.toObject(),
          assignedNurseName: nurseAssignment?.assignedNurse || "",
          assignedNurseDepartment:
            nurseAssignment?.department ||
            nurseAssignment?.assignedStation ||
            "",
          doctorInstructions: nurseAssignment?.doctorInstructions || "",
          carePlan: nurseAssignment?.carePlan || "",
          nurseAccepted: nurseAssignment?.nurseAccepted || false,
          nurseResponse: nurseAssignment?.nurseResponse || "",
          nurseNotes: nurseAssignment?.nurseNotes || "",
          nurseStatus: nurseAssignment?.status || "",
        };
      })
    );

    res.status(200).json({ success: true, count: enrichedCases.length, data: enrichedCases });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getDoctorPatient = async (req, res) => {
  try {
    const doctorUserId = req.user._id;
    const NurseAssignment = require("../models/NurseAssignment");
    const staffProfile = await StaffProfile.findOne({ profileId: doctorUserId, jobTitle: "Doctor" });
    const doctorDept = staffProfile?.dept || "";

    const query = {
      _id: req.params.id,
      "consultation.assignedDoctor": {
        $in: [doctorUserId, doctorUserId.toString()],
      },
    };

    if (doctorDept) {
      query.triageDepartment = doctorDept;
    }

    const patient = await PatientRecord.findOne(query)
      .select(
        "cardId patientName firstName middleName lastName age gender triage consultation currentStatus laboratory pharmacy radiology triageDepartment liaison",
      );

    if (!patient) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Patient not found or not assigned to you",
        });
    }

    // Get nurse assignment data
    const nurseAssignment = await NurseAssignment.findOne({ patientId: patient._id });
    const enrichedPatient = {
      ...patient.toObject(),
      assignedNurseName: nurseAssignment?.assignedNurse || "",
      assignedNurseDepartment:
        nurseAssignment?.department ||
        nurseAssignment?.assignedStation ||
        "",
      doctorInstructions: nurseAssignment?.doctorInstructions || "",
      carePlan: nurseAssignment?.carePlan || "",
      nurseAccepted: nurseAssignment?.nurseAccepted || false,
      nurseResponse: nurseAssignment?.nurseResponse || "",
      nurseNotes: nurseAssignment?.nurseNotes || "",
      nurseStatus: nurseAssignment?.status || "",
    };

    res.status(200).json({ success: true, data: enrichedPatient });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getDoctorsByDepartment = async (req, res) => {
  try {
    let { department } = req.params;

    // Safely extract string if department was mistakenly passed as an object string template
    if (department && department.includes("[object Object]")) {
      return res.status(400).json({
        success: false,
        message: "Invalid department parameter format",
      });
    }

    if (!department || department.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Department parameter is required",
      });
    }

    const targetDept = department.trim();
    console.log(
      `[getDoctorsByDepartment] Fetching doctors for department: ${targetDept}`,
    );

    // Find staff profiles matching the department (exact match, case-insensitive)
    const staffProfiles = await StaffProfile.find({
      dept: {
        $regex: new RegExp(`^${targetDept}$`, "i"),
      },
    });

    console.log(
      `[getDoctorsByDepartment] Found ${staffProfiles.length} staff profiles`,
    );

    if (staffProfiles.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
        message: `No doctors found in ${targetDept} department`,
      });
    }

    // Get the user details for these staff members using staffId linkage
    const staffIds = staffProfiles
      .map((profile) => profile.staffId)
      .filter(Boolean); // Remove null/undefined

    if (staffIds.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
        message: "No staff IDs linked to department",
      });
    }

    // Build query to dynamically look up matching user records cleanly
    const queryConditions = [{ staffId: { $in: staffIds }, role: "Doctor" }];

    // Safely verify if any staff IDs match standard MongoDB 24-char hex ObjectIDs before querying by _id
    const validObjectIds = staffIds.filter((id) =>
      /^[0-9a-fA-F]{24}$/.test(id.toString()),
    );
    if (validObjectIds.length > 0) {
      queryConditions.push({ _id: { $in: validObjectIds }, role: "Doctor" });
    }

    const doctors = await User.find({ $or: queryConditions })
      .select("-password")
      .lean();

    console.log(`[getDoctorsByDepartment] Found ${doctors.length} doctors`);

    res.status(200).json({
      success: true,
      count: doctors.length,
      data: doctors,
      message:
        doctors.length === 0
          ? `No doctors found in ${targetDept} department`
          : undefined,
    });
  } catch (error) {
    console.error("[getDoctorsByDepartment] Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllDepartments = async (req, res) => {
  try {
    console.log("[getAllDepartments] Fetching all departments");

    // Get all unique departments from StaffProfile
    const departments = await StaffProfile.distinct("dept");

    // Filter out empty/null values and sort
    const filteredDepartments = departments
      .filter((dept) => dept && dept.toString().trim().length > 0)
      .map((dept) => dept.toString().trim())
      .sort();

    res.status(200).json({
      success: true,
      count: filteredDepartments.length,
      data: filteredDepartments,
    });
  } catch (error) {
    console.error("[getAllDepartments] Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const dispatchToDoctor = async (req, res) => {
  try {
    const { orderId, department, dispatchedBy, timestamp } = req.body;

    if (!orderId || !department) {
      return res.status(400).json({
        success: false,
        message: "Order ID and department are required",
      });
    }

    const pharmacyOrder = await PharmacyOrder.findById(orderId);
    if (!pharmacyOrder) {
      return res.status(404).json({
        success: false,
        message: "Pharmacy order not found",
      });
    }

    const staffProfiles = await StaffProfile.find({ dept: department });
    const doctorIds = staffProfiles.map((profile) => profile.staffId);

    const queryConditions = [];
    const validObjectIds = doctorIds.filter((id) =>
      /^[0-9a-fA-F]{24}$/.test(id?.toString()),
    );
    if (validObjectIds.length > 0) {
      queryConditions.push({ _id: { $in: validObjectIds }, role: "Doctor" });
    }
    queryConditions.push({ staffId: { $in: doctorIds }, role: "Doctor" });

    const doctors = await User.find({ $or: queryConditions });

    if (doctors.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No doctors found in the specified department",
      });
    }

    const selectedDoctor = doctors[0];

    pharmacyOrder.dispatchInfo = {
      dispatchedToDepartment: department,
      dispatchedToDoctor: selectedDoctor.name,
      dispatchedBy: dispatchedBy || "Pharmacist",
      dispatchedAt: timestamp || new Date().toISOString(),
      status: "Dispatched to Doctor",
    };

    await pharmacyOrder.save();

    res.status(200).json({
      success: true,
      message: `Prescription dispatched to ${department} department`,
      data: {
        orderId,
        department,
        dispatchedToDoctor: selectedDoctor.name,
        dispatchedAt: pharmacyOrder.dispatchInfo.dispatchedAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getCompletedEncountersCount = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const count = await PatientRecord.countDocuments({
      currentStatus: "Discharged",
      updatedAt: { $gte: today },
    });

    res.status(200).json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const submitConsultation = async (req, res) => {
  try {
    const patient = await PatientRecord.findById(req.params.id);
    if (!patient) {
      return res
        .status(404)
        .json({ success: false, message: "Patient record not found." });
    }

    const {
      historyPresentIllness,
      physicalExamination,
      icd11Diagnosis,
      pastMedicalHistory,
      familyHistory,
      allergies,
      labRequests,
      prescriptionLines,
      returnToReception,
      radiologyForm,
      nurseForm,
      liaisonForm,
      transferForm,
    } = req.body;

    const consultationUpdate = {
      symptoms: historyPresentIllness || patient.consultation?.symptoms,
      doctorNotes: physicalExamination || patient.consultation?.doctorNotes,
      diagnosis: icd11Diagnosis || patient.consultation?.diagnosis,
      historyPresentIllness: historyPresentIllness || patient.consultation?.historyPresentIllness || "",
      physicalExamination: physicalExamination || patient.consultation?.physicalExamination || "",
      icd11Diagnosis: icd11Diagnosis || patient.consultation?.icd11Diagnosis || "",
      pastMedicalHistory: pastMedicalHistory || patient.consultation?.pastMedicalHistory || "",
      familyHistory: familyHistory || patient.consultation?.familyHistory || "",
      allergies: allergies || patient.consultation?.allergies || "",
      assignedDoctor: req.user?._id || patient.consultation?.assignedDoctor,
    };

    patient.consultation = consultationUpdate;

    let nextStatus = "Consultation";
    if (Array.isArray(labRequests) && labRequests.length > 0) {
      patient.laboratory = {
        ...(patient.laboratory || {}),
        testRequests: labRequests,
        labStatus: "Pending",
      };
      nextStatus = "Laboratory";

      await LabOrder.create({
        accessionId: `LAB-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        patientCardId: patient.cardId,
        patientName: patient.patientName,
        age: patient.age,
        gender: patient.gender,
        requestedBy: req.user?.name || "Unknown Physician",
        timestamp: new Date().toISOString(),
        urgency: "Routine",
        panels: labRequests,
        specimen: "Pending Specimen",
        linkedPatient: patient._id,
      });
    }

    if (Array.isArray(prescriptionLines) && prescriptionLines.length > 0) {
      patient.pharmacy = {
        ...(patient.pharmacy || {}),
        prescribedDrugs: prescriptionLines.map((line) => line.name),
        prescriptionLines,
        dispenseStatus: "Pending",
      };
      if (nextStatus !== "Laboratory") {
        nextStatus = "Pharmacy";
      }

      // Price the prescription here so the pharmacy desk and the cashier queue
      // show the same tariff the patient is billed for.
      const MedicineStock = require("../models/MedicineStock");
      const {
        resolveMedicationLines,
      } = require("../config/medicinePrices");
      const inventory = await MedicineStock.find({})
        .select("name price stock")
        .lean();
      const { lines, totalAmount } = resolveMedicationLines(
        prescriptionLines,
        inventory,
      );

      await PharmacyOrder.create({
        orderId: `RX-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        patientCardId: patient.cardId,
        patientName: patient.patientName,
        age: patient.age,
        doctorName: req.user?.name || "Unknown Physician",
        timestamp: new Date().toISOString(),
        medications: lines,
        totalAmount,
        linkedPatient: patient._id,
      });
    }

    patient.currentStatus = returnToReception ? "Registration" : nextStatus;
    await patient.save();

    // Card handed back to reception: this encounter is finished, so archive
    // every sub-tab onto a Diagnosis history file and wipe the visit-scoped
    // fields. The next time this card is sent to a doctor the sub-tabs open
    // empty and the previous visit lives in the patient's history folder.
    if (returnToReception) {
      const assignment = await NurseAssignment.findOne({ patientId: patient._id });
      const lab = patient.laboratory || {};
      const radiology = patient.radiology || {};
      const pharmacy = patient.pharmacy || {};
      const liaison = patient.liaison || {};

      const archivedPrescriptions = (
        (pharmacy.prescriptionLines || []).length > 0
          ? pharmacy.prescriptionLines
          : prescriptionLines || []
      ).map((line) => ({
        name: line.name || "",
        dosage: line.dosage || "",
        frequency: line.frequency || "",
        duration: line.duration || "",
      }));

      const archivedLabRequests =
        (lab.testRequests || []).length > 0
          ? lab.testRequests
          : Array.isArray(labRequests)
            ? labRequests
            : [];

      const imagingRegions =
        (radiology.requestedModalities || []).length > 0
          ? radiology.requestedModalities
          : radiologyForm?.regions || [];
      const hasImaging =
        imagingRegions.length > 0 ||
        Boolean(radiology.requestedModality) ||
        Boolean(radiology.clinicalIndication || radiologyForm?.indication);

      const preferredWard = liaison.preferredWard || liaisonForm?.preferredWard || "";
      const hasLiaison = Boolean(
        preferredWard || liaison.clinicalReason || liaisonForm?.clinicalReason,
      );

      try {
        await Diagnosis.create({
          patientId: patient._id,
          patientMrn: patient.cardId,
          doctorName:
            req.user?.name || patient.consultation?.assignedDoctorName || "Attending Physician",
          triageSnapshot: patient.triage
            ? {
                bloodPressure: patient.triage.bloodPressure,
                heartRate: patient.triage.heartRate,
                temperature: patient.triage.temperature,
                respiratoryRate: patient.triage.respiratoryRate,
                weight: patient.triage.weight,
                spo2: patient.triage.spo2,
                triageCategory: patient.triage.triageCategory,
              }
            : undefined,
          hpi: consultationUpdate.historyPresentIllness || "No HPI documented.",
          physicalExamination: consultationUpdate.physicalExamination || "",
          pastMedicalHistory: consultationUpdate.pastMedicalHistory || "",
          familyHistory: consultationUpdate.familyHistory || "",
          allergies: consultationUpdate.allergies || "",
          icd11Diagnosis:
            consultationUpdate.icd11Diagnosis || "Encounter Record",
          labRequests: archivedLabRequests,
          labResultsSnapshot:
            lab.testResults && Object.keys(lab.testResults).length > 0
              ? lab.testResults
              : undefined,
          prescriptions: archivedPrescriptions,
          radiologyRequest: hasImaging
            ? {
                region: radiology.requestedModality || "",
                regions: imagingRegions,
                indication:
                  radiology.clinicalIndication || radiologyForm?.indication || "",
                urgency:
                  radiology.urgencyLevel || radiologyForm?.urgency || "Routine",
                reportText: radiology.reportText || "",
                imageUrls: radiology.imageUrls || [],
              }
            : undefined,
          nurseData: {
            assignedNurseId:
              assignment?.assignedNurseId?.toString() ||
              assignment?._id?.toString() ||
              "",
            assignedNurseName:
              assignment?.assignedNurse || patient.assignedNurseName || "",
            doctorInstructions:
              nurseForm?.doctorInstructions ||
              assignment?.doctorInstructions ||
              patient.doctorInstructions ||
              "",
            carePlan:
              nurseForm?.carePlan || assignment?.carePlan || patient.carePlan || "",
            status: nurseForm?.status || assignment?.status || "",
            nurseResponse: patient.nurseResponse || assignment?.nurseResponse || "",
          },
          liaisonData: hasLiaison
            ? {
                preferredWard,
                admissionUrgency:
                  liaison.admissionUrgency || liaisonForm?.admissionUrgency || "Routine",
                clinicalReason: liaison.clinicalReason || liaisonForm?.clinicalReason || "",
                admissionDate: liaison.admissionDate || liaisonForm?.admissionDate || "",
                dischargeDate: liaison.dischargeDate || liaisonForm?.dischargeDate || "",
                medicationIntake:
                  liaison.medicationIntake || liaisonForm?.medicationIntake || "",
              }
            : undefined,
          transferData: transferForm?.targetFacility
            ? {
                targetFacility: transferForm.targetFacility,
                clinicalReason: transferForm.clinicalReason || "",
                admissionUrgency: transferForm.admissionUrgency || "Routine",
              }
            : undefined,
          timestamp: new Date(),
        });
      } catch (archiveError) {
        // Never block the hand-back to reception if archiving fails.
        console.error("[submitConsultation] history archive failed:", archiveError.message);
      }

      await NurseAssignment.deleteMany({ patientId: patient._id });
      await PatientRecord.findByIdAndUpdate(patient._id, {
        $set: {
          // Keep the routing fields so the card re-enters the same doctor's
          // queue when reception sends it forward again.
          "consultation.assignedDoctor": patient.consultation?.assignedDoctor,
          "consultation.assignedDoctorName":
            patient.consultation?.assignedDoctorName || "",
          "consultation.assignedDoctorEmail":
            patient.consultation?.assignedDoctorEmail || "",
          "consultation.dispatchedDepartment":
            patient.consultation?.dispatchedDepartment || "",
          // Visit documentation is archived, so the tabs start clean.
          "consultation.historyPresentIllness": "",
          "consultation.physicalExamination": "",
          "consultation.icd11Diagnosis": "",
          "consultation.pastMedicalHistory": "",
          "consultation.familyHistory": "",
          "consultation.allergies": "",
          "consultation.symptoms": "",
          "consultation.doctorNotes": "",
          "consultation.diagnosis": "",
        },
        $unset: {
          laboratory: "",
          radiology: "",
          pharmacy: "",
          liaison: "",
          nurseResponse: "",
          nurseAccepted: "",
          nurseNotes: "",
          nurseStatus: "",
          doctorInstructions: "",
        },
      });
      await logAudit(
        req,
        "UPDATE",
        "Consultation",
        `Encounter archived to history and visit tabs cleared for ${patient.patientName} (${patient.cardId}) on return to reception`,
        patient._id,
      );
    }

    await logAudit(req, "UPDATE", "Consultation", `Consultation completed for ${patient.patientName} (${patient.cardId}) by ${req.user?.name}`, patient._id);

    res.status(200).json({ success: true, data: patient });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Shape a legacy PatientRecord (an encounter never archived as a Diagnosis)
// into the same history-file structure the doctor UI renders.
const mapRecordToHistoryFile = (record) => {
  const consultation = record.consultation || {};
  const laboratory = record.laboratory || {};
  const radiology = record.radiology || {};
  const pharmacy = record.pharmacy || {};
  const triage = record.triage || {};

  const regions =
    (radiology.requestedModalities || []).length > 0
      ? radiology.requestedModalities
      : radiology.requestedModality
        ? [radiology.requestedModality]
        : [];

  return {
    _id: record._id,
    patientId: record._id,
    patientMrn: record.cardId,
    doctorName:
      consultation.assignedDoctorName || record.doctorName || "Attending Physician",
    hpi: consultation.historyPresentIllness || consultation.symptoms || "",
    physicalExamination:
      consultation.physicalExamination || consultation.doctorNotes || "",
    pastMedicalHistory: consultation.pastMedicalHistory || "",
    familyHistory: consultation.familyHistory || "",
    allergies: consultation.allergies || "",
    icd11Diagnosis:
      consultation.icd11Diagnosis || consultation.diagnosis || "Encounter Record",
    triageSnapshot:
      triage.bloodPressure || triage.heartRate || triage.temperature
        ? {
            bloodPressure: triage.bloodPressure,
            heartRate: triage.heartRate,
            temperature: triage.temperature,
            respiratoryRate: triage.respiratoryRate,
            weight: triage.weight,
            spo2: triage.spo2,
            triageCategory: triage.triageCategory,
          }
        : undefined,
    labRequests: laboratory.testRequests || [],
    labResultsSnapshot:
      laboratory.testResults && Object.keys(laboratory.testResults).length > 0
        ? laboratory.testResults
        : undefined,
    prescriptions: (pharmacy.prescriptionLines || []).length
      ? pharmacy.prescriptionLines.map((line) => ({
          name: line.name || "",
          dosage: line.dosage || "",
          frequency: line.frequency || "",
          duration: line.duration || "",
        }))
      : (pharmacy.prescribedDrugs || []).map((name) => ({ name })),
    radiologyRequest: regions.length
      ? {
          region: radiology.requestedModality || "",
          regions,
          indication: radiology.clinicalIndication || "",
          urgency: radiology.urgencyLevel || "Routine",
          reportText: radiology.reportText || "",
          imageUrls: radiology.imageUrls || [],
        }
      : undefined,
    nurseData: record.doctorInstructions || record.assignedNurseName
      ? {
          assignedNurseName: record.assignedNurseName || "",
          doctorInstructions: record.doctorInstructions || "",
          carePlan: record.carePlan || "",
          status: record.nurseStatus || "",
          nurseResponse: record.nurseResponse || "",
        }
      : undefined,
    liaisonData: record.liaison?.preferredWard || record.liaison?.clinicalReason
      ? record.liaison
      : undefined,
    timestamp: record.updatedAt || record.createdAt,
  };
};

// Get patient history
const getPatientHistory = async (req, res) => {
  try {
    const patientId = req.params.id;

    // Get the current patient record
    const patient = await PatientRecord.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    // Archived encounter files. One is written every time a card is returned
    // to reception, so a returning patient always has their previous visits.
    const archived = await Diagnosis.find({ patientMrn: patient.cardId })
      .sort({ timestamp: -1 })
      .limit(25)
      .lean();

    // Older cards that predate archiving: other PatientRecord documents for the
    // same person that still carry clinical documentation.
    const legacyRecords = await PatientRecord.find({
      patientName: patient.patientName,
      _id: { $ne: patient._id },
      $or: [
        { "consultation.icd11Diagnosis": { $nin: ["", null] } },
        { "consultation.diagnosis": { $nin: ["", null] } },
        { "laboratory.testRequests.0": { $exists: true } },
        { "pharmacy.prescribedDrugs.0": { $exists: true } },
        { "radiology.requestedModality": { $exists: true } },
        { "radiology.requestedModalities.0": { $exists: true } },
      ],
    })
      .sort({ updatedAt: -1 })
      .limit(10)
      .lean();

    const history = [
      ...archived,
      ...legacyRecords.map(mapRecordToHistoryFile),
    ].sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

    res.status(200).json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (error) {
    console.error('Error fetching patient history:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Get recommended nurse for patient
const getRecommendedNurse = async (req, res) => {
  try {
    const patientId = req.params.id;
    
    // Get the patient record
    const patient = await PatientRecord.findById(patientId);
    if (!patient) {
      return res.status(404).json({ 
        success: false, 
        message: "Patient not found" 
      });
    }

    // Get the patient's department
    const department = patient.triageDepartment || patient.consultation?.department;
    
    if (!department) {
      return res.status(200).json({ 
        success: true, 
        data: null,
        message: "No department assigned to patient"
      });
    }

    // Find nurses in the same department with the least workload
    const nurses = await User.find({ 
      role: "Nurse",
      dept: department
    }).select("name email dept");

    if (nurses.length === 0) {
      return res.status(200).json({ 
        success: true, 
        data: null,
        message: `No nurses available in ${department} department`
      });
    }

    // For now, return the first nurse (can be enhanced with workload calculation)
    const recommendedNurse = {
      name: nurses[0].name,
      email: nurses[0].email,
      department: nurses[0].dept,
      reason: "Available in patient's department"
    };

    res.status(200).json({ 
      success: true, 
      data: recommendedNurse 
    });
  } catch (error) {
    console.error('Error getting recommended nurse:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Create laboratory order from doctor
const createDoctorLabOrder = async (req, res) => {
  try {
    const patientId = req.params.id;
    const { dispatchedTests, authorizingPhysician, linkedPatient, clinicalSummary } = req.body;
    
    const LabOrder = require("../models/LabOrder");
    
    // Get patient details
    const patient = await PatientRecord.findById(patientId);
    if (!patient) {
      return res.status(404).json({ 
        success: false, 
        message: "Patient not found" 
      });
    }
    
    // Create lab order
    const order = await LabOrder.create({
      accessionId: `LAB-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      patientCardId: patient.cardId,
      patientName: patient.patientName || `${patient.firstName} ${patient.lastName}`,
      age: patient.age,
      gender: patient.gender,
      requestedBy: authorizingPhysician || req.user?.name || "Doctor",
      timestamp: new Date().toISOString(),
      urgency: "Routine",
      panels: dispatchedTests || [],
      specimen: "Pending Specimen",
      status: "Pending",
      linkedPatient: linkedPatient || patientId,
      clinicalSummary: clinicalSummary || "",
    });
    
    // Update patient record
    await PatientRecord.findByIdAndUpdate(patientId, {
      "laboratory.testRequests": dispatchedTests || [],
      "laboratory.labStatus": "Pending",
      "laboratory.clinicalSummary": clinicalSummary || "",
      currentStatus: "Laboratory",
    });
    
    await logAudit(req, "CREATE", "Laboratory", `Lab order ${order.accessionId} created by ${authorizingPhysician} for ${patient.patientName}`, order._id);
    
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    console.error('Error creating lab order:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Create radiology order from doctor
const createDoctorRadiologyOrder = async (req, res) => {
  try {
    const patientId = req.params.id;
    const { selectedRegions, clinicalIndication, urgencyLevel } = req.body;
    
    // Validate selectedRegions array
    if (!Array.isArray(selectedRegions) || selectedRegions.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Please select at least one imaging region" 
      });
    }
    
    // Get patient details
    const patient = await PatientRecord.findById(patientId);
    if (!patient) {
      return res.status(404).json({ 
        success: false, 
        message: "Patient not found" 
      });
    }
    
    // Update patient record with radiology request
    await PatientRecord.findByIdAndUpdate(patientId, {
      "radiology.imagingStatus": "Pending Ultrasound Scan",
      "radiology.requestedModalities": selectedRegions,
      "radiology.requestedModality": selectedRegions[0],
      "radiology.clinicalIndication": clinicalIndication,
      "radiology.urgencyLevel": urgencyLevel || "Routine",
      // Stamp the referral so the ultrasound worklist shows who ordered it
      // and when, instead of a blank "Attending Physician / Not recorded".
      "radiology.authorizingPhysician": req.user?.name || "Attending Physician",
      "radiology.timestamp": new Date(),
      // A new referral must not inherit the previous study's report.
      "radiology.reportText": "",
      "radiology.imageUrls": [],
      "radiology.resultsTimestamp": null,
      "radiology.releasedBy": "",
      currentStatus: "Radiology",
    });
    
    await logAudit(req, "CREATE", "Radiology", `Radiology order for ${selectedRegions.join(", ")} created for ${patient.patientName}`, patientId);
    
    res.status(201).json({ success: true, message: "Radiology order created successfully" });
  } catch (error) {
    console.error('Error creating radiology order:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDoctorCases,
  submitConsultation,
  getCompletedEncountersCount,
  getDoctorPatient,
  getDoctorsByDepartment,
  dispatchToDoctor,
  getAllDepartments,
  getPatientHistory,
  getRecommendedNurse,
  createDoctorLabOrder,
  createDoctorRadiologyOrder,
};
