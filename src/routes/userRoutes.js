const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const role = require("../middleware/role");

const {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require("../controller/userController");

router.post("/create", auth, role("Admin"), createUser);      // ADD USER
router.get("/", auth, role("Admin"), getUsers);               // GET ALL USERS
router.get("/:id", auth, role("Admin"), getUserById);         // GET USER BY ID
router.put("/:id", auth, role("Admin"), updateUser);          // UPDATE USER
router.post("/delete/:id", auth, role("Admin"), deleteUser);  // DELETE USER (kept as POST for frontend compatibility)
router.delete("/:id", auth, role("Admin"), deleteUser);       // DELETE USER (REST standard)

module.exports = router;
