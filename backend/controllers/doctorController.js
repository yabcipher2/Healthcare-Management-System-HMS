const PatientRecord = require("../models/PatientRecord");
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
      "consultation.assignedDoctor": doctorUserId,
    };

    if (doctorDept) {
      query.triageDepartment = doctorDept;
    }

    const cases = await PatientRecord.find(query)
      .sort({ updatedAt: -1 })
      .select(
        "cardId patientName firstName middleName lastName age gender triage consultation currentStatus laboratory pharmacy triageDepartment",
      );

    // Enrich with nurse assignment data
    const enrichedCases = await Promise.all(
      cases.map(async (patientCase) => {
        const nurseAssignment = await NurseAssignment.findOne({ patientId: patientCase._id });
        return {
          ...patientCase.toObject(),
          assignedNurseName: nurseAssignment?.assignedStation || null,
          assignedNurseDepartment: nurseAssignment?.assignedStation || null,
          doctorInstructions: nurseAssignment?.doctorInstructions || "",
          carePlan: nurseAssignment?.carePlan || "",
          nurseAccepted: nurseAssignment?.nurseAccepted || false,
          nurseResponse: nurseAssignment?.nurseResponse || "",
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
      "consultation.assignedDoctor": doctorUserId,
    };

    if (doctorDept) {
      query.triageDepartment = doctorDept;
    }

    const patient = await PatientRecord.findOne(query)
      .select(
        "cardId patientName firstName middleName lastName age gender triage consultation currentStatus laboratory pharmacy triageDepartment",
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
      assignedNurseName: nurseAssignment?.assignedStation || null,
      assignedNurseDepartment: nurseAssignment?.assignedStation || null,
      doctorInstructions: nurseAssignment?.doctorInstructions || "",
      carePlan: nurseAssignment?.carePlan || "",
      nurseAccepted: nurseAssignment?.nurseAccepted || false,
      nurseResponse: nurseAssignment?.nurseResponse || "",
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
        dispenseStatus: "Pending",
      };
      if (nextStatus !== "Laboratory") {
        nextStatus = "Pharmacy";
      }

      await PharmacyOrder.create({
        orderId: `RX-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        patientCardId: patient.cardId,
        patientName: patient.patientName,
        age: patient.age,
        doctorName: req.user?.name || "Unknown Physician",
        timestamp: new Date().toISOString(),
        medications: prescriptionLines,
        linkedPatient: patient._id,
      });
    }

    patient.currentStatus = nextStatus;
    await patient.save();

    await logAudit(req, "UPDATE", "Consultation", `Consultation completed for ${patient.patientName} (${patient.cardId}) by ${req.user?.name}`, patient._id);

    res.status(200).json({ success: true, data: patient });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
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
        message: "Patient not found" 
      });
    }

    // Find all historical records for this patient (by card ID or patient name)
    const history = await PatientRecord.find({
      $or: [
        { cardId: patient.cardId },
        { patientName: patient.patientName }
      ],
      _id: { $ne: patientId } // Exclude current record
    })
    .sort({ createdAt: -1 })
    .select('cardId patientName age gender triage consultation laboratory pharmacy currentStatus createdAt updatedAt')
    .limit(10);

    res.status(200).json({ 
      success: true, 
      data: history 
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
      "radiology.clinicalIndication": clinicalIndication,
      "radiology.urgencyLevel": urgencyLevel || "Routine",
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
