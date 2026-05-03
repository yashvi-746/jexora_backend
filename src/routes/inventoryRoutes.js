const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  getInventoryStatus,
  updateInventoryById,
  createInventory,
  deleteInventory
} = require("../controller/inventoryController");

router.get("/", auth, getInventoryStatus);
router.post("/", auth, createInventory);
router.put("/:id", auth, updateInventoryById);
router.delete("/:id", auth, deleteInventory);

module.exports = router;
