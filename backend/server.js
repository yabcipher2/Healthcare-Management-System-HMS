const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');

// 1. Load Configurations Environment
dotenv.config();

const app = express();

// 2. Mount Production Security Middleware Engines
app.use(helmet()); // Sets protective headers against known web vulnerabilities
app.use(xss());    // Sanitizes all data formatting configurations 
app.use(cors());   // Allows cross-origin requests from your React frontend
app.use(express.json({ limit: '10kb' })); // Prevents large JSON payload abuse

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); // Dev logs
}

// 4. Set App Rate Limits on API Request Streams
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes tracker
  max: 200, // Cap client access points at 200 attempts per window
  message: 'Too many access hits processed from this endpoint source location. Access frozen for 15 minutes.'
});
app.use('/api/', apiLimiter);

// 5. Mount Core Endpoint Pipelines
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/patients', require('./routes/patientRoutes'));

// 6. Base Fallback Status Check Route
app.get('/', (req, res) => {
  res.json({ app: "HMS Digital Backend Terminal Engine", status: "Operational v1.0.0" });
});

// 7. Universal App Error Handling Interceptor Module
app.use(errorHandler);

// 8. Bind System Port Listener Process after DB connection
const startServer = async () => {
  await connectDB();

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`HMS Backend Infrastructure Operational Mode: ${process.env.NODE_ENV} Mode on Port Server Node: ${PORT}`);
  });
};

startServer();