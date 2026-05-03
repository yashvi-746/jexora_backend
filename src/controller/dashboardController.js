const Product       = require("../models/Product");
const Category      = require("../models/Category");
const Supplier      = require("../models/Supplier");
const Inventory     = require("../models/Inventory");
const RFQ           = require("../models/rfq");
const PurchaseOrder = require("../models/PurchaseOrder");
const SalesOrder    = require("../models/SalesOrder");
const StockMovement = require("../models/StockMovement");
const User          = require("../models/User");

exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 1. Fetch user's products first to get IDs for inventory filtering
    const userProducts = await Product.find({ owner: userId }).populate("categoryId", "name");
    const userProductIds = userProducts.map(p => p._id);

    // 2. Parallel fetch other data for this user
    const [categories, suppliers, inventory, rfqs, pos, allPos, salesOrders, users, recentMovements] = await Promise.all([
      Category.find({ owner: userId }),
      Supplier.find({ owner: userId }),
      Inventory.find({ productId: { $in: userProductIds } }).populate({
        path: 'productId',
        populate: { path: 'categoryId', select: 'name' }
      }),
      RFQ.find({ owner: userId }),
      PurchaseOrder.find({ owner: userId }).populate("supplierId", "name").sort({ createdAt: -1 }).limit(5), // Latest 5
      PurchaseOrder.find({ owner: userId }), // All POs for value calculation
      SalesOrder.find({ owner: userId }),
      User.find({ _id: userId }).select("-password"), // Only return self for basic stats
      StockMovement.find({ productId: { $in: userProductIds } }).populate("productId", "name").sort({ createdAt: -1 }).limit(10),
    ]);

    // Low stock items (quantity <= minStocks)
    const lowStockItems = inventory.filter(i => i.quantity <= i.minStocks && i.productId);

    // Out of stock
    const outOfStock = inventory.filter(i => i.quantity === 0 && i.productId);

    // Total inventory value (Using Cost Price for true asset value)
    const totalInventoryValue = inventory.reduce((sum, i) => {
      const cost = i.productId?.costPrice || 0;
      return sum + (cost * i.quantity);
    }, 0);

    // PO stats
    const poStats = {
      total:    pos.length,
      pending:  (await PurchaseOrder.countDocuments({ owner: userId, status: { $in: ["pending", "draft", "Pending", "Draft"] } })),
      approved: (await PurchaseOrder.countDocuments({ owner: userId, status: { $in: ["approved", "Approved"] } })),
      rejected: (await PurchaseOrder.countDocuments({ owner: userId, status: { $in: ["rejected", "Rejected"] } })),
    };

    // RFQ stats
    const rfqStats = {
      total:  rfqs.length,
      open:   rfqs.filter(r => r.status === "Open").length,
      closed: rfqs.filter(r => r.status === "Closed").length,
    };

    // Stock movement summary (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentMoves  = await StockMovement.find({ productId: { $in: userProductIds }, createdAt: { $gte: sevenDaysAgo } });
    const weeklyIn     = recentMoves.filter(m => m.type === "IN").reduce((s, m) => s + m.quantity, 0);
    const weeklyOut    = recentMoves.filter(m => m.type === "OUT").reduce((s, m) => s + m.quantity, 0);

    // Category-wise inventory value (Using Cost Price)
    const categoryValue = {};
    inventory.forEach(i => {
      const catName = i.productId?.categoryId?.name || "Unknown";
      const val     = (i.productId?.costPrice || 0) * i.quantity;
      categoryValue[catName] = (categoryValue[catName] || 0) + val;
    });

    // Daily movement for last 7 days (for chart)
    const dailyMovements = [];
    for (let d = 6; d >= 0; d--) {
      const dayStart = new Date(); dayStart.setDate(dayStart.getDate() - d); dayStart.setHours(0,0,0,0);
      const dayEnd   = new Date(); dayEnd.setDate(dayEnd.getDate() - d);     dayEnd.setHours(23,59,59,999);
      const dayMoves = recentMoves.filter(m => new Date(m.createdAt) >= dayStart && new Date(m.createdAt) <= dayEnd);
      dailyMovements.push({
        date: dayStart.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
        in:   dayMoves.filter(m => m.type === "IN").reduce((s, m) => s + m.quantity, 0),
        out:  dayMoves.filter(m => m.type === "OUT").reduce((s, m) => s + m.quantity, 0),
      });
    }

    // Sales stats
    const salesStats = {
      total: salesOrders.length,
      confirmed: salesOrders.filter(o => o.status === "confirmed").length,
      shipped: salesOrders.filter(o => o.status === "shipped").length,
      totalRevenue: salesOrders.reduce((sum, so) => sum + (so.totalAmount || 0), 0)
    };

    // Calculate PO Value properly
    const totalPOValue = allPos.reduce((sum, po) => sum + (po.totalAmount || 0), 0);

    res.json({
      counts: {
        products:   userProducts.length,
        categories: categories.length,
        suppliers:  suppliers.length,
        users:      users.length,
        inventory:  inventory.length,
        sales:      salesOrders.length
      },
      totalInventoryValue: Math.round(totalInventoryValue),
      totalPOValue: Math.round(totalPOValue),
      totalSalesValue: Math.round(salesStats.totalRevenue),
      lowStockItems:  lowStockItems.map(i => ({ _id: i._id, productId: i.productId, quantity: i.quantity, minStocks: i.minStocks })),
      outOfStock:     outOfStock.map(i => ({ _id: i._id, productId: i.productId, quantity: i.quantity })),
      poStats,
      salesStats,
      rfqStats,
      weeklyIn,
      weeklyOut,
      recentMovements,
      recentPOs: pos,
      recentSales: salesOrders.slice(0, 5),
      dailyMovements,
      categoryValue: Object.entries(categoryValue).map(([name, value]) => ({ name, value: Math.round(value) })),
      
      // Demand Forecasting (Advanced Velocity Logic + Fallback)
      forecasting: await (async () => {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const movements30 = await StockMovement.find({ 
          productId: { $in: userProductIds },
          type: "OUT", 
          createdAt: { $gte: thirtyDaysAgo } 
        });

        const predictions = inventory.map(i => {
          if (!i.productId) return null;
          const prodIdStr = i.productId._id.toString();
          const totalOut = movements30
            .filter(m => m.productId.toString() === prodIdStr)
            .reduce((s, m) => s + m.quantity, 0);
          
          const dailyRate = totalOut / 30;
          const daysRemaining = dailyRate > 0 ? Math.floor(i.quantity / dailyRate) : 999;
          
          // Show alert if: below min stock OR running out soon
          if (i.quantity <= i.minStocks || (dailyRate > 0 && daysRemaining < 14)) {
            let status = "LOW";
            if (i.quantity === 0) status = "OUT OF STOCK";
            else if (i.quantity <= i.minStocks / 2) status = "CRITICAL";
            else if (dailyRate === 0) status = "REPLENISH"; // Fallback for new products

            return {
              productId: i.productId._id,
              name: i.productId.name,
              currentStock: i.quantity,
              dailyRate: dailyRate > 0 ? dailyRate.toFixed(2) : "New Item",
              daysRemaining: daysRemaining === 999 ? "∞" : daysRemaining,
              status: status,
              suggestedOrder: Math.ceil((dailyRate * 30) || (i.minStocks * 2))
            };
          }
          return null;
        }).filter(p => p !== null);

        return predictions.sort((a, b) => (a.daysRemaining === "∞" ? 999 : a.daysRemaining) - (b.daysRemaining === "∞" ? 999 : b.daysRemaining)).slice(0, 5);
      })(),
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ message: err.message });
  }
};

