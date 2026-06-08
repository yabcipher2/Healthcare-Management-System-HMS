const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      trim: true,
    },
    module: {
      type: String,
      required: true,
      trim: true,
    },
    userId: {
      type: String,
      required: true,
      trim: true,
    },
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    userRole: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
      default: "",
    },
    targetId: {
      type: String,
      trim: true,
      default: "",
    },
    targetType: {
      type: String,
      trim: true,
      default: "",
    },
    targetDepartment: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    details: {
      type: String,
      trim: true,
      default: "",
    },
    ipAddress: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);
