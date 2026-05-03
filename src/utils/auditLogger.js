const AuditLog = require("../models/AuditLog");

/**
 * Logs an action to the audit trail
 * @param {string} userId - The user performing the action
 * @param {string} action - The type of action (e.g., 'CREATE', 'UPDATE', 'DELETE')
 * @param {string} details - Human-readable description of the change
 */
exports.logAction = async (userId, action, details) => {
  try {
    await AuditLog.create({
      entityId: userId,
      action,
      details
    });
  } catch (error) {
    console.error("Failed to log audit action:", error);
  }
};
