const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  getAuditLogs,
  getAuditLogById,
} = require("../controller/auditLogController");

router.get("/", auth, getAuditLogs);
router.get("/:id", auth, getAuditLogById);

module.exports = router;
