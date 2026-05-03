const SalesOrder = require("../models/SalesOrder");
const Inventory = require("../models/Inventory");
const Product = require("../models/Product");
const StockMovement = require("../models/StockMovement");

exports.createSalesOrder = async (req, res) => {
  try {
    const { customerId, items, notes, status } = req.body;
    const userId = req.user.id;

    const count = await SalesOrder.countDocuments({ owner: userId });
    const orderNumber = "SO-" + (count + 1).toString().padStart(4, "0");

    const totalAmount = items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);

    // PROFIT GUARD: Check if selling price is below cost price
    for (const item of items) {
      const prod = await Product.findById(item.productId);
      if (prod && item.unitPrice < prod.costPrice) {
        return res.status(400).json({ 
          message: `Loss Prevention: Selling price for '${prod.name}' (₹${item.unitPrice}) is below your buying cost (₹${prod.costPrice}). Please adjust the price.` 
        });
      }
    }

    const salesOrder = await SalesOrder.create({
      orderNumber,
      customerId,
      items,
      totalAmount,
      notes,
      status: status || "draft",
      owner: userId
    });

    // If created as confirmed, reduce inventory
    if (salesOrder.status === "confirmed" || salesOrder.status === "shipped") {
      await updateStockForSales(salesOrder, userId);
    }

    res.status(201).json({ message: "Sales order created", salesOrder });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSalesOrders = async (req, res) => {
  try {
    const orders = await SalesOrder.find({ owner: req.user.id })
      .populate("customerId", "name companyName")
      .populate("items.productId", "name")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateSalesOrder = async (req, res) => {
  try {
    const { status, items, notes } = req.body;
    const userId = req.user.id;

    const oldOrder = await SalesOrder.findOne({ _id: req.params.id, owner: userId });
    if (!oldOrder) return res.status(404).json({ message: "Sales order not found" });

    const updatedOrder = await SalesOrder.findOneAndUpdate(
      { _id: req.params.id, owner: userId },
      { status, items, notes },
      { new: true }
    ).populate("customerId", "name companyName");

    // If status changed to confirmed/shipped from something else, reduce stock
    const needsStockUpdate = (status === "confirmed" || status === "shipped") && 
                             (oldOrder.status === "draft" || oldOrder.status === "cancelled");
    
    if (needsStockUpdate) {
      await updateStockForSales(updatedOrder, userId);
    }

    res.json({ message: "Sales order updated", salesOrder: updatedOrder });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper to handle stock reduction
async function updateStockForSales(order, userId) {
  for (const item of order.items) {
    // 1. Reduce Inventory
    await Inventory.findOneAndUpdate(
      { productId: item.productId, owner: userId },
      { $inc: { quantity: -item.quantity } }
    );

    // 2. Log Movement
    await StockMovement.create({
      productId: item.productId,
      type: "OUT",
      quantity: item.quantity,
      reason: `Sales Order: ${order.orderNumber}`,
      owner: userId
    });
  }
}

exports.deleteSalesOrder = async (req, res) => {
  try {
    const order = await SalesOrder.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
    if (!order) return res.status(404).json({ message: "Sales order not found" });
    res.json({ message: "Sales order deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
