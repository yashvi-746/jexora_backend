const Quote     = require("../models/Quote");
const RFQItem   = require("../models/rfqItems");   // <-- match the filename here
const Supplier  = require("../models/Supplier");
const User      = require("../models/User");
const { logActivity } = require("./auditLogController");
// const { createNotification } = require("./notificationController");

// ===============================
// 1️⃣ Get Supplier RFQs
// ===============================
exports.getSupplierRfq = async (req, res) => {
  try {
    const supplierId = req.params.supplierId;
    const rfqs = await Quote.find({ supplier: supplierId })
      .select("rfq status items notes")
      .populate('rfq', 'title description status');
    res.json(rfqs);
  } catch (error) {
    console.error("Error in getSupplierRfq:", error);
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// 2️⃣ Get RFQ Items for Supplier
// ===============================
exports.getRfqItemsForSupplier = async (req, res) => {
  try {
    const rfqId = req.params.rfqId;
    const items = await RFQItem.find({ rfq: rfqId })
      .populate('productId', 'name units');
    res.json(items);
  } catch (error) {
    console.error("Error in getRfqItemsForSupplier:", error);
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// 3️⃣ Submit or Update Quote by Supplier
// ===============================
exports.submitQuote = async (req, res) => {
  try {
    const supplierId = req.user.id;
    const rfqId = req.params.rfqId;
    const { items, notes } = req.body;
    let existingQuote = await Quote.findOne({ rfq: rfqId, supplier: supplierId });

    if (existingQuote) {
      existingQuote.items = items;
      existingQuote.notes = notes;
      existingQuote.status = "submitted";
      existingQuote.submittedAt = new Date();
      await existingQuote.save();
      await logActivity(supplierId, `Updated quote for RFQ ${rfqId}`);
      return res.status(200).json({
        message: "Quote updated successfully",
        quote: existingQuote,
      });
    }

    const newQuote = await Quote.create({
      rfq: rfqId,
      supplier: supplierId,
      items,
      notes,
      status: "submitted",
      submittedAt: new Date(),
    });

    await logActivity(supplierId, `Submitted quote for RFQ ${rfqId}`);

    const supplierDetails = await Supplier.findById(supplierId).select('companyName');
    const supplierName = supplierDetails ? supplierDetails.companyName : 'Supplier';
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      await createNotification(admin._id, `New quote submitted by ${supplierName} for RFQ ${rfqId}`);
    }

    res.status(201).json({ message: "Quote submitted successfully", quote: newQuote });
  } catch (error) {
    console.error("Error in submitQuote:", error);
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// 4️⃣ Get All Quotes for an RFQ
// ===============================
exports.getQuoteStatus = async (req, res) => {
  try {
    const rfqId = req.params.rfqId;
    const quotes = await Quote.find({ rfq: rfqId })
      .populate('supplier', 'companyName')
      .populate({
        path: "items.rfqItemId",
        populate: { path: "productId", select: "name units" }
      });
    const rfqItems = await RFQItem.find({ rfq: rfqId })
      .populate('productId', 'name units');
    res.json({ quotes, rfqItems });
  } catch (error) {
    console.error("Error in getQuoteStatus:", error);
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// 5️⃣ Check if Supplier Already Submitted Quote
// ===============================
exports.checkExistingQuote = async (req, res) => {
  try {
    const supplierId = req.user.id;
    const rfqId = req.params.rfqId;
    const exists = await Quote.exists({ rfq: rfqId, supplier: supplierId });
    res.json({ submitted: !!exists });
  } catch (error) {
    console.error("Error in checkExistingQuote:", error);
    res.status(500).json({ message: error.message });
  }
};