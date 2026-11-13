const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const router = express.Router();
const {
  getPendingUltrasoundRequests,
  submitUltrasoundResults,
  uploadUltrasoundImages,
} = require("../controllers/ultrasoundController");
const {
  protectRoute,
  authorizeRoles,
} = require("../middleware/authMiddleware");

// Scan stills are written to disk and referenced by URL, so a patient record
// never carries a multi-megabyte base64 image.
const uploadDir = path.join(__dirname, "..", "uploads", "ultrasound");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safeName = (file.originalname || "scan")
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .slice(-60);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeName}`);
  },
});

const imageUpload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024, files: 6 },
  fileFilter: (req, file, cb) => {
    if (!/^image\//i.test(file.mimetype || "")) {
      return cb(new Error("Only image files can be attached to a scan."));
    }
    cb(null, true);
  },
});

// @desc    Fetch patients waiting for ultrasound scans
// @access  Private (Radiology, Administrator)
router.get(
  "/pending",
  protectRoute,
  authorizeRoles("Radiology", "Administrator"),
  getPendingUltrasoundRequests,
);

// @desc    Attach captured scan images to a patient's imaging record
// @access  Private (Radiology, Administrator)
router.post(
  "/:id/images",
  protectRoute,
  authorizeRoles("Radiology", "Administrator"),
  (req, res, next) =>
    imageUpload.array("images", 6)(req, res, (err) =>
      err
        ? res.status(400).json({ success: false, message: err.message })
        : next(),
    ),
  uploadUltrasoundImages,
);

// @desc    Submit scan results and reports back to Doctor EMR
// @access  Private (Radiology, Administrator)
router.put(
  "/:id/results",
  protectRoute,
  authorizeRoles("Radiology", "Administrator"),
  submitUltrasoundResults,
);

module.exports = router;
