const Notification = require("../models/Notification");

// GET all notifications for the current user
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// MARK a notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      { isRead: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: "Notification not found" });
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// MARK all as read
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, isRead: false },
      { isRead: true }
    );
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// SYSTEM FUNCTION: Create a specific notification for a user
exports.createUserNotification = async (userId, message) => {
  try {
    await Notification.create({
      userId,
      message,
      isRead: false
    });
  } catch (error) {
    console.error("Failed to create user notification:", error);
  }
};

// SYSTEM FUNCTION: Create a global notification for all admins (Legacy / Multi-admin)
exports.createGlobalNotification = async (message) => {
  try {
    const User = require("../models/User");
    const admins = await User.find({ role: "Admin" });
    
    const notifications = admins.map(admin => ({
      userId: admin._id,
      message,
      isRead: false
    }));
    
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
  } catch (error) {
    console.error("Failed to create global notification:", error);
  }
};
