const express = require("express");
const router = express.Router();
const {
  createCategory,
  updateCategory,
  deleteCategory,
  getCategories,
} = require("../controller/categoryController");

const auth = require("../middleware/auth");

router.post("/create", auth, createCategory);
router.get("/", auth, getCategories);
router.put("/:id", auth, updateCategory);
router.post("/delete/:id", auth, deleteCategory);


module.exports = router;

