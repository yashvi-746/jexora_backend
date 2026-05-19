const Inventory = require("../models/Inventory");

// GET ALL INVENTORY STATUS (filtered by owner)
exports.getInventoryStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    // Repair Step: Find inventory records for user's products that might be missing the owner field
    const Product = require("../models/Product");
    const userProducts = await Product.find({}).select("_id");
    const userProductIds = userProducts.map(p => p._id);

    // Update unowned inventory records that belong to this user's products
    await Inventory.updateMany(
      { productId: { $in: userProductIds }, owner: { $exists: false } },
      { $set: {} }
    );

    const inventoryStatus = await Inventory.find({})
      .populate("productId", "name price units categoryId")
      .populate({ path: "productId", populate: { path: "categoryId", select: "name" } })
      .sort({ createdAt: -1 });

    res.json(inventoryStatus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CREATE INVENTORY RECORD
exports.createInventory = async (req, res) => {
  try {
    const { productId, warehouseId, quantity, minStocks } = req.body;

    if (!productId || !warehouseId) {
      return res.status(400).json({ message: "Product and Warehouse are required" });
    }

    // Check if record exists for THIS product in THIS warehouse
    const existingRecord = await Inventory.findOne({ productId, warehouseId });
    if (existingRecord) {
      // If exists, just update the quantity
      existingRecord.quantity += parseInt(quantity || 0);
      await existingRecord.save();
      return res.json({ message: "Stock updated successfully", inventory: existingRecord });
    }

    const newRecord = await Inventory.create({
      productId,
      warehouseId,
      quantity: quantity ?? 0,
      minStocks: minStocks ?? 10
    });

    const populated = await Inventory.findById(newRecord._id)
      .populate("productId", "name price units categoryId")
      .populate("warehouseId", "name");

    res.status(201).json({ message: "Inventory tracking started", inventory: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE INVENTORY BY RECORD ID (with Stock Movement logging)
exports.updateInventoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, minStocks } = req.body;

    const oldRecord = await Inventory.findOne({ _id: id });
    if (!oldRecord) return res.status(404).json({ message: "Inventory record not found" });

    const updateData = {};
    if (quantity !== undefined) updateData.quantity = parseInt(quantity);
    if (minStocks !== undefined) updateData.minStocks = parseInt(minStocks);

    // If quantity changed, log it
    if (quantity !== undefined && parseInt(quantity) !== oldRecord.quantity) {
      const StockMovement = require("../models/StockMovement");
      const diff = parseInt(quantity) - oldRecord.quantity;
      await StockMovement.create({
        productId: oldRecord.productId,
        type: diff > 0 ? "IN" : "OUT",
        quantity: Math.abs(diff),
        reason: "Manual Update"
      });
    }

    const updated = await Inventory.findByIdAndUpdate(id, updateData, { new: true })
      .populate("productId", "name price units categoryId");

    res.json({ message: "Inventory updated successfully", inventory: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE INVENTORY RECORD
exports.deleteInventory = async (req, res) => {
  try {
    const deleted = await Inventory.findOneAndDelete({ _id: req.params.id });
    if (!deleted) {
      return res.status(404).json({ message: "Inventory record not found" });
    }
    res.json({ message: "Inventory record deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UTILITY: Auto-create inventory when a product is created
exports.createInventoryForProduct = async (productId, ownerId, quantity = 0, minStocks = 10) => {
  try {
    const existingRecord = await Inventory.findOne({ productId });
    if (!existingRecord) {
      await Inventory.create({ productId, owner: ownerId, quantity, minStocks });
    }
  } catch (error) {
    console.error("Error auto-creating inventory record:", error.message);
  }
};
