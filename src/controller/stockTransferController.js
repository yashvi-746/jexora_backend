const StockTransfer = require("../models/StockTransfer");
const Inventory = require("../models/Inventory");
const StockMovement = require("../models/StockMovement");

exports.createTransfer = async (req, res) => {
  try {
    const { fromWarehouseId, toWarehouseId, items, notes } = req.body;
    const owner = req.user.id;

    if (fromWarehouseId === toWarehouseId) {
      return res.status(400).json({ message: "Source and destination warehouses must be different" });
    }

    const transferNumber = "TR-" + Date.now().toString().slice(-6);

    const newTransfer = new StockTransfer({
      transferNumber,
      fromWarehouseId,
      toWarehouseId,
      items,
      owner,
      notes,
      status: "completed" // Direct completion for simplicity in this version
    });

    // Process Stock Updates
    for (const item of items) {
      // 1. Decrement from Source
      const sourceInv = await Inventory.findOne({ productId: item.productId, warehouseId: fromWarehouseId, owner });
      if (!sourceInv || sourceInv.quantity < item.quantity) {
        throw new Error(`Insufficient stock for product ${item.productId} in source warehouse`);
      }
      sourceInv.quantity -= item.quantity;
      await sourceInv.save();

      // 2. Increment at Destination
      let destInv = await Inventory.findOne({ productId: item.productId, warehouseId: toWarehouseId, owner });
      if (!destInv) {
        destInv = new Inventory({
          productId: item.productId,
          warehouseId: toWarehouseId,
          quantity: item.quantity,
          owner
        });
      } else {
        destInv.quantity += item.quantity;
      }
      await destInv.save();

      // 3. Log Movements
      await StockMovement.create([
        {
          productId: item.productId,
          warehouseId: fromWarehouseId,
          type: "OUT",
          quantity: item.quantity,
          reason: `Transfer to ${toWarehouseId} (${transferNumber})`,
          owner
        },
        {
          productId: item.productId,
          warehouseId: toWarehouseId,
          type: "IN",
          quantity: item.quantity,
          reason: `Transfer from ${fromWarehouseId} (${transferNumber})`,
          owner
        }
      ]);
    }

    await newTransfer.save();
    res.status(201).json({ message: "Stock transfer completed successfully", transfer: newTransfer });

  } catch (error) {
    console.error("TRANSFER_ERROR:", error);
    res.status(400).json({ 
      message: error.message || "Error processing transfer"
    });
  }
};

exports.getTransfers = async (req, res) => {
  try {
    const transfers = await StockTransfer.find({ owner: req.user.id })
      .populate("fromWarehouseId", "name")
      .populate("toWarehouseId", "name")
      .populate("items.productId", "name")
      .sort({ createdAt: -1 });
    res.json(transfers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching transfers" });
  }
};
