const express = require("express");
const router = express.Router();
const stockTransferController = require("../controller/stockTransferController");
const authMiddleware = require("../middleware/auth");

router.post("/", authMiddleware, stockTransferController.createTransfer);
router.get("/", authMiddleware, stockTransferController.getTransfers);

module.exports = router;
