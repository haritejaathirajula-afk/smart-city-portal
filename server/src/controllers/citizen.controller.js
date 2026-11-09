const db = require('../config/db');

/**
 * Get Citizen Dashboard Summary
 * GET /api/citizen/dashboard
 */
async function getDashboardSummary(req, res, next) {
  try {
    const citizenId = req.user.id;
    const userWard = req.user.ward_no || 'Ward-12';

    // Check DB connectivity
    const dbCheck = await db.checkConnection();

    if (dbCheck.connected) {
      // 1. Complaint metrics
      const [metrics] = await db.query(
        `SELECT 
           COUNT(*) as totalComplaints,
           SUM(CASE WHEN status IN ('REPORTED', 'ASSIGNED', 'IN_PROGRESS', 'REOPENED') THEN 1 ELSE 0 END) as activeComplaints,
           SUM(CASE WHEN status IN ('RESOLVED', 'VERIFIED', 'CLOSED') THEN 1 ELSE 0 END) as resolvedComplaints
         FROM complaints
         WHERE citizen_id = ?`,
        [citizenId]
      );

      // 2. Service request metrics
      const [serviceMetrics] = await db.query(
        `SELECT COUNT(*) as activeServices
         FROM service_requests
         WHERE citizen_id = ? AND status NOT IN ('COMPLETED', 'REJECTED')`,
        [citizenId]
      );

      // 3. Notification unread count
      const [notificationMetrics] = await db.query(
        `SELECT 
           COUNT(*) as totalNotifications,
           SUM(CASE WHEN is_read = FALSE THEN 1 ELSE 0 END) as unreadNotifications
         FROM notifications
         WHERE user_id = ?`,
        [citizenId]
      );

      // 4. Citizen complaints list (ordered by most recent)
      const [complaints] = await db.query(
        `SELECT 
           c.id, c.tracking_code, c.title, c.description, c.location_address,
           c.ward_no, c.photo_url, c.priority, c.status, c.rejection_reason, c.created_at, c.resolved_at,
           d.name as department_name, d.code as department_code,
           cat.name as category_name,
           (SELECT remarks FROM complaint_status_history WHERE complaint_id = c.id ORDER BY id DESC LIMIT 1) as latest_remark
         FROM complaints c
         JOIN departments d ON c.department_id = d.id
         JOIN complaint_categories cat ON c.category_id = cat.id
         WHERE c.citizen_id = ?
         ORDER BY c.created_at DESC
         LIMIT 10`,
        [citizenId]
      );

      // 5. Active emergency alerts (for citizen's ward or ALL)
      const [alerts] = await db.query(
        `SELECT id, title, severity, target_ward, message, action_instructions, created_at
         FROM emergency_alerts
         WHERE is_active = TRUE AND (target_ward = 'ALL' OR target_ward = ?)
         ORDER BY FIELD(severity, 'DISASTER', 'CRITICAL', 'WARNING', 'INFO'), created_at DESC
         LIMIT 5`,
        [userWard]
      );

      // 6. Recent published announcements
      const [announcements] = await db.query(
        `SELECT a.id, a.title, a.content, a.category, a.created_at, u.name as author_name
         FROM announcements a
         JOIN users u ON a.author_id = u.id
         WHERE a.is_published = TRUE
         ORDER BY a.created_at DESC
         LIMIT 4`
      );

      // 7. Citizen's active service requests
      const [serviceRequests] = await db.query(
        `SELECT sr.id, sr.request_code, sr.details, sr.address, sr.ward_no, sr.preferred_slot, sr.status, sr.created_at,
                sc.name as service_name, sc.fee,
                d.name as department_name
         FROM service_requests sr
         JOIN service_categories sc ON sr.service_category_id = sc.id
         JOIN departments d ON sr.department_id = d.id
         WHERE sr.citizen_id = ?
         ORDER BY sr.created_at DESC
         LIMIT 5`,
        [citizenId]
      );

      // 8. Citizen notifications
      const [notifications] = await db.query(
        `SELECT id, user_id, title, message, type, entity_type, entity_id, is_read, created_at
         FROM notifications
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT 15`,
        [citizenId]
      );

      return res.status(200).json({
        success: true,
        data: {
          stats: {
            totalComplaints: Number(metrics[0]?.totalComplaints) || 0,
            activeComplaints: Number(metrics[0]?.activeComplaints) || 0,
            resolvedComplaints: Number(metrics[0]?.resolvedComplaints) || 0,
            activeServices: Number(serviceMetrics[0]?.activeServices) || 0,
            unreadNotifications: Number(notificationMetrics[0]?.unreadNotifications) || 0,
          },
          complaints,
          alerts,
          announcements,
          serviceRequests,
          notifications,
        },
      });
    }

    // Fallback demonstration response when MySQL is offline
    const demoData = {
      stats: {
        totalComplaints: 3,
        activeComplaints: 2,
        resolvedComplaints: 1,
        activeServices: 1,
        unreadNotifications: 1,
      },
      complaints: [
        {
          id: 1,
          tracking_code: 'CMP-2026-00101',
          title: 'Severe Pothole Cluster on 5th Cross Road',
          description: 'Three deep craters spanning 2 meters across have formed right in front of Greenfield Apartments.',
          location_address: 'Near Gate 2, Greenfield Apartments, 5th Cross Road, Sector 15',
          ward_no: 'Ward-12',
          photo_url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
          priority: 'HIGH',
          status: 'REPORTED',
          rejection_reason: null,
          created_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
          resolved_at: null,
          department_name: 'Roads & Infrastructure (PWD)',
          department_code: 'PWD',
          category_name: 'Pothole and Crater on Road',
          latest_remark: 'Complaint submitted via citizen web portal with geo-coordinates and photograph.',
        },
        {
          id: 4,
          tracking_code: 'CMP-2026-00104',
          title: 'Underground Water Main Fractured on Park Avenue',
          description: 'High pressure clean water flooding the street and reducing pressure to 40 households.',
          location_address: 'Plot 72, Park Avenue, Ward 15',
          ward_no: 'Ward-15',
          photo_url: 'https://images.unsplash.com/photo-1584467735815-f778f274e296?auto=format&fit=crop&w=800&q=80',
          priority: 'EMERGENCY',
          status: 'RESOLVED',
          rejection_reason: null,
          created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
          resolved_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
          department_name: 'Water Supply & Sewerage Board',
          department_code: 'WSS',
          category_name: 'Major Water Pipeline Burst',
          latest_remark: 'Replacement collar fitted and pressurized test passed with zero leakage. Site backfilled.',
        },
        {
          id: 7,
          tracking_code: 'CMP-2026-00107',
          title: 'Substandard Patching of Pothole on Ward 12 Main Road',
          description: 'The initial gravel patch eroded completely during last night light rain. Deep hole is exposed again.',
          location_address: 'Opposite Metro Pillar 114, Main Road',
          ward_no: 'Ward-12',
          photo_url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
          priority: 'HIGH',
          status: 'REOPENED',
          rejection_reason: null,
          created_at: new Date(Date.now() - 96 * 3600 * 1000).toISOString(),
          resolved_at: null,
          department_name: 'Roads & Infrastructure (PWD)',
          department_code: 'PWD',
          category_name: 'Pothole and Crater on Road',
          latest_remark: 'Citizen rejected resolution: Gravel was washed out within 12 hours. Proper hot-mix asphalt required.',
        },
      ],
      alerts: [
        {
          id: 1,
          title: 'Flash Flood Warning: Low-Lying Sectors along Western Riverbank',
          severity: 'CRITICAL',
          target_ward: 'Ward-15',
          message: 'Continuous rainfall upstream has raised water levels in the canal. Water accumulation expected in basement parking lots along Riverbank Road.',
          action_instructions: 'Move vehicles to elevated municipal parking lots. In case of water ingress, dial Municipal Control Room at 1800-11-2026 immediately.',
          created_at: new Date().toISOString(),
        },
      ],
      announcements: [
        {
          id: 1,
          title: 'Launch of the Smart City 24/7 Citizen Redressal Portal',
          content: 'Citizens can now log issues with GPS coordinates, track their complaints in real-time, and hold departments accountable.',
          category: 'GOVERNANCE',
          created_at: new Date().toISOString(),
          author_name: 'City Administrator',
        },
        {
          id: 2,
          title: 'City-Wide Pre-Monsoon Drainage Cleaning Drive Starting Oct 1',
          content: 'Sanitation and PWD crews will be conducting intensive silt extraction across all 24 wards.',
          category: 'ENVIRONMENT',
          created_at: new Date().toISOString(),
          author_name: 'City Administrator',
        },
      ],
      serviceRequests: [
        {
          id: 1,
          request_code: 'SRQ-2026-0001',
          service_name: 'Emergency Potable Water Tanker (6,000L)',
          department_name: 'Water Supply & Sewerage Board',
          details: 'Underground water pump burned out; request emergency 6,000-liter tanker for residential tower.',
          address: 'Greenfield Apartments, Sector 15',
          ward_no: 'Ward-12',
          preferred_slot: 'Morning (8 AM - 11 AM)',
          status: 'APPROVED',
          fee: '350.00',
          created_at: new Date().toISOString(),
        },
      ],
      notifications: [
        {
          id: 1,
          user_id: 5,
          title: 'Complaint Assigned',
          message: 'Your complaint CMP-2026-00101 (Severe Pothole Cluster) has been received and queued for zonal review.',
          type: 'INFO',
          entity_type: 'COMPLAINT',
          entity_id: 1,
          is_read: false,
          created_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
        },
      ],
    };

    res.status(200).json({
      success: true,
      data: demoData,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Citizen Notifications List
 * GET /api/citizen/notifications
 */
async function getNotifications(req, res, next) {
  try {
    const citizenId = req.user.id;
    const isReadFilter = req.query.is_read !== undefined 
      ? req.query.is_read === 'true' || req.query.is_read === '1' 
      : null;
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);

    const dbCheck = await db.checkConnection();

    if (dbCheck.connected) {
      let query = `
        SELECT id, user_id, title, message, type, entity_type, entity_id, is_read, created_at
        FROM notifications
        WHERE user_id = ?
      `;
      const params = [citizenId];

      if (isReadFilter !== null) {
        query += ` AND is_read = ?`;
        params.push(isReadFilter);
      }

      query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const [notifications] = await db.query(query, params);

      const [unreadResult] = await db.query(
        `SELECT COUNT(*) as unreadCount FROM notifications WHERE user_id = ? AND is_read = FALSE`,
        [citizenId]
      );

      return res.status(200).json({
        success: true,
        data: {
          notifications,
          unreadCount: Number(unreadResult[0]?.unreadCount) || 0,
          limit,
          offset,
        },
      });
    }

    // Demo fallback
    res.status(200).json({
      success: true,
      data: {
        notifications: [
          {
            id: 1,
            user_id: citizenId,
            title: 'Complaint Assigned',
            message: 'Your complaint CMP-2026-00101 has been received and queued for zonal review.',
            type: 'INFO',
            entity_type: 'COMPLAINT',
            entity_id: 1,
            is_read: false,
            created_at: new Date().toISOString(),
          },
        ],
        unreadCount: 1,
        limit,
        offset,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark a single notification as read
 * PATCH /api/citizen/notifications/:id/read
 */
async function markNotificationRead(req, res, next) {
  try {
    const citizenId = req.user.id;
    const notificationId = parseInt(req.params.id, 10);

    if (isNaN(notificationId) || notificationId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID provided.',
      });
    }

    const dbCheck = await db.checkConnection();

    if (dbCheck.connected) {
      const [result] = await db.query(
        `UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?`,
        [notificationId, citizenId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found or access denied.',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Notification marked as read successfully.',
        data: {
          id: notificationId,
          is_read: true,
        },
      });
    }

    // Demo fallback
    res.status(200).json({
      success: true,
      message: 'Notification marked as read (Demo mode).',
      data: {
        id: notificationId,
        is_read: true,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark all notifications as read for current citizen
 * PATCH /api/citizen/notifications/mark-all-read
 */
async function markAllNotificationsRead(req, res, next) {
  try {
    const citizenId = req.user.id;

    const dbCheck = await db.checkConnection();

    if (dbCheck.connected) {
      const [result] = await db.query(
        `UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE`,
        [citizenId]
      );

      return res.status(200).json({
        success: true,
        message: 'All notifications marked as read.',
        data: {
          updatedCount: result.affectedRows,
        },
      });
    }

    // Demo fallback
    res.status(200).json({
      success: true,
      message: 'All notifications marked as read (Demo mode).',
      data: {
        updatedCount: 1,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDashboardSummary,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};
