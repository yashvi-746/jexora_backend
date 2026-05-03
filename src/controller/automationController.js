const Product = require("../models/Product");
const Inventory = require("../models/Inventory");
const StockMovement = require("../models/StockMovement");
const PurchaseOrder = require("../models/PurchaseOrder");
const SalesOrder = require("../models/SalesOrder");
const Warehouse = require("../models/Warehouse");
const { sendEmail } = require("../utils/emailService");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

/**
 * 1. SMART REORDER AUTOMATION
 * Checks for low stock and prepares draft POs
 */
exports.runSmartReorder = async (owner) => {
  try {
    const inventory = await Inventory.find({ owner }).populate("productId");
    const alerts = [];

    for (const item of inventory) {
      if (!item || !item.productId || !item.productId.owner) continue;

      // If stock is below min, and no pending PO exists for this product
      if (item.quantity <= item.minStocks) {
        const existingPO = await PurchaseOrder.findOne({
          owner,
          status: { $in: ["pending", "draft"] },
          "items.productId": item.productId._id
        });

        if (!existingPO) {
          const count = await PurchaseOrder.countDocuments({ owner });
          const purchaseNumber = "AUTO-PO-" + (count + 1).toString().padStart(4, "0");

          // Create Draft PO
          await PurchaseOrder.create({
            purchaseNumber,
            supplierId: item.productId.owner, 
            items: [{
              productId: item.productId._id,
              quantity: Math.max(item.minStocks * 3, 10), 
              Price: item.productId.costPrice || 0,
              total: (item.productId.costPrice || 0) * Math.max(item.minStocks * 3, 10)
            }],
            status: "draft",
            notes: "SYSTEM GENERATED: Stock level below minimum threshold.",
            owner
          });
          alerts.push(`Auto-Drafted ${purchaseNumber} for ${item.productId.name}`);
        }
      }
    }
    return alerts;
  } catch (err) {
    console.error("Smart Reorder Error:", err);
    return [];
  }
};

/**
 * 2. AUTO-WAREHOUSE BALANCING
 * Suggests transfers if one warehouse is low and another has excess
 */
exports.suggestTransfers = async (owner) => {
  try {
    const allInventory = await Inventory.find({ owner }).populate("productId warehouseId");
    const products = [...new Set(allInventory.filter(i => i.productId).map(i => i.productId._id.toString()))];
    const suggestions = [];

    for (const prodId of products) {
      const records = allInventory.filter(i => i.productId && i.productId._id.toString() === prodId);
      
      const lowStockRecord = records.find(r => r.quantity <= r.minStocks);
      const excessStockRecord = records.find(r => r.quantity > r.minStocks * 3);

      if (lowStockRecord && excessStockRecord && lowStockRecord.productId && lowStockRecord.warehouseId && excessStockRecord.warehouseId) {
        suggestions.push({
          productName: lowStockRecord.productId.name,
          from: excessStockRecord.warehouseId.name,
          to: lowStockRecord.warehouseId.name,
          quantity: Math.floor((excessStockRecord.quantity - excessStockRecord.minStocks) / 2),
          reason: `Unbalanced Stock: ${lowStockRecord.warehouseId.name} is low, but ${excessStockRecord.warehouseId.name} has excess.`
        });
      }
    }
    return suggestions;
  } catch (err) {
    console.error("Transfer Suggestion Error:", err);
    return [];
  }
};

/**
 * 3. MORNING COFFEE REPORT
 * Generates a summary of yesterday's performance
 */
