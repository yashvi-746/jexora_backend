const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { createCustomer, getCustomers, updateCustomer, deleteCustomer } = require("../controller/customerController");

router.post("/", auth, createCustomer);
router.get("/", auth, getCustomers);
router.put("/:id", auth, updateCustomer);
router.delete("/:id", auth, deleteCustomer);

module.exports = router;
