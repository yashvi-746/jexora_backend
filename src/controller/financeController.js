const SalesOrder = require("../models/SalesOrder");
const PurchaseOrder = require("../models/PurchaseOrder");
const Product = require("../models/Product");

exports.getFinanceSummary = async (req, res) => {
  try {
    const owner = req.user.id;

    // 1. Fetch all Sales and POs for this user
    const [sales, pos, products] = await Promise.all([
      SalesOrder.find({ owner }).populate('items.productId'),
      PurchaseOrder.find({ owner }),
      Product.find({ owner })
    ]);

    // 2. Calculate Total Revenue (Confirmed/Shipped/Delivered Sales)
    const activeSales = sales.filter(s => s.status !== 'cancelled' && s.status !== 'draft');
    const totalRevenue = activeSales.reduce((acc, s) => acc + (s.totalAmount || 0), 0);

    // 3. Calculate COGS (Cost of Goods Sold)
    let cogs = 0;
    activeSales.forEach(sale => {
      sale.items.forEach(item => {
        const cost = item.productId?.costPrice || 0;
        cogs += (cost * item.quantity);
      });
    });

    // 4. Calculate Total Procurement Cost (Summing up item totals)
    const totalProcurement = pos.reduce((acc, po) => {
      const poTotal = po.items.reduce((sum, item) => sum + (item.total || 0), 0);
      return acc + poTotal;
    }, 0);

    // 5. Monthly Breakdown (Last 6 Months)
    const monthlyStats = [];
    for (let i = 5; i >= 0; i--) {
      const start = new Date();
      start.setMonth(start.getMonth() - i);
      start.setDate(1);
      start.setHours(0,0,0,0);

      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      end.setHours(23,59,59,999);

      const monthSales = activeSales.filter(s => s.createdAt >= start && s.createdAt <= end);
      const rev = monthSales.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
      
      let monthCogs = 0;
      monthSales.forEach(s => s.items.forEach(it => monthCogs += (it.productId?.costPrice || 0) * it.quantity));

      monthlyStats.push({
        month: start.toLocaleString('default', { month: 'short' }),
        revenue: rev,
        profit: rev - monthCogs
      });
    }

    res.status(200).json({
      summary: {
        totalRevenue,
        totalCogs: cogs,
        grossProfit: totalRevenue - cogs,
        profitMargin: totalRevenue > 0 ? ((totalRevenue - cogs) / totalRevenue * 100).toFixed(2) : 0,
        totalProcurement
      },
      monthlyStats
    });

  } catch (error) {
    res.status(500).json({ message: "Error generating finance report", error: error.message });
  }
};
