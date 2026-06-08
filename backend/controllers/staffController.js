const StaffProfile = require("../models/StaffProfile");
const User = require("../models/User");

const mapJobTitleToRole = (jobTitle) => {
  const title = (jobTitle || "").toLowerCase();
  if (title.includes("admin")) return "Administrator";
  if (title.includes("doctor")) return "Doctor";
  if (title.includes("pharmacist")) return "Pharmacist";
  if (title.includes("reception")) return "Receptionist";
  if (title.includes("lab") || title.includes("laboratory"))
    return "Laboratory";
  if (title.includes("triage") || title.includes("nurse")) return "Triage";
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
      return res.status(400).json({
        success: false,
        message: "Password is required when email is provided for staff login.",
      });
    }
    if (payload.password && !payload.email) {
      return res.status(400).json({
        success: false,
        message: "Email is required when password is provided for staff login.",
      });
    }

    if (shouldCreateUser) {
      const existingUser = await User.findOne({ email: payload.email });
      if (existingUser) {
        existingUser.dept = payload.dept;
        existingUser.role = payload.role || mapJobTitleToRole(payload.jobTitle) || existingUser.role;
        await existingUser.save();
      } else {
        const userRole = payload.role || mapJobTitleToRole(payload.jobTitle);
        await User.create({
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

    const created = await StaffProfile.create(payload);
    res.status(201).json({ success: true, data: created });
  } catch (error) {
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

module.exports = { getStaffList, createStaff, updateStaff };
