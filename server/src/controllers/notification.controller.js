const db = require('../config/db');

// Fallback demo notifications for offline resilience
let fallbackNotifications = [
  {
    id: 1,
    user_id: 5,
    title: 'Complaint Assigned',
    message: 'Your complaint CMP-2026-00101 (Severe Pothole Cluster) has been received and queued for zonal review.',
    type: 'INFO',
    entity_type: 'COMPLAINT',
    entity_id: 1,
    is_read: false,
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 2,
    user_id: 6,
    title: 'Work Verified',
    message: 'Your reported issue CMP-2026-00102 has been verified by the zonal supervisor.',
    type: 'SUCCESS',
    entity_type: 'COMPLAINT',
    entity_id: 2,
    is_read: true,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 3,
    user_id: 2,
    title: 'New Complaint Assigned',
    message: 'Grievance CMP-2026-00101 has been assigned to your department queue for urgent resolution.',
    type: 'WARNING',
    entity_type: 'COMPLAINT',
    entity_id: 1,
    is_read: false,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
];

/**
 * GET /api/notifications
 * Retrieve notifications for current authenticated user (Citizen, Officer, or Admin)
 */
exports.getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const isReadFilter = req.query.is_read !== undefined
      ? req.query.is_read === 'true' || req.query.is_read === '1'
      : null;
    const typeFilter = req.query.type;
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);

    try {
      let query = `
        SELECT id, user_id, title, message, type, entity_type, entity_id, is_read, created_at
        FROM notifications
        WHERE user_id = ?
      `;
      const params = [userId];

      if (isReadFilter !== null) {
        query += ` AND is_read = ?`;
        params.push(isReadFilter);
      }

      if (typeFilter) {
        query += ` AND type = ?`;
        params.push(typeFilter);
      }

      query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const [notifications] = await db.query(query, params);

      const [unreadResult] = await db.query(
        `SELECT COUNT(*) as unreadCount FROM notifications WHERE user_id = ? AND is_read = FALSE`,
        [userId]
      );

      const [totalResult] = await db.query(
        `SELECT COUNT(*) as totalCount FROM notifications WHERE user_id = ?`,
        [userId]
      );

      return res.status(200).json({
        success: true,
        count: notifications.length,
        data: {
          notifications,
          unreadCount: Number(unreadResult[0]?.unreadCount) || 0,
          totalCount: Number(totalResult[0]?.totalCount) || 0,
          limit,
          offset,
        },
      });
    } catch (dbErr) {
      let list = fallbackNotifications.filter((n) => n.user_id === userId);
      if (isReadFilter !== null) list = list.filter((n) => Boolean(n.is_read) === isReadFilter);
      if (typeFilter) list = list.filter((n) => n.type === typeFilter);

      const unreadCount = list.filter((n) => !n.is_read).length;
      return res.status(200).json({
        success: true,
        count: list.length,
        data: {
          notifications: list.slice(offset, offset + limit),
          unreadCount,
          totalCount: list.length,
          limit,
          offset,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/notifications/:id/read
 * Mark a single notification as read
 */
exports.markNotificationRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const notificationId = parseInt(req.params.id, 10);

    if (isNaN(notificationId) || notificationId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID provided.',
      });
    }

    try {
      // Check ownership
      const [rows] = await db.query(`SELECT id, user_id, is_read FROM notifications WHERE id = ?`, [notificationId]);
      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found.',
        });
      }

      if (rows[0].user_id !== userId && req.user.role !== 'admin') {
        return res.status(404).json({
          success: false,
          message: 'Notification not found or access denied.',
        });
      }

      await db.query(`UPDATE notifications SET is_read = TRUE WHERE id = ?`, [notificationId]);

      return res.status(200).json({
        success: true,
        message: 'Notification marked as read successfully.',
        data: {
          id: notificationId,
          is_read: true,
        },
      });
    } catch (dbErr) {
      const item = fallbackNotifications.find((n) => n.id === notificationId && n.user_id === userId);
      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found or access denied.',
        });
      }
      item.is_read = true;
      return res.status(200).json({
        success: true,
        message: 'Notification marked as read successfully.',
        data: { id: notificationId, is_read: true },
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/notifications/mark-all-read
 * Mark all notifications as read for current user
 */
exports.markAllNotificationsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;

    try {
      const [result] = await db.query(
        `UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE`,
        [userId]
      );

      return res.status(200).json({
        success: true,
        message: 'All notifications marked as read.',
        data: {
          updatedCount: result.affectedRows,
        },
      });
    } catch (dbErr) {
      let count = 0;
      fallbackNotifications.forEach((n) => {
        if (n.user_id === userId && !n.is_read) {
          n.is_read = true;
          count++;
        }
      });
      return res.status(200).json({
        success: true,
        message: 'All notifications marked as read.',
        data: { updatedCount: count },
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
exports.deleteNotification = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const notificationId = parseInt(req.params.id, 10);

    if (isNaN(notificationId) || notificationId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID provided.',
      });
    }

    try {
      const [rows] = await db.query(`SELECT id, user_id FROM notifications WHERE id = ?`, [notificationId]);
      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found.',
        });
      }

      if (rows[0].user_id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You cannot delete another user\'s notification.',
        });
      }

      await db.query(`DELETE FROM notifications WHERE id = ?`, [notificationId]);

      return res.status(200).json({
        success: true,
        message: 'Notification deleted successfully.',
      });
    } catch (dbErr) {
      fallbackNotifications = fallbackNotifications.filter((n) => !(n.id === notificationId && n.user_id === userId));
      return res.status(200).json({
        success: true,
        message: 'Notification deleted successfully.',
      });
    }
  } catch (error) {
    next(error);
  }
};

