const NurseAssignment = require("../models/NurseAssignment");
const PatientRecord = require("../models/PatientRecord");

// Same definition used by the doctor's nurse workload counters.
const ACTIVE_PATIENT_STATUSES = [
  "Consultation",
  "Laboratory",
  "Radiology",
  "Pharmacy",
  "Billing",
  "Admitted",
  "Ward",
];

const getAssignments = async (req, res) => {
  try {
    // A nurse must only see the patients a doctor explicitly handed to them.
    // Returning every assignment made one dispatch look like it went to the
    // whole department. Administrators and triage still get the full board.
    const isNurse = req.user?.role === "Nurse";
    const query = isNurse ? { assignedNurse: req.user.name } : {};

    let assignments = await NurseAssignment.find(query).sort({ createdAt: -1 });

    // Keep the station board and the doctor's workload counters on exactly the
    // same definition: patients still inside the clinical pipeline.
    if (isNurse && assignments.length) {
      const patientIds = assignments
        .map((assignment) => assignment.patientId)
        .filter(Boolean);

      const activeIds = await PatientRecord.find({
        _id: { $in: patientIds },
        currentStatus: { $in: ACTIVE_PATIENT_STATUSES },
      }).distinct("_id");

      const activeSet = new Set(activeIds.map(String));
      assignments = assignments.filter(
        (assignment) =>
          !assignment.patientId || activeSet.has(String(assignment.patientId)),
      );
    }

    res.status(200).json({ success: true, count: assignments.length, data: assignments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createAssignment = async (req, res) => {
  try {
    const { patientId, cardId, patientName, age, gender, assignedStation, assignedDoctor, status, carePlan, vitals, assignedBy } = req.body;

    const existing = await NurseAssignment.findOne({ patientId });
    if (existing) {
      return res.status(400).json({ success: false, message: "Patient already assigned to a nurse." });
    }

    const assignment = await NurseAssignment.create({
      patientId,
      cardId,
      patientName,
      age,
      gender,
      assignedStation,
      assignedDoctor,
      status,
      carePlan,
      vitals,
      assignedBy,
    });

    if (patientId) {
      await PatientRecord.findByIdAndUpdate(patientId, { currentStatus: "Consultation" });
    }

    res.status(201).json({ success: true, data: assignment });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateNurseNotes = async (req, res) => {
  try {
    const { nurseNotes, medicationAdministered } = req.body;
    const assignment = await NurseAssignment.findByIdAndUpdate(
      req.params.id,
      { nurseNotes, medicationAdministered },
      { returnDocument: "after", runValidators: true }
    );
    if (!assignment) return res.status(404).json({ success: false, message: "Assignment not found." });
    await PatientRecord.findByIdAndUpdate(assignment.patientId, {
      $set: {
        nurseNotes: assignment.nurseNotes,
        medicationAdministered: assignment.medicationAdministered,
      },
    });
    res.status(200).json({ success: true, data: assignment });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateCareStatus = async (req, res) => {
  try {
    const { careStatusUpdate } = req.body;
    const assignment = await NurseAssignment.findByIdAndUpdate(
      req.params.id,
      { status: careStatusUpdate },
      { returnDocument: "after", runValidators: true }
    );
    if (!assignment) return res.status(404).json({ success: false, message: "Assignment not found." });
    // A routine progress note must not move the encounter forward. Previously
    // anything other than "Stable" pushed the patient into "Ward", which made
    // the doctor's queue and the nurse's own board drop the patient.
    const patientStatus =
      careStatusUpdate === "Observations Complete / Stable"
        ? "Billing"
        : "Consultation";
    await PatientRecord.findByIdAndUpdate(assignment.patientId, {
      $set: { nurseStatus: assignment.status, currentStatus: patientStatus },
    });
    res.status(200).json({ success: true, data: assignment });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateDoctorObservation = async (req, res) => {
  try {
    const patientId = req.params.id;
    const { nurseName, department, doctorInstructions, carePlan, status } = req.body;

    console.log("🔵 Doctor Observation Request Received:");
    console.log("   Patient ID:", patientId);
    console.log("   Nurse Name:", nurseName);
    console.log("   Department:", department);
    console.log("   Doctor Instructions:", doctorInstructions);
    console.log("   Care Plan:", carePlan);
    console.log("   Status:", status);

    // Find or create nurse assignment for this patient
    let assignment = await NurseAssignment.findOne({ patientId });

    if (!assignment) {
      // Get patient details
      const patient = await PatientRecord.findById(patientId);
      if (!patient) {
        return res.status(404).json({ 
          success: false, 
          message: "Patient record not found." 
        });
      }

      // Create new nurse assignment
      assignment = await NurseAssignment.create({
        patientId: patient._id,
        cardId: patient.cardId,
        patientName: patient.patientName || `${patient.firstName} ${patient.lastName}`,
        age: patient.age,
        gender: patient.gender,
        assignedStation: department || patient.triageDepartment || "General",
        assignedNurse: nurseName || "",
        assignedDoctor: req.user?.name || "Doctor",
        status: status || "Pending Meds",
        carePlan: carePlan || "",
        doctorInstructions: doctorInstructions || "",
        assignedBy: req.user?.name || "Doctor",
      });
      console.log("✅ Created new nurse assignment:", assignment._id);
    } else {
      // Update existing assignment with doctor's instructions
      console.log("📝 Updating existing assignment:", assignment._id);
      assignment.assignedStation = department || assignment.assignedStation;
      assignment.assignedNurse = nurseName || assignment.assignedNurse;
      assignment.assignedDoctor = req.user?.name || assignment.assignedDoctor;
      assignment.status = status || assignment.status;
      assignment.carePlan = carePlan || assignment.carePlan;
      assignment.doctorInstructions = doctorInstructions || assignment.doctorInstructions;
      await assignment.save();
      console.log("✅ Updated assignment with doctor instructions");
    }

    res.status(200).json({ 
      success: true, 
      message: "Doctor instructions dispatched to nursing station.",
      data: assignment 
    });
  } catch (error) {
    console.error("Doctor observation update error:", error);
    res.status(400).json({ 
      success: false, 
      message: error.message || "Failed to dispatch doctor instructions." 
    });
  }
};

const updateNurseResponse = async (req, res) => {
  try {
    const assignmentId = req.params.id;
    const { nurseResponse, nurseAccepted, careStatusUpdate, nurseSummary } =
      req.body;

    // Always store the newest response. Freezing the first message meant the
    // doctor kept reading an outdated summary after the nurse edited it.
    const responseUpdate = { respondedAt: new Date() };
    if (nurseResponse !== undefined) responseUpdate.nurseResponse = nurseResponse;
    if (nurseAccepted !== undefined) responseUpdate.nurseAccepted = nurseAccepted;
    if (careStatusUpdate) responseUpdate.status = careStatusUpdate;
    if (nurseSummary !== undefined) responseUpdate.nurseNotes = nurseSummary;

    const assignment = await NurseAssignment.findByIdAndUpdate(
      assignmentId,
      responseUpdate,
      { returnDocument: "after", runValidators: true }
    );

    if (!assignment) {
      return res.status(404).json({ 
        success: false, 
        message: "Assignment not found." 
      });
    }

    await PatientRecord.findByIdAndUpdate(assignment.patientId, {
      $set: {
        nurseResponse: assignment.nurseResponse,
        nurseAccepted: assignment.nurseAccepted,
        nurseStatus: assignment.status,
        nurseNotes: assignment.nurseNotes,
      },
    });

    res.status(200).json({ 
      success: true, 
      data: assignment 
    });
  } catch (error) {
    console.error("Nurse response update error:", error);
    res.status(400).json({ 
      success: false, 
      message: error.message || "Failed to update nurse response." 
    });
  }
};

module.exports = { 
  getAssignments, 
  createAssignment, 
  updateNurseNotes, 
  updateCareStatus,
  updateDoctorObservation,
  updateNurseResponse
};
