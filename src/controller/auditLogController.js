const AuditLog = require("../models/AuditLog");

// GET ALL AUDIT LOGS (filtered by user)
exports.getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find({ entityId: req.user.id })
      .populate("entityId", "name email role")
      .sort({ createdAt: -1 });

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET AUDIT LOG BY ID
exports.getAuditLogById = async (req, res) => {
  try {
    const log = await AuditLog.findById(req.params.id).populate(
      "performedBy",
      "email role",
    );

    if (!log) return res.status(404).json({ message: "Audit log not found" });

    res.json(log);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
