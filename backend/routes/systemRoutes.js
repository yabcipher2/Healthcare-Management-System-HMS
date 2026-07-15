const express = require("express");
const router = express.Router();
const fs = require("fs").promises;
const path = require("path");

const STATUS_FILE = path.join(__dirname, "..", "data", "hospitalStatus.json");

const readStatus = async () => {
  try {
    const data = await fs.readFile(STATUS_FILE, "utf8");
    return JSON.parse(data);
  } catch (err) {
    if (err.code === "ENOENT") {
      try {
        await fs.writeFile(STATUS_FILE, JSON.stringify({ status: "open" }));
      } catch (_writeErr) {
        // fall back to default in memory
      }
      return { status: "open" };
    }
    return { status: "open" };
  }
};

router.get("/hospital-status", async (req, res) => {
  try {
    const data = await readStatus();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put("/hospital-status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!["open", "emergency", "closed"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status" });
    }
    const payload = { status, updatedAt: new Date().toISOString() };
    await fs.writeFile(STATUS_FILE, JSON.stringify(payload, null, 2));
    res.json({ success: true, data: payload });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
