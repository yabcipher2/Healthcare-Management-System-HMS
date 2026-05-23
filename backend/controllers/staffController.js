const StaffProfile = require("../models/StaffProfile");

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
    }
    if (!payload.certificationNo || payload.certificationNo === null) {
      payload.certificationNo = `CERT-${timestamp}`;
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
    const updated = await StaffProfile.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
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
