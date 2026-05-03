const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { getNotifications, markAsRead, markAllAsRead } = require("../controller/notificationController");

router.get("/", auth, getNotifications);
router.put("/mark-all-read", auth, markAllAsRead);
router.put("/:id/read", auth, markAsRead);

module.exports = router;
