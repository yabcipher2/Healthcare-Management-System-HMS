const express = require("express");
const router = express.Router();
const {
  submitDemoRequest,
  getDemoRequests,
} = require("../controllers/demoController");

router.post("/request", submitDemoRequest);
router.get("/requests", getDemoRequests);

module.exports = router;
