const express = require("express");
const router = express.Router();
const {
  getInventory,
  updateStock,
  addItem,
} = require("../controllers/storeController");
const { protectRoute, authorizeRoles } = require("../middleware/authMiddleware");

router.get("/", protectRoute, authorizeRoles("Administrator", "Pharmacist"), getInventory);
router.put("/:itemId/stock", protectRoute, authorizeRoles("Administrator", "Pharmacist"), updateStock);
router.post("/", protectRoute, authorizeRoles("Administrator", "Pharmacist"), addItem);

module.exports = router;
