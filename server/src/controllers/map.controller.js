const db = require('../config/db');

// Fallback seed geospatial data for offline resilience & demo mode
const FALLBACK_MAP_COMPLAINTS = [
  {
    id: 1,
    tracking_code: 'CMP-2026-00101',
    title: 'Severe Pothole Cluster on 5th Cross Road',
    description: 'Three deep craters spanning 2 meters across have formed in front of Greenfield Apartments.',
    department_id: 1,
    department_name: 'Roads & Infrastructure (PWD)',
    department_code: 'PWD',
    category_name: 'Pothole / Damaged Road',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    latitude: 28.6139,
    longitude: 77.2090,
    ward_no: 'Ward-12',
    location_address: '42, Green Avenue, Ward 12',
    photo_url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
    citizen_name: 'Aarav Mehta',
    assigned_officer_name: 'Officer Vikramaditya Sen',
    task_count: 1,
    active_worker_name: 'Suresh Yadav',
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    resolved_at: null,
  },
  {
    id: 2,
    tracking_code: 'CMP-2026-00102',
    title: 'Commercial garbage bin overflowing into street walkway',
    description: 'Waste has piled up around the community container on 2nd Main Road.',
    department_id: 2,
    department_name: 'Solid Waste Management (SWM)',
    department_code: 'SWM',
    category_name: 'Overflowing Garbage Bin',
    priority: 'HIGH',
    status: 'ASSIGNED',
    latitude: 28.6289,
    longitude: 77.2180,
    ward_no: 'Ward-08',
    location_address: 'Market Square, Ward 08',
    photo_url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80',
    citizen_name: 'Pooja Iyer',
    assigned_officer_name: 'Officer Fatima Al-Hassan',
    task_count: 1,
    active_worker_name: 'Raju Kumar',
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    resolved_at: null,
  },
  {
    id: 3,
    tracking_code: 'CMP-2026-00103',
    title: 'Drinking water pipeline ruptured causing low pressure',
    description: 'High-pressure water spurting from main supply pipe near Sector 4 gate.',
    department_id: 3,
    department_name: 'Water Supply & Sewerage (WSS)',
    department_code: 'WSS',
    category_name: 'Water Pipeline Leakage / Burst',
    priority: 'EMERGENCY',
    status: 'REPORTED',
    latitude: 28.6010,
    longitude: 77.1950,
    ward_no: 'Ward-04',
    location_address: 'Sector 4 Entrance, Ward 04',
    photo_url: 'https://images.unsplash.com/photo-1584467735815-f778f274e296?auto=format&fit=crop&w=800&q=80',
    citizen_name: 'David Fernandes',
    assigned_officer_name: null,
    task_count: 0,
    active_worker_name: null,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    resolved_at: null,
  },
  {
    id: 4,
    tracking_code: 'CMP-2026-00104',
    title: 'Streetlight completely out creating dark blind spot',
    description: 'Three consecutive streetlights are dark on Ring Road overpass.',
    department_id: 4,
    department_name: 'Electricity & Street Lighting (ELE)',
    department_code: 'ELE',
    category_name: 'Streetlight Not Working / Dark Spot',
    priority: 'MEDIUM',
    status: 'RESOLVED',
    latitude: 28.6350,
    longitude: 77.2250,
    ward_no: 'Ward-01',
    location_address: 'Ring Road Flyover, Ward 01',
    photo_url: null,
    citizen_name: 'Aarav Mehta',
    assigned_officer_name: 'Officer Vikramaditya Sen',
    task_count: 1,
    active_worker_name: 'Dinesh Chand',
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    resolved_at: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
  {
    id: 5,
    tracking_code: 'CMP-2026-00105',
    title: 'Large fallen tree branch obstructing right traffic lane',
    description: 'Storm knocked down a major banyan limb blocking vehicle lane.',
    department_id: 5,
    department_name: 'Parks & Horticulture (PRK)',
    department_code: 'PRK',
    category_name: 'Dangerous Tree Branch / Fallen Tree',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    latitude: 28.5900,
    longitude: 77.2300,
    ward_no: 'Ward-14',
    location_address: 'Tech Park Avenue, Ward 14',
    photo_url: null,
    citizen_name: 'Pooja Iyer',
    assigned_officer_name: 'Officer Fatima Al-Hassan',
    task_count: 1,
    active_worker_name: 'Kishan Singh',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    resolved_at: null,
  },
  {
    id: 6,
    tracking_code: 'CMP-2026-00106',
    title: 'Mosquito breeding in stagnant stormwater ditch',
    description: 'Open trench has standing water producing high mosquito density.',
    department_id: 6,
    department_name: 'Public Health & Sanitation (HLT)',
    department_code: 'HLT',
    category_name: 'Mosquito Fogging & Larvicide',
    priority: 'MEDIUM',
    status: 'ASSIGNED',
    latitude: 28.5800,
    longitude: 77.2100,
    ward_no: 'Ward-15',
    location_address: 'South Canal Bank, Ward 15',
    photo_url: null,
    citizen_name: 'David Fernandes',
    assigned_officer_name: null,
    task_count: 0,
    active_worker_name: null,
    created_at: new Date(Date.now() - 3600000 * 14).toISOString(),
    resolved_at: null,
  },
];

const WARD_METADATA = {
  'Ward-01': { name: 'Central Square & Civil Lines', centerLat: 28.6350, centerLng: 77.2250 },
  'Ward-04': { name: 'Lake View & Sector 4', centerLat: 28.6010, centerLng: 77.1950 },
  'Ward-08': { name: 'Old Town & Bazaar Market', centerLat: 28.6289, centerLng: 77.2180 },
  'Ward-12': { name: 'Greenfield & Ring Road', centerLat: 28.6139, centerLng: 77.2090 },
  'Ward-14': { name: 'Tech Park & Urban Metro', centerLat: 28.5900, centerLng: 77.2300 },
  'Ward-15': { name: 'Riverfront & South Colony', centerLat: 28.5800, centerLng: 77.2100 },
};

const FALLBACK_CLUSTERS = [
  { ward_no: 'Ward-01', name: 'Central Square & Civil Lines', lat: 28.6350, lng: 77.2250, total: 24, active: 4, resolved: 20, emergency_count: 1, dominant_priority: 'MEDIUM', density_score: 42 },
  { ward_no: 'Ward-04', name: 'Lake View & Sector 4', lat: 28.6010, lng: 77.1950, total: 31, active: 6, resolved: 25, emergency_count: 3, dominant_priority: 'EMERGENCY', density_score: 78 },
  { ward_no: 'Ward-08', name: 'Old Town & Bazaar Market', lat: 28.6289, lng: 77.2180, total: 42, active: 8, resolved: 34, emergency_count: 2, dominant_priority: 'HIGH', density_score: 85 },
  { ward_no: 'Ward-12', name: 'Greenfield & Ring Road', lat: 28.6139, lng: 77.2090, total: 56, active: 9, resolved: 47, emergency_count: 2, dominant_priority: 'HIGH', density_score: 92 },
  { ward_no: 'Ward-14', name: 'Tech Park & Urban Metro', lat: 28.5900, lng: 77.2300, total: 38, active: 5, resolved: 33, emergency_count: 1, dominant_priority: 'HIGH', density_score: 60 },
  { ward_no: 'Ward-15', name: 'Riverfront & South Colony', lat: 28.5800, lng: 77.2100, total: 29, active: 4, resolved: 25, emergency_count: 1, dominant_priority: 'MEDIUM', density_score: 50 },
];

const FALLBACK_WORKERS = [
  { id: 1, department_id: 1, name: 'Suresh Yadav', phone: '+91-98111-10001', skills: 'Asphalt filling, Concrete repair', ward_assigned: 'Ward-12', is_available: 1, latitude: 28.6145, longitude: 77.2085, department_code: 'PWD' },
  { id: 2, department_id: 2, name: 'Raju Kumar', phone: '+91-98111-10002', skills: 'Garbage compactor driver', ward_assigned: 'Ward-04', is_available: 1, latitude: 28.6015, longitude: 77.1945, department_code: 'SWM' },
  { id: 3, department_id: 3, name: 'Mohammad Imran', phone: '+91-98111-10003', skills: 'Pipeline plumber', ward_assigned: 'Ward-15', is_available: 1, latitude: 28.5810, longitude: 77.2110, department_code: 'WSS' },
  { id: 4, department_id: 4, name: 'Dinesh Chand', phone: '+91-98111-10004', skills: 'Lineman, High-voltage pole repair', ward_assigned: 'Ward-08', is_available: 1, latitude: 28.6295, longitude: 77.2175, department_code: 'ELE' },
  { id: 5, department_id: 5, name: 'Kishan Singh', phone: '+91-98111-10005', skills: 'Tree arborist, Pruning technician', ward_assigned: 'Ward-14', is_available: 1, latitude: 28.5910, longitude: 77.2295, department_code: 'PRK' },
];

/**
 * Valid enums for request parameter validation
 */
const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'];
const VALID_STATUSES = [
  'REPORTED',
  'ASSIGNED',
  'IN_PROGRESS',
  'RESOLVED',
  'VERIFIED',
  'CLOSED',
  'REOPENED',
  'REJECTED',
];

/**
 * GET /api/map/complaints
 * Retrieve all complaint map markers with coordinates, department info, and query filters
 */
exports.getMapComplaints = async (req, res, next) => {
  try {
    const { department_id, department_code, priority, status, ward, search, bbox } = req.query;

    // Parameter validations
    if (priority && !VALID_PRIORITIES.includes(priority.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid priority filter '${priority}'. Must be one of: ${VALID_PRIORITIES.join(', ')}`,
      });
    }

    if (status && !VALID_STATUSES.includes(status.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid status filter '${status}'. Must be a valid complaint lifecycle status.`,
      });
    }

    try {
      let sql = `
        SELECT 
          c.id,
          c.tracking_code,
          c.title,
          c.description,
          c.priority,
          c.status,
          CAST(COALESCE(c.latitude, 28.6139) AS DECIMAL(10,6)) AS latitude,
          CAST(COALESCE(c.longitude, 77.2090) AS DECIMAL(10,6)) AS longitude,
          COALESCE(c.ward_no, 'Ward-12') AS ward_no,
          c.location_address,
          c.photo_url,
          c.created_at,
          c.resolved_at,
          d.id AS department_id,
          d.name AS department_name,
          d.code AS department_code,
          cc.name AS category_name,
          cc.sla_hours,
          u.name AS citizen_name,
          ou.name AS assigned_officer_name,
          (SELECT COUNT(*) FROM tasks t WHERE t.complaint_id = c.id) AS task_count,
          (
            SELECT fw.name 
            FROM tasks t2 
            JOIN field_workers fw ON t2.field_worker_id = fw.id 
            WHERE t2.complaint_id = c.id 
            ORDER BY t2.id DESC 
            LIMIT 1
          ) AS active_worker_name
        FROM complaints c
        JOIN departments d ON c.department_id = d.id
        JOIN complaint_categories cc ON c.category_id = cc.id
        LEFT JOIN users u ON c.citizen_id = u.id
        LEFT JOIN officers o ON c.assigned_officer_id = o.id
        LEFT JOIN users ou ON o.user_id = ou.id
        WHERE 1=1
      `;
      const params = [];

      if (department_id) {
        sql += ` AND (d.id = ? OR d.code = ?)`;
        params.push(department_id, department_id);
      } else if (department_code) {
        sql += ` AND d.code = ?`;
        params.push(department_code);
      }

      if (priority) {
        sql += ` AND c.priority = ?`;
        params.push(priority.toUpperCase());
      }

      if (status) {
        sql += ` AND c.status = ?`;
        params.push(status.toUpperCase());
      }

      if (ward) {
        const cleanWard = ward.startsWith('Ward-') ? ward : `Ward-${ward.padStart(2, '0')}`;
        sql += ` AND (c.ward_no = ? OR c.ward_no = ?)`;
        params.push(ward, cleanWard);
      }

      if (search) {
        sql += ` AND (c.title LIKE ? OR c.tracking_code LIKE ? OR c.location_address LIKE ?)`;
        const q = `%${search.trim()}%`;
        params.push(q, q, q);
      }

      if (bbox) {
        const parts = bbox.split(',').map(Number);
        if (parts.length === 4 && parts.every((n) => !isNaN(n))) {
          const [minLat, maxLat, minLng, maxLng] = parts;
          sql += ` AND c.latitude BETWEEN ? AND ? AND c.longitude BETWEEN ? AND ?`;
          params.push(minLat, maxLat, minLng, maxLng);
        }
      }

      sql += ` ORDER BY c.created_at DESC`;

      const [rows] = await db.query(sql, params);

      const formatted = (rows.length > 0 ? rows : FALLBACK_MAP_COMPLAINTS).map((row) => ({
        ...row,
        latitude: parseFloat(row.latitude) || 28.6139,
        longitude: parseFloat(row.longitude) || 77.2090,
      }));

      return res.json({ success: true, count: formatted.length, data: formatted });
    } catch (dbErr) {
      let list = [...FALLBACK_MAP_COMPLAINTS];
      if (department_id || department_code) {
        const dept = department_id || department_code;
        list = list.filter((c) => c.department_id == dept || c.department_code === dept);
      }
      if (priority) list = list.filter((c) => c.priority === priority.toUpperCase());
      if (status) list = list.filter((c) => c.status === status.toUpperCase());
      if (ward) list = list.filter((c) => c.ward_no === ward || c.ward_no === `Ward-${ward}`);
      if (search) {
        const q = search.toLowerCase();
        list = list.filter(
          (c) =>
            c.title.toLowerCase().includes(q) ||
            c.tracking_code.toLowerCase().includes(q) ||
            c.location_address.toLowerCase().includes(q)
        );
      }
      return res.json({ success: true, count: list.length, data: list });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/map/clusters
 * Retrieve ward cluster data for heatmapping, ward statistics, and hotspot density
 */
exports.getWardClusters = async (req, res, next) => {
  try {
    try {
      const [rows] = await db.query(`
        SELECT 
          COALESCE(c.ward_no, 'Ward-12') AS ward_no,
          COUNT(*) AS total,
          SUM(CASE WHEN c.status IN ('REPORTED', 'ASSIGNED', 'IN_PROGRESS', 'REOPENED') THEN 1 ELSE 0 END) AS active,
          SUM(CASE WHEN c.status IN ('RESOLVED', 'VERIFIED', 'CLOSED') THEN 1 ELSE 0 END) AS resolved,
          SUM(CASE WHEN c.priority = 'EMERGENCY' THEN 1 ELSE 0 END) AS emergency_count,
          SUM(CASE WHEN c.priority = 'HIGH' THEN 1 ELSE 0 END) AS high_count,
          ROUND(AVG(COALESCE(c.latitude, 28.6139)), 6) AS lat,
          ROUND(AVG(COALESCE(c.longitude, 77.2090)), 6) AS lng
        FROM complaints c
        GROUP BY c.ward_no
        ORDER BY total DESC
      `);

      if (rows.length > 0) {
        const clusters = rows.map((r) => {
          const meta = WARD_METADATA[r.ward_no] || {
            name: `${r.ward_no} Civic Zone`,
            centerLat: 28.6139,
            centerLng: 77.2090,
          };
          const total = Number(r.total) || 0;
          const active = Number(r.active) || 0;
          const emergency = Number(r.emergency_count) || 0;

          const densityScore = Math.min(100, Math.round((active * 7) + (emergency * 15) + (total * 1.5)));

          return {
            ward_no: r.ward_no,
            name: meta.name,
            total,
            active,
            resolved: Number(r.resolved) || 0,
            emergency_count: emergency,
            dominant_priority: emergency > 0 ? 'EMERGENCY' : (Number(r.high_count) > 0 ? 'HIGH' : 'MEDIUM'),
            lat: parseFloat(r.lat) || meta.centerLat,
            lng: parseFloat(r.lng) || meta.centerLng,
            density_score: densityScore,
          };
        });

        return res.json({ success: true, count: clusters.length, data: clusters });
      }

      return res.json({ success: true, count: FALLBACK_CLUSTERS.length, data: FALLBACK_CLUSTERS });
    } catch (dbErr) {
      return res.json({ success: true, count: FALLBACK_CLUSTERS.length, data: FALLBACK_CLUSTERS });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/map/heatmap
 * Retrieve weighted coordinates for client-side heatmap rasterization
 */
exports.getHeatmapData = async (req, res, next) => {
  try {
    const { department_id } = req.query;

    try {
      let sql = `
        SELECT 
          c.id,
          c.tracking_code,
          c.priority,
          c.status,
          COALESCE(c.ward_no, 'Ward-12') AS ward_no,
          CAST(COALESCE(c.latitude, 28.6139) AS DECIMAL(10,6)) AS latitude,
          CAST(COALESCE(c.longitude, 77.2090) AS DECIMAL(10,6)) AS longitude,
          d.code AS department_code
        FROM complaints c
        JOIN departments d ON c.department_id = d.id
        WHERE 1=1
      `;
      const params = [];

      if (department_id) {
        sql += ` AND (d.id = ? OR d.code = ?)`;
        params.push(department_id, department_id);
      }

      const [rows] = await db.query(sql, params);
      const dataset = rows.length > 0 ? rows : FALLBACK_MAP_COMPLAINTS;

      const points = dataset.map((item) => {
        let baseWeight = 0.3;
        if (item.priority === 'EMERGENCY') baseWeight = 1.0;
        else if (item.priority === 'HIGH') baseWeight = 0.75;
        else if (item.priority === 'MEDIUM') baseWeight = 0.5;
        else baseWeight = 0.25;

        // Active grievances have higher heat footprint
        const isActive = ['REPORTED', 'ASSIGNED', 'IN_PROGRESS', 'REOPENED'].includes(item.status);
        const finalWeight = isActive ? baseWeight : baseWeight * 0.4;

        return {
          id: item.id,
          lat: parseFloat(item.latitude) || 28.6139,
          lng: parseFloat(item.longitude) || 77.2090,
          weight: parseFloat(finalWeight.toFixed(2)),
          priority: item.priority,
          status: item.status,
          ward_no: item.ward_no,
          tracking_code: item.tracking_code,
        };
      });

      // Top 3 Hotspot wards
      const wardCounts = {};
      points.forEach((p) => {
        wardCounts[p.ward_no] = (wardCounts[p.ward_no] || 0) + 1;
      });
      const hotspots = Object.entries(wardCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([ward, count]) => ({
          ward_no: ward,
          name: WARD_METADATA[ward]?.name || `${ward} Sector`,
          incident_count: count,
        }));

      return res.json({
        success: true,
        count: points.length,
        data: {
          points,
          hotspots,
          total_active_hazards: points.filter((p) => p.priority === 'EMERGENCY' || p.priority === 'HIGH').length,
        },
      });
    } catch (dbErr) {
      const points = FALLBACK_MAP_COMPLAINTS.map((item) => ({
        id: item.id,
        lat: item.latitude,
        lng: item.longitude,
        weight: item.priority === 'EMERGENCY' ? 1.0 : item.priority === 'HIGH' ? 0.75 : 0.4,
        priority: item.priority,
        status: item.status,
        ward_no: item.ward_no,
        tracking_code: item.tracking_code,
      }));

      return res.json({
        success: true,
        count: points.length,
        data: {
          points,
          hotspots: [
            { ward_no: 'Ward-12', name: 'Greenfield & Ring Road', incident_count: 56 },
            { ward_no: 'Ward-08', name: 'Old Town & Bazaar Market', incident_count: 42 },
            { ward_no: 'Ward-04', name: 'Lake View & Sector 4', incident_count: 31 },
          ],
          total_active_hazards: 4,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/map/officer-view
 * Protected endpoint for municipal officers and administrators
 * Returns department-scoped pins, available field workers with locations, and department dispatch stats
 */
exports.getOfficerMapView = async (req, res, next) => {
  try {
    const user = req.user;
    let departmentId = user.department_id;

    try {
      // 1. Resolve officer's department if not in token
      if (!departmentId && user.role === 'officer') {
        const [officerRows] = await db.query(
          `SELECT department_id FROM officers WHERE user_id = ?`,
          [user.id]
        );
        if (officerRows.length > 0) {
          departmentId = officerRows[0].department_id;
        }
      }

      // If admin, allow passing query department_id or default to department 1
      if (user.role === 'admin' && req.query.department_id) {
        departmentId = Number(req.query.department_id);
      }
      if (!departmentId) departmentId = 1;

      // 2. Fetch Department details
      const [deptRows] = await db.query(
        `SELECT id, name, code, contact_phone, head_officer_name FROM departments WHERE id = ?`,
        [departmentId]
      );
      const department = deptRows[0] || {
        id: departmentId,
        name: 'Roads & Infrastructure (PWD)',
        code: 'PWD',
      };

      // 3. Fetch Department Complaints with coordinates
      const [complaints] = await db.query(
        `SELECT 
          c.id,
          c.tracking_code,
          c.title,
          c.description,
          c.priority,
          c.status,
          CAST(COALESCE(c.latitude, 28.6139) AS DECIMAL(10,6)) AS latitude,
          CAST(COALESCE(c.longitude, 77.2090) AS DECIMAL(10,6)) AS longitude,
          COALESCE(c.ward_no, 'Ward-12') AS ward_no,
          c.location_address,
          c.photo_url,
          c.created_at,
          cc.name AS category_name,
          cc.sla_hours,
          u.name AS citizen_name,
          (SELECT COUNT(*) FROM tasks WHERE complaint_id = c.id) AS task_count,
          (
            SELECT fw.name 
            FROM tasks t 
            JOIN field_workers fw ON t.field_worker_id = fw.id 
            WHERE t.complaint_id = c.id 
            ORDER BY t.id DESC 
            LIMIT 1
          ) AS active_worker_name
        FROM complaints c
        JOIN complaint_categories cc ON c.category_id = cc.id
        LEFT JOIN users u ON c.citizen_id = u.id
        WHERE c.department_id = ?
        ORDER BY c.created_at DESC`,
        [departmentId]
      );

      // 4. Fetch Department Field Workers and map to their assigned ward coordinates
      const [workers] = await db.query(
        `SELECT 
          fw.id,
          fw.name,
          fw.phone,
          fw.skills,
          fw.ward_assigned,
          fw.is_available,
          fw.department_id,
          d.code AS department_code
        FROM field_workers fw
        JOIN departments d ON fw.department_id = d.id
        WHERE fw.department_id = ?`,
        [departmentId]
      );

      const mappedWorkers = (workers.length > 0 ? workers : FALLBACK_WORKERS.filter((w) => w.department_id === departmentId)).map((w) => {
        const meta = WARD_METADATA[w.ward_assigned] || { centerLat: 28.6139, centerLng: 77.2090 };
        return {
          ...w,
          latitude: meta.centerLat + (Math.random() - 0.5) * 0.006,
          longitude: meta.centerLng + (Math.random() - 0.5) * 0.006,
        };
      });

      const formattedComplaints = complaints.map((c) => ({
        ...c,
        latitude: parseFloat(c.latitude),
        longitude: parseFloat(c.longitude),
      }));

      // 5. Compute Department KPIs
      const totalCases = formattedComplaints.length;
      const emergencyCases = formattedComplaints.filter((c) => c.priority === 'EMERGENCY').length;
      const activeCases = formattedComplaints.filter((c) =>
        ['REPORTED', 'ASSIGNED', 'IN_PROGRESS'].includes(c.status)
      ).length;
      const resolvedCases = formattedComplaints.filter((c) =>
        ['RESOLVED', 'VERIFIED', 'CLOSED'].includes(c.status)
      ).length;

      return res.json({
        success: true,
        data: {
          department,
          kpis: {
            total_cases: totalCases,
            emergency_cases: emergencyCases,
            active_cases: activeCases,
            resolved_cases: resolvedCases,
            total_workers: mappedWorkers.length,
            available_workers: mappedWorkers.filter((w) => Boolean(w.is_available)).length,
          },
          complaints: formattedComplaints,
          field_workers: mappedWorkers,
        },
      });
    } catch (dbErr) {
      // Offline fallback for officer map view
      const deptComplaints = FALLBACK_MAP_COMPLAINTS.filter((c) => c.department_id === departmentId || departmentId === 1);
      const deptWorkers = FALLBACK_WORKERS.filter((w) => w.department_id === departmentId || departmentId === 1);

      return res.json({
        success: true,
        data: {
          department: {
            id: departmentId,
            name: 'Roads & Infrastructure (PWD)',
            code: 'PWD',
          },
          kpis: {
            total_cases: deptComplaints.length,
            emergency_cases: deptComplaints.filter((c) => c.priority === 'EMERGENCY').length,
            active_cases: deptComplaints.filter((c) => ['REPORTED', 'ASSIGNED', 'IN_PROGRESS'].includes(c.status)).length,
            resolved_cases: deptComplaints.filter((c) => c.status === 'RESOLVED').length,
            total_workers: deptWorkers.length,
            available_workers: deptWorkers.filter((w) => w.is_available).length,
          },
          complaints: deptComplaints,
          field_workers: deptWorkers,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};
