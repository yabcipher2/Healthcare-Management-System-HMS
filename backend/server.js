const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const maintenanceMiddleware = require("./middleware/maintenanceMiddleware");
const { errorHandler } = require("./middleware/errorMiddleware");

// Load settings environment format
dotenv.config();

const app = express();

const startServer = async () => {
  // Setup middleware first so server can respond to health checks even if DB fails
  app.use(express.json());
  app.use(cors());

  // Uploaded scan images (ultrasound stills) are served from disk so patient
  // records only carry a URL instead of a multi-megabyte base64 blob.
  app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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
  // Ultrasound / radiology worklist — was never mounted, so the imaging unit
  // could not pull doctor referrals or release reports.
  app.use("/api/ultrasound", require("./routes/ultrasoundRoutes"));
  app.use("/api/pharmacy", require("./routes/pharmacyRoutes"));
  // Billing desks (lab / pharmacy cashier) — these routes existed but were
  // never mounted, so the cashier queues always came back 404.
  app.use("/api/cashier", require("./routes/cashierRoutes"));
  app.use("/api/system", require("./routes/systemRoutes"));
  app.use("/api/audit", require("./routes/auditRoutes"));

  // Health check endpoint for monitoring and load balancers
  app.get("/api/health", (req, res) => {
    const mongoose = require('mongoose');
    const healthCheck = {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      service: "HMS Backend",
      environment: process.env.NODE_ENV || "development",
      port: Number.parseInt(process.env.PORT, 10) || 5000,
    };
    
    // Return 200 even if DB is down, but indicate status
    res.status(200).json(healthCheck);
  });

  // Base sanity framework fallback checkpoint route
  app.get("/", (req, res) => {
    res.json({
      status: "online",
      system: "HMS Digital Backend Core Framework",
    });
  });

  // Error handling middleware (must be last)
  app.use(errorHandler);

  // Guard against a non-numeric or 0 PORT (which would bind a random port the
  // frontend cannot reach and make every API call fail with ERR_CONNECTION_REFUSED).
  const parsedPort = Number.parseInt(process.env.PORT, 10);
  const PORT = Number.isInteger(parsedPort) && parsedPort > 0 ? parsedPort : 5000;
  
  // Bind to 0.0.0.0 to accept connections from any network interface (required for Render/cloud platforms)
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`HMS Infrastructure layer streaming live on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Health check available at: http://0.0.0.0:${PORT}/api/health`);
  });

  // Connect to database after server starts (prevents deployment failure if DB is temporarily unavailable)
  try {
    await connectDB();
    console.log('Database connection established successfully');
  } catch (error) {
    console.error('Database connection failed, but server is still running:', error.message);
    console.error('Please check MongoDB Atlas Network Access settings');
  }
};

startServer();
