const express = require("express");
const router = express.Router();
const {
  registerPatient,
  fetchRecords,
  modifyWorkflow,
} = require("../controllers/patientController");
const {
  protectRoute,
  authorizeRoles,
} = require("../middleware/authMiddleware");

router.route("/").post(registerPatient).get(fetchRecords);

router.route("/:id").put(modifyWorkflow);

module.exports = router;
