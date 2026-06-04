const Bed = require("../models/Bed");

const getBeds = async (req, res) => {
  try {
    let beds = await Bed.find({}).sort({ bedId: 1 });
    if (beds.length === 0) {
      const defaultBeds = [
        { bedId: "B-101", room: "Room 01 (ICU)", type: "Critical Care", status: "Available" },
        { bedId: "B-102", room: "Room 01 (ICU)", type: "Critical Care", status: "Available" },
        { bedId: "B-201", room: "Room 02 (General)", type: "General Ward", status: "Available" },
        { bedId: "B-202", room: "Room 02 (General)", type: "General Ward", status: "Available" },
        { bedId: "B-301", room: "Room 03 (Pediatric)", type: "Children's Block", status: "Available" },
        { bedId: "B-302", room: "Room 03 (Pediatric)", type: "Children's Block", status: "Available" },
      ];
      beds = await Bed.insertMany(defaultBeds);
    }
    res.status(200).json({ success: true, count: beds.length, data: beds });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateBed = async (req, res) => {
  try {
    const bed = await Bed.findOneAndUpdate({ bedId: req.params.bedId }, req.body, { new: true, runValidators: true });
    if (!bed) return res.status(404).json({ success: false, message: "Bed not found." });
    res.status(200).json({ success: true, data: bed });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const dischargeBed = async (req, res) => {
  try {
    const bed = await Bed.findOneAndUpdate(
      { bedId: req.params.bedId },
      { status: "Available", patientName: "", admissionTime: "", attendingDoctor: "", severity: "", patientCardId: "" },
      { new: true, runValidators: true }
    );
    if (!bed) return res.status(404).json({ success: false, message: "Bed not found." });
    res.status(200).json({ success: true, data: bed });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { getBeds, updateBed, dischargeBed };
