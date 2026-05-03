const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

const {
  createSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
  getSupplierPerformance
} = require("../controller/supplierController");

router.post("/create", auth, createSupplier);
router.get("/performance", auth, getSupplierPerformance);
router.get("/", auth, getSuppliers);
router.get("/:id", auth, getSupplierById);
router.put("/:id", auth, updateSupplier);
router.delete("/:id", auth, deleteSupplier);

module.exports = router;
