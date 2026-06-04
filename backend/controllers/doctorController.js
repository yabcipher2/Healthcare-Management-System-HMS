const PatientRecord = require("../models/PatientRecord");
const LabOrder = require("../models/LabOrder");
const PharmacyOrder = require("../models/PharmacyOrder");
const StaffProfile = require("../models/StaffProfile");
const User = require("../models/User");

const getDoctorCases = async (req, res) => {
  try {
    // Get patients assigned to the current doctor, regardless of status
    const cases = await PatientRecord.find({
      "consultation.assignedDoctor": req.user._id,
    })
      .sort({ updatedAt: -1 })
      .select(
        "cardId patientName firstName middleName lastName age gender triage consultation currentStatus laboratory pharmacy",
      );

    res.status(200).json({ success: true, count: cases.length, data: cases });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getDoctorPatient = async (req, res) => {
  try {
    // Get a specific patient only if assigned to the current doctor
    const patient = await PatientRecord.findOne({
      _id: req.params.id,
      "consultation.assignedDoctor": req.user._id,
    }).select(
      "cardId patientName firstName middleName lastName age gender triage consultation currentStatus laboratory pharmacy",
    );

    if (!patient) {
      return res
        .status(404)
        .json({ success: false, message: "Patient not found or not assigned to you" });
    }

    res.status(200).json({ success: true, data: patient });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getDoctorsByDepartment = async (req, res) => {
  try {
    const { department } = req.params;
    
    if (!department || department.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Department parameter is required"
      });
    }
    
    console.log(`[getDoctorsByDepartment] Fetching doctors for department: ${department}`);
    
    // Find staff profiles matching the department (exact match, case-insensitive)
    const staffProfiles = await StaffProfile.find({
      dept: { 
        $regex: new RegExp(`^${department.trim()}$`, "i") 
      }
    });
    
    console.log(`[getDoctorsByDepartment] Found ${staffProfiles.length} staff profiles`);
    
    if (staffProfiles.length === 0) {
      console.log(`[getDoctorsByDepartment] No staff profiles found for department: ${department}`);
      return res.status(200).json({ 
        success: true, 
        count: 0, 
        data: [],
        message: `No doctors found in ${department} department`
      });
    }
    
    // Get the user details for these staff members using staffId linkage
    const staffIds = staffProfiles
      .map(profile => profile.staffId)
      .filter(Boolean); // Remove null/undefined
    
    console.log(`[getDoctorsByDepartment] Staff IDs: ${staffIds.join(", ")}`);
    
    if (staffIds.length === 0) {
      console.log(`[getDoctorsByDepartment] No valid staffIds found in profiles`);
      return res.status(200).json({ 
        success: true, 
        count: 0, 
        data: [],
        message: "No staff IDs linked to department"
      });
    }
    
    // Try both _id and staffId field since there might be linking issues
    const doctors = await User.find({
      $or: [
        { staffId: { $in: staffIds }, role: "Doctor" },
        { _id: { $in: staffIds }, role: "Doctor" }
      ]
    })
      .select("-password")
      .lean();
    
    console.log(`[getDoctorsByDepartment] Found ${doctors.length} doctors`);
    
    res.status(200).json({ 
      success: true, 
      count: doctors.length, 
      data: doctors,
      message: doctors.length === 0 ? `No doctors found in ${department} department` : undefined
    });
  } catch (error) {
    console.error("[getDoctorsByDepartment] Error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined
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
      .filter(dept => dept && dept.trim().length > 0)
      .sort();
    
    console.log(`[getAllDepartments] Found ${filteredDepartments.length} departments: ${filteredDepartments.join(", ")}`);
    
    res.status(200).json({ 
      success: true, 
      count: filteredDepartments.length, 
      data: filteredDepartments
    });
  } catch (error) {
    console.error("[getAllDepartments] Error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
};

const dispatchToDoctor = async (req, res) => {
  try {
    const { orderId, department, dispatchedBy, timestamp } = req.body;
    
    // Validate required fields
    if (!orderId || !department) {
      return res.status(400).json({
        success: false,
        message: "Order ID and department are required"
      });
    }

    // Find the pharmacy order
    const pharmacyOrder = await PharmacyOrder.findById(orderId);
    if (!pharmacyOrder) {
      return res.status(404).json({
        success: false,
        message: "Pharmacy order not found"
      });
    }

    // Find doctors in the specified department
    const staffProfiles = await StaffProfile.find({ dept: department });
    const doctorIds = staffProfiles.map(profile => profile.staffId);
    const doctors = await User.find({ _id: { $in: doctorIds }, role: "Doctor" });
    
    if (doctors.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No doctors found in the specified department"
      });
    }

    // For simplicity, we'll select the first doctor in the department
    // In a real system, you might want to consider workload, specialty, etc.
    const selectedDoctor = doctors[0];
    
    // Create a dispatch record or notification
    // For now, we'll just update the pharmacy order with dispatch info
    // In a real system, you might create a separate Dispatch model
    pharmacyOrder.dispatchInfo = {
      dispatchedToDepartment: department,
      dispatchedToDoctor: selectedDoctor.name,
      dispatchedBy: dispatchedBy || "Pharmacist",
      dispatchedAt: timestamp || new Date().toISOString(),
      status: "Dispatched to Doctor"
    };
    
    await pharmacyOrder.save();

    res.status(200).json({
      success: true,
      message: `Prescription dispatched to ${department} department`,
      data: {
        orderId,
        department,
        dispatchedToDoctor: selectedDoctor.name,
        dispatchedAt: pharmacyOrder.dispatchInfo.dispatchedAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
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
      labRequests,
      prescriptionLines,
    } = req.body;

    const consultationUpdate = {
      symptoms: historyPresentIllness || patient.consultation?.symptoms,
      doctorNotes: physicalExamination || patient.consultation?.doctorNotes,
      diagnosis: icd11Diagnosis || patient.consultation?.diagnosis,
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
         prescribedDrugs: prescriptionLines.map(line => line.name),
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

    res.status(200).json({ success: true, data: patient });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { getDoctorCases, submitConsultation, getCompletedEncountersCount, getDoctorPatient, getDoctorsByDepartment, dispatchToDoctor, getAllDepartments };
