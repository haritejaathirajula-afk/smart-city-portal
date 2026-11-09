const db = require('../config/db');

// Fallback seed announcements for offline resilience & demo mode
let fallbackAnnouncements = [
  {
    id: 1,
    title: 'Monsoon Desilting Drive Across Central Stormwater Drains',
    content: 'The Public Works Department (PWD) in coordination with SWM has commenced the annual pre-monsoon desilting operations covering Ward 01 through Ward 15. Residents are requested to avoid parking near open drain culverts.',
    category: 'CIVIC_WORK',
    is_published: true,
    author_id: 1,
    author_name: 'City Administrator',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 2,
    title: 'Free Vector-Borne Disease Screening & Larvicide Distribution Camp',
    content: 'Public Health Department is organizing mobile health checkup camps and distributing free mosquito repellant kits at all community centers this weekend from 9:00 AM to 4:00 PM.',
    category: 'PUBLIC_HEALTH',
    is_published: true,
    author_id: 1,
    author_name: 'Dr. Alok Nath (Public Health)',
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
  {
    id: 3,
    title: 'Smart LED Streetlighting Upgrade on Ring Road Junction',
    content: 'Electricity wing will replace 250 conventional sodium vapor lamps with energy-efficient 90W smart connected LED fixtures between 11:00 PM and 5:00 AM. Minimal traffic diversion will be in effect.',
    category: 'CIVIC_WORK',
    is_published: true,
    author_id: 2,
    author_name: 'Rajesh Sharma (PWD)',
    created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
  },
];

let fallbackAlerts = [
  {
    id: 1,
    title: 'Flash Flood Warning: Low-Lying Sectors along Western Riverbank',
    severity: 'CRITICAL',
    target_ward: 'Ward-15',
    message: 'Continuous rainfall upstream has raised water levels in the canal. Water accumulation expected in basement parking lots along Riverbank Road.',
    action_instructions: 'Move vehicles to elevated municipal parking lots. In case of water ingress, dial Municipal Control Room at 1800-11-2026 immediately.',
    is_active: true,
    expires_at: new Date(Date.now() + 3600000 * 12).toISOString(),
    author_id: 1,
    author_name: 'Municipal Disaster Management Cell',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 2,
    title: 'Emergency 36-Hour Water Pipeline Maintenance in South Zone',
    severity: 'WARNING',
    target_ward: 'Ward 08, Ward 09',
    message: 'Scheduled major valve replacement at South Zone Treatment Plant will disrupt piped drinking water supply for 36 hours starting tomorrow morning.',
    action_instructions: 'Store sufficient potable water. Free municipal drinking water tankers can be requested directly via the Services portal.',
    is_active: true,
    expires_at: new Date(Date.now() + 3600000 * 36).toISOString(),
    author_id: 1,
    author_name: 'Water Supply & Sewerage Board',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
];

/**
 * GET /api/announcements
 * Retrieve list of published civic announcements
 */
exports.getAnnouncements = async (req, res, next) => {
  try {
    const { category, search, limit = 50, offset = 0 } = req.query;

    try {
      let sql = `
        SELECT 
          a.id,
          a.title,
          a.content,
          a.category,
          a.is_published,
          a.created_at,
          a.updated_at,
          u.name AS author_name,
          u.email AS author_email
        FROM announcements a
        JOIN users u ON a.author_id = u.id
        WHERE a.is_published = TRUE
      `;
      const params = [];

      if (category && category !== 'ALL') {
        sql += ` AND a.category = ?`;
        params.push(category);
      }
      if (search) {
        sql += ` AND (a.title LIKE ? OR a.content LIKE ?)`;
        const q = `%${search}%`;
        params.push(q, q);
      }

      sql += ` ORDER BY a.created_at DESC LIMIT ? OFFSET ?`;
      params.push(Math.min(parseInt(limit, 10) || 50, 100), Math.max(parseInt(offset, 10) || 0, 0));

      const [rows] = await db.query(sql, params);
      const formatted = rows.map((r) => ({
        ...r,
        is_active: Boolean(r.is_active),
        is_expired: Boolean(r.is_expired),
      }));
      return res.json({ success: true, count: formatted.length, data: formatted });
    } catch (dbErr) {
      let list = [...fallbackAnnouncements];
      if (category && category !== 'ALL') list = list.filter((a) => a.category === category);
      if (search) {
        const s = search.toLowerCase();
        list = list.filter((a) => a.title.toLowerCase().includes(s) || a.content.toLowerCase().includes(s));
      }
      return res.json({ success: true, count: list.length, data: list });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/announcements/:id
 * Retrieve single announcement details
 */
exports.getAnnouncementById = async (req, res, next) => {
  try {
    const annId = req.params.id;

    try {
      const [rows] = await db.query(
        `SELECT a.*, u.name AS author_name, u.email AS author_email
         FROM announcements a
         JOIN users u ON a.author_id = u.id
         WHERE a.id = ?`,
        [annId]
      );

      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Announcement not found' });
      }

      return res.json({ success: true, data: rows[0] });
    } catch (dbErr) {
      const item = fallbackAnnouncements.find((a) => a.id == annId);
      if (!item) {
        return res.status(404).json({ success: false, message: 'Announcement not found' });
      }
      return res.json({ success: true, data: item });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/announcements
 * Publish new municipal announcement (Officer/Admin)
 */
exports.createAnnouncement = async (req, res, next) => {
  try {
    const authorId = req.user.id;
    const { title, content, category } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }

    if (typeof title !== 'string' || title.trim().length < 5) {
      return res.status(400).json({ success: false, message: 'Title must be at least 5 characters long' });
    }

    if (typeof content !== 'string' || content.trim().length < 10) {
      return res.status(400).json({ success: false, message: 'Content must be at least 10 characters long' });
    }

    const validCategories = ['CIVIC_WORK', 'PUBLIC_HEALTH', 'TRAFFIC', 'COMMUNITY', 'GENERAL', 'UTILITY', 'ENVIRONMENT'];
    const annCategory = validCategories.includes(category) ? category : 'GENERAL';

    try {
      const [result] = await db.query(
        `INSERT INTO announcements (author_id, title, content, category, is_published)
         VALUES (?, ?, ?, ?, TRUE)`,
        [authorId, title.trim(), content.trim(), annCategory]
      );

      const newId = result.insertId;

      // Log in audit trail
      try {
        await db.query(
          `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
           VALUES (?, 'ANNOUNCEMENT_CREATED', 'ANNOUNCEMENT', ?, ?, ?)`,
          [
            authorId,
            newId,
            JSON.stringify({ title: title.trim(), category: annCategory }),
            req.ip || '127.0.0.1',
          ]
        );
      } catch (auditErr) {
        console.warn('Audit log insert failed:', auditErr.message);
      }

      return res.status(201).json({
        success: true,
        message: 'Announcement published successfully',
        data: {
          id: newId,
          author_id: authorId,
          title: title.trim(),
          content: content.trim(),
          category: annCategory,
          is_published: true,
          created_at: new Date().toISOString(),
        },
      });
    } catch (dbErr) {
      const newAnn = {
        id: fallbackAnnouncements.length + 1,
        author_id: authorId,
        author_name: req.user.name || 'Municipal Authority',
        title: title.trim(),
        content: content.trim(),
        category: annCategory,
        is_published: true,
        created_at: new Date().toISOString(),
      };
      fallbackAnnouncements.unshift(newAnn);

      return res.status(201).json({
        success: true,
        message: 'Announcement published successfully',
        data: newAnn,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/announcements/:id
 * Update an existing announcement (Officer/Admin)
 */
exports.updateAnnouncement = async (req, res, next) => {
  try {
    const annId = req.params.id;
    const authorId = req.user.id;
    const { title, content, category, is_published } = req.body;

    try {
      const [existing] = await db.query(`SELECT * FROM announcements WHERE id = ?`, [annId]);
      if (existing.length === 0) {
        return res.status(404).json({ success: false, message: 'Announcement not found' });
      }

      const updatedTitle = title !== undefined ? title.trim() : existing[0].title;
      const updatedContent = content !== undefined ? content.trim() : existing[0].content;
      const updatedCat = category !== undefined ? category : existing[0].category;
      const updatedPublished = is_published !== undefined ? Boolean(is_published) : existing[0].is_published;

      await db.query(
        `UPDATE announcements 
         SET title = ?, content = ?, category = ?, is_published = ?, updated_at = NOW()
         WHERE id = ?`,
        [updatedTitle, updatedContent, updatedCat, updatedPublished, annId]
      );

      // Audit log
      try {
        await db.query(
          `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
           VALUES (?, 'ANNOUNCEMENT_UPDATED', 'ANNOUNCEMENT', ?, ?, ?)`,
          [authorId, annId, JSON.stringify({ title: updatedTitle, category: updatedCat }), req.ip || '127.0.0.1']
        );
      } catch (e) {}

      return res.json({
        success: true,
        message: 'Announcement updated successfully',
        data: {
          id: Number(annId),
          title: updatedTitle,
          content: updatedContent,
          category: updatedCat,
          is_published: updatedPublished,
        },
      });
    } catch (dbErr) {
      const item = fallbackAnnouncements.find((a) => a.id == annId);
      if (!item) {
        return res.status(404).json({ success: false, message: 'Announcement not found' });
      }
      if (title) item.title = title.trim();
      if (content) item.content = content.trim();
      if (category) item.category = category;
      if (is_published !== undefined) item.is_published = Boolean(is_published);

      return res.json({
        success: true,
        message: 'Announcement updated successfully',
        data: item,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/announcements/:id
 * Delete an announcement (Officer/Admin)
 */
exports.deleteAnnouncement = async (req, res, next) => {
  try {
    const annId = req.params.id;
    const authorId = req.user.id;

    try {
      const [existing] = await db.query(`SELECT id, title FROM announcements WHERE id = ?`, [annId]);
      if (existing.length === 0) {
        return res.status(404).json({ success: false, message: 'Announcement not found' });
      }

      await db.query(`DELETE FROM announcements WHERE id = ?`, [annId]);

      try {
        await db.query(
          `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
           VALUES (?, 'ANNOUNCEMENT_DELETED', 'ANNOUNCEMENT', ?, ?, ?)`,
          [authorId, annId, JSON.stringify({ deleted_title: existing[0].title }), req.ip || '127.0.0.1']
        );
      } catch (e) {}

      return res.json({ success: true, message: 'Announcement deleted successfully' });
    } catch (dbErr) {
      fallbackAnnouncements = fallbackAnnouncements.filter((a) => a.id != annId);
      return res.json({ success: true, message: 'Announcement deleted successfully' });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/alerts
 * Retrieve emergency broadcasts with automatic expiry handling
 * Query params:
 *   - severity: 'DISASTER' | 'CRITICAL' | 'WARNING' | 'INFO'
 *   - ward: target ward name / number
 *   - status: 'active' (default) | 'expired' | 'all'
 *   - search: string
 */
exports.getEmergencyAlerts = async (req, res, next) => {
  try {
    const { severity, ward, status = 'active', search } = req.query;

    try {
      let sql = `
        SELECT 
          ea.id,
          ea.title,
          ea.severity,
          ea.target_ward,
          ea.message,
          ea.action_instructions,
          ea.is_active,
          ea.expires_at,
          ea.created_at,
          ea.updated_at,
          u.name AS author_name,
          CASE 
            WHEN ea.expires_at IS NOT NULL AND ea.expires_at <= NOW() THEN TRUE 
            ELSE FALSE 
          END AS is_expired
        FROM emergency_alerts ea
        JOIN users u ON ea.author_id = u.id
        WHERE 1=1
      `;
      const params = [];

      // Expiry and Active Filter Logic
      if (status === 'expired') {
        sql += ` AND (ea.expires_at IS NOT NULL AND ea.expires_at <= NOW())`;
      } else if (status === 'all') {
        // Return all alerts (active, inactive, expired)
      } else {
        // Default 'active': Alert must be active AND not expired
        sql += ` AND ea.is_active = TRUE AND (ea.expires_at IS NULL OR ea.expires_at > NOW())`;
      }

      if (severity) {
        sql += ` AND ea.severity = ?`;
        params.push(severity);
      }
      if (ward && ward !== 'ALL') {
        sql += ` AND (ea.target_ward = 'ALL' OR ea.target_ward LIKE ?)`;
        params.push(`%${ward}%`);
      }
      if (search) {
        sql += ` AND (ea.title LIKE ? OR ea.message LIKE ? OR ea.target_ward LIKE ?)`;
        const q = `%${search}%`;
        params.push(q, q, q);
      }

      sql += ` ORDER BY 
        CASE ea.severity 
          WHEN 'DISASTER' THEN 1 
          WHEN 'CRITICAL' THEN 2 
          WHEN 'WARNING' THEN 3 
          ELSE 4 
        END ASC, 
        ea.created_at DESC`;

      const [rows] = await db.query(sql, params);
      const formatted = rows.map((r) => ({
        ...r,
        is_active: Boolean(r.is_active),
        is_expired: Boolean(r.is_expired),
      }));
      return res.json({ success: true, count: formatted.length, data: formatted });
    } catch (dbErr) {
      const now = Date.now();
      let list = fallbackAlerts.map((a) => ({
        ...a,
        is_expired: a.expires_at ? new Date(a.expires_at).getTime() <= now : false,
      }));

      if (status === 'expired') {
        list = list.filter((a) => a.is_expired);
      } else if (status === 'all') {
        // Keep all
      } else {
        list = list.filter((a) => a.is_active && !a.is_expired);
      }

      if (severity) list = list.filter((a) => a.severity === severity);
      if (ward && ward !== 'ALL') list = list.filter((a) => a.target_ward === 'ALL' || a.target_ward.includes(ward));
      if (search) {
        const s = search.toLowerCase();
        list = list.filter((a) => a.title.toLowerCase().includes(s) || a.message.toLowerCase().includes(s));
      }

      return res.json({ success: true, count: list.length, data: list });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/alerts/:id
 * Retrieve single emergency alert details
 */
exports.getEmergencyAlertById = async (req, res, next) => {
  try {
    const alertId = req.params.id;

    try {
      const [rows] = await db.query(
        `SELECT 
          ea.*,
          u.name AS author_name,
          CASE 
            WHEN ea.expires_at IS NOT NULL AND ea.expires_at <= NOW() THEN TRUE 
            ELSE FALSE 
          END AS is_expired
        FROM emergency_alerts ea
        JOIN users u ON ea.author_id = u.id
        WHERE ea.id = ?`,
        [alertId]
      );

      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Emergency alert not found' });
      }

      const item = {
        ...rows[0],
        is_active: Boolean(rows[0].is_active),
        is_expired: Boolean(rows[0].is_expired),
      };

      return res.json({ success: true, data: item });
    } catch (dbErr) {
      const alert = fallbackAlerts.find((a) => a.id == alertId);
      if (!alert) {
        return res.status(404).json({ success: false, message: 'Emergency alert not found' });
      }
      return res.json({ success: true, data: alert });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/alerts
 * Issue an emergency broadcast with optional expiry and in-app notification propagation (Officer/Admin)
 */
exports.createEmergencyAlert = async (req, res, next) => {
  try {
    const authorId = req.user.id;
    const { title, severity, target_ward, message, action_instructions, expires_at, duration_hours } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message are required' });
    }

    if (typeof title !== 'string' || title.trim().length < 5) {
      return res.status(400).json({ success: false, message: 'Title must be at least 5 characters long' });
    }

    if (typeof message !== 'string' || message.trim().length < 10) {
      return res.status(400).json({ success: false, message: 'Message must be at least 10 characters long' });
    }

    const validSeverities = ['INFO', 'WARNING', 'CRITICAL', 'DISASTER'];
    const alertSeverity = validSeverities.includes(severity) ? severity : 'WARNING';

    // Handle Expiry Calculation & Validation
    let calculatedExpiry = null;
    if (expires_at) {
      const expDate = new Date(expires_at);
      if (isNaN(expDate.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid expires_at date format' });
      }
      if (expDate.getTime() <= Date.now()) {
        return res.status(400).json({ success: false, message: 'Alert expiry must be in the future' });
      }
      calculatedExpiry = expDate.toISOString().slice(0, 19).replace('T', ' ');
    } else if (duration_hours && Number(duration_hours) > 0) {
      const expDate = new Date(Date.now() + Number(duration_hours) * 3600000);
      calculatedExpiry = expDate.toISOString().slice(0, 19).replace('T', ' ');
    }

    const effectiveWard = target_ward ? target_ward.trim() : 'ALL';
    const effectiveAction = action_instructions ? action_instructions.trim() : null;

    try {
      const [result] = await db.query(
        `INSERT INTO emergency_alerts (author_id, title, severity, target_ward, message, action_instructions, is_active, expires_at)
         VALUES (?, ?, ?, ?, ?, ?, TRUE, ?)`,
        [authorId, title.trim(), alertSeverity, effectiveWard, message.trim(), effectiveAction, calculatedExpiry]
      );

      const newId = result.insertId;

      // Broadcast in-app notification to affected citizens if CRITICAL or DISASTER
      if (['CRITICAL', 'DISASTER'].includes(alertSeverity)) {
        try {
          await db.query(
            `INSERT INTO notifications (user_id, title, message, type, entity_type, entity_id)
             SELECT u.id, ?, ?, 'ALERT', 'EMERGENCY_ALERT', ?
             FROM users u
             WHERE u.is_active = TRUE AND (? = 'ALL' OR u.ward_no = ? OR ? LIKE CONCAT('%', u.ward_no, '%'))
             LIMIT 50`,
            [
              `🚨 EMERGENCY: ${title.trim()}`,
              `${message.trim()}${effectiveAction ? ' Action: ' + effectiveAction : ''}`,
              newId,
              effectiveWard,
              effectiveWard,
              effectiveWard,
            ]
          );
        } catch (notifErr) {
          console.warn('In-app emergency alert broadcast failed:', notifErr.message);
        }
      }

      // Record in audit logs
      try {
        await db.query(
          `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
           VALUES (?, 'EMERGENCY_ALERT_BROADCASTED', 'EMERGENCY_ALERT', ?, ?, ?)`,
          [
            authorId,
            newId,
            JSON.stringify({
              title: title.trim(),
              severity: alertSeverity,
              target_ward: effectiveWard,
              expires_at: calculatedExpiry,
            }),
            req.ip || '127.0.0.1',
          ]
        );
      } catch (auditErr) {
        console.warn('Audit log insert failed:', auditErr.message);
      }

      return res.status(201).json({
        success: true,
        message: 'Emergency alert broadcasted successfully',
        data: {
          id: newId,
          author_id: authorId,
          title: title.trim(),
          severity: alertSeverity,
          target_ward: effectiveWard,
          message: message.trim(),
          action_instructions: effectiveAction,
          is_active: true,
          expires_at: calculatedExpiry,
          created_at: new Date().toISOString(),
        },
      });
    } catch (dbErr) {
      const newAlert = {
        id: fallbackAlerts.length + 1,
        author_id: authorId,
        author_name: req.user.name || 'Emergency Authority',
        title: title.trim(),
        severity: alertSeverity,
        target_ward: effectiveWard,
        message: message.trim(),
        action_instructions: effectiveAction,
        is_active: true,
        expires_at: calculatedExpiry,
        created_at: new Date().toISOString(),
      };
      fallbackAlerts.unshift(newAlert);

      return res.status(201).json({
        success: true,
        message: 'Emergency alert broadcasted successfully',
        data: newAlert,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/alerts/:id/deactivate
 * Deactivate resolved emergency alert (Officer/Admin)
 */
exports.deactivateEmergencyAlert = async (req, res, next) => {
  try {
    const alertId = req.params.id;
    const authorId = req.user.id;

    try {
      const [existing] = await db.query(`SELECT id, title, is_active FROM emergency_alerts WHERE id = ?`, [alertId]);
      if (existing.length === 0) {
        return res.status(404).json({ success: false, message: 'Emergency alert not found' });
      }

      await db.query(`UPDATE emergency_alerts SET is_active = FALSE, updated_at = NOW() WHERE id = ?`, [alertId]);

      // Record in audit trail
      try {
        await db.query(
          `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
           VALUES (?, 'EMERGENCY_ALERT_DEACTIVATED', 'EMERGENCY_ALERT', ?, ?, ?)`,
          [authorId, alertId, JSON.stringify({ deactivated_title: existing[0].title }), req.ip || '127.0.0.1']
        );
      } catch (e) {}

      return res.json({ success: true, message: 'Emergency alert deactivated successfully' });
    } catch (dbErr) {
      const alert = fallbackAlerts.find((a) => a.id == alertId);
      if (alert) alert.is_active = false;
      return res.json({ success: true, message: 'Emergency alert deactivated successfully' });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/alerts/:id
 * Delete an emergency alert (Officer/Admin)
 */
exports.deleteEmergencyAlert = async (req, res, next) => {
  try {
    const alertId = req.params.id;
    const authorId = req.user.id;

    try {
      const [existing] = await db.query(`SELECT id, title FROM emergency_alerts WHERE id = ?`, [alertId]);
      if (existing.length === 0) {
        return res.status(404).json({ success: false, message: 'Emergency alert not found' });
      }

      await db.query(`DELETE FROM emergency_alerts WHERE id = ?`, [alertId]);

      try {
        await db.query(
          `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
           VALUES (?, 'EMERGENCY_ALERT_DELETED', 'EMERGENCY_ALERT', ?, ?, ?)`,
          [authorId, alertId, JSON.stringify({ deleted_title: existing[0].title }), req.ip || '127.0.0.1']
        );
      } catch (e) {}

      return res.json({ success: true, message: 'Emergency alert deleted successfully' });
    } catch (dbErr) {
      fallbackAlerts = fallbackAlerts.filter((a) => a.id != alertId);
      return res.json({ success: true, message: 'Emergency alert deleted successfully' });
    }
  } catch (error) {
    next(error);
  }
};
