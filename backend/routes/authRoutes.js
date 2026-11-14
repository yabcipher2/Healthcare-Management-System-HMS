const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { protectRoute } = require("../middleware/authMiddleware");
const User = require("../models/User");
const StaffProfile = require("../models/StaffProfile");
const AuditLog = require("../models/AuditLog");

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

// @route   POST /api/auth/reset-password (Public Access)
// Self-service recovery for staff who forgot their access key: the work email
// plus the Staff ID printed on their ID badge prove the account is theirs. Each
// account allows 5 attempts per 15 minutes, and every attempt is audit-logged.
const RESET_WINDOW_MS = 15 * 60 * 1000;
const MAX_RESET_ATTEMPTS = 5;

router.post("/reset-password", async (req, res) => {
  const email = String(req.body?.email || "")
    .trim()
    .toLowerCase();
  const staffId = String(req.body?.staffId || "").trim();
  const newPassword = String(req.body?.newPassword || "");

  if (!email || !staffId || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "Email, Staff ID and the new password are required.",
    });
  }
  if (newPassword.length < 4) {
    return res.status(400).json({
      success: false,
      message: "The new password must be at least 4 characters long.",
    });
  }

  try {
    const user = await User.findOne({ email }).select("+password");
    const now = Date.now();
    const windowStart = user?.resetWindowStart
      ? new Date(user.resetWindowStart).getTime()
      : 0;
    const attempts =
      windowStart && now - windowStart < RESET_WINDOW_MS
        ? user.resetAttempts || 0
        : 0;

    if (attempts >= MAX_RESET_ATTEMPTS) {
      return res.status(429).json({
        success: false,
        message:
          "Too many verification attempts. Wait 15 minutes or ask an administrator to reset the account.",
      });
    }

    const staffIdMatches =
      !!user &&
      String(user.staffId || "")
        .trim()
        .toLowerCase() === staffId.toLowerCase();

    if (!staffIdMatches) {
      if (user) {
        user.resetAttempts = attempts + 1;
        user.resetWindowStart = new Date(now);
        await user.save({ validateBeforeSave: false });
        try {
          await AuditLog.create({
            action: "UPDATE",
            module: "Auth",
            userId: String(user._id),
            userName: user.name,
            userRole: user.role,
            details: `Failed password recovery attempt for ${user.email}`,
            ipAddress: req.ip || "",
          });
        } catch (auditError) {
          console.error("Reset audit log failed:", auditError.message);
        }
      }
      // Same answer whether the email is unknown or the Staff ID is wrong.
      return res.status(401).json({
        success: false,
        message: "That email and Staff ID do not match any account.",
      });
    }

    user.password = newPassword;
    user.resetAttempts = 0;
    user.resetWindowStart = undefined;
    await user.save();

    try {
      await AuditLog.create({
        action: "UPDATE",
        module: "Auth",
        userId: String(user._id),
        userName: user.name,
        userRole: user.role,
        targetId: String(user._id),
        targetType: "User",
        details: `Password reset through self-service recovery for ${user.email}`,
        ipAddress: req.ip || "",
      });
    } catch (auditError) {
      console.error("Reset audit log failed:", auditError.message);
    }

    res.json({
      success: true,
      message: "Password updated. Sign in with your new access key.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/auth/login (Public Access)
router.post("/login", async (req, res) => {
  console.log('🔐 Login attempt received:', { email: req.body?.email, hasPassword: !!req.body?.password });
  
  // Emails are stored lowercase, and query filters do not run schema setters,
  // so a login typed as "Admin@Mesra.com" would otherwise never match.
  const email = (req.body?.email || "").toString().trim().toLowerCase();
  const password = req.body?.password;
  if (!email || !password) {
    console.log('❌ Missing email or password');
    return res
      .status(400)
      .json({ success: false, message: "Email and password are required." });
  }

  try {
    console.log('📧 Looking up user:', email);
    const user = await User.findOne({ email });
    console.log('👤 User found:', !!user);
    
    if (!user) {
      console.log('❌ User not found');
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password." });
    }
    
    // Check if user has a password field
    if (!user.password) {
      console.log('❌ User has no password hash in database');
      return res
        .status(500)
        .json({ success: false, message: "Account configuration error. Please contact administrator." });
    }
    
    console.log('🔒 Comparing passwords...');
    const isPasswordMatch = await user.matchPassword(password);
    console.log('🔑 Password matched:', isPasswordMatch);
    
    if (isPasswordMatch) {
      console.log('✅ Password matched - generating token');
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });
      const dashboardRoute = getDashboardRoute(user.role);
      let dept = user.dept;
      if (!dept && user.staffId) {
        const profile = await StaffProfile.findOne({ staffId: user.staffId });
        dept = profile?.dept || "";
        if (dept) {
          user.dept = dept;
          await user.save();
        }
      }
      console.log('✅ Login successful, sending response');
      res.json({
        success: true,
        token,
        dashboardRoute,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          dept,
        },
      });
    } else {
      console.log('❌ Invalid credentials - password mismatch');
      res
        .status(401)
        .json({ success: false, message: "Invalid email or password." });
    }
  } catch (error) {
    console.error('❌ Login error:', error);
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
