const Razorpay = require("razorpay");
const crypto = require("crypto");
const SalesOrder = require("../models/SalesOrder");

/**
 * Initialize Razorpay Instance
 */
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_MOCK_KEY",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "MOCK_SECRET",
});

/**
 * 1. CREATE PAYMENT ORDER
 */
exports.createPaymentOrder = async (req, res) => {
  try {
    const { orderId, amount } = req.body;

    if (!amount) {
      return res.status(400).json({ message: "Amount is required" });
    }

    const options = {
      amount: Math.round(amount * 100), // Ensure it is an integer
      currency: "INR",
      receipt: `receipt_${orderId || Date.now()}`,
    };

    try {
      const order = await razorpay.orders.create(options);
      res.json({
        success: true,
        order,
      });
    } catch (rzpErr) {
      console.error("Razorpay API Error:", rzpErr);
      // Fallback for development if keys are invalid/missing
      res.json({
        success: true,
        isMock: true,
        order: {
          id: "order_MOCK_" + Date.now(),
          amount: options.amount,
          currency: "INR"
        },
        message: "Running in Mock Mode (Invalid Razorpay Keys)"
      });
    }
  } catch (err) {
    console.error("Payment Order Creation Crash:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * 2. VERIFY PAYMENT SIGNATURE
 * Ensures the payment was not tampered with
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      salesOrderId 
    } = req.body;

    // MOCK VERIFICATION for Development
    if (razorpay_order_id && razorpay_order_id.startsWith("order_MOCK_")) {
      await SalesOrder.findByIdAndUpdate(salesOrderId, {
        paymentStatus: "paid",
        transactionId: "MOCK_PAY_" + Date.now()
      });
      return res.json({ success: true, message: "MOCK Payment verified!" });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "MOCK_SECRET")
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      // Update Sales Order Status to PAID
      await SalesOrder.findByIdAndUpdate(salesOrderId, {
        paymentStatus: "paid",
        transactionId: razorpay_payment_id
      });

      res.json({ success: true, message: "Payment verified and order updated!" });
    } else {
      res.status(400).json({ success: false, message: "Invalid payment signature!" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * 3. MANUAL VERIFICATION (For UPI/GPay)
 */
exports.verifyManualPayment = async (req, res) => {
  try {
    const { salesOrderId } = req.body;

    await SalesOrder.findByIdAndUpdate(salesOrderId, {
      paymentStatus: "paid",
      transactionId: "UPI_MANUAL_" + Date.now()
    });

    res.json({ success: true, message: "Payment confirmed manually!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
