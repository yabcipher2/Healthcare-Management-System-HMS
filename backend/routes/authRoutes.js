const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { protectRoute } = require("../middleware/authMiddleware");
const User = require("../models/User");

const getDashboardRoute = (role) => {
  const normalizedRole = (role || "").toLowerCase();
  if (normalizedRole.includes("administrator")) return "admin";
  if (normalizedRole.includes("pharmacist")) return "pharmacy";
  if (normalizedRole.includes("laboratory") || normalizedRole.includes("lab"))
    return "laboratory";
  if (normalizedRole.includes("doctor")) return "doctor";
  if (normalizedRole.includes("reception")) return "reception";
  if (normalizedRole.includes("triage") || normalizedRole.includes("nurse"))
    return "triage";
  return "home";
};

// @route   POST /api/auth/register (Public Access)
router.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists)
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });

    const staffCount = await User.countDocuments({});
    const staffIndex = staffCount + 1;
    const staffId = `S-${100 + staffIndex}`;
    const profileId = `P-${500 + staffIndex}`;
    const nationalId = `NID-${Date.now()}`;
    const certificationNo = `CERT-${Date.now()}`;
    const id = `ID-${1000 + staffIndex}`;

    const user = await User.create({
      staffId,
      id,
      profileId,
      nationalId,
      certificationNo,
      name,
      email,
      password,
      role,
    });
    res.status(201).json({
      success: true,
      message: "Staff profile initialized successfully",
      data: user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/auth/change-password (Protected)
router.post("/change-password", protectRoute, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current and new passwords are required.",
      });
    }

    const user = await User.findById(req.user._id).select("+password");
    if (!user || !(await user.matchPassword(currentPassword))) {
      return res
        .status(401)
        .json({ success: false, message: "Current password is incorrect." });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: "Password updated successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/auth/login (Public Access)
router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Email and password are required." });
  }

  try {
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });
      const dashboardRoute = getDashboardRoute(user.role);
      res.json({
        success: true,
        token,
        dashboardRoute,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } else {
      res
        .status(401)
        .json({ success: false, message: "Invalid active credentials" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/auth/me (Protected)
router.get("/me", protectRoute, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    let staffProfile = null;
    if (user.staffId) {
      staffProfile = await StaffProfile.findOne({ staffId: user.staffId });
    }
    res.json({
      success: true,
      data: {
        ...user._doc,
        staffProfile,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