// Notifications: low stock + out-of-stock alerts (filtered by user)
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const Product = require("../models/Product");
    const userProducts = await Product.find({ owner: userId }).select("_id");
    const userProductIds = userProducts.map(p => p._id);

    const inventory = await Inventory.find({ productId: { $in: userProductIds } }).populate("productId", "name price");
    const alerts = [];

    inventory.forEach(i => {
      if (!i.productId) return;
      if (i.quantity === 0) {
        alerts.push({ type: "OUT_OF_STOCK", severity: "critical", product: i.productId.name, productId: i.productId._id, quantity: i.quantity, minStocks: i.minStocks, inventoryId: i._id });
      } else if (i.quantity <= i.minStocks) {
        alerts.push({ type: "LOW_STOCK", severity: "warning", product: i.productId.name, productId: i.productId._id, quantity: i.quantity, minStocks: i.minStocks, inventoryId: i._id });
      }
    });

    res.json({ count: alerts.length, alerts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const PDFDocument = require('pdfkit');

exports.exportReportPDF = async (req, res) => {
  try {
    const userId = req.user.id;
    const Product = require("../models/Product");
    const userProducts = await Product.find({ owner: userId }).select("_id");
    const userProductIds = userProducts.map(p => p._id);

    const [inventory, pos] = await Promise.all([
      Inventory.find({ productId: { $in: userProductIds } }).populate({
        path: 'productId',
        populate: { path: 'categoryId', select: 'name' }
      }),
      PurchaseOrder.find({ owner: userId, status: "Pending" }).populate("supplierId", "name")
    ]);

    const totalInventoryValue = inventory.reduce((sum, i) => {
      const price = i.productId?.price || 0;
      return sum + (price * i.quantity);
    }, 0);

    const lowStockItems = inventory.filter(i => i.quantity <= i.minStocks && i.productId);
    const outOfStock = inventory.filter(i => i.quantity === 0 && i.productId);

    // Create a PDF document
    const doc = new PDFDocument({ margin: 50 });

    // Set response headers
    const fileName = `InventIQ_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

    // Pipe the PDF to the response
    doc.pipe(res);

    // Header
    doc.fillColor('#4f46e5').fontSize(24).text('InventIQ EXECUTIVE REPORT', { align: 'center' });
    doc.moveDown();
    doc.fillColor('#64748b').fontSize(10).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(2);

    // Summary Section
    doc.fillColor('#1e293b').fontSize(16).text('1. Summary Statistics', { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(`Total Inventory Value: $${Math.round(totalInventoryValue).toLocaleString()}`);
    doc.text(`Total Low Stock Items: ${lowStockItems.length}`);
    doc.text(`Total Out of Stock: ${outOfStock.length}`);
    doc.text(`Pending Purchase Orders: ${pos.length}`);
    doc.moveDown(2);

    // Low Stock Table (Manual Draw)
    doc.fillColor('#ef4444').fontSize(16).text('2. Action Required: Low Stock / Out of Stock', { underline: true });
    doc.moveDown();
    
    // Table Headers
    const startX = 50;
    let currentY = doc.y;
    doc.fillColor('#475569').fontSize(10);
    doc.text('Product', startX, currentY);
    doc.text('Current Qty', startX + 250, currentY);
    doc.text('Min Threshold', startX + 350, currentY);
    currentY += 20;
    doc.moveTo(startX, currentY - 5).lineTo(550, currentY - 5).stroke();

    // Table Body
    const allAlerts = [...outOfStock, ...lowStockItems];
    allAlerts.forEach(item => {
      if (currentY > 700) { doc.addPage(); currentY = 50; }
      doc.fillColor('#1e293b').text(item.productId?.name || 'N/A', startX, currentY);
      doc.text(item.quantity.toString(), startX + 250, currentY);
      doc.text((item.minStocks || 10).toString(), startX + 350, currentY);
      currentY += 20;
    });

    // Footer
    doc.fontSize(8).fillColor('#94a3b8').text('Confidential - InventIQ Inventory Management System', 50, 750, { align: 'center' });

    // Finalize the PDF
    doc.end();

  } catch (err) {
    console.error("PDF Export Error:", err);
    res.status(500).json({ message: "Failed to generate PDF" });
  }
};
