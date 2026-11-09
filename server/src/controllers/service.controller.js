const db = require('../config/db');

// Helper to generate tracking code: SRV-YYYY-XXXXX
function generateServiceCode() {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `SRV-${year}-${randomNum}`;
}

// Fallback seed catalog for offline resilience & demo mode
const fallbackCatalog = [
  {
    id: 1,
    department_id: 3,
    department_name: 'Water Supply & Sewerage (WSS)',
    department_code: 'WSS',
    name: 'Emergency Potable Water Tanker (6,000L)',
    description: 'Direct delivery of municipal treated drinking water tanker to residential society or event.',
    estimated_days: 1,
    fee: 350.00,
    is_active: true,
  },
  {
    id: 2,
    department_id: 2,
    department_name: 'Solid Waste Management (SWM)',
    department_code: 'SWM',
    name: 'Special Bulk Debris & Construction Waste Removal',
    description: 'Scheduled doorstep pickup of post-renovation rubble, old furniture, or dry tree logs.',
    estimated_days: 3,
    fee: 500.00,
    is_active: true,
  },
  {
    id: 3,
    department_id: 5,
    department_name: 'Parks & Horticulture (PRK)',
    department_code: 'PRK',
    name: 'Roadside Shade Tree Pruning & Canopy Shaping',
    description: 'Professional arborist pruning for trees obscuring rooftop solar panels or wall lines.',
    estimated_days: 5,
    fee: 0.00,
    is_active: true,
  },
  {
    id: 4,
    department_id: 6,
    department_name: 'Public Health & Sanitation (HLT)',
    department_code: 'HLT',
    name: 'Residential Vector Fogging & Larvicide Spray',
    description: 'Targeted cold-fogging treatment for apartment complexes with dengue/chikungunya clusters.',
    estimated_days: 2,
    fee: 0.00,
    is_active: true,
  },
  {
    id: 5,
    department_id: 1,
    department_name: 'Roads & Infrastructure (PWD)',
    department_code: 'PWD',
    name: 'Emergency Asphalt Pothole Patching & Trench Restoration',
    description: 'Rapid deployment of asphalt hot-mix crew and roller for deep vehicular craters, trenches, and damaged roadway sections.',
    estimated_days: 2,
    fee: 0.00,
    is_active: true,
  },
  {
    id: 6,
    department_id: 4,
    department_name: 'Electricity & Street Lighting (ELE)',
    department_code: 'ELE',
    name: 'Dedicated Streetlight Pole Assessment & Shifting',
    description: 'Technical survey and relocation of electric poles obstructing residential entrances or road widening works.',
    estimated_days: 5,
    fee: 0.00,
    is_active: true,
  },
];

let fallbackRequests = [
  {
    id: 1,
    request_code: 'SRQ-2026-0001',
    citizen_id: 5,
    citizen_name: 'Aarav Mehta',
    citizen_email: 'citizen@smartcity.gov',
    citizen_phone: '+91-98765-00005',
    service_category_id: 1,
    service_name: 'Emergency Potable Water Tanker (6,000L)',
    department_id: 3,
    department_name: 'Water Supply & Sewerage (WSS)',
    department_code: 'WSS',
    assigned_officer_id: null,
    details: 'Underground water pump burned out; request emergency 6,000-liter tanker for residential tower.',
    address: 'Greenfield Apartments, Sector 15',
    ward_no: 'Ward-12',
    preferred_slot: 'Morning (09:00 AM - 12:00 PM)',
    status: 'APPROVED',
    resolution_notes: 'Tanker vehicle DL-1GB-4421 dispatched with technician.',
    completed_at: null,
    created_at: new Date(Date.now() - 3600000 * 20).toISOString(),
    fee: 350.00,
  },
  {
    id: 2,
    request_code: 'SRQ-2026-0002',
    citizen_id: 6,
    citizen_name: 'Sunita Rao',
    citizen_email: 'sunita.citizen@example.com',
    citizen_phone: '+91-98765-00006',
    service_category_id: 2,
    service_name: 'Special Bulk Debris & Construction Waste Removal',
    department_id: 2,
    department_name: 'Solid Waste Management (SWM)',
    department_code: 'SWM',
    assigned_officer_id: 2,
    details: 'Kitchen renovation debris (approx 10 bags of tiles and mortar) stacked neatly in private driveway.',
    address: 'House 18, Gulmohar Marg',
    ward_no: 'Ward-08',
    preferred_slot: 'Afternoon (12:00 PM - 03:00 PM)',
    status: 'SUBMITTED',
    resolution_notes: null,
    completed_at: null,
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    fee: 500.00,
  },
];

