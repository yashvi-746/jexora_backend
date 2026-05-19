const StockMovement = require("../models/StockMovement");
const Inventory = require("../models/Inventory");

// GET ALL STOCK MOVEMENTS (filtered by owner)
exports.getStockMovements = async (req, res) => {
  try {
    const filter = {};
    if (req.query.productId) filter.productId = req.query.productId;
    if (req.query.type) filter.type = req.query.type;

    const movements = await StockMovement.find(filter)
      .populate("productId", "name units price")
      .sort({ createdAt: -1 })
      .limit(200);

    res.json(movements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CREATE A STOCK MOVEMENT (logs entry AND updates inventory)
exports.createStockMovement = async (req, res) => {
  try {
    const { productId, type, quantity, reason, note, referenceId, performedBy } = req.body;

    if (!productId || !type || !quantity) {
      return res.status(400).json({ message: "productId, type, and quantity are required" });
    }
    
    // 1. Verify product ownership
    const Product = require("../models/Product");
    const productExists = await Product.findOne({ _id: productId });
    if (!productExists) return res.status(404).json({ message: "Product not found or access denied" });

    // 2. Get current inventory
    let inventoryRecord = await Inventory.findOne({ productId });
    const stockBefore = inventoryRecord ? inventoryRecord.quantity : 0;

    let stockAfter;
    if (type === "IN") {
      stockAfter = stockBefore + parseInt(quantity);
    } else {
      stockAfter = stockBefore - parseInt(quantity);
      if (stockAfter < 0) {
        return res.status(400).json({ message: `Not enough stock. Current stock is ${stockBefore}` });
      }
    }

    // 3. Update or create the inventory record
    if (inventoryRecord) {
      inventoryRecord.quantity = stockAfter;
      await inventoryRecord.save();
    } else {
      await Inventory.create({ productId, quantity: stockAfter });
    }

    // 4. Create movement entry
    const movement = await StockMovement.create({
      productId,
      type,
      quantity: parseInt(quantity),
      reason: reason || "Manual Adjustment",
      note: note || "",
      referenceId: referenceId || "",
      performedBy: performedBy || req.user.email || "User",
      stockBefore,
      stockAfter
    });

    const populated = await StockMovement.findById(movement._id)
      .populate("productId", "name units price");

    // 5. Low Stock Alert Notification
    if (type === "OUT" && inventoryRecord && stockAfter <= inventoryRecord.minStocks) {
      try {
        const { createUserNotification } = require("./notificationController");
        await createUserNotification(
          req.user.id, 
          `⚠️ Low Stock Alert: ${populated.productId?.name} has dropped to ${stockAfter} units.`
        );
      } catch (notiErr) {
        console.error("Failed to create low stock notification:", notiErr);
      }
    }

    res.status(201).json({
      message: `Stock ${type === "IN" ? "added" : "removed"} successfully`,
      movement: populated,
      stockBefore,
      stockAfter
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE A MOVEMENT LOG
exports.deleteStockMovement = async (req, res) => {
  try {
    const deleted = await StockMovement.findOneAndDelete({ _id: req.params.id });
    if (!deleted) return res.status(404).json({ message: "Movement log not found" });
    res.json({ message: "Movement log deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET SUMMARY
exports.getMovementSummary = async (req, res) => {
  try {
    const mongoose = require("mongoose");
    const summary = await StockMovement.aggregate([
      { $match: { owner: new mongoose.Types.ObjectId(req.user.id) } },
      {
        $group: {
          _id: { productId: "$productId", type: "$type" },
          totalQty: { $sum: "$quantity" },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "_id.productId",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      { $sort: { "_id.productId": 1 } },
    ]);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
