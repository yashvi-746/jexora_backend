const express = require("express");
const router = express.Router();

const {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require("../controller/userController");

router.post("/create", createUser);      // ADD USER
router.get("/", getUsers);               // GET ALL USERS
router.get("/:id", getUserById);         // GET USER BY ID
router.put("/:id", updateUser);          // UPDATE USER
router.post("/delete/:id", deleteUser);  // DELETE USER (kept as POST for frontend compatibility)
router.delete("/:id", deleteUser);       // DELETE USER (REST standard)

module.exports = router;