exports.sendDailyReport = async (user, recipientList) => {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0,0,0,0);

    const sales = await SalesOrder.find({
      owner: user._id,
      createdAt: { $gte: yesterday }
    });

    const totalRevenue = sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const topSale = sales.sort((a, b) => b.totalAmount - a.totalAmount)[0];

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
        <h2 style="color: #6366f1;">☕ Your InventIQ Morning Report</h2>
        <p>Good morning. Here is the business performance summary:</p>
        <div style="background: #f8faff; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Yesterday's Revenue</p>
          <p style="margin: 5px 0; font-size: 24px; font-weight: bold; color: #1e1b4b;">₹${totalRevenue.toLocaleString()}</p>
        </div>
        <p><b>Total Orders:</b> ${sales.length}</p>
        ${topSale ? `<p><b>Best Sale:</b> ${topSale.orderNumber} (₹${topSale.totalAmount})</p>` : ""}
        <br/>
        <a href="#" style="background: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Open Dashboard</a>
      </div>
    `;

    // Send to all specified emails
    const targets = recipientList ? recipientList.split(',').map(e => e.trim()) : [user.email];
    
    for (const email of targets) {
      const result = await sendEmail({
        to: email,
        subject: "📊 Business Summary - InventIQ",
        html
      });
      if (result.previewUrl) {
        console.log(`\n🚀 REPORT PREVIEW FOR ${email}: ${result.previewUrl}\n`);
      }
    }

    return true;
  } catch (err) {
    console.error("Daily Report Error:", err);
    return false;
  }
};

/**
 * 4. AUTO-INVOICING
 * Generates and sends a PDF invoice when an order is shipped
 */
exports.sendAutomatedInvoice = async (salesOrder, user) => {
  try {
    // Generate PDF (Mock path for now)
    const invoicePath = path.join(__dirname, `../../invoices/INV-${salesOrder.orderNumber}.pdf`);
    
    // Ensure directory exists
    if (!fs.existsSync(path.join(__dirname, "../../invoices"))) {
      fs.mkdirSync(path.join(__dirname, "../../invoices"), { recursive: true });
    }

    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(invoicePath));
    doc.fontSize(25).text('TAX INVOICE', { align: 'center' });
    doc.fontSize(10).text(`Order: ${salesOrder.orderNumber}`, { align: 'right' });
    doc.text(`Date: ${new Date().toLocaleDateString()}`, { align: 'right' });
    doc.moveDown();
    doc.text(`Customer ID: ${salesOrder.customerId}`);
    doc.moveDown();
    doc.text('----------------------------------------------------');
    salesOrder.items.forEach(item => {
      doc.text(`${item.productId?.name || "Product"} x ${item.quantity} ... ₹${item.unitPrice * item.quantity}`);
    });
    doc.text('----------------------------------------------------');
    doc.fontSize(15).text(`TOTAL: ₹${salesOrder.totalAmount}`, { align: 'right' });
    doc.end();

    // Send Email
    await sendEmail({
      to: user.email, // In real world, send to customer's email
      subject: `Invoice for Order ${salesOrder.orderNumber}`,
      html: `<p>Please find attached the invoice for your order ${salesOrder.orderNumber}.</p>`,
      // attachment logic would go here in transporter
    });

    return true;
  } catch (err) {
    console.error("Auto Invoice Error:", err);
    return false;
  }
};

/**
 * 5. DYNAMIC PRICING SUGGESTIONS
 * Analyzes velocity and stock to suggest price changes
 */
exports.getDynamicPriceSuggestions = async (owner) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const inventory = await Inventory.find({ owner }).populate("productId");
    const movements = await StockMovement.find({ owner, type: "OUT", createdAt: { $gte: thirtyDaysAgo } });

    const suggestions = [];

    inventory.forEach(item => {
      if (!item || !item.productId) return;
      
      // Calculate real sales velocity (items sold per day)
      const salesVolume = movements
        .filter(m => m.productId && m.productId._id.toString() === item.productId._id.toString())
        .reduce((sum, m) => sum + m.quantity, 0);
      
      const velocity = salesVolume / 30;

      // 1. SCARCITY ALERT: Stock is low (< 10)
      if (item.quantity > 0 && item.quantity < 10) {
        suggestions.push({
          productId: item.productId._id,
          name: item.productId.name,
          currentPrice: item.productId.price || 0,
          suggestedPrice: Math.round((item.productId.price || 0) * 1.08), // +8%
          reason: `High Scarcity: Only ${item.quantity} left. Increase price by 8% to maximize profit.`
        });
      }
      // 2. DEAD STOCK ALERT: No sales in 30 days and high stock (> 50)
      else if (salesVolume === 0 && item.quantity > 50) {
        suggestions.push({
          productId: item.productId._id,
          name: item.productId.name,
          currentPrice: item.productId.price || 0,
          suggestedPrice: Math.round((item.productId.price || 0) * 0.85), // -15%
          reason: "Dead Stock: 0 sales in 30 days. Recommend 15% discount to clear warehouse space."
        });
      }
    });

    return suggestions;
  } catch (err) {
    console.error("Pricing Suggestions Error:", err);
    return [];
  }
};


