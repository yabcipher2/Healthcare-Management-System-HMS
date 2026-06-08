const AuditLog = require("../models/AuditLog");

const createAuditLog = async (req, res) => {
  try {
    const {
      action,
      module,
      userId,
      userName,
      userRole,
      department,
      targetId,
      targetType,
      details,
      ipAddress,
    } = req.body;

    const log = await AuditLog.create({
      action,
      module,
      userId: userId || req.user?._id || req.user?.id || "unknown",
      userName: userName || req.user?.name || "Unknown",
      userRole: userRole || req.user?.role || "unknown",
      department: department || req.user?.dept || "",
      targetId: targetId || "",
      targetType: targetType || "",
      details: details || "",
      ipAddress: ipAddress || req.ip || "",
    });

    res.status(201).json({ success: true, data: log });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getAuditLogs = async (req, res) => {
  try {
    const {
      page = "1",
      limit = "50",
      module,
      userRole,
      department,
      startDate,
      endDate,
      search,
    } = req.query;

    const query = {};

    if (module) query.module = module;
    if (userRole) query.userRole = userRole;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    if (search) {
      query.$or = [
        { action: { $regex: search, $options: "i" } },
        { details: { $regex: search, $options: "i" } },
        { userName: { $regex: search, $options: "i" } },
        { targetId: { $regex: search, $options: "i" } },
      ];
    }

    if (
      req.user &&
      req.user.role &&
      req.user.role !== "Administrator"
    ) {
      if (req.user.dept) {
        query.department = req.user.dept;
      } else {
        query.userId = req.user._id || req.user.id;
      }
    } else if (department) {
      query.department = department;
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      AuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      AuditLog.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: logs,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAuditAlertsCount = async (req, res) => {
  try {
    const query = {};
    if (req.user?.role !== "Administrator") {
      if (req.user?.dept) {
        query.department = req.user.dept;
      } else {
        query.userId = req.user?._id || req.user?.id;
      }
    }
    const count = await AuditLog.countDocuments(query);
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createAuditLog,
  getAuditLogs,
  getAuditAlertsCount,
};
