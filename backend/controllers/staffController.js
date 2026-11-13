const StaffProfile = require("../models/StaffProfile");
const User = require("../models/User");
const NurseAssignment = require("../models/NurseAssignment");
const PatientRecord = require("../models/PatientRecord");

// Patients still inside the clinical pipeline, used for nurse workload counts.
const ACTIVE_PATIENT_STATUSES = [
  "Consultation",
  "Laboratory",
  "Radiology",
  "Pharmacy",
  "Billing",
  "Admitted",
  "Ward",
];

// Attach each nurse's current caseload and free/busy state to a staff list.
const withNurseWorkload = async (staff) =>
  Promise.all(
    staff.map(async (member) => {
      const assignments = await NurseAssignment.find({
        assignedNurse: member.name,
      }).select("patientId");

      const patientIds = assignments
        .map((assignment) => assignment.patientId)
        .filter(Boolean);

      const activePatients = patientIds.length
        ? await PatientRecord.countDocuments({
            _id: { $in: patientIds },
            currentStatus: { $in: ACTIVE_PATIENT_STATUSES },
          })
        : 0;

      return {
        ...member.toObject(),
        activePatients,
        availability:
          activePatients === 0
            ? "Free"
            : activePatients <= 2
              ? "Moderate"
              : "Busy",
      };
    }),
  );

// The portal routes staff by `role`, so the job title must map onto a role the
// User schema and the frontend both understand. Anything unrecognised used to
// fall through to "Doctor", which sent cashiers and ward staff to the wrong
// dashboard.
const mapJobTitleToRole = (jobTitle) => {
  const title = (jobTitle || "").toLowerCase();
  if (title.includes("admin")) return "Administrator";
  if (title.includes("lab cashier") || title.includes("laboratory cashier"))
    return "Laboratory Cashier";
  if (title.includes("pharmacy cashier")) return "Pharmacy Cashier";
  if (title.includes("pharmacist")) return "Pharmacist";
  if (
    title.includes("radiolog") ||
    title.includes("ultrasound") ||
    title.includes("sonograph")
  )
    return "Radiology";
  if (
    title.includes("store") ||
    title.includes("inventory") ||
    title.includes("supply")
  )
    return "Store Manager";
  if (
    title.includes("ward manager") ||
    title.includes("charge nurse") ||
    title.trim() === "ward"
  )
    return "Ward";
  if (title.includes("triage")) return "Triage";
  if (title.includes("nurse")) return "Nurse";
  if (title.includes("cashier")) return "Cashier";
  if (title.includes("reception")) return "Receptionist";
  if (title.includes("lab") || title.includes("laboratory")) return "Lab Tech";
  if (title.includes("doctor")) return "Doctor";
  return "Doctor";
};

