const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const maintenanceMiddleware = require("./middleware/maintenanceMiddleware");

// Load settings environment format
dotenv.config();

const app = express();

const startServer = async () => {
  await connectDB();

  app.use(express.json());
  app.use(cors());

  app.use(maintenanceMiddleware);

  app.use("/api/auth", require("./routes/authRoutes"));
  app.use("/api/staffs", require("./routes/staffRoutes"));
  app.use("/api/patients", require("./routes/patientRoutes"));
  app.use("/api/reception", require("./routes/receptionRoutes"));
  app.use("/api/triage", require("./routes/triageRoutes"));
  app.use("/api/doctor", require("./routes/doctorRoutes"));
  app.use("/api/nurse", require("./routes/nurseRoutes"));
  app.use("/api/ward", require("./routes/wardRoutes"));
  app.use("/api/store", require("./routes/storeRoutes"));
  app.use("/api/lab", require("./routes/labRoutes"));
  app.use("/api/pharmacy", require("./routes/pharmacyRoutes"));
  app.use("/api/system", require("./routes/systemRoutes"));
  app.use("/api/audit", require("./routes/auditRoutes"));

  // Base sanity framework fallback checkpoint route
  app.get("/", (req, res) => {
    res.json({
      status: "online",
      system: "HMS Digital Backend Core Framework",
    });
  });

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () =>
    console.log(`HMS Infrastructure layer streaming live on port ${PORT}`),
  );
};

startServer();
