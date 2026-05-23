const express = require("express");
const router = express.Router();
const Staff = require("../models/Staff");

// 🟢 ACTION: REGISTER NEW SYSTEM PROFILE
router.post("/staff/register", async (req, res) => {
  try {
    // Sequential custom ID generation logic can be wired here or generated via database count
    const totalStaffCount = await Staff.countDocuments();
    const nextIdNum = totalStaffCount + 101;

    const newStaffRecord = new Staff({
      ...req.body,
      staffId: `S-${nextIdNum}`,
      profileId: `P-${nextIdNum + 400}`,
      hireDate: new Date(),
    });

    const savedStaff = await newStaffRecord.save();
    res.status(201).json(savedStaff);
  } catch (error) {
    res
      .status(400)
      .json({
        error: "Failed to compile registration data profile.",
        details: error.message,
      });
  }
});

// 🔵 ACTION: FETCH PAGINATED DIRECTORY (MAX 20 STAFF MEMBERS)
router.get("/staff", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20; // 👈 Strict layout rule: 20 records per page
    const skip = (page - 1) * limit;

    // Search query engine logic
    let searchCriteria = {};
    if (req.query.search) {
      searchCriteria.fullName = { $regex: req.query.search, $options: "i" };
    }

    const totalRecords = await Staff.countDocuments(searchCriteria);
    const paginatedStaff = await Staff.find(searchCriteria)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      staff: paginatedStaff,
      currentPage: page,
      totalPages: Math.ceil(totalRecords / limit),
      totalRecords,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to read database logs." });
  }
});

// 🟡 ACTION: INLINE EDIT UPDATE SESSIONS
router.put("/staff/:id", async (req, res) => {
  try {
    const updatedRecord = await Staff.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true },
    );
    res.json(updatedRecord);
  } catch (error) {
    res.status(400).json({ error: "Modification validation failed." });
  }
});

// 🔴 ACTION: SOFT DELETE - CHANGES STATUS TO INACTIVE FOR AUDIT COMPLIANCE
router.patch("/staff/:id/toggle-status", async (req, res) => {
  try {
    const staffMember = await Staff.findById(req.params.id);
    if (!staffMember)
      return res.status(404).json({ error: "Profile not found." });

    // Toggle logic
    const nextStatus =
      staffMember.contractStatus === "Active" ? "Inactive" : "Active";
    staffMember.contractStatus = nextStatus;

    await staffMember.save();
    res.json({
      message: `Contract profile shifted to ${nextStatus}.`,
      staff: staffMember,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to modify audit logs status." });
  }
});

module.exports = router;
