/**
 * In-app notifications — list, unread count, mark read.
 */
import Notification from "../models/notificationModel.js";

/** GET /api/notification — current user's notifications. */
export const listNotifications = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const unreadOnly = ["1", "true"].includes(String(req.query.unread || ""));

    const filter = { recipient: req.user.id };
    if (unreadOnly) filter.readAt = null;

    const [total, unreadCount, data] = await Promise.all([
      Notification.countDocuments(filter),
      Notification.countDocuments({ recipient: req.user.id, readAt: null }),
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    return res.status(200).json({
      success: true,
      data,
      page,
      limit,
      total,
      unreadCount,
      totalPages: total ? Math.ceil(total / limit) : 0,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/** GET /api/notification/unread-count */
export const getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({
      recipient: req.user.id,
      readAt: null,
    });
    return res.status(200).json({ success: true, unreadCount });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/** PUT /api/notification/:id/read */
export const markRead = async (req, res) => {
  try {
    const note = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user.id,
    });
    if (!note) {
      return res.status(404).json({ success: false, message: "Notification not found." });
    }
    if (!note.readAt) {
      note.readAt = new Date();
      await note.save();
    }
    return res.status(200).json({ success: true, data: note });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/** PUT /api/notification/read-all */
export const markAllRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { recipient: req.user.id, readAt: null },
      { $set: { readAt: new Date() } }
    );
    return res.status(200).json({
      success: true,
      modified: result.modifiedCount || 0,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
