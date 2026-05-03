const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductsByCategory
} = require("../controller/productController");

router.post("/create", auth, createProduct);
router.get("/", auth, getProducts);
router.get("/category/:categoryId", auth, getProductsByCategory);
router.get("/:id", auth, getProductById);
router.put("/:id", auth, updateProduct);
router.post("/delete/:id", auth, deleteProduct);

module.exports = router;
