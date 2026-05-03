const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { createWarehouse, getWarehouses, updateWarehouse, deleteWarehouse } = require("../controller/warehouseController");

router.get("/", auth, getWarehouses);
router.post("/create", auth, createWarehouse);
router.put("/:id", auth, updateWarehouse);
router.delete("/:id", auth, deleteWarehouse);

module.exports = router;
