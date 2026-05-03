const RFQ = require("../models/rfq");
const RFQItem = require("../models/rfqItems");
const Supplier = require("../models/Supplier");


// CREATE RFQ
exports.createRFQ = async (req, res) => {
  try {
    const{ title, notes, suppliers} =req.body;

  const rfqCount = await RFQ.countDocuments({ owner: req.user.id });
  const rfqNumber = "RFQ-" + String(rfqCount + 1).padStart(4, "0");

  const rfq = await RFQ.create({
    rfqNumber,
    title,
    notes,
    suppliers,
    owner: req.user.id
  });

  // Option B: In-App Notification
  try {
    const { createGlobalNotification } = require("./notificationController");
    await createGlobalNotification(`📝 New RFQ Created: ${rfq.rfqNumber} - ${rfq.title}`);
  } catch (notifyErr) {
    console.error("Failed to trigger notification:", notifyErr);
  }
    res.status(201).json({
      message: "RFQ created successfully",
      rfq: rfq,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
//add items to rfq
exports.addItemsToRFQ = async (req, res) => {
  try {
    const { productId, quantity, unitPrice } = req.body;
    const rfqId = req.params.id;

    // Verify ownership of RFQ
    const rfq = await RFQ.findOne({ _id: rfqId, owner: req.user.id });
    if (!rfq) return res.status(404).json({ message: "RFQ not found" });

    const Product = require("../models/Product");
    const product = await Product.findOne({ _id: productId, owner: req.user.id });
    const priceToUse = unitPrice || (product ? product.price : 0);

    const rfqItem = await RFQItem.create({
      rfqId,
      productId,
      quantity,
      unitPrice: priceToUse,
      owner: req.user.id
    });
    
    res.status(201).json({
      message: "Item added to RFQ successfully",
      item: rfqItem,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET RFQ ITEMS
exports.getRFQItems = async (req, res) => {
  try {
    const rfqId = req.params.id;
    const items = await RFQItem.find({ rfqId, owner: req.user.id }).populate('productId', 'name sku price');
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL RFQs
exports.getRFQs = async (req, res) => {
  try {
    const rfqs = await RFQ.find({ owner: req.user.id }).populate("suppliers", "name email");
    res.json(rfqs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET RFQ BY ID
exports.getRFQById = async (req, res) => {
  try {
    const rfqItem = await RFQ.findOne({ _id: req.params.id, owner: req.user.id }).populate("suppliers", "name email");
    if (!rfqItem) return res.status(404).json({ message: "RFQ not found" });
    res.json(rfqItem);
  }
    catch (error) { 
    res.status(500).json({ message: error.message });
  }
};

// UPDATE RFQ
exports.updateRFQ = async (req, res) => {
  try {
    const { title, notes, suppliers, status } = req.body;
    const rfq = await RFQ.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      { title, notes, suppliers, status },
      { new: true }
    );
    if (!rfq) return res.status(404).json({ message: "RFQ not found" });
    res.json({
      message: "RFQ updated successfully",
      rfq: rfq,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE RFQ
exports.deleteRFQ = async (req, res) => {
  try {
    const rfq = await RFQ.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
    if (!rfq) return res.status(404).json({ message: "RFQ not found" });
    // Also delete associated items
    await RFQItem.deleteMany({ rfqId: req.params.id, owner: req.user.id });
    
    res.json({
      message: "RFQ deleted successfully",
      rfq: rfq,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};