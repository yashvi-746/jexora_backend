const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const role = require("../middleware/role");

const {
  getAuditLogs,
  getAuditLogById,
} = require("../controller/auditLogController");

router.get("/", auth, role("Admin"), getAuditLogs);
router.get("/:id", auth, role("Admin"), getAuditLogById);

module.exports = router;
