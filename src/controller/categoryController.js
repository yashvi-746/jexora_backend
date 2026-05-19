const Category = require("../models/Category"); 

// ADD CATEGORY
exports.createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const category = new Category({ name });
    await category.save();
    res.status(201).json({ message: "Category created", category });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "A category with this name already exists!" });
    }
    res.status(500).json({ message: error.message });
  }
};

// UPDATE CATEGORY
exports.updateCategory = async (req, res) => {
  try {
    const updated = await Category.findOneAndUpdate(
      { _id: req.params.id }, 
      req.body, 
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Category not found" });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL CATEGORIES
exports.getCategories = async (req, res) => {
  try {
    // Fetch all categories (global) so users can see seeded categories too
    const categories = await Category.find({});
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE CATEGORY
exports.deleteCategory = async (req, res) => {
  try {
    const deleted = await Category.findOneAndDelete({ _id: req.params.id });
    if (!deleted) return res.status(404).json({ message: "Category not found" });
    res.json({ message: "Category deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

