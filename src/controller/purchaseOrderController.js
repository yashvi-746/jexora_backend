const PurchaseOrder = require("../models/PurchaseOrder");
// const { logActivity } = require("../utils/activityLog");
// const { createNotification } = require("../utils/notification");

/**
 * CREATE PURCHASE ORDER (status pending )
 */
/**
 * CREATE PURCHASE ORDER (status pending )
 */
exports.createPurchaseOrder = async (req, res) => {
  try {
    const { rfqId, supplierId, items, notes, status } = req.body;

    const count = await PurchaseOrder.countDocuments({ owner: req.user.id });
    const purchaseNumber = "PO-" + (count + 1).toString().padStart(4, "0");

    let po = await PurchaseOrder.create({
        purchaseNumber,
        rfqId,
        supplierId,
        items,
        notes,
        status: status || "draft",
        owner: req.user.id
    });

    // Automatically update inventory if created as approved
    const currentStatus = po.status ? po.status.toLowerCase() : "";
    if (currentStatus === "approved") {
      const Inventory = require("../models/Inventory");
      const StockMovement = require("../models/StockMovement");
      const Product = require("../models/Product");

      for (const item of po.items) {
        if (item.productId && item.quantity) {
          const prod = await Product.findOne({ _id: item.productId, owner: req.user.id });
          if (prod) {
            await Inventory.findOneAndUpdate(
              { productId: item.productId, owner: req.user.id },
              { $inc: { quantity: item.quantity } },
              { upsert: true, new: true, setDefaultsOnInsert: true }
            );

            await StockMovement.create({
              productId: item.productId,
              type: "IN",
              quantity: item.quantity,
              reason: `Initial PO Approval: ${po.purchaseNumber}`,
              owner: req.user.id
            });
          }
        }
      }
    }

    //populate correctly
    po = await PurchaseOrder.findOne({ _id: po._id, owner: req.user.id })
    .populate("supplierId", "name email")
    .populate("items.productId", "name");

    res.status(201).json({ message: "Purchase order created", purchaseOrder: po });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
    

/**
 * GET ALL PURCHASE ORDERS
 */
exports.getPurchaseOrders = async (req, res) => {
  try {
    const purchaseOrders = await PurchaseOrder.find({ owner: req.user.id })
      .populate("supplierId", "name email")
      .populate("approvedBy", "name email")
      .populate("rfqId");

    res.json(purchaseOrders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET PURCHASE ORDER BY ID
 */
exports.getPurchaseOrderById = async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findOne({ _id: req.params.id, owner: req.user.id })
      .populate("supplierId", "name email")
      .populate("approvedBy", "name email")
      .populate("rfqId")
      .populate("items.productId");

    if (!purchaseOrder)
      return res.status(404).json({ message: "Purchase Order not found" });

    res.json(purchaseOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * UPDATE PURCHASE ORDER
 */
exports.updatePurchaseOrder = async (req, res) => {
  try {
    const { status, notes, items, approvedBy } = req.body;
    
    // Check old status to prevent double-counting inventory if re-approved
    const oldPo = await PurchaseOrder.findOne({ _id: req.params.id, owner: req.user.id });
    if (!oldPo) return res.status(404).json({ message: "Purchase Order not found" });

    const po = await PurchaseOrder.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      { status, notes, items, approvedBy },
      { new: true }
    ).populate("supplierId", "name email");
    
    // Automatically update inventory when PO status changes to approved
    const newStatus = status ? status.toLowerCase() : "";
    const oldStatus = oldPo.status ? oldPo.status.toLowerCase() : "";

    if (newStatus === "approved" && oldStatus !== "approved") {
      const Inventory = require("../models/Inventory");
      const StockMovement = require("../models/StockMovement");
      const Product = require("../models/Product");

      for (const item of po.items) {
        if (item.productId && item.quantity) {
          // Verify product belongs to user
          const prod = await Product.findOne({ _id: item.productId, owner: req.user.id });
          const inv = await Inventory.findOne({ productId: item.productId, owner: req.user.id });
          const currentQty = inv ? inv.quantity : 0;
          
          if (prod) {
            // AVERAGE COST CALCULATION
            const oldCost = prod.costPrice || 0;
            const newPrice = item.Price || 0;
            const receivedQty = item.quantity;
            
            // Formula: ((Old Qty * Old Cost) + (New Qty * New Price)) / (Total Qty)
            const averageCost = ((currentQty * oldCost) + (receivedQty * newPrice)) / (currentQty + receivedQty);
            prod.costPrice = Math.round(averageCost * 100) / 100; // Round to 2 decimals
            await prod.save();

            // Update or create inventory
            await Inventory.findOneAndUpdate(
              { productId: item.productId, owner: req.user.id },
              { $inc: { quantity: item.quantity } },
              { upsert: true, new: true, setDefaultsOnInsert: true }
            );

            // Log Stock Movement
            await StockMovement.create({
              productId: item.productId,
              type: "IN",
              quantity: item.quantity,
              reason: `PO Arrival & Cost Re-average: ${po.purchaseNumber}`,
              owner: req.user.id
            });
          }
        }
      }
      
      let emailPreviewUrl = null;
      // Option C: Send Automated Email Alert to Supplier
      try {
        const { sendEmail } = require("../utils/emailService");
          if (po.supplierId && po.supplierId.email) {
            const result = await sendEmail({
              to: po.supplierId.email,
              subject: `Purchase Order Approved: ${po.purchaseNumber}`,
              html: `
                <h2>Purchase Order Approved</h2>
                <p>Hello ${po.supplierId.name},</p>
                <p>Your Purchase Order <strong>${po.purchaseNumber}</strong> has been approved.</p>
                <p>Please log in to your portal to view the details or reply to this email for assistance.</p>
                <br/>
                <p>Thanks,<br/>InventIQ Admin</p>
              `
            });
            emailPreviewUrl = result.previewUrl;
          }
          
          // Option B: In-App Notification (Always fire on approval)
          const { createGlobalNotification } = require("./notificationController");
          await createGlobalNotification(`✅ Purchase Order ${po.purchaseNumber} has been approved.`);

          // Log Action to Audit Trail
          if (req.user) {
            const { logAction } = require("../utils/auditLogger");
            await logAction(req.user.id, "APPROVE_PO", `Approved Purchase Order: ${po.purchaseNumber}`);
          }
          
          } catch (emailErr) {
            console.error("Failed to send PO approval email:", emailErr);
          }
          
          return res.json({ 
            message: "Purchase order updated and email sent", 
            purchaseOrder: po,
            emailPreviewUrl 
          });
    }

    res.json({ message: "Purchase order updated", purchaseOrder: po });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * DELETE PURCHASE ORDER
 */
exports.deletePurchaseOrder = async (req, res) => {
  try {
    const po = await PurchaseOrder.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
    if (!po) return res.status(404).json({ message: "Purchase Order not found" });
    res.json({ message: "Purchase order deleted", purchaseOrder: po });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//get purchaseorder list
exports.getPurchaseOrdersForSupplier = async (req, res) => {
    try {
        const supplierId = req.params.supplierId;
        const purchaseOrders = await PurchaseOrder.find({ supplierId, owner: req.user.id })
        .populate('approvedBy', 'name email')
        .populate('rfqId');
        res.json(purchaseOrders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }   
};

// Option 1: AI-Powered Auto-Procurement
exports.autoGenerateDraftPOs = async (req, res) => {
  try {
    const Product = require("../models/Product");
    const Inventory = require("../models/Inventory");
    const StockMovement = require("../models/StockMovement");

    const userId = req.user.id;
    const [products, movements] = await Promise.all([
      Product.find({ owner: userId }),
      StockMovement.find({
        owner: userId,
        type: "OUT",
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      })
    ]);
    const productIds = products.map(p => p._id);
    const inventory = await Inventory.find({ productId: { $in: productIds } });

    const draftPOs = [];

    // 2. Calculate velocity and predict needs
    for (const prod of products) {
      const prodInv = inventory.find(i => i.productId.toString() === prod._id.toString());
      const currentStock = prodInv ? prodInv.quantity : 0;
      const minStock = prodInv ? prodInv.minStocks : 10;

      const prodMovements = movements.filter(m => m.productId.toString() === prod._id.toString());
      const totalOut = prodMovements.reduce((sum, m) => sum + m.quantity, 0);
      const dailyVelocity = totalOut / 30;

      // If predicted stock out in less than 10 days, or already below min stock
      if (currentStock <= minStock || (dailyVelocity > 0 && currentStock / dailyVelocity < 10)) {
        // Suggest ordering 30 days of supply
        const orderQty = Math.max(minStock * 2, Math.ceil(dailyVelocity * 30));
        
        // Find a supplier for this category (mock logic: just take first supplier)
        const Supplier = require("../models/Supplier");
        const supplier = await Supplier.findOne({ /* could filter by category or owner */ });

        if (supplier) {
          const count = await PurchaseOrder.countDocuments({ owner: req.user.id });
          const purchaseNumber = "AUTO-PO-" + (count + 1).toString().padStart(4, "0");
          
          const po = await PurchaseOrder.create({
            purchaseNumber,
            supplierId: supplier.userId, 
            items: [{ 
              productId: prod._id, 
              quantity: orderQty, 
              Price: prod.price,
              total: orderQty * prod.price
            }],
            status: "pending",
            notes: "AI-Generated: Stock level critically low based on sales velocity.",
            owner: req.user.id
          });
          draftPOs.push(po);
        }
      }
    }
    
    // Log System Action
    const { logAction } = require("../utils/auditLogger");
    await logAction(req.user.id, "AI_AUTO_PROCURE", `AI automatically generated ${draftPOs.length} draft Purchase Orders.`);

    res.json({ message: `Successfully generated ${draftPOs.length} draft Purchase Orders.`, count: draftPOs.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};