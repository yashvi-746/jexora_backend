const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { createSalesOrder, getSalesOrders, updateSalesOrder, deleteSalesOrder } = require("../controller/salesController");

router.post("/", auth, createSalesOrder);
router.get("/", auth, getSalesOrders);
router.put("/:id", auth, updateSalesOrder);
router.delete("/:id", auth, deleteSalesOrder);

module.exports = router;