/**
 * Helper to resolve officerId and departmentId from JWT user or officers table
 */
async function getOfficerContext(user) {
  let officerId = user.officer_id;
  let departmentId = user.department_id;

  if (!officerId || !departmentId) {
    try {
      const [rows] = await db.query(
        'SELECT id AS officer_id, department_id FROM officers WHERE user_id = ?',
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
    officerId: officerId || null,
    departmentId: departmentId || null,
  };
}

/**
 * GET /api/services/catalog
 * Public / Authenticated catalog of municipal services
 */
exports.getServiceCatalog = async (req, res, next) => {
  try {
    try {
      const [services] = await db.query(`
        SELECT 
          sc.id,
          sc.department_id,
          sc.name,
          sc.description,
          sc.estimated_days,
          sc.fee,
          sc.is_active,
          d.name AS department_name,
          d.code AS department_code
        FROM service_categories sc
        JOIN departments d ON sc.department_id = d.id
        WHERE sc.is_active = TRUE
        ORDER BY sc.id ASC
      `);

      if (services && services.length > 0) {
        return res.json({ success: true, count: services.length, data: services });
      }
      return res.json({ success: true, count: fallbackCatalog.length, data: fallbackCatalog });
    } catch (dbErr) {
      return res.json({ success: true, count: fallbackCatalog.length, data: fallbackCatalog });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/services/requests
 * Citizen submits a new municipal service request
 */
exports.createServiceRequest = async (req, res, next) => {
  try {
    const citizenId = req.user.id;
    const { service_category_id, details, address, ward_no, preferred_slot } = req.body;

    if (!service_category_id || !details || !address) {
      return res.status(400).json({
        success: false,
        message: 'service_category_id, details, and address are required',
      });
    }

    if (typeof details !== 'string' || details.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Service request details must be at least 5 characters long',
      });
    }

    if (typeof address !== 'string' || address.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Service request address must be at least 3 characters long',
      });
    }

    const requestCode = generateServiceCode();

    try {
      // Validate service category existence
      const [catRows] = await db.query(
        `SELECT sc.*, d.name AS department_name, d.code AS department_code 
         FROM service_categories sc 
         JOIN departments d ON sc.department_id = d.id 
         WHERE sc.id = ? AND sc.is_active = TRUE`,
        [service_category_id]
      );

      if (catRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Service category not found or is currently inactive',
        });
      }

      const category = catRows[0];
      const deptId = category.department_id;
      const effectiveWard = ward_no || req.user.ward_no || 'Ward-01';
      const effectiveSlot = preferred_slot || 'Morning (09:00 AM - 12:00 PM)';

      const [result] = await db.query(
        `INSERT INTO service_requests (
          request_code, citizen_id, service_category_id, department_id,
          details, address, ward_no, preferred_slot, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'SUBMITTED')`,
        [
          requestCode,
          citizenId,
          service_category_id,
          deptId,
          details.trim(),
          address.trim(),
          effectiveWard,
          effectiveSlot,
        ]
      );

      const newId = result.insertId;

      // Insert citizen confirmation notification
      try {
        await db.query(
          `INSERT INTO notifications (user_id, title, message, type, entity_type, entity_id)
           VALUES (?, 'Service Request Received', ?, 'INFO', 'SERVICE_REQUEST', ?)`,
          [
            citizenId,
            `Your request for "${category.name}" has been registered with tracking code ${requestCode}.`,
            newId,
          ]
        );
      } catch (notifErr) {
        console.warn('Failed to insert service request notification:', notifErr.message);
      }

      // Log in audit trail
      try {
        await db.query(
          `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
           VALUES (?, 'SERVICE_REQUEST_CREATED', 'SERVICE_REQUEST', ?, ?, ?)`,
          [
            citizenId,
            newId,
            JSON.stringify({
              request_code: requestCode,
              service_name: category.name,
              department_id: deptId,
              fee: category.fee,
              ward_no: effectiveWard,
              preferred_slot: effectiveSlot,
            }),
            req.ip || '127.0.0.1',
          ]
        );
      } catch (auditErr) {
        console.warn('Failed to insert service request audit log:', auditErr.message);
      }

      return res.status(201).json({
        success: true,
        message: 'Municipal service request submitted successfully',
        data: {
          id: newId,
          request_code: requestCode,
          citizen_id: citizenId,
          service_category_id: Number(service_category_id),
          service_name: category.name,
          department_id: deptId,
          department_name: category.department_name,
          department_code: category.department_code,
          details: details.trim(),
          address: address.trim(),
          ward_no: effectiveWard,
          preferred_slot: effectiveSlot,
          fee: category.fee,
          estimated_days: category.estimated_days,
          status: 'SUBMITTED',
          created_at: new Date().toISOString(),
        },
      });
    } catch (dbErr) {
      const cat = fallbackCatalog.find((c) => c.id == service_category_id) || fallbackCatalog[0];
      const newReq = {
        id: fallbackRequests.length + 1,
        request_code: requestCode,
        citizen_id: citizenId,
        citizen_name: req.user.name || 'Citizen User',
        citizen_email: req.user.email || 'citizen@smartcity.gov',
        citizen_phone: '+91 98765 43210',
        service_category_id: Number(service_category_id),
        service_name: cat.name,
        department_id: cat.department_id,
        department_name: cat.department_name,
        department_code: cat.department_code,
        assigned_officer_id: null,
        details: details.trim(),
        address: address.trim(),
        ward_no: ward_no || 'Ward-01',
        preferred_slot: preferred_slot || 'Morning (09:00 AM - 12:00 PM)',
        status: 'SUBMITTED',
        resolution_notes: null,
        completed_at: null,
        created_at: new Date().toISOString(),
        fee: cat.fee,
      };
      fallbackRequests.unshift(newReq);

      return res.status(201).json({
        success: true,
        message: 'Municipal service request submitted successfully',
        data: newReq,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/services/requests
 * List service requests (scoped by role: Citizen -> own, Officer -> department, Admin -> all)
 */
exports.getServiceRequests = async (req, res, next) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.id;
    const { status, search, department_id } = req.query;

    try {
      let sql = `
        SELECT 
          sr.id,
          sr.request_code,
          sr.citizen_id,
          sr.service_category_id,
          sr.department_id,
          sr.assigned_officer_id,
          sr.details,
          sr.address,
          sr.ward_no,
          sr.preferred_slot,
          sr.status,
          sr.resolution_notes,
          sr.completed_at,
          sr.created_at,
          sr.updated_at,
          sc.name AS service_name,
          sc.fee,
          sc.estimated_days,
          d.name AS department_name,
          d.code AS department_code,
          u.name AS citizen_name,
          u.email AS citizen_email,
          u.phone AS citizen_phone,
          off_u.name AS assigned_officer_name
        FROM service_requests sr
        JOIN service_categories sc ON sr.service_category_id = sc.id
        JOIN departments d ON sr.department_id = d.id
        JOIN users u ON sr.citizen_id = u.id
        LEFT JOIN officers off ON sr.assigned_officer_id = off.id
        LEFT JOIN users off_u ON off.user_id = off_u.id
        WHERE 1=1
      `;
      const params = [];

      // Citizen view: only own requests
      if (userRole === 'citizen') {
        sql += ` AND sr.citizen_id = ?`;
        params.push(userId);
      } else if (userRole === 'officer') {
        // Officer view: scoped to officer department or assigned officer
        const { officerId, departmentId } = await getOfficerContext(req.user);
        if (departmentId) {
          sql += ` AND (sr.department_id = ? OR sr.assigned_officer_id = ?)`;
          params.push(departmentId, officerId || -1);
        } else if (req.user.department_id) {
          sql += ` AND sr.department_id = ?`;
          params.push(req.user.department_id);
        }
      } else if (userRole === 'admin' && department_id) {
        sql += ` AND sr.department_id = ?`;
        params.push(department_id);
      }

      if (status) {
        sql += ` AND sr.status = ?`;
        params.push(status);
      }
      if (search) {
        sql += ` AND (sr.request_code LIKE ? OR sr.details LIKE ? OR sr.address LIKE ? OR u.name LIKE ?)`;
        const q = `%${search}%`;
        params.push(q, q, q, q);
      }

      sql += ` ORDER BY sr.created_at DESC`;

      const [requests] = await db.query(sql, params);
      return res.json({ success: true, count: requests.length, data: requests });
    } catch (dbErr) {
      let list = [...fallbackRequests];
      if (userRole === 'citizen') {
        list = list.filter((r) => r.citizen_id === userId);
      } else if (userRole === 'officer') {
        const { departmentId } = await getOfficerContext(req.user);
        if (departmentId) {
          list = list.filter((r) => r.department_id === departmentId);
        }
      }
      if (status) {
        list = list.filter((r) => r.status === status);
      }
      if (search) {
        const s = search.toLowerCase();
        list = list.filter((r) => r.request_code.toLowerCase().includes(s) || r.details.toLowerCase().includes(s));
      }
      return res.json({ success: true, count: list.length, data: list });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/services/requests/:idOrCode
 * Retrieve single service request details with permission check
 */
exports.getServiceRequestByCode = async (req, res, next) => {
  try {
    const { idOrCode } = req.params;
    const userRole = req.user.role;
    const userId = req.user.id;

    try {
      const [rows] = await db.query(
        `SELECT 
          sr.*,
          sc.name AS service_name,
          sc.fee,
          sc.estimated_days,
          d.name AS department_name,
          d.code AS department_code,
          u.name AS citizen_name,
          u.email AS citizen_email,
          u.phone AS citizen_phone,
          off_u.name AS assigned_officer_name
        FROM service_requests sr
        JOIN service_categories sc ON sr.service_category_id = sc.id
        JOIN departments d ON sr.department_id = d.id
        JOIN users u ON sr.citizen_id = u.id
        LEFT JOIN officers off ON sr.assigned_officer_id = off.id
        LEFT JOIN users off_u ON off.user_id = off_u.id
        WHERE sr.id = ? OR sr.request_code = ?`,
        [idOrCode, idOrCode]
      );

      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Service request not found' });
      }

      const requestItem = rows[0];

      // Authorization checks
      if (userRole === 'citizen' && requestItem.citizen_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You do not have permission to view this service request',
        });
      }

      if (userRole === 'officer') {
        const { officerId, departmentId } = await getOfficerContext(req.user);
        const matchesDept = departmentId && departmentId === requestItem.department_id;
        const isAssigned = officerId && officerId === requestItem.assigned_officer_id;
        if (!matchesDept && !isAssigned) {
          return res.status(403).json({
            success: false,
            message: 'Forbidden: You do not have jurisdiction over service requests in this department',
          });
        }
      }

      return res.json({ success: true, data: requestItem });
    } catch (dbErr) {
      const reqItem = fallbackRequests.find((r) => r.id == idOrCode || r.request_code === idOrCode);
      if (!reqItem) {
        return res.status(404).json({ success: false, message: 'Service request not found' });
      }

      if (userRole === 'citizen' && reqItem.citizen_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You do not have permission to view this service request',
        });
      }

      return res.json({ success: true, data: reqItem });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/services/requests/:id/status
 * Officer / Admin updates service request status (with jurisdiction validation, notes check, notification, and audit)
 */
exports.updateServiceRequestStatus = async (req, res, next) => {
  try {
    const requestId = req.params.id;
    const { status, resolution_notes, assigned_officer_id } = req.body;
    const userRole = req.user.role;
    const userId = req.user.id;

    const validStatuses = ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    // Rejection requires meaningful resolution notes explaining why
    if (status === 'REJECTED' && (!resolution_notes || resolution_notes.trim().length < 5)) {
      return res.status(400).json({
        success: false,
        message: 'Resolution notes (min 5 characters) are required when rejecting a service request',
      });
    }

    try {
      // Fetch request details
      const [rows] = await db.query(
        `SELECT sr.*, sc.name AS service_name, d.name AS department_name
         FROM service_requests sr
         JOIN service_categories sc ON sr.service_category_id = sc.id
         JOIN departments d ON sr.department_id = d.id
         WHERE sr.id = ?`,
        [requestId]
      );

      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Service request not found' });
      }

      const currentReq = rows[0];

      // Check Officer Department Jurisdiction
      if (userRole === 'officer') {
        const { officerId, departmentId } = await getOfficerContext(req.user);
        const matchesDept = departmentId && departmentId === currentReq.department_id;
        const isAssigned = officerId && officerId === currentReq.assigned_officer_id;

        if (!matchesDept && !isAssigned) {
          return res.status(403).json({
            success: false,
            message: 'Forbidden: You do not have jurisdiction over service requests in this department',
          });
        }
      }

      const prevStatus = currentReq.status;
      const cleanNotes = resolution_notes ? resolution_notes.trim() : null;

      await db.query(
        `UPDATE service_requests 
         SET status = ?, 
             resolution_notes = COALESCE(?, resolution_notes),
             assigned_officer_id = COALESCE(?, assigned_officer_id),
             completed_at = CASE WHEN ? = 'COMPLETED' THEN NOW() ELSE completed_at END
         WHERE id = ?`,
        [status, cleanNotes, assigned_officer_id || null, status, requestId]
      );

      // Notify citizen of status transition
      try {
        const notifType = status === 'COMPLETED' ? 'SUCCESS' : status === 'REJECTED' ? 'ALERT' : 'INFO';
        const notifMessage = status === 'COMPLETED'
          ? `Your service request ${currentReq.request_code} (${currentReq.service_name}) has been marked as COMPLETED by the department.`
          : status === 'REJECTED'
            ? `Your service request ${currentReq.request_code} (${currentReq.service_name}) was rejected: "${cleanNotes}".`
            : status === 'APPROVED'
              ? `Your service request ${currentReq.request_code} (${currentReq.service_name}) has been APPROVED and scheduled for execution.${cleanNotes ? ' Note: ' + cleanNotes : ''}`
              : `Your service request ${currentReq.request_code} (${currentReq.service_name}) is now ${status}.${cleanNotes ? ' Note: ' + cleanNotes : ''}`;

        await db.query(
          `INSERT INTO notifications (user_id, title, message, type, entity_type, entity_id)
           VALUES (?, ?, ?, ?, 'SERVICE_REQUEST', ?)`,
          [
            currentReq.citizen_id,
            `Service Request ${status}`,
            notifMessage,
            notifType,
            requestId,
          ]
        );
      } catch (notifErr) {
        console.warn('Failed to insert service status notification:', notifErr.message);
      }

      // Record in audit logs
      try {
        await db.query(
          `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
           VALUES (?, 'SERVICE_REQUEST_STATUS_UPDATED', 'SERVICE_REQUEST', ?, ?, ?)`,
          [
            userId,
            requestId,
            JSON.stringify({
              request_code: currentReq.request_code,
              previous_status: prevStatus,
              new_status: status,
              resolution_notes: cleanNotes,
            }),
            req.ip || '127.0.0.1',
          ]
        );
      } catch (auditErr) {
        console.warn('Failed to insert service status audit log:', auditErr.message);
      }

      return res.json({
        success: true,
        message: `Service request marked as ${status}`,
        data: {
          id: Number(requestId),
          request_code: currentReq.request_code,
          previous_status: prevStatus,
          status,
          resolution_notes: cleanNotes || currentReq.resolution_notes,
          completed_at: status === 'COMPLETED' ? new Date().toISOString() : currentReq.completed_at,
        },
      });
    } catch (dbErr) {
      const reqItem = fallbackRequests.find((r) => r.id == requestId);
      if (!reqItem) {
        return res.status(404).json({ success: false, message: 'Service request not found' });
      }

      if (userRole === 'officer') {
        const { officerId, departmentId } = await getOfficerContext(req.user);
        if (departmentId && departmentId !== reqItem.department_id && officerId !== reqItem.assigned_officer_id) {
          return res.status(403).json({
            success: false,
            message: 'Forbidden: You do not have jurisdiction over service requests in this department',
          });
        }
      }

      reqItem.status = status;
      if (resolution_notes) reqItem.resolution_notes = resolution_notes.trim();
      if (status === 'COMPLETED') reqItem.completed_at = new Date().toISOString();

      return res.json({
        success: true,
        message: `Service request marked as ${status}`,
        data: reqItem,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/services/requests/:id/cancel
 * Citizen cancels their own pending service request
 */
exports.cancelServiceRequest = async (req, res, next) => {
  try {
    const requestId = req.params.id;
    const userId = req.user.id;
    const { reason } = req.body || {};

    try {
      const [rows] = await db.query(
        `SELECT sr.*, sc.name AS service_name 
         FROM service_requests sr
         JOIN service_categories sc ON sr.service_category_id = sc.id
         WHERE sr.id = ?`,
        [requestId]
      );

      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Service request not found' });
      }

      const serviceReq = rows[0];

      // Authorization check: Citizen owner or admin only
      if (serviceReq.citizen_id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You are not authorized to cancel this service request',
        });
      }

      // Business logic checks
      if (serviceReq.status === 'COMPLETED') {
        return res.status(400).json({
          success: false,
          message: 'Cannot cancel an already completed service request',
        });
      }

      if (serviceReq.status === 'REJECTED') {
        return res.status(400).json({
          success: false,
          message: 'Service request is already cancelled or rejected',
        });
      }

      const cancellationNotes = reason && reason.trim().length > 0
        ? `Cancelled by Citizen: ${reason.trim()}`
        : 'Cancelled by Citizen';

      await db.query(
        `UPDATE service_requests 
         SET status = 'REJECTED', 
             resolution_notes = ? 
         WHERE id = ?`,
        [cancellationNotes, requestId]
      );

      // Notification
      try {
        await db.query(
          `INSERT INTO notifications (user_id, title, message, type, entity_type, entity_id)
           VALUES (?, 'Service Request Cancelled', ?, 'INFO', 'SERVICE_REQUEST', ?)`,
          [
            serviceReq.citizen_id,
            `Your service request ${serviceReq.request_code} (${serviceReq.service_name}) has been cancelled.`,
            requestId,
          ]
        );
      } catch (notifErr) {
        console.warn('Failed to insert cancel notification:', notifErr.message);
      }

      // Audit trail
      try {
        await db.query(
          `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
           VALUES (?, 'SERVICE_REQUEST_CANCELLED', 'SERVICE_REQUEST', ?, ?, ?)`,
          [
            userId,
            requestId,
            JSON.stringify({
              request_code: serviceReq.request_code,
              previous_status: serviceReq.status,
              reason: cancellationNotes,
            }),
            req.ip || '127.0.0.1',
          ]
        );
      } catch (auditErr) {
        console.warn('Failed to insert cancel audit log:', auditErr.message);
      }

      return res.json({
        success: true,
        message: 'Service request successfully cancelled',
        data: {
          id: Number(requestId),
          request_code: serviceReq.request_code,
          status: 'REJECTED',
          resolution_notes: cancellationNotes,
        },
      });
    } catch (dbErr) {
      const reqItem = fallbackRequests.find((r) => r.id == requestId);
      if (!reqItem) {
        return res.status(404).json({ success: false, message: 'Service request not found' });
      }

      if (reqItem.citizen_id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You are not authorized to cancel this service request',
        });
      }

      if (reqItem.status === 'COMPLETED') {
        return res.status(400).json({
          success: false,
          message: 'Cannot cancel an already completed service request',
        });
      }

      reqItem.status = 'REJECTED';
      reqItem.resolution_notes = reason ? `Cancelled by Citizen: ${reason}` : 'Cancelled by Citizen';

      return res.json({
        success: true,
        message: 'Service request successfully cancelled',
        data: reqItem,
      });
    }
  } catch (error) {
    next(error);
  }
};
