const express = require("express");
const router = express.Router();
const automationController = require("../controller/automationController");
const auth = require("../middleware/auth");
const User = require("../models/User");

// 1. Run full automation audit (Stock + Prices)
router.get("/audit", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const reorders = await automationController.runSmartReorder(userId);
    const pricing = await automationController.getDynamicPriceSuggestions(userId);
    const transfers = await automationController.suggestTransfers(userId);
    
    res.json({
      message: "Automation audit completed successfully.",
      reorders,
      pricing,
      transfers
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. Trigger Morning Coffee Email (Manual Trigger for testing)
router.post("/trigger-report", auth, async (req, res) => {
  try {
    const { recipientList } = req.body;
    const user = await User.findById(req.user.id);
    const sent = await automationController.sendDailyReport(user, recipientList);
    if (sent) {
      res.json({ message: "Daily report emails sent successfully." });
    } else {
      res.status(500).json({ message: "Failed to send reports." });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
