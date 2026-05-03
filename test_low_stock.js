const mongoose = require("mongoose");
const Inventory = require("./src/models/Inventory");
const Product = require("./src/models/Product");
const StockMovement = require("./src/models/StockMovement");
require("dotenv").config();

async function testLowStock() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Find an inventory item
    let inventory = await Inventory.findOne().populate("productId");
    if (!inventory) {
      console.log("No inventory found to test.");
      process.exit(1);
    }
    
    console.log(`Current stock for ${inventory.productId.name} is ${inventory.quantity}. Min stocks is ${inventory.minStocks}`);
    
    // Simulate API call logic: create a stock movement OUT that brings it below minStocks
    const qtyToRemove = (inventory.quantity - inventory.minStocks) + 1;
    
    if (qtyToRemove <= 0) {
        console.log("Stock is already low. Testing by removing 1.");
    }
    const amount = qtyToRemove > 0 ? qtyToRemove : 1;

    console.log(`Simulating Stock OUT movement of ${amount}...`);
    
    // Make an API request to the running server so we see the log output in the terminal
    // Or we can just call the controller function if we mock req/res, but it's easier to use fetch
    
    const response = await fetch("http://localhost:5000/api/v1/stock-movements/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            productId: inventory.productId._id,
            type: "OUT",
            quantity: amount,
            reason: "Manual Adjustment",
            performedBy: "Automated Test"
        })
    });
    
    const data = await response.json();
    console.log("API Response:", data);
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

testLowStock();