const getStaffList = async (req, res) => {
  try {
    const staff = await StaffProfile.find({}).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: staff.length, data: staff });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createStaff = async (req, res) => {
  console.log('📝 Staff creation attempt:', {
    name: req.body?.name,
    email: req.body?.email,
    jobTitle: req.body?.jobTitle,
    dept: req.body?.dept
  });
  
  try {
    const payload = { ...req.body };
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);

    // Ensure all required unique indexed fields have values
    if (!payload.staffId || payload.staffId === null) {
      payload.staffId = `STAFF-${timestamp}-${random}`;
    }
    if (!payload.id || payload.id === null) {
      payload.id = `ID-${timestamp}-${random}`;
    }
    if (!payload.profileId || payload.profileId === null) {
      payload.profileId = `PROFILE-${timestamp}-${random}`;
    }
    if (!payload.nationalId || payload.nationalId === null) {
      payload.nationalId = `NID-${timestamp}`;
    } else if (payload.nationalId.includes("@")) {
      // Prevent email addresses from being used as nationalId
      console.log('❌ National ID contains @');
      return res.status(400).json({
        success: false,
        message:
          "National ID cannot be an email address. Please provide a valid ID number.",
      });
    }
    if (!payload.certificationNo || payload.certificationNo === null) {
      payload.certificationNo = `CERT-${timestamp}`;
    }

    const shouldCreateUser = payload.email && payload.password;
    if (payload.email && !payload.password) {
      console.log('❌ Email provided but no password');
      return res.status(400).json({
        success: false,
        message: "Password is required when email is provided for staff login.",
      });
    }
    if (payload.password && !payload.email) {
      console.log('❌ Password provided but no email');
      return res.status(400).json({
        success: false,
        message: "Email is required when password is provided for staff login.",
      });
    }

    if (shouldCreateUser) {
      console.log('👤 Creating/updating user account...');
      const existingUser = await User.findOne({ email: payload.email });
      if (existingUser) {
        console.log('   User exists, updating...');
        existingUser.dept = payload.dept;
        existingUser.role = payload.role || mapJobTitleToRole(payload.jobTitle) || existingUser.role;
        await existingUser.save();
      } else {
        console.log('   Creating new user...');
        const userRole = payload.role || mapJobTitleToRole(payload.jobTitle);
        await User.create({
          staffId: payload.staffId,  // ADD staffId to User
          id: payload.id,            // ADD id to User
          profileId: payload.profileId,  // ADD profileId to User
          nationalId: payload.nationalId,  // ADD nationalId to User
          certificationNo: payload.certificationNo,  // ADD certificationNo to User
          name: payload.name,
          email: payload.email,
          password: payload.password,
          role: userRole,
          dept: payload.dept,
        });
      }
    }

    if (!payload.email || payload.email === null) {
      payload.email = `staff-${timestamp}-${random}@mesra.local`;
    }

    console.log('💾 Creating staff profile...');
    const created = await StaffProfile.create(payload);
    console.log('✅ Staff created successfully');
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    console.error('❌ Staff creation error:', error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateStaff = async (req, res) => {
  try {
    const updated = await StaffProfile.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      {
        returnDocument: "after",
        runValidators: true,
      },
    );
    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Staff profile not found." });
    }
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get all unique nurse departments
const getNurseDepartments = async (req, res) => {
  try {
    const departments = await User.distinct("dept", { 
      role: "Nurse",
      dept: { $exists: true, $ne: null, $ne: "" }
    });
    res.status(200).json({ 
      success: true, 
      departments: departments.filter(d => d && d.trim()) 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get nurses by department
const getNursesByDepartment = async (req, res) => {
  try {
    const { department } = req.query;
    if (!department) {
      return res.status(400).json({ 
        success: false, 
        message: "Department parameter is required" 
      });
    }
    
    const nurses = await withNurseWorkload(
      await User.find({
        role: "Nurse",
        dept: department,
      }).select("name email dept role"),
    );

    res.status(200).json({
      success: true,
      count: nurses.length,
      nurses,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all unique ward departments (for ward staff, not nurses)
const getWardDepartments = async (req, res) => {
  try {
    // Get departments of ward-related staff (Ward Manager, Ward Nurse, etc.)
    const departments = await User.distinct("dept", { 
      $or: [
        { role: "Ward" },
        { role: "Nurse", dept: /ward|inpatient/i }
      ],
      dept: { $exists: true, $ne: null, $ne: "" }
    });
    res.status(200).json({ 
      success: true, 
      departments: departments.filter(d => d && d.trim()) 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get ward staff by department (Ward Managers, Ward Nurses, etc.)
const getWardStaffByDepartment = async (req, res) => {
  try {
    const { department } = req.query;
    if (!department) {
      return res.status(400).json({ 
        success: false, 
        message: "Department parameter is required" 
      });
    }
    
    // Find staff in ward-related roles OR nurses in ward departments
    const staff = await withNurseWorkload(
      await User.find({
        dept: department,
        $or: [{ role: "Ward" }, { role: "Nurse" }],
      }).select("name email dept role"),
    );

    res.status(200).json({
      success: true,
      count: staff.length,
      staff,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { 
  getStaffList, 
  createStaff, 
  updateStaff,
  getNurseDepartments,
  getNursesByDepartment,
  getWardDepartments,
  getWardStaffByDepartment
};
