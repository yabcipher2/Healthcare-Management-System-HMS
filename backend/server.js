const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const User = require("./models/User");

// Load settings environment format [cite: 19, 23]
dotenv.config();

const seedAdminUser = async () => {
  try {
    const existing = await User.findOne({ email: "admin@mesra.com" });
    if (!existing) {
      await User.create({
        staffId: "ADMIN-001",
        id: "ADMIN-ID-001",
        profileId: "ADMIN-P-001",
        nationalId: "ADMIN-NID-001",
        certificationNo: "ADMIN-CERT-001",
        name: "System Administrator",
        email: "admin@mesra.com",
        password: "admin123",
        role: "Administrator",
      });
      console.log("Default admin user created: admin@mesra.com / admin123");
    }
  } catch (error) {
    console.error("Failed to seed default admin user:", error.message);
  }
};

const app = express();

const startServer = async () => {
  await connectDB();
  await seedAdminUser();

  // --- PAYLOAD PARSING MIDDLEWARE ---
  app.use(express.json());
  app.use(cors());

  // --- ENDPOINT ROUTING MOUNTS ---
  app.use("/api/auth", require("./routes/authRoutes"));
  app.use("/api/staffs", require("./routes/staffRoutes"));
  app.use("/api/patients", require("./routes/patientRoutes"));

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
