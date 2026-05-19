const Product = require("../models/Product");
const Inventory = require("../models/Inventory");
const { logAction } = require("../utils/auditLogger");

// CREATE PRODUCT
exports.createProduct = async (req, res) => {
  try {
    const { name, description, categoryId, price, costPrice, initialStock, barcode, units } = req.body;

    const product = await Product.create({
      name,
      description,
      categoryId,
      price,
      costPrice: costPrice || 0,
      barcode: barcode || undefined,
      units
    });

    // Create associated inventory
    await Inventory.create({
      productId: product._id,
      quantity: initialStock || 0
    });

    if (req.user) {
      await logAction(req.user.id, "CREATE_PRODUCT", `Created product: ${name}`);
    }

    res.status(201).json({
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL PRODUCTS (with Inventory joined)
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find({}).populate("categoryId", "name");
    const productIds = products.map(p => p._id);
    
    // Fetch inventory only for this user's products
    const inventory = await Inventory.find({ productId: { $in: productIds } });
    
    // Merge data
    const merged = products.map(p => {
      const inv = inventory.find(i => i.productId.toString() === p._id.toString());
      const obj = p.toObject();
      return {
        ...obj,
        _id: obj._id.toString(),
        currentStock: inv ? inv.quantity : 0
      };
    });

    res.json(merged);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET PRODUCT BY ID
exports.getProductById = async (req, res) => {
  try {
    let product;
    // Check if ID is a valid MongoDB ObjectId, if not, treat as barcode
    const isValidId = req.params.id.match(/^[0-9a-fA-F]{24}$/);
    
    if (isValidId) {
      product = await Product.findOne({ _id: req.params.id }).populate("categoryId");
    }
    
    // If not found by ID or not a valid ID, try searching by barcode
    if (!product) {
      product = await Product.findOne({ barcode: req.params.id }).populate("categoryId");
    }
    
    if (!product) return res.status(404).json({ message: "Product not found" });

    const inventory = await Inventory.findOne({ productId: product._id });
    
    const obj = product.toObject();
    res.json({
      ...obj,
      _id: obj._id.toString(),
      currentStock: inventory ? inventory.quantity : 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE PRODUCT & STOCK
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentStock, ...productData } = req.body;
    
    // Fix: If barcode is empty string, set it to undefined to avoid unique index clashing
    if (productData.barcode === "") {
      productData.barcode = undefined;
    }

    const updatedProduct = await Product.findOneAndUpdate(
      { _id: id }, 
      productData, 
      { new: true }
    );

    if (updatedProduct && currentStock !== undefined) {
      const oldInv = await Inventory.findOne({ productId: id });
      const diff = parseInt(currentStock) - (oldInv ? oldInv.quantity : 0);
      
      if (diff !== 0) {
        const StockMovement = require("../models/StockMovement");
        await StockMovement.create({
          productId: id,
          type: diff > 0 ? "IN" : "OUT",
          quantity: Math.abs(diff),
          reason: "Product Data Update"
        });
      }

      await Inventory.findOneAndUpdate(
        { productId: id },
        { quantity: currentStock },
        { upsert: true, new: true }
      );
    }

    if (!updatedProduct)
      return res.status(404).json({ message: "Product not found" });

    if (req.user) {
      await logAction(req.user.id, "UPDATE_PRODUCT", `Updated product: ${updatedProduct.name}`);
    }

    res.json(updatedProduct);
  } catch (error) {
    console.error("Update Product Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// DELETE PRODUCT
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findOneAndDelete({ _id: id });
    if (product && req.user) {
      await logAction(req.user.id, "DELETE_PRODUCT", `Deleted product: ${product.name}`);
      await Inventory.deleteMany({ productId: id });
      res.json({ message: "Product deleted successfully" });
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET PRODUCTS BY CATEGORY
exports.getProductsByCategory = async (req, res) => {
  try {
    const products = await Product.find({ categoryId: req.params.categoryId });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

