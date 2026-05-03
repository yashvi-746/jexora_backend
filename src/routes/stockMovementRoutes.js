const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  getStockMovements,
  createStockMovement,
  deleteStockMovement,
  getMovementSummary,
} = require("../controller/stockMovementController");

router.get("/", auth, getStockMovements);
router.post("/create", auth, createStockMovement);
router.get("/summary", auth, getMovementSummary);
router.delete("/:id", auth, deleteStockMovement);

module.exports = router;
