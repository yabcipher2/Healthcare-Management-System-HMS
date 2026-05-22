const express = require('express');
const router = express.Router();
const { registerPatient, updatePatientWorkflow, getPatientRecords } = require('../controllers/patientController');
const { protectRoute, authorizeRoles } = require('../middleware/authMiddleware');

// Unified Pipeline Routing Configuration
router.route('/')
  .post(protectRoute, authorizeRoles('Administrator', 'Receptionist'), registerPatient)
  .get(protectRoute, authorizeRoles('Administrator', 'Doctor', 'Receptionist', 'Pharmacist'), getPatientRecords);

router.route('/:id')
  .put(protectRoute, authorizeRoles('Administrator', 'Doctor', 'Receptionist', 'Pharmacist'), updatePatientWorkflow);

module.exports = router;