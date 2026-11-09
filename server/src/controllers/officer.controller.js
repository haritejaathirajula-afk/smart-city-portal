const db = require('../config/db');

// Fallback demo field workers
const DEMO_WORKERS = [
  { id: 1, department_id: 1, name: 'Suresh Yadav', phone: '+91-98111-10001', skills: 'Asphalt filling, Concrete repair, Road roller operator', ward_assigned: 'Ward-12', is_available: true },
  { id: 2, department_id: 2, name: 'Raju Kumar', phone: '+91-98111-10002', skills: 'Garbage compactor driver, Segregation supervisor', ward_assigned: 'Ward-04', is_available: true },
  { id: 3, department_id: 3, name: 'Mohammad Imran', phone: '+91-98111-10003', skills: 'Pipeline plumber, Hydro-jetting technician', ward_assigned: 'Ward-15', is_available: true },
  { id: 4, department_id: 4, name: 'Dinesh Chand', phone: '+91-98111-10004', skills: 'Lineman, High-voltage electrician, Pole repair', ward_assigned: 'Ward-08', is_available: true },
  { id: 5, department_id: 5, name: 'Kishan Singh', phone: '+91-98111-10005', skills: 'Chainsaw operator, Tree arborist, Pruning technician', ward_assigned: 'Ward-09', is_available: true },
];

const DEMO_TASKS = [
  { id: 1, complaint_id: 3, tracking_code: 'CMP-2026-00103', worker_name: 'Raju Kumar', title: 'Market Dumpster Evacuation & Disinfection', status: 'IN_PROGRESS', due_date: new Date().toISOString().split('T')[0] },
  { id: 2, complaint_id: 4, tracking_code: 'CMP-2026-00104', worker_name: 'Mohammad Imran', title: 'Collar Joint Clamp Installation', status: 'COMPLETED', due_date: new Date(Date.now() - 24 * 3600 * 1000).toISOString().split('T')[0] },
  { id: 3, complaint_id: 7, tracking_code: 'CMP-2026-00107', worker_name: 'Suresh Yadav', title: 'Re-patching with Hot Mix Asphalt & Compaction', status: 'PENDING', due_date: new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0] },
];

/**
 * Helper to resolve officer_id and department_id
 */
async function getOfficerContext(user) {
  let officerId = user.officer_id;
  let departmentId = user.department_id;

  if (!officerId || !departmentId) {
    try {
      const [rows] = await db.query(
        'SELECT id as officer_id, department_id FROM officers WHERE user_id = ?',
        [user.id]
      );
      if (rows && rows.length > 0) {
        officerId = officerId || rows[0].officer_id;
        departmentId = departmentId || rows[0].department_id;
      }
    } catch (err) {
      console.warn('Could not query officer profile:', err.message);
    }
  }

  return {
    officerId: officerId || 1,
    departmentId: departmentId || 1,
  };
}

/**
 * Get Officer Dashboard Data
 * GET /api/officer/dashboard
 */
async function getOfficerDashboard(req, res, next) {
  try {
    const user = req.user;
    const { officerId, departmentId } = await getOfficerContext(user);

    const dbCheck = await db.checkConnection();

    if (dbCheck.connected) {
      // 1. Department KPIs
      const [kpis] = await db.query(
        `SELECT 
           COUNT(*) as deptTotal,
           SUM(CASE WHEN assigned_officer_id = ? AND status NOT IN ('RESOLVED', 'VERIFIED', 'CLOSED', 'REJECTED') THEN 1 ELSE 0 END) as assignedToMe,
           SUM(CASE WHEN status IN ('REPORTED', 'ASSIGNED') THEN 1 ELSE 0 END) as deptPending,
           SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as deptInProgress,
           SUM(CASE WHEN status = 'REOPENED' THEN 1 ELSE 0 END) as deptReopened,
           SUM(CASE WHEN status IN ('RESOLVED', 'VERIFIED', 'CLOSED') THEN 1 ELSE 0 END) as deptResolved
         FROM complaints
         WHERE (? = 'admin' OR department_id = ?)`,
        [officerId, user.role, departmentId]
      );

      // Total available workers in department
      const [workerCount] = await db.query(
        `SELECT COUNT(*) as totalWorkers FROM field_workers WHERE department_id = ?`,
        [departmentId]
      );

      // 2. Department Complaints Queue
      const [queue] = await db.query(
        `SELECT 
           c.id, c.tracking_code, c.title, c.description, c.location_address,
           c.latitude, c.longitude, c.ward_no, c.photo_url, c.priority, c.status,
           c.rejection_reason, c.created_at, c.resolved_at,
           c.assigned_officer_id,
           d.name as department_name, d.code as department_code,
           cat.name as category_name, cat.sla_hours,
           u.name as citizen_name, u.phone as citizen_phone,
           (SELECT remarks FROM complaint_status_history WHERE complaint_id = c.id ORDER BY id DESC LIMIT 1) as latest_remark
         FROM complaints c
         JOIN departments d ON c.department_id = d.id
         JOIN complaint_categories cat ON c.category_id = cat.id
         JOIN users u ON c.citizen_id = u.id
         WHERE (? = 'admin' OR c.department_id = ?)
         ORDER BY 
           FIELD(c.status, 'REOPENED', 'REPORTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'VERIFIED', 'CLOSED', 'REJECTED'),
           FIELD(c.priority, 'EMERGENCY', 'HIGH', 'MEDIUM', 'LOW'),
           c.created_at DESC
         LIMIT 50`,
        [user.role, departmentId]
      );

      // 3. Department Field Workers
      const [workers] = await db.query(
        `SELECT id, name, phone, skills, ward_assigned, is_available
         FROM field_workers
         WHERE department_id = ?
         ORDER BY name ASC`,
        [departmentId]
      );

      // 4. Active Field Tasks
      const [tasks] = await db.query(
        `SELECT t.id, t.complaint_id, t.field_worker_id, t.title, t.description, t.status, t.due_date, t.notes, t.created_at,
                c.tracking_code, fw.name as worker_name, fw.phone as worker_phone
         FROM tasks t
         JOIN complaints c ON t.complaint_id = c.id
         JOIN field_workers fw ON t.field_worker_id = fw.id
         WHERE (? = 'admin' OR c.department_id = ?)
         ORDER BY t.created_at DESC
         LIMIT 20`,
        [user.role, departmentId]
      );

      return res.status(200).json({
        success: true,
        data: {
          stats: {
            assignedToMe: Number(kpis[0]?.assignedToMe) || 0,
            deptTotal: Number(kpis[0]?.deptTotal) || 0,
            deptPending: Number(kpis[0]?.deptPending) || 0,
            deptInProgress: Number(kpis[0]?.deptInProgress) || 0,
            deptReopened: Number(kpis[0]?.deptReopened) || 0,
            deptResolved: Number(kpis[0]?.deptResolved) || 0,
            availableWorkers: Number(workerCount[0]?.totalWorkers) || workers.length,
          },
          queue,
          fieldWorkers: workers,
          tasks,
        },
      });
    }

    // Fallback demo data
    res.status(200).json({
      success: true,
      data: {
        stats: {
          assignedToMe: 2,
          deptTotal: 4,
          deptPending: 1,
          deptInProgress: 1,
          deptReopened: 1,
          deptResolved: 1,
          availableWorkers: DEMO_WORKERS.length,
        },
        queue: [
          {
            id: 7,
            tracking_code: 'CMP-2026-00107',
            title: 'Substandard Patching of Pothole on Ward 12 Main Road',
            description: 'The initial gravel patch eroded completely during last night light rain.',
            location_address: 'Opposite Metro Pillar 114, Main Road',
            ward_no: 'Ward-12',
            photo_url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
            priority: 'HIGH',
            status: 'REOPENED',
            rejection_reason: null,
            assigned_officer_id: officerId,
            department_name: 'Roads & Infrastructure (PWD)',
            department_code: 'PWD',
            category_name: 'Pothole and Crater on Road',
            sla_hours: 48,
            citizen_name: 'Aarav Mehta',
            citizen_phone: '+91-98765-00005',
            created_at: new Date(Date.now() - 96 * 3600 * 1000).toISOString(),
            latest_remark: 'Citizen rejected resolution: Gravel washed out in rain.',
          },
        ],
        fieldWorkers: DEMO_WORKERS,
        tasks: DEMO_TASKS,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Available Field Workers for Officer's Department
 * GET /api/officer/field-workers
 */
async function getFieldWorkers(req, res, next) {
  try {
    const { departmentId } = await getOfficerContext(req.user);
    const dbCheck = await db.checkConnection();

    if (dbCheck.connected) {
      const [workers] = await db.query(
        'SELECT id, name, phone, skills, ward_assigned, is_available FROM field_workers WHERE department_id = ? ORDER BY name ASC',
        [departmentId]
      );
      return res.status(200).json({ success: true, data: workers });
    }

    res.status(200).json({
      success: true,
      data: DEMO_WORKERS.filter((w) => w.department_id === departmentId || req.user.role === 'admin'),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Assign Complaint to Current Officer
 * PATCH /api/officer/complaints/:id/assign
 */
async function assignComplaint(req, res, next) {
  try {
    const { id } = req.params;
    const numericId = parseInt(id, 10);
    if (isNaN(numericId) || numericId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid complaint ID format.' });
    }
    const { officerId, departmentId } = await getOfficerContext(req.user);
    const officerUserId = req.user.id;

    const dbCheck = await db.checkConnection();

    if (dbCheck.connected) {
      const [complaints] = await db.query(
        'SELECT id, tracking_code, citizen_id, department_id, status FROM complaints WHERE id = ?',
        [id]
      );

      if (complaints.length === 0) {
        return res.status(404).json({ success: false, message: 'Complaint not found.' });
      }

      const complaint = complaints[0];

      // Check department permissions
      if (req.user.role !== 'admin' && complaint.department_id !== departmentId) {
        return res.status(403).json({
          success: false,
          message: 'You do not have departmental jurisdiction over this complaint.',
        });
      }

      const prevStatus = complaint.status;
      const nextStatus = prevStatus === 'REPORTED' ? 'ASSIGNED' : prevStatus;

      await db.query(
        `UPDATE complaints 
         SET assigned_officer_id = ?, 
             status = ?,
             updated_at = NOW() 
         WHERE id = ?`,
        [officerId, nextStatus, id]
      );

      // Audit status transition if status changed
      if (prevStatus !== nextStatus) {
        await db.query(
          `INSERT INTO complaint_status_history (
             complaint_id, previous_status, new_status, changed_by_user_id, remarks
           ) VALUES (?, ?, ?, ?, 'Officer took ownership and assigned ticket to self.')`,
          [id, prevStatus, nextStatus, officerUserId]
        );
      }

      // Notify citizen
      await db.query(
        `INSERT INTO notifications (
           user_id, title, message, type, entity_type, entity_id
         ) VALUES (?, 'Complaint Assigned to Officer', ?, 'INFO', 'COMPLAINT', ?)`,
        [
          complaint.citizen_id,
          `Your complaint ${complaint.tracking_code} has been assigned to a department officer for active processing.`,
          id,
        ]
      );

      return res.status(200).json({
        success: true,
        message: 'Complaint successfully assigned to your officer queue.',
        data: {
          id: complaint.id,
          assigned_officer_id: officerId,
          status: nextStatus,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Complaint assigned (Demo mode).',
      data: { id, assigned_officer_id: officerId, status: 'ASSIGNED' },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Dispatch Field Worker (Create Task)
 * POST /api/officer/tasks
 */
async function createTask(req, res, next) {
  try {
    const { complaint_id, field_worker_id, title, description, due_date } = req.body;
    const { officerId, departmentId } = await getOfficerContext(req.user);
    const officerUserId = req.user.id;

    if (!complaint_id || !field_worker_id || !title) {
      return res.status(400).json({
        success: false,
        message: 'Complaint ID, field worker, and task title are required.',
      });
    }

    const dbCheck = await db.checkConnection();

    if (dbCheck.connected) {
      // Verify complaint exists and belongs to officer's department
      const [complaints] = await db.query(
        'SELECT id, tracking_code, citizen_id, department_id, status FROM complaints WHERE id = ?',
        [complaint_id]
      );

      if (complaints.length === 0) {
        return res.status(404).json({ success: false, message: 'Complaint not found.' });
      }

      const complaint = complaints[0];
      if (req.user.role !== 'admin' && complaint.department_id !== departmentId) {
        return res.status(403).json({
          success: false,
          message: 'You do not have departmental jurisdiction to dispatch tasks for this complaint.',
        });
      }

      // Insert task
      const [taskResult] = await db.query(
        `INSERT INTO tasks (
           complaint_id, field_worker_id, assigned_by_officer_id,
           title, description, status, due_date
         ) VALUES (?, ?, ?, ?, ?, 'PENDING', ?)`,
        [complaint_id, field_worker_id, officerId, title, description || null, due_date || null]
      );

      const prevStatus = complaint.status;
      // Advance complaint to IN_PROGRESS if currently REPORTED or ASSIGNED or REOPENED
      await db.query(
        `UPDATE complaints 
         SET status = 'IN_PROGRESS', 
             assigned_officer_id = COALESCE(assigned_officer_id, ?),
             updated_at = NOW() 
         WHERE id = ?`,
        [officerId, complaint_id]
      );

      // Log status history transition
      await db.query(
        `INSERT INTO complaint_status_history (
           complaint_id, previous_status, new_status, changed_by_user_id, remarks
         ) VALUES (?, ?, 'IN_PROGRESS', ?, ?)`,
        [complaint_id, prevStatus, officerUserId, `Field technician dispatched: ${title}`]
      );

      // Create notification for citizen
      await db.query(
        `INSERT INTO notifications (
           user_id, title, message, type, entity_type, entity_id
         ) VALUES (?, 'Field Crew Dispatched', ?, 'INFO', 'COMPLAINT', ?)`,
        [
          complaint.citizen_id,
          `A municipal field crew has been dispatched for your complaint ${complaint.tracking_code}. Status: IN_PROGRESS.`,
          complaint_id,
        ]
      );

      // Write audit log
      try {
        await db.query(
          `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
           VALUES (?, 'TASK_DISPATCHED', 'TASK', ?, ?, ?)`,
          [
            officerUserId,
            taskResult.insertId,
            JSON.stringify({ complaint_id, field_worker_id, title }),
            req.ip || '127.0.0.1',
          ]
        );
      } catch (logErr) {
        console.warn('Audit log write skipped:', logErr.message);
      }

      return res.status(201).json({
        success: true,
        message: 'Field technician assigned and task dispatched successfully.',
        data: {
          id: taskResult.insertId,
          complaint_id,
          field_worker_id,
          title,
          status: 'PENDING',
        },
      });
    }

    // Demo fallback
    res.status(201).json({
      success: true,
      message: 'Field technician assigned (Demo Mode).',
      data: {
        id: Math.floor(100 + Math.random() * 900),
        complaint_id,
        field_worker_id,
        title,
        status: 'PENDING',
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update Field Task Status
 * PATCH /api/officer/tasks/:id/status
 */
async function updateTaskStatus(req, res, next) {
  try {
    const { id } = req.params;
    const numericId = parseInt(id, 10);
    if (isNaN(numericId) || numericId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid task ID format.' });
    }
    const { status, notes } = req.body;
    const allowedStatuses = ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid task status. Allowed: [${allowedStatuses.join(', ')}]`,
      });
    }

    const dbCheck = await db.checkConnection();

    if (dbCheck.connected) {
      let updateQuery = `UPDATE tasks SET status = ?, updated_at = NOW()`;
      const params = [status];

      if (notes) {
        updateQuery += `, notes = ?`;
        params.push(notes);
      }

      if (status === 'COMPLETED') {
        updateQuery += `, completed_at = NOW()`;
      }

      updateQuery += ` WHERE id = ?`;
      params.push(id);

      const [result] = await db.query(updateQuery, params);

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Task not found.' });
      }

      return res.status(200).json({
        success: true,
        message: `Task status updated to ${status} successfully.`,
      });
    }

    res.status(200).json({
      success: true,
      message: `Task status updated to ${status} (Demo Mode).`,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update Complaint Status (Officer Progress Notes / Resolution / Rejection)
 * PATCH /api/officer/complaints/:id/status
 */
async function updateComplaintStatus(req, res, next) {
  try {
    const { id } = req.params;
    const numericId = parseInt(id, 10);
    if (isNaN(numericId) || numericId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid complaint ID format.' });
    }
    const { status, remarks, photo_proof_url } = req.body;
    const officerUserId = req.user.id;
    const { officerId, departmentId } = await getOfficerContext(req.user);

    const allowedStatuses = ['ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid officer status. Allowed: [${allowedStatuses.join(', ')}]`,
      });
    }

    if (!remarks || remarks.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Progress notes / remarks (at least 5 characters) are required for status updates.',
      });
    }

    const dbCheck = await db.checkConnection();

    if (dbCheck.connected) {
      const [complaints] = await db.query(
        'SELECT id, tracking_code, citizen_id, department_id, status FROM complaints WHERE id = ?',
        [id]
      );

      if (complaints.length === 0) {
        return res.status(404).json({ success: false, message: 'Complaint not found.' });
      }

      const complaint = complaints[0];
      const prevStatus = complaint.status;

      // Check department permissions
      if (req.user.role !== 'admin' && complaint.department_id !== departmentId) {
        return res.status(403).json({
          success: false,
          message: 'You do not have departmental jurisdiction to update this complaint.',
        });
      }

      let updateQuery = `
        UPDATE complaints 
        SET status = ?, 
            assigned_officer_id = COALESCE(assigned_officer_id, ?),
            updated_at = NOW()
      `;
      const updateParams = [status, officerId];

      if (status === 'RESOLVED') {
        updateQuery += ', resolved_at = NOW()';
      } else if (status === 'REJECTED') {
        updateQuery += ', rejection_reason = ?';
        updateParams.push(remarks.trim());
      }

      updateQuery += ' WHERE id = ?';
      updateParams.push(id);

      await db.query(updateQuery, updateParams);

      // Log status history transition
      await db.query(
        `INSERT INTO complaint_status_history (
           complaint_id, previous_status, new_status, changed_by_user_id, remarks, photo_proof_url
         ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          id,
          prevStatus,
          status,
          officerUserId,
          remarks.trim(),
          photo_proof_url || null,
        ]
      );

      // Create notification for citizen
      const notifType = status === 'RESOLVED' ? 'SUCCESS' : status === 'REJECTED' ? 'ALERT' : 'INFO';
      const notifMessage = status === 'RESOLVED'
        ? `Your complaint ${complaint.tracking_code} has been marked as RESOLVED by the department. Please verify the outcome.`
        : status === 'REJECTED'
          ? `Your complaint ${complaint.tracking_code} was reviewed and rejected: "${remarks.trim()}".`
          : `Your complaint ${complaint.tracking_code} progress updated: "${remarks.trim()}".`;

      await db.query(
        `INSERT INTO notifications (
           user_id, title, message, type, entity_type, entity_id
         ) VALUES (?, ?, ?, ?, 'COMPLAINT', ?)`,
        [
          complaint.citizen_id,
          `Complaint Status: ${status}`,
          notifMessage,
          notifType,
          id,
        ]
      );

      // Record in audit log
      try {
        await db.query(
          `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
           VALUES (?, 'COMPLAINT_STATUS_UPDATED', 'COMPLAINT', ?, ?, ?)`,
          [
            officerUserId,
            id,
            JSON.stringify({ tracking_code: complaint.tracking_code, prevStatus, newStatus: status, remarks }),
            req.ip || '127.0.0.1',
          ]
        );
      } catch (logErr) {
        console.warn('Audit log write skipped:', logErr.message);
      }

      return res.status(200).json({
        success: true,
        message: `Complaint status updated to ${status} successfully.`,
      });
    }

    res.status(200).json({
      success: true,
      message: `Complaint status updated to ${status} (Demo Mode).`,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getOfficerDashboard,
  getFieldWorkers,
  assignComplaint,
  createTask,
  updateTaskStatus,
  updateComplaintStatus,
};
