const getHospitalStatus = async () => {
  try {
    const fs = require("fs").promises;
    const path = require("path");
    const STATUS_FILE = path.join(__dirname, "..", "data", "hospitalStatus.json");
    const data = await fs.readFile(STATUS_FILE, "utf8").catch(() => JSON.stringify({ status: "open" }));
    const parsed = JSON.parse(data);
    return parsed.status || "open";
  } catch (err) {
    console.error("Status check error:", err);
    return "open";
  }
};

const maintenanceMiddleware = async (req, res, next) => {
  try {
    const status = await getHospitalStatus();
    req.hospitalStatus = req.hospitalStatus || status;
    next();
  } catch (err) {
    console.error("Maintenance middleware error:", err);
    next(err);
  }
};

module.exports = maintenanceMiddleware;
