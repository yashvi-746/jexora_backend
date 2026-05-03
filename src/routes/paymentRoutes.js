const express = require("express");
const router = express.Router();
const paymentController = require("../controller/paymentController");
const auth = require("../middleware/auth");

// Route to create a new Razorpay Order
router.post("/create-order", auth, paymentController.createPaymentOrder);

// Route to verify the payment signature
router.post("/verify", auth, paymentController.verifyPayment);

// Route for manual UPI verification
router.post("/verify-manual", auth, paymentController.verifyManualPayment);

module.exports = router;
