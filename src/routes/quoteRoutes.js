// routes/quoteRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const role = require("../middleware/role");

const {
  getSupplierRfq,
  getRfqItemsForSupplier,
  submitQuote,
  getQuoteStatus,
  checkExistingQuote,
} = require("../controller/quoteController");

// =======================
// 1️⃣ Get RFQs assigned to a supplier
// GET /api/quotes/supplier/:supplierId
// =======================
router.get("/supplier/:supplierId", auth, getSupplierRfq);

// =======================
// 2️⃣ Get RFQ Items for Supplier to quote
// GET /api/quotes/rfq/:rfqId/items
// =======================
router.get("/rfq/:rfqId/items", auth, getRfqItemsForSupplier);

// =======================
// 3️⃣ Submit a Quote (supplier)
// POST /api/quotes/rfq/:rfqId/submit
// =======================
router.post("/rfq/:rfqId/submit", auth, submitQuote);

// =======================
// 4️⃣ Get all quotes submitted for an RFQ (admin view)
// GET /api/quotes/rfq/:rfqId/status
// =======================
router.get("/rfq/:rfqId/status", auth, role("Admin"), getQuoteStatus);

// =======================
// 5️⃣ Check if supplier has already submitted a quote
// GET /api/quotes/rfq/:rfqId/check
// =======================
router.get("/rfq/:rfqId/check", auth, checkExistingQuote);

module.exports = router;