const express = require("express");
const cors = require("cors");
require("dotenv").config(); // ✅ LOAD FIRST

const userRoutes = require("./src/routes/userRoutes");
const categoryRoutes = require("./src/routes/categoryRoutes");
const supplierRoutes = require("./src/routes/supplierRoutes");
const productRoutes = require("./src/routes/productRoutes");
const auditLogRoutes = require("./src/routes/auditLogRoutes");
const quoteRoutes = require("./src/routes/quoteRoutes");
const rfqRoutes = require("./src/routes/rfqRoutes");
const inventoryRoutes = require("./src/routes/inventoryRoutes");
const authRoutes = require("./src/routes/authRoutes");
const purchaseOrderRoutes = require("./src/routes/purchaseOrderRoutes");
const stockMovementRoutes = require("./src/routes/stockMovementRoutes");
const shipmentRoutes   = require("./src/routes/shipmentRoutes");
const dashboardRoutes  = require("./src/routes/dashboardRoutes");
const notificationRoutes = require("./src/routes/notificationRoutes");
const warehouseRoutes = require("./src/routes/warehouseRoutes");
const customerRoutes = require("./src/routes/customerRoutes");
const salesRoutes = require("./src/routes/salesRoutes");
const financeRoutes = require("./src/routes/financeRoutes");
const stockTransferRoutes = require("./src/routes/stockTransferRoutes");
const automationRoutes = require("./src/routes/automationRoutes");

const app = express();
const { connectDB } = require("./src/config/db");

// =======================
// PORT
// =======================
const PORT = process.env.PORT || 5000;

// =======================
// CONNECT DATABASE
// =======================
connectDB();

// =======================
// MIDDLEWARE
// =======================
app.use(express.json());


app.use(cors({
  origin: true, // This allows the origin that is sending the request
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// =======================
// ROUTES
// =======================
app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

//routes
app.use("/api/v1/user", userRoutes);

app.use("/api/v1/categories", categoryRoutes);

app.use("/api/v1/suppliers", supplierRoutes);

app.use("/api/v1/products", productRoutes);

app.use("/api/v1/auditlogs", auditLogRoutes);

app.use("/api/v1/quotes", quoteRoutes);

app.use("/api/v1/rfqs", rfqRoutes);
app.use("/api/v1/purchase-orders", purchaseOrderRoutes);
app.use("/api/v1/inventory", inventoryRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/stock-movements", stockMovementRoutes);
app.use("/api/v1/shipments",  shipmentRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/warehouses", warehouseRoutes);
app.use("/api/v1/customers", customerRoutes);
app.use("/api/v1/sales-orders", salesRoutes);
app.use("/api/v1/finance", financeRoutes);
app.use("/api/v1/transfers", stockTransferRoutes);
app.use("/api/v1/automation", automationRoutes);
app.use("/api/v1/payments", require("./src/routes/paymentRoutes"));

app.get("/test", (req, res) => {
  res.send("Test route working fine ✅");
});

app.get("/api/json", (req, res) => {
  res.json({
    message: "This is a JSON API",
    status: "success",
  });
});

app.get("/api/student", (req, res) => {
  res.json({
    id: 101,
    name: "Arpita",
    course: "Computer Science",
  });
});

app.get("/api/hello/:name", (req, res) => {
  res.send(`Hello ${req.params.name}`);
});

app.get("/api/status", (req, res) => {
  res.json({
    server: "running",
    port: PORT,
  });
});

// =======================
// START SERVER
// =======================
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});



