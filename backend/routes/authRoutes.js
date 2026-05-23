const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
// Change from '../models/User' to match your actual file name: Users.js
const User = require("../models/User");

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

// @route   POST /api/auth/login (Public Access)
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });
      res.json({
        success: true,
        token,
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

module.exports = router;
