const StoreItem = require("../models/StoreItem");

const getInventory = async (req, res) => {
  try {
    let items = await StoreItem.find({}).sort({ name: 1 });
    if (items.length === 0) {
      const defaultItems = [
        { itemId: "MED-091", name: "Paracetamol 500mg Tablets", type: "medicines", stock: 1200, unit: "tabs", minThreshold: 500, shelfLocation: "Rack A-3", status: "In Stock" },
        { itemId: "MED-104", name: "Amoxicillin 250mg/5ml Syrup", type: "medicines", stock: 140, unit: "bottles", minThreshold: 200, shelfLocation: "Rack B-1 (Cold)", status: "Low Stock" },
        { itemId: "MED-312", name: "Metformin 850mg Tablets", type: "medicines", stock: 3200, unit: "tabs", minThreshold: 1000, shelfLocation: "Rack A-7", status: "In Stock" },
        { itemId: "MED-201", name: "Insulin Glargine 100U/mL", type: "medicines", stock: 42, unit: "pens", minThreshold: 30, shelfLocation: "Cold Fridge 2", status: "In Stock" },
        { itemId: "SUP-001", name: "Syringe 5ml (Box of 100)", type: "supplies", stock: 340, unit: "boxes", minThreshold: 100, shelfLocation: "Rack S-1", status: "In Stock" },
      ];
      items = await StoreItem.insertMany(defaultItems);
    }
    res.status(200).json({ success: true, count: items.length, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateStock = async (req, res) => {
  try {
    const { stock, status } = req.body;
    const item = await StoreItem.findOneAndUpdate(
      { itemId: req.params.itemId },
      { stock, status },
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ success: false, message: "Item not found." });
    res.status(200).json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const addItem = async (req, res) => {
  try {
    const item = await StoreItem.create(req.body);
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { getInventory, updateStock, addItem };
