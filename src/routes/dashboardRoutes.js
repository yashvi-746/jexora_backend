const express = require("express");
const router  = express.Router();
const auth    = require("../middleware/auth");
const { getDashboardStats, getNotifications, exportReportPDF } = require("../controller/dashboardController");

router.get("/stats",         auth, getDashboardStats);
router.get("/notifications", auth, getNotifications);
router.get("/export-report", auth, exportReportPDF);

module.exports = router;
