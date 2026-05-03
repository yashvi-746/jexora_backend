const express = require("express");
const router = express.Router();
const financeController = require("../controller/financeController");
const authMiddleware = require("../middleware/auth");

router.get("/summary", authMiddleware, financeController.getFinanceSummary);

module.exports = router;
