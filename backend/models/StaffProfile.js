const mongoose = require("mongoose");

const StaffProfileSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    staffId: { type: String, unique: true, sparse: true },
    profileId: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, unique: true, sparse: true, trim: true },
    dob: { type: String, trim: true },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      default: "Other",
    },
    nationalId: { type: String, unique: true, sparse: true, trim: true },
    phone: { type: String, trim: true },
    emergencyContact: { type: String, trim: true },
    address: { type: String, trim: true },
    jobTitle: { type: String, trim: true },
    dept: { type: String, trim: true },
    yearsExp: { type: String, trim: true },
    qualification: { type: String, trim: true },
    certNo: { type: String, trim: true },
    certificationNo: { type: String, unique: true, sparse: true },
    hireDate: { type: String, trim: true },
    contractStatus: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    avatarColor: { type: String, default: "bg-slate-500" },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("StaffProfile", StaffProfileSchema, "staffs");
