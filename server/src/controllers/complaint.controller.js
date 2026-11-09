const db = require('../config/db');

/**
 * Generate official tracking code: CMP-YYYY-XXXXX
 */
function generateTrackingCode() {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `CMP-${year}-${randomNum}`;
}

// Fallback seed complaints for demo mode
const FALLBACK_COMPLAINTS = [
  {
    id: 1,
    tracking_code: 'CMP-2026-00101',
    citizen_id: 5,
    citizen_name: 'Aarav Mehta',
    citizen_phone: '+91-98765-00005',
    category_id: 1,
    category_name: 'Pothole and Crater on Road',
    department_id: 1,
    department_name: 'Roads & Infrastructure (PWD)',
    department_code: 'PWD',
    assigned_officer_id: null,
    officer_name: null,
    officer_designation: null,
    officer_badge: null,
    title: 'Severe Pothole Cluster on 5th Cross Road',
    description: 'Three deep craters spanning 2 meters across have formed right in front of Greenfield Apartments. Two two-wheelers skidded yesterday.',
    location_address: 'Near Gate 2, Greenfield Apartments, 5th Cross Road, Sector 15',
    latitude: 28.613939,
    longitude: 77.209021,
    ward_no: 'Ward-12',
    photo_url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
    priority: 'HIGH',
    status: 'REPORTED',
    resolved_at: null,
    closed_at: null,
    created_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    status_history: [
      {
        id: 1,
        previous_status: null,
        new_status: 'REPORTED',
        changed_by_name: 'Aarav Mehta',
        changed_by_role: 'citizen',
        remarks: 'Complaint submitted via citizen web portal with geo-coordinates and photograph.',
        created_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 2,
    tracking_code: 'CMP-2026-00102',
    citizen_id: 6,
    citizen_name: 'Pooja Iyer',
    citizen_phone: '+91-98765-00006',
    category_id: 7,
    category_name: 'Streetlight Dark / Non-functional',
    department_id: 4,
    department_name: 'Electrical & Street Lighting',
    department_code: 'ELE',
    assigned_officer_id: 1,
    officer_name: 'Officer Priya Sharma',
    officer_designation: 'Assistant Electrical Engineer',
    officer_badge: 'ELE-OFF-404',
    title: 'Twin Streetlights Out near Metro Pillar 42',
    description: 'Entire 100-meter stretch is pitch dark after 7:30 PM. Women commuters feel unsafe walking from the metro exit.',
    location_address: 'Opposite Metro Pillar 42, Gulmohar Marg',
    latitude: 28.621900,
    longitude: 77.218500,
    ward_no: 'Ward-08',
    photo_url: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=800&q=80',
    priority: 'MEDIUM',
    status: 'ASSIGNED',
    resolved_at: null,
    closed_at: null,
    created_at: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
    status_history: [
      {
        id: 2,
        previous_status: null,
        new_status: 'REPORTED',
        changed_by_name: 'Pooja Iyer',
        changed_by_role: 'citizen',
        remarks: 'Streetlight blackout reported by resident.',
        created_at: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
      },
      {
        id: 3,
        previous_status: 'REPORTED',
        new_status: 'ASSIGNED',
        changed_by_name: 'City Administrator',
        changed_by_role: 'admin',
        remarks: 'Assigned to Electrical & Street Lighting division for pole circuitry inspection.',
        created_at: new Date(Date.now() - 16 * 3600 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 3,
    tracking_code: 'CMP-2026-00103',
    citizen_id: 7,
    citizen_name: 'David Fernandes',
    citizen_phone: '+91-98765-00007',
    category_id: 3,
    category_name: 'Garbage Overflow / Dumpster Full',
    department_id: 2,
    department_name: 'Sanitation & Solid Waste Management',
    department_code: 'SWM',
    assigned_officer_id: 2,
    officer_name: 'Officer Fatima Al-Hassan',
    officer_designation: 'Senior Sanitary Inspector',
    officer_badge: 'SWM-OFF-202',
    title: 'Commercial Dumpster Overflowing into Vegetable Market',
    description: 'Market traders and shoppers unable to access the eastern lane. Stray cattle dispersing rotting plastic into the road.',
    location_address: 'East Gate, Sector 4 Central Market',
    latitude: 28.632400,
    longitude: 77.219800,
    ward_no: 'Ward-04',
    photo_url: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=800&q=80',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    resolved_at: null,
    closed_at: null,
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    status_history: [
      {
        id: 4,
        previous_status: null,
        new_status: 'REPORTED',
        changed_by_name: 'David Fernandes',
        changed_by_role: 'citizen',
        remarks: 'Garbage dumping overflow complaint filed.',
        created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      },
      {
        id: 5,
        previous_status: 'REPORTED',
        new_status: 'ASSIGNED',
        changed_by_name: 'City Administrator',
        changed_by_role: 'admin',
        remarks: 'Assigned to Officer Fatima Al-Hassan (Sanitation).',
        created_at: new Date(Date.now() - 22 * 3600 * 1000).toISOString(),
      },
      {
        id: 6,
        previous_status: 'ASSIGNED',
        new_status: 'IN_PROGRESS',
        changed_by_name: 'Officer Fatima Al-Hassan',
        changed_by_role: 'officer',
        remarks: 'Dispatched compactor crew (Worker Raju Kumar) with bin replacement equipment.',
        created_at: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 4,
    tracking_code: 'CMP-2026-00104',
    citizen_id: 5,
    citizen_name: 'Aarav Mehta',
    citizen_phone: '+91-98765-00005',
    category_id: 5,
    category_name: 'Major Water Pipeline Burst',
    department_id: 3,
    department_name: 'Water Supply & Sewerage Board',
    department_code: 'WSS',
    assigned_officer_id: 3,
    officer_name: 'Officer Rameshwar Gupta',
    officer_designation: 'Assistant Water Works Engineer',
    officer_badge: 'WSS-OFF-303',
    title: 'Underground Water Main Fractured on Park Avenue',
    description: 'High pressure clean water flooding the street and reducing pressure to 40 households.',
    location_address: 'Plot 72, Park Avenue, Ward 15',
    latitude: 28.608000,
    longitude: 77.205000,
    ward_no: 'Ward-15',
    photo_url: 'https://images.unsplash.com/photo-1584467735815-f778f274e296?auto=format&fit=crop&w=800&q=80',
    priority: 'EMERGENCY',
    status: 'RESOLVED',
    resolved_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    closed_at: null,
    created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    status_history: [
      {
        id: 7,
        previous_status: null,
        new_status: 'REPORTED',
        changed_by_name: 'Aarav Mehta',
        changed_by_role: 'citizen',
        remarks: 'Burst pipe reported with urgent priority.',
        created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      },
      {
        id: 8,
        previous_status: 'REPORTED',
        new_status: 'ASSIGNED',
        changed_by_name: 'City Administrator',
        changed_by_role: 'admin',
        remarks: 'Assigned to Water Works Officer Rameshwar Gupta.',
        created_at: new Date(Date.now() - 44 * 3600 * 1000).toISOString(),
      },
      {
        id: 9,
        previous_status: 'ASSIGNED',
        new_status: 'IN_PROGRESS',
        changed_by_name: 'Officer Rameshwar Gupta',
        changed_by_role: 'officer',
        remarks: 'Isolation valve shut; excavation team deployed to replace broken 6-inch PVC section.',
        created_at: new Date(Date.now() - 30 * 3600 * 1000).toISOString(),
      },
      {
        id: 10,
        previous_status: 'IN_PROGRESS',
        new_status: 'RESOLVED',
        changed_by_name: 'Officer Rameshwar Gupta',
        changed_by_role: 'officer',
        remarks: 'Replacement collar fitted and pressurized test passed with zero leakage. Site backfilled.',
        created_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 5,
    tracking_code: 'CMP-2026-00105',
    citizen_id: 6,
    citizen_name: 'Pooja Iyer',
    citizen_phone: '+91-98765-00006',
    category_id: 8,
    category_name: 'Fallen Tree / Heavy Hanging Branch',
    department_id: 5,
    department_name: 'Parks & Horticulture Department',
    department_code: 'PRK',
    assigned_officer_id: 1,
    officer_name: 'Officer Farooq Ahmed',
    officer_designation: 'Horticulture Supervisor',
    officer_badge: 'PRK-OFF-505',
    title: 'Fallen Gulmohar Bough Blocking School Bus Route',
    description: 'Large tree branch snapped during morning gale and fell over the lane to Model Public School.',
    location_address: 'Junction of 3rd Cross & School Road, Ward 08',
    latitude: 28.625000,
    longitude: 77.221000,
    ward_no: 'Ward-08',
    photo_url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80',
    priority: 'HIGH',
    status: 'VERIFIED',
    resolved_at: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
    closed_at: null,
    created_at: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    feedback: {
      rating: 5,
      comments: 'Outstanding response time! The horticulture crew arrived within 2 hours and cleared the heavy tree branches before school hours.',
      satisfaction_level: 'EXCELLENT',
    },
    status_history: [
      {
        id: 11,
        previous_status: null,
        new_status: 'REPORTED',
        changed_by_name: 'Pooja Iyer',
        changed_by_role: 'citizen',
        remarks: 'School path obstruction reported.',
        created_at: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
      },
      {
        id: 12,
        previous_status: 'REPORTED',
        new_status: 'ASSIGNED',
        changed_by_name: 'City Administrator',
        changed_by_role: 'admin',
        remarks: 'Assigned to Parks & Horticulture.',
        created_at: new Date(Date.now() - 70 * 3600 * 1000).toISOString(),
      },
      {
        id: 13,
        previous_status: 'ASSIGNED',
        new_status: 'IN_PROGRESS',
        changed_by_name: 'Officer Farooq Ahmed',
        changed_by_role: 'officer',
        remarks: 'Arborist chainsaw crew dispatched.',
        created_at: new Date(Date.now() - 50 * 3600 * 1000).toISOString(),
      },
      {
        id: 14,
        previous_status: 'IN_PROGRESS',
        new_status: 'RESOLVED',
        changed_by_name: 'Officer Farooq Ahmed',
        changed_by_role: 'officer',
        remarks: 'Branch cleared and shredded; roadway swept clean for school buses.',
        created_at: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
      },
      {
        id: 15,
        previous_status: 'RESOLVED',
        new_status: 'VERIFIED',
        changed_by_name: 'Pooja Iyer',
        changed_by_role: 'citizen',
        remarks: 'Citizen inspected the road and confirmed clean access. Rated 5 stars.',
        created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 7,
    tracking_code: 'CMP-2026-00107',
    citizen_id: 5,
    citizen_name: 'Aarav Mehta',
    citizen_phone: '+91-98765-00005',
    category_id: 1,
    category_name: 'Pothole and Crater on Road',
    department_id: 1,
    department_name: 'Roads & Infrastructure (PWD)',
    department_code: 'PWD',
    assigned_officer_id: 1,
    officer_name: 'Officer Vikramaditya Sen',
    officer_designation: 'Executive Engineer (Roads)',
    officer_badge: 'PWD-OFF-101',
    title: 'Substandard Patching of Pothole on Ward 12 Main Road',
    description: 'The initial gravel patch eroded completely during last night light rain. Deep hole is exposed again.',
    location_address: 'Opposite Metro Pillar 114, Main Road',
    latitude: 28.618000,
    longitude: 77.210000,
    ward_no: 'Ward-12',
    photo_url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
    priority: 'HIGH',
    status: 'REOPENED',
    resolved_at: null,
    closed_at: null,
    created_at: new Date(Date.now() - 96 * 3600 * 1000).toISOString(),
    status_history: [
      {
        id: 16,
        previous_status: null,
        new_status: 'REPORTED',
        changed_by_name: 'Aarav Mehta',
        changed_by_role: 'citizen',
        remarks: 'Pothole complaint initially submitted.',
        created_at: new Date(Date.now() - 96 * 3600 * 1000).toISOString(),
      },
      {
        id: 17,
        previous_status: 'REPORTED',
        new_status: 'ASSIGNED',
        changed_by_name: 'City Administrator',
        changed_by_role: 'admin',
        remarks: 'Assigned to PWD team.',
        created_at: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
      },
      {
        id: 18,
        previous_status: 'ASSIGNED',
        new_status: 'IN_PROGRESS',
        changed_by_name: 'Officer Vikramaditya Sen',
        changed_by_role: 'officer',
        remarks: 'Cold-mix asphalt patch applied.',
        created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      },
      {
        id: 19,
        previous_status: 'IN_PROGRESS',
        new_status: 'RESOLVED',
        changed_by_name: 'Officer Vikramaditya Sen',
        changed_by_role: 'officer',
        remarks: 'Officer marked repair as finished.',
        created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      },
      {
        id: 20,
        previous_status: 'RESOLVED',
        new_status: 'REOPENED',
        changed_by_name: 'Aarav Mehta',
        changed_by_role: 'citizen',
        remarks: 'Citizen rejected resolution: Gravel was washed out within 12 hours. Proper hot-mix asphalt required.',
        created_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
      },
    ],
  },
];

/**
 * Get Complaint Metadata (Departments & Categories with SLAs)
 * GET /api/complaints/meta
 */
async function getMetadata(req, res, next) {
  try {
    const dbCheck = await db.checkConnection();

    if (dbCheck.connected) {
      const [departments] = await db.query(
        'SELECT id, code, name, description FROM departments WHERE is_active = TRUE ORDER BY name ASC'
      );

      const [categories] = await db.query(
        'SELECT id, department_id, name, description, sla_hours, default_priority FROM complaint_categories WHERE is_active = TRUE ORDER BY name ASC'
      );

      return res.status(200).json({
        success: true,
        data: {
          departments,
          categories,
        },
      });
    }

    const fallbackData = {
      departments: [
        { id: 1, code: 'PWD', name: 'Roads & Infrastructure (PWD)', description: 'Roads, potholes, pavements, and flyovers.' },
        { id: 2, code: 'SWM', name: 'Sanitation & Solid Waste Management', description: 'Garbage collection, dustbins, and street cleaning.' },
        { id: 3, code: 'WSS', name: 'Water Supply & Sewerage Board', description: 'Water pipeline leaks, tankers, and drainage.' },
        { id: 4, code: 'ELE', name: 'Electrical & Street Lighting', description: 'Streetlamps, wiring, and illumination.' },
        { id: 5, code: 'PRK', name: 'Parks & Horticulture Department', description: 'Tree trimming, park maintenance, and greenery.' },
        { id: 6, code: 'HLT', name: 'Public Health & Vector Control', description: 'Mosquito fogging, pest control, and hygiene.' },
      ],
      categories: [
        { id: 1, department_id: 1, name: 'Pothole and Crater on Road', sla_hours: 48, default_priority: 'HIGH' },
        { id: 2, department_id: 1, name: 'Damaged Footpath / Broken Pavements', sla_hours: 72, default_priority: 'MEDIUM' },
        { id: 3, department_id: 2, name: 'Garbage Overflow / Dumpster Full', sla_hours: 24, default_priority: 'HIGH' },
        { id: 4, department_id: 2, name: 'Dead Animal Removal', sla_hours: 12, default_priority: 'EMERGENCY' },
        { id: 5, department_id: 3, name: 'Major Water Pipeline Burst', sla_hours: 12, default_priority: 'EMERGENCY' },
        { id: 6, department_id: 3, name: 'Open / Overflowing Sewage Manhole', sla_hours: 24, default_priority: 'HIGH' },
        { id: 7, department_id: 4, name: 'Streetlight Dark / Non-functional', sla_hours: 24, default_priority: 'MEDIUM' },
        { id: 8, department_id: 5, name: 'Fallen Tree / Heavy Hanging Branch', sla_hours: 12, default_priority: 'HIGH' },
        { id: 9, department_id: 6, name: 'Stagnant Water / Mosquito Breeding', sla_hours: 48, default_priority: 'MEDIUM' },
      ],
    };

    res.status(200).json({
      success: true,
      data: fallbackData,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Upload Photographic Evidence
 * POST /api/complaints/upload
 */
async function uploadPhoto(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided for upload.',
      });
    }

    const photoUrl = `/uploads/${req.file.filename}`;

    return res.status(200).json({
      success: true,
      message: 'Photo uploaded successfully.',
      data: {
        filename: req.file.filename,
        original_name: req.file.originalname,
        size_bytes: req.file.size,
        mimetype: req.file.mimetype,
        photo_url: photoUrl,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Report a new municipal grievance
 * POST /api/complaints
 */
async function createComplaint(req, res, next) {
  try {
    const {
      title,
      description,
      category_id,
      department_id,
      location_address,
      ward_no,
      priority = 'MEDIUM',
      latitude = null,
      longitude = null,
      photo_url = null,
    } = req.body;

    const citizenId = req.user.id;
    const trackingCode = generateTrackingCode();

    const parsedLat = latitude !== undefined && latitude !== null && latitude !== '' 
      ? parseFloat(latitude) 
      : null;
    const parsedLng = longitude !== undefined && longitude !== null && longitude !== '' 
      ? parseFloat(longitude) 
      : null;

    const dbCheck = await db.checkConnection();

    if (dbCheck.connected) {
      const [insertResult] = await db.query(
        `INSERT INTO complaints (
           tracking_code, citizen_id, category_id, department_id,
           title, description, location_address, latitude, longitude,
           ward_no, photo_url, priority, status
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'REPORTED')`,
        [
          trackingCode,
          citizenId,
          parseInt(category_id, 10),
          parseInt(department_id, 10),
          title,
          description,
          location_address,
          parsedLat,
          parsedLng,
          ward_no,
          photo_url || null,
          priority,
        ]
      );

      const complaintId = insertResult.insertId;

      await db.query(
        `INSERT INTO complaint_status_history (
           complaint_id, previous_status, new_status, changed_by_user_id, remarks
         ) VALUES (?, NULL, 'REPORTED', ?, 'Complaint registered by citizen with photo and GPS location.')`,
        [complaintId, citizenId]
      );

      await db.query(
        `INSERT INTO notifications (
           user_id, title, message, type, entity_type, entity_id
         ) VALUES (?, 'Grievance Submitted', ?, 'SUCCESS', 'COMPLAINT', ?)`,
        [
          citizenId,
          `Your complaint "${title}" has been registered with tracking ID ${trackingCode}.`,
          complaintId,
        ]
      );

      // Audit log entry
      try {
        await db.query(
          `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
           VALUES (?, 'COMPLAINT_CREATED', 'COMPLAINT', ?, ?, ?)`,
          [
            citizenId,
            complaintId,
            JSON.stringify({ tracking_code: trackingCode, priority, ward_no }),
            req.ip || '127.0.0.1',
          ]
        );
      } catch (logErr) {
        console.warn('Audit log write skipped:', logErr.message);
      }

      return res.status(201).json({
        success: true,
        message: 'Your complaint has been successfully reported to the municipal authorities.',
        data: {
          id: complaintId,
          tracking_code: trackingCode,
          title,
          description,
          category_id: parseInt(category_id, 10),
          department_id: parseInt(department_id, 10),
          location_address,
          ward_no,
          priority,
          latitude: parsedLat,
          longitude: parsedLng,
          status: 'REPORTED',
          photo_url: photo_url || null,
          created_at: new Date().toISOString(),
        },
      });
    }

    // Demo fallback
    const newDemoItem = {
      id: Math.floor(100 + Math.random() * 900),
      tracking_code: trackingCode,
      citizen_id: citizenId,
      citizen_name: req.user.name || 'Resident Citizen',
      title,
      description,
      category_id,
      category_name: 'Municipal Issue',
      department_id,
      department_name: 'Municipal Corporation',
      department_code: 'MC',
      location_address,
      ward_no,
      priority,
      status: 'REPORTED',
      photo_url,
      created_at: new Date().toISOString(),
      status_history: [
        {
          id: 1,
          previous_status: null,
          new_status: 'REPORTED',
          changed_by_name: req.user.name || 'Resident Citizen',
          changed_by_role: 'citizen',
          remarks: 'Complaint registered by citizen.',
          created_at: new Date().toISOString(),
        },
      ],
    };
    FALLBACK_COMPLAINTS.unshift(newDemoItem);

    res.status(201).json({
      success: true,
      message: 'Your complaint has been successfully reported (Demo Mode).',
      data: newDemoItem,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * List Complaints with Filters
 * GET /api/complaints
 */
async function listComplaints(req, res, next) {
  try {
    const { status, search, department_id, ward_no, priority, category_id, page = 1, limit = 20 } = req.query;
    const user = req.user;

    const dbCheck = await db.checkConnection();

    if (dbCheck.connected) {
      let baseWhere = ' WHERE 1=1';
      const params = [];

      // Role check: If citizen, restrict to own complaints unless searching by exact tracking code
      if (user && user.role === 'citizen' && !search) {
        baseWhere += ' AND c.citizen_id = ?';
        params.push(user.id);
      }

      if (status && status !== 'ALL') {
        baseWhere += ' AND c.status = ?';
        params.push(status);
      }

      if (department_id) {
        baseWhere += ' AND c.department_id = ?';
        params.push(parseInt(department_id, 10));
      }

      if (category_id) {
        baseWhere += ' AND c.category_id = ?';
        params.push(parseInt(category_id, 10));
      }

      if (ward_no && ward_no !== 'ALL') {
        baseWhere += ' AND c.ward_no = ?';
        params.push(ward_no);
      }

      if (priority && priority !== 'ALL') {
        baseWhere += ' AND c.priority = ?';
        params.push(priority);
      }

      if (search) {
        baseWhere += ' AND (c.tracking_code LIKE ? OR c.title LIKE ? OR c.location_address LIKE ? OR d.name LIKE ?)';
        const term = `%${search}%`;
        params.push(term, term, term, term);
      }

      // Count total matching records for pagination
      const countQuery = `
        SELECT COUNT(*) as total
        FROM complaints c
        JOIN departments d ON c.department_id = d.id
        JOIN complaint_categories cat ON c.category_id = cat.id
        JOIN users u ON c.citizen_id = u.id
        ${baseWhere}
      `;
      const [countResult] = await db.query(countQuery, params);
      const totalCount = Number(countResult[0]?.total) || 0;

      // Select data with pagination
      const dataQuery = `
        SELECT 
          c.id, c.tracking_code, c.title, c.description, c.location_address,
          c.ward_no, c.photo_url, c.priority, c.status, c.rejection_reason,
          c.created_at, c.resolved_at,
          d.name as department_name, d.code as department_code,
          cat.name as category_name,
          u.name as citizen_name,
          (SELECT remarks FROM complaint_status_history WHERE complaint_id = c.id ORDER BY id DESC LIMIT 1) as latest_remark
        FROM complaints c
        JOIN departments d ON c.department_id = d.id
        JOIN complaint_categories cat ON c.category_id = cat.id
        JOIN users u ON c.citizen_id = u.id
        ${baseWhere}
        ORDER BY c.created_at DESC LIMIT ? OFFSET ?
      `;

      const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
      const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
      const offset = (parsedPage - 1) * parsedLimit;
      const dataParams = [...params, parsedLimit, offset];

      const [complaints] = await db.query(dataQuery, dataParams);

      return res.status(200).json({
        success: true,
        data: complaints,
        total: totalCount,
        pagination: {
          page: parsedPage,
          limit: parsedLimit,
          totalPages: Math.ceil(totalCount / parsedLimit) || 1,
        },
      });
    }

    // Demo fallback
    let results = [...FALLBACK_COMPLAINTS];

    if (user && user.role === 'citizen' && !search) {
      results = results.filter((c) => c.citizen_id === user.id);
    }

    if (status && status !== 'ALL') {
      results = results.filter((c) => c.status === status);
    }

    if (priority && priority !== 'ALL') {
      results = results.filter((c) => c.priority === priority);
    }

    if (department_id) {
      results = results.filter((c) => String(c.department_id) === String(department_id));
    }

    if (ward_no && ward_no !== 'ALL') {
      results = results.filter((c) => c.ward_no === ward_no);
    }

    if (search) {
      const q = search.toLowerCase();
      results = results.filter(
        (c) =>
          c.tracking_code.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.location_address.toLowerCase().includes(q) ||
          (c.department_name && c.department_name.toLowerCase().includes(q))
      );
    }

    res.status(200).json({
      success: true,
      data: results,
      total: results.length,
      pagination: {
        page: 1,
        limit: results.length,
        totalPages: 1,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Complaint Details with Full Status History by ID or Tracking Code
 * GET /api/complaints/:idOrCode
 */
async function getComplaintByCodeOrId(req, res, next) {
  try {
    const { idOrCode } = req.params;
    const isNumeric = /^\d+$/.test(idOrCode);

    const dbCheck = await db.checkConnection();

    if (dbCheck.connected) {
      const condition = isNumeric ? 'c.id = ?' : 'c.tracking_code = ?';
      const [complaints] = await db.query(
        `SELECT 
           c.id, c.tracking_code, c.citizen_id, c.title, c.description, c.location_address,
           c.latitude, c.longitude, c.ward_no, c.photo_url, c.priority, c.status, c.rejection_reason,
           c.resolved_at, c.closed_at, c.created_at, c.updated_at,
           d.id as department_id, d.name as department_name, d.code as department_code,
           cat.id as category_id, cat.name as category_name, cat.sla_hours,
           u.name as citizen_name, u.phone as citizen_phone, u.email as citizen_email,
           o.id as officer_id, o.badge_number as officer_badge, o.designation as officer_designation,
           ou.name as officer_name
         FROM complaints c
         JOIN departments d ON c.department_id = d.id
         JOIN complaint_categories cat ON c.category_id = cat.id
         JOIN users u ON c.citizen_id = u.id
         LEFT JOIN officers o ON c.assigned_officer_id = o.id
         LEFT JOIN users ou ON o.user_id = ou.id
         WHERE ${condition}`,
        [idOrCode]
      );

      if (complaints.length === 0) {
        return res.status(404).json({
          success: false,
          message: `Complaint not found for reference: ${idOrCode}`,
        });
      }

      const complaint = complaints[0];

      // Fetch chronological status history
      const [history] = await db.query(
        `SELECT 
           h.id, h.previous_status, h.new_status, h.remarks, h.photo_proof_url, h.created_at,
           u.name as changed_by_name, r.name as changed_by_role
         FROM complaint_status_history h
         JOIN users u ON h.changed_by_user_id = u.id
         JOIN roles r ON u.role_id = r.id
         WHERE h.complaint_id = ?
         ORDER BY h.created_at ASC`,
        [complaint.id]
      );

      // Fetch feedback if any
      const [feedback] = await db.query(
        'SELECT rating, comments, satisfaction_level, created_at FROM feedback WHERE complaint_id = ?',
        [complaint.id]
      );

      return res.status(200).json({
        success: true,
        data: {
          ...complaint,
          status_history: history,
          feedback: feedback.length > 0 ? feedback[0] : null,
        },
      });
    }

    // Fallback demo search
    const found = FALLBACK_COMPLAINTS.find(
      (c) => String(c.id) === String(idOrCode) || c.tracking_code === idOrCode
    );

    if (!found) {
      return res.status(404).json({
        success: false,
        message: `Complaint not found for reference: ${idOrCode}`,
      });
    }

    res.status(200).json({
      success: true,
      data: found,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Citizen verifies resolution
 * POST /api/complaints/:id/verify
 */
async function verifyComplaint(req, res, next) {
  try {
    const { id } = req.params;
    const { rating, comments } = req.body;
    const citizenId = req.user.id;

    const dbCheck = await db.checkConnection();

    if (dbCheck.connected) {
      const [complaints] = await db.query(
        'SELECT id, tracking_code, citizen_id, status FROM complaints WHERE id = ?',
        [id]
      );

      if (complaints.length === 0) {
        return res.status(404).json({ success: false, message: 'Complaint not found.' });
      }

      const complaint = complaints[0];

      // Verification check: only citizen who filed or admin can verify
      if (req.user.role !== 'admin' && complaint.citizen_id !== citizenId) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to verify this complaint.',
        });
      }

      if (complaint.status !== 'RESOLVED') {
        return res.status(400).json({
          success: false,
          message: `Complaint must be in RESOLVED status to verify. Current status is ${complaint.status}.`,
        });
      }

      // Update status to VERIFIED
      await db.query(
        "UPDATE complaints SET status = 'VERIFIED', updated_at = NOW() WHERE id = ?",
        [id]
      );

      // Add to status history
      await db.query(
        `INSERT INTO complaint_status_history (complaint_id, previous_status, new_status, changed_by_user_id, remarks)
         VALUES (?, 'RESOLVED', 'VERIFIED', ?, ?)`,
        [id, citizenId, comments || 'Citizen inspected and verified the resolution.']
      );

      // Insert feedback if rating provided
      if (rating) {
        const satLevel = rating >= 4 ? 'EXCELLENT' : rating === 3 ? 'GOOD' : 'AVERAGE';
        await db.query(
          `INSERT INTO feedback (complaint_id, citizen_id, rating, comments, satisfaction_level)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE rating = VALUES(rating), comments = VALUES(comments)`,
          [id, citizenId, rating, comments || null, satLevel]
        );
      }

      // Notification for citizen
      await db.query(
        `INSERT INTO notifications (user_id, title, message, type, entity_type, entity_id)
         VALUES (?, 'Resolution Verified', ?, 'SUCCESS', 'COMPLAINT', ?)`,
        [
          citizenId,
          `Complaint ${complaint.tracking_code} has been successfully verified. Thank you for your feedback!`,
          id,
        ]
      );

      // Audit log entry
      try {
        await db.query(
          `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
           VALUES (?, 'COMPLAINT_VERIFIED', 'COMPLAINT', ?, ?, ?)`,
          [
            citizenId,
            id,
            JSON.stringify({ tracking_code: complaint.tracking_code, rating }),
            req.ip || '127.0.0.1',
          ]
        );
      } catch (logErr) {
        console.warn('Audit log write skipped:', logErr.message);
      }

      return res.status(200).json({
        success: true,
        message: 'Complaint has been verified successfully. Thank you for your feedback!',
      });
    }

    // Demo mode fallback
    const target = FALLBACK_COMPLAINTS.find((c) => String(c.id) === String(id));
    if (target) {
      target.status = 'VERIFIED';
      target.status_history.push({
        id: target.status_history.length + 1,
        previous_status: 'RESOLVED',
        new_status: 'VERIFIED',
        changed_by_name: req.user.name || 'Citizen',
        changed_by_role: 'citizen',
        remarks: comments || 'Citizen inspected and verified the resolution.',
        created_at: new Date().toISOString(),
      });
    }

    res.status(200).json({
      success: true,
      message: 'Complaint has been verified successfully (Demo Mode).',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Citizen rejects resolution and reopens grievance
 * POST /api/complaints/:id/reopen
 */
async function reopenComplaint(req, res, next) {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const citizenId = req.user.id;

    if (!remarks || remarks.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a clear reason (at least 5 characters) explaining why the issue is not resolved.',
      });
    }

    const dbCheck = await db.checkConnection();

    if (dbCheck.connected) {
      const [complaints] = await db.query(
        'SELECT id, tracking_code, citizen_id, assigned_officer_id, status FROM complaints WHERE id = ?',
        [id]
      );

      if (complaints.length === 0) {
        return res.status(404).json({ success: false, message: 'Complaint not found.' });
      }

      const complaint = complaints[0];

      if (req.user.role !== 'admin' && complaint.citizen_id !== citizenId) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to reopen this complaint.',
        });
      }

      if (complaint.status !== 'RESOLVED') {
        return res.status(400).json({
          success: false,
          message: `Only complaints in RESOLVED status can be reopened. Current status is ${complaint.status}.`,
        });
      }

      // Update status to REOPENED
      await db.query(
        "UPDATE complaints SET status = 'REOPENED', resolved_at = NULL, updated_at = NOW() WHERE id = ?",
        [id]
      );

      // Add to status history
      await db.query(
        `INSERT INTO complaint_status_history (complaint_id, previous_status, new_status, changed_by_user_id, remarks)
         VALUES (?, 'RESOLVED', 'REOPENED', ?, ?)`,
        [id, citizenId, `Citizen rejected resolution: ${remarks}`]
      );

      // Notification for citizen
      await db.query(
        `INSERT INTO notifications (user_id, title, message, type, entity_type, entity_id)
         VALUES (?, 'Grievance Reopened', ?, 'WARNING', 'COMPLAINT', ?)`,
        [
          citizenId,
          `Grievance ${complaint.tracking_code} was reopened: "${remarks}". Returned to municipal department queue.`,
          id,
        ]
      );

      // Audit log entry
      try {
        await db.query(
          `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
           VALUES (?, 'COMPLAINT_REOPENED', 'COMPLAINT', ?, ?, ?)`,
          [
            citizenId,
            id,
            JSON.stringify({ tracking_code: complaint.tracking_code, remarks }),
            req.ip || '127.0.0.1',
          ]
        );
      } catch (logErr) {
        console.warn('Audit log write skipped:', logErr.message);
      }

      return res.status(200).json({
        success: true,
        message: 'Grievance has been reopened and returned to the department queue for corrective action.',
      });
    }

    // Demo mode fallback
    const target = FALLBACK_COMPLAINTS.find((c) => String(c.id) === String(id));
    if (target) {
      target.status = 'REOPENED';
      target.status_history.push({
        id: target.status_history.length + 1,
        previous_status: 'RESOLVED',
        new_status: 'REOPENED',
        changed_by_name: req.user.name || 'Citizen',
        changed_by_role: 'citizen',
        remarks: `Citizen rejected resolution: ${remarks}`,
        created_at: new Date().toISOString(),
      });
    }

    res.status(200).json({
      success: true,
      message: 'Grievance has been reopened (Demo Mode).',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getMetadata,
  uploadPhoto,
  createComplaint,
  listComplaints,
  getComplaintByCodeOrId,
  verifyComplaint,
  reopenComplaint,
};
