-- =============================================================================
-- SMART CITY SERVICE PORTAL - SEED DATA SCRIPT (MySQL 8)
-- Version: 2.0.0 (Phase 2 - 16 Relational Tables Seed Data)
-- =============================================================================

USE `smart_city_db`;

-- Disable foreign key checks during seed population
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE `audit_logs`;
TRUNCATE TABLE `feedback`;
TRUNCATE TABLE `notifications`;
TRUNCATE TABLE `emergency_alerts`;
TRUNCATE TABLE `announcements`;
TRUNCATE TABLE `service_requests`;
TRUNCATE TABLE `service_categories`;
TRUNCATE TABLE `tasks`;
TRUNCATE TABLE `complaint_status_history`;
TRUNCATE TABLE `complaints`;
TRUNCATE TABLE `complaint_categories`;
TRUNCATE TABLE `field_workers`;
TRUNCATE TABLE `officers`;
TRUNCATE TABLE `users`;
TRUNCATE TABLE `departments`;
TRUNCATE TABLE `roles`;

SET FOREIGN_KEY_CHECKS = 1;

-- -----------------------------------------------------------------------------
-- 1. SEED ROLES
-- -----------------------------------------------------------------------------
INSERT INTO `roles` (`id`, `name`, `description`) VALUES
(1, 'admin', 'System Administrator with full municipal governance and oversight'),
(2, 'officer', 'Municipal Department Officer managing grievances and field dispatches'),
(3, 'citizen', 'Verified Resident submitting complaints and service requests'),
(4, 'field_worker', 'On-ground technician executing civic repairs and sanitation');

-- -----------------------------------------------------------------------------
-- 2. SEED DEPARTMENTS
-- -----------------------------------------------------------------------------
INSERT INTO `departments` (`id`, `code`, `name`, `description`, `contact_email`, `contact_phone`, `head_officer_name`, `is_active`) VALUES
(1, 'PWD', 'Roads & Infrastructure (PWD)', 'Maintenance of municipal roads, flyovers, potholes, pavements, and public structures.', 'roads@smartcity.gov', '+91-11-2345-0101', 'Er. Rajesh Varma', TRUE),
(2, 'SWM', 'Sanitation & Solid Waste Management', 'Door-to-door waste collection, street sweeping, community dustbins, and recycling.', 'sanitation@smartcity.gov', '+91-11-2345-0102', 'Dr. Meenakshi Sundaram', TRUE),
(3, 'WSS', 'Water Supply & Sewerage Board', 'Drinking water distribution, pipeline leak repairs, tanker supply, and sewage drainage.', 'water@smartcity.gov', '+91-11-2345-0103', 'Er. Anil Kulkarni', TRUE),
(4, 'ELE', 'Electrical & Street Lighting', 'Street lamp maintenance, transformer inspection, energy-efficient LED upgrades.', 'lighting@smartcity.gov', '+91-11-2345-0104', 'Smt. Priya Sharma', TRUE),
(5, 'PRK', 'Parks & Horticulture Department', 'Urban greenery, pruning overgrown roadside trees, public park maintenance.', 'parks@smartcity.gov', '+91-11-2345-0105', 'Shri Farooq Ahmed', TRUE),
(6, 'HLT', 'Public Health & Vector Control', 'Mosquito fogging, epidemic prevention, food safety inspections, and civic clinic aid.', 'health@smartcity.gov', '+91-11-2345-0106', 'Dr. Sunita Rao', TRUE);

-- -----------------------------------------------------------------------------
-- 3. SEED USERS
-- Default Demo Passwords (bcrypt hash: 10 rounds):
-- Admin:    Admin@123   ($2a$10$XY73vJ/QmnvHiupijQNFnuJqw9mm.ZjOst5hnU4nPTxEUrJVQkDne)
-- Officers: Officer@123 ($2a$10$ZSBl.rX9gAqFdLbDuuYaluW85wWpNTr.mAYVb0Ez1it7FjfvZvD8i)
-- Citizens: Citizen@123 ($2a$10$cPhNTqeOkTlDi8lxkwDde.Pn.xpqexrUk3gD5xhH9UUKKUFVrM0VK)
-- -----------------------------------------------------------------------------
INSERT INTO `users` (`id`, `role_id`, `name`, `email`, `password_hash`, `phone`, `address`, `ward_no`, `is_active`) VALUES
(1, 1, 'City Administrator', 'admin@smartcity.gov', '$2a$10$XY73vJ/QmnvHiupijQNFnuJqw9mm.ZjOst5hnU4nPTxEUrJVQkDne', '+91-98765-00001', 'Municipal Corporation HQ, Central Plaza', 'Ward-01', TRUE),
(2, 2, 'Officer Vikramaditya Sen', 'officer.roads@smartcity.gov', '$2a$10$ZSBl.rX9gAqFdLbDuuYaluW85wWpNTr.mAYVb0Ez1it7FjfvZvD8i', '+91-98765-00002', 'Zonal Office 4, North Sector', 'Ward-04', TRUE),
(3, 2, 'Officer Fatima Al-Hassan', 'officer.sanitation@smartcity.gov', '$2a$10$ZSBl.rX9gAqFdLbDuuYaluW85wWpNTr.mAYVb0Ez1it7FjfvZvD8i', '+91-98765-00003', 'Zonal Depot 7, West Enclave', 'Ward-07', TRUE),
(4, 2, 'Officer Rameshwar Gupta', 'officer.water@smartcity.gov', '$2a$10$ZSBl.rX9gAqFdLbDuuYaluW85wWpNTr.mAYVb0Ez1it7FjfvZvD8i', '+91-98765-00004', 'Water Works Station, Riverbank Road', 'Ward-12', TRUE),
(5, 3, 'Aarav Mehta', 'citizen@smartcity.gov', '$2a$10$cPhNTqeOkTlDi8lxkwDde.Pn.xpqexrUk3gD5xhH9UUKKUFVrM0VK', '+91-98765-00005', 'Flat 402, Greenfield Apartments, Sector 15', 'Ward-12', TRUE),
(6, 3, 'Pooja Iyer', 'citizen.pooja@smartcity.gov', '$2a$10$cPhNTqeOkTlDi8lxkwDde.Pn.xpqexrUk3gD5xhH9UUKKUFVrM0VK', '+91-98765-00006', 'House 18, Gulmohar Marg, Ward 08', 'Ward-08', TRUE),
(7, 3, 'David Fernandes', 'citizen.david@smartcity.gov', '$2a$10$cPhNTqeOkTlDi8lxkwDde.Pn.xpqexrUk3gD5xhH9UUKKUFVrM0VK', '+91-98765-00007', 'B-12, Royal Residency, East Block', 'Ward-04', TRUE);

-- -----------------------------------------------------------------------------
-- 4. SEED OFFICERS
-- -----------------------------------------------------------------------------
INSERT INTO `officers` (`id`, `user_id`, `department_id`, `badge_number`, `designation`, `office_location`) VALUES
(1, 2, 1, 'PWD-OFF-101', 'Executive Engineer (Roads)', 'North Zonal Engineering Complex, Room 204'),
(2, 3, 2, 'SWM-OFF-202', 'Senior Sanitary Inspector', 'West Solid Waste Management Yard, Cabin 3'),
(3, 4, 3, 'WSS-OFF-303', 'Assistant Water Works Engineer', 'South Water Pumping Station, Main Office');

-- -----------------------------------------------------------------------------
-- 5. SEED FIELD WORKERS
-- -----------------------------------------------------------------------------
INSERT INTO `field_workers` (`id`, `department_id`, `name`, `phone`, `skills`, `ward_assigned`, `is_available`) VALUES
(1, 1, 'Suresh Yadav', '+91-98111-10001', 'Asphalt filling, Concrete repair, Road roller operator', 'Ward-12', TRUE),
(2, 2, 'Raju Kumar', '+91-98111-10002', 'Garbage compactor driver, Segregation supervisor', 'Ward-04', TRUE),
(3, 3, 'Mohammad Imran', '+91-98111-10003', 'Pipeline plumber, Hydro-jetting technician', 'Ward-15', TRUE),
(4, 4, 'Dinesh Chand', '+91-98111-10004', 'Lineman, High-voltage electrician, Pole repair', 'Ward-08', TRUE),
(5, 5, 'Kishan Singh', '+91-98111-10005', 'Chainsaw operator, Tree arborist, Pruning technician', 'Ward-09', TRUE);

-- -----------------------------------------------------------------------------
-- 6. SEED COMPLAINT CATEGORIES
-- -----------------------------------------------------------------------------
INSERT INTO `complaint_categories` (`id`, `department_id`, `name`, `description`, `sla_hours`, `default_priority`, `is_active`) VALUES
(1, 1, 'Pothole and Crater on Road', 'Large road cavities causing traffic slowdowns and vehicle damage.', 48, 'HIGH', TRUE),
(2, 1, 'Damaged Footpath / Broken Pavements', 'Broken pedestrian walk slabs posing hazard to elderly and strollers.', 72, 'MEDIUM', TRUE),
(3, 2, 'Garbage Overflow / Dumpster Full', 'Public dustbins spilling over onto footpaths and creating foul stench.', 24, 'HIGH', TRUE),
(4, 2, 'Dead Animal Removal', 'Carcass lying in open public space requiring immediate sanitation removal.', 12, 'EMERGENCY', TRUE),
(5, 3, 'Major Water Pipeline Burst', 'Substantial drinking water loss due to ruptured underground pipe.', 12, 'EMERGENCY', TRUE),
(6, 3, 'Open / Overflowing Sewage Manhole', 'Drainage overflow contaminating streets and creating disease risks.', 24, 'HIGH', TRUE),
(7, 4, 'Streetlight Dark / Non-functional', 'Streetlight off during nighttime creating dark spots for pedestrians.', 24, 'MEDIUM', TRUE),
(8, 5, 'Fallen Tree / Heavy Hanging Branch', 'Tree or heavy boughs fallen across roadway impeding traffic or power lines.', 12, 'HIGH', TRUE),
(9, 6, 'Stagnant Water / Mosquito Breeding', 'Waterlogging creating dengue/malaria larvae infestation hotspots.', 48, 'MEDIUM', TRUE);

-- -----------------------------------------------------------------------------
-- 7. SEED COMPLAINTS (Demonstrating all 8 lifecycle states)
-- -----------------------------------------------------------------------------
INSERT INTO `complaints` (`id`, `tracking_code`, `citizen_id`, `category_id`, `department_id`, `assigned_officer_id`, `title`, `description`, `location_address`, `latitude`, `longitude`, `ward_no`, `photo_url`, `priority`, `status`, `rejection_reason`, `resolved_at`, `closed_at`, `created_at`) VALUES
-- 1. REPORTED (Fresh citizen complaint)
(1, 'CMP-2026-00101', 5, 1, 1, NULL, 
 'Severe Pothole Cluster on 5th Cross Road', 
 'Three deep craters spanning 2 meters across have formed right in front of Greenfield Apartments. Two two-wheelers skidded yesterday.', 
 'Near Gate 2, Greenfield Apartments, 5th Cross Road, Sector 15', 
 28.613939, 77.209021, 'Ward-12', 
 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80', 
 'HIGH', 'REPORTED', NULL, NULL, NULL, 
 DATE_SUB(NOW(), INTERVAL 4 HOUR)),

-- 2. ASSIGNED (Assigned to designated department officer)
(2, 'CMP-2026-00102', 6, 7, 4, NULL, 
 'Twin Streetlights Out near Metro Pillar 42', 
 'Entire 100-meter stretch is pitch dark after 7:30 PM. Women commuters feel unsafe walking from the metro exit.', 
 'Opposite Metro Pillar 42, Gulmohar Marg', 
 28.621900, 77.218500, 'Ward-08', 
 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=800&q=80', 
 'MEDIUM', 'ASSIGNED', NULL, NULL, NULL, 
 DATE_SUB(NOW(), INTERVAL 18 HOUR)),

-- 3. IN_PROGRESS (Field worker dispatched, repair underway)
(3, 'CMP-2026-00103', 7, 3, 2, 2, 
 'Commercial Dumpster Overflowing into Vegetable Market', 
 'Market traders and shoppers unable to access the eastern lane. Stray cattle dispersing rotting plastic into the road.', 
 'East Gate, Sector 4 Central Market', 
 28.632400, 77.219800, 'Ward-04', 
 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=800&q=80', 
 'HIGH', 'IN_PROGRESS', NULL, NULL, NULL, 
 DATE_SUB(NOW(), INTERVAL 1 DAY)),

-- 4. RESOLVED (Repairs completed, awaiting citizen verification)
(4, 'CMP-2026-00104', 5, 5, 3, 3, 
 'Underground Water Main Fractured on Park Avenue', 
 'High pressure clean water flooding the street and reducing pressure to 40 households.', 
 'Plot 72, Park Avenue, Ward 15', 
 28.608000, 77.205000, 'Ward-15', 
 'https://images.unsplash.com/photo-1584467735815-f778f274e296?auto=format&fit=crop&w=800&q=80', 
 'EMERGENCY', 'RESOLVED', NULL, DATE_SUB(NOW(), INTERVAL 6 HOUR), NULL, 
 DATE_SUB(NOW(), INTERVAL 2 DAY)),

-- 5. VERIFIED (Citizen verified work and gave 5-star rating)
(5, 'CMP-2026-00105', 6, 8, 5, NULL, 
 'Fallen Gulmohar Bough Blocking School Bus Route', 
 'Large tree branch snapped during morning gale and fell over the lane to Model Public School.', 
 'Junction of 3rd Cross & School Road, Ward 08', 
 28.625000, 77.221000, 'Ward-08', 
 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80', 
 'HIGH', 'VERIFIED', NULL, DATE_SUB(NOW(), INTERVAL 1 DAY), NULL, 
 DATE_SUB(NOW(), INTERVAL 3 DAY)),

-- 6. CLOSED (Completed, audited, and archived)
(6, 'CMP-2026-00106', 7, 6, 3, 3, 
 'Blocked Storm Drainage and Sewage Backup', 
 'Manhole lid loose and backflowing rain runoff onto pedestrian crosswalk.', 
 'Intersection of Road 14 and Market Link', 
 28.631000, 77.215000, 'Ward-04', 
 'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?auto=format&fit=crop&w=800&q=80', 
 'HIGH', 'CLOSED', NULL, DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY), 
 DATE_SUB(NOW(), INTERVAL 6 DAY)),

-- 7. REOPENED (Citizen rejected inadequate resolution)
(7, 'CMP-2026-00107', 5, 1, 1, 1, 
 'Substandard Patching of Pothole on Ward 12 Main Road', 
 'The initial gravel patch eroded completely during last night light rain. Deep hole is exposed again.', 
 'Opposite Metro Pillar 114, Main Road', 
 28.618000, 77.210000, 'Ward-12', 
 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80', 
 'HIGH', 'REOPENED', NULL, DATE_SUB(NOW(), INTERVAL 12 HOUR), NULL, 
 DATE_SUB(NOW(), INTERVAL 4 DAY)),

-- 8. REJECTED (Demonstrating legitimate rejection with documented reason)
(8, 'CMP-2026-00108', 6, 2, 1, 1, 
 'Request for Private Boundary Wall Painting', 
 'Citizen requested municipal painting crew to repaint private garden boundary wall.', 
 'House 22, Gulmohar Marg, Ward 08', 
 28.623000, 77.219000, 'Ward-08', 
 NULL, 
 'LOW', 'REJECTED', 
 'Outside municipal jurisdiction: Private residential property maintenance is the responsibility of the plot owner.', 
 NULL, NULL, 
 DATE_SUB(NOW(), INTERVAL 3 DAY));

-- -----------------------------------------------------------------------------
-- 8. SEED COMPLAINT STATUS HISTORY
-- -----------------------------------------------------------------------------
INSERT INTO `complaint_status_history` (`complaint_id`, `previous_status`, `new_status`, `changed_by_user_id`, `remarks`, `created_at`) VALUES
-- History for CMP-2026-00101
(1, NULL, 'REPORTED', 5, 'Complaint submitted via citizen web portal with geo-coordinates and photograph.', DATE_SUB(NOW(), INTERVAL 4 HOUR)),

-- History for CMP-2026-00102
(2, NULL, 'REPORTED', 6, 'Streetlight blackout reported by resident.', DATE_SUB(NOW(), INTERVAL 18 HOUR)),
(2, 'REPORTED', 'ASSIGNED', 1, 'Assigned to Electrical & Street Lighting division for pole circuitry inspection.', DATE_SUB(NOW(), INTERVAL 16 HOUR)),

-- History for CMP-2026-00103
(3, NULL, 'REPORTED', 7, 'Garbage dumping overflow complaint filed.', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(3, 'REPORTED', 'ASSIGNED', 1, 'Assigned to Officer Fatima Al-Hassan (Sanitation).', DATE_SUB(NOW(), INTERVAL 22 HOUR)),
(3, 'ASSIGNED', 'IN_PROGRESS', 3, 'Dispatched compactor crew (Worker Raju Kumar) with bin replacement equipment.', DATE_SUB(NOW(), INTERVAL 14 HOUR)),

-- History for CMP-2026-00104
(4, NULL, 'REPORTED', 5, 'Burst pipe reported with urgent priority.', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(4, 'REPORTED', 'ASSIGNED', 1, 'Assigned to Water Works Officer Rameshwar Gupta.', DATE_SUB(NOW(), INTERVAL 44 HOUR)),
(4, 'ASSIGNED', 'IN_PROGRESS', 4, 'Isolation valve shut; excavation team deployed to replace broken 6-inch PVC section.', DATE_SUB(NOW(), INTERVAL 30 HOUR)),
(4, 'IN_PROGRESS', 'RESOLVED', 4, 'Replacement collar fitted and pressurized test passed with zero leakage. Site backfilled.', DATE_SUB(NOW(), INTERVAL 6 HOUR)),

-- History for CMP-2026-00105
(5, NULL, 'REPORTED', 6, 'School path obstruction reported.', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(5, 'REPORTED', 'ASSIGNED', 1, 'Assigned to Parks & Horticulture.', DATE_SUB(NOW(), INTERVAL 70 HOUR)),
(5, 'ASSIGNED', 'IN_PROGRESS', 1, 'Arborist chainsaw crew dispatched.', DATE_SUB(NOW(), INTERVAL 50 HOUR)),
(5, 'IN_PROGRESS', 'RESOLVED', 1, 'Branch cleared and shredded; roadway swept clean for school buses.', DATE_SUB(NOW(), INTERVAL 28 HOUR)),
(5, 'RESOLVED', 'VERIFIED', 6, 'Citizen inspected the road and confirmed clean access. Rated 5 stars.', DATE_SUB(NOW(), INTERVAL 24 HOUR)),

-- History for CMP-2026-00106
(6, NULL, 'REPORTED', 7, 'Storm drain overflow report filed.', DATE_SUB(NOW(), INTERVAL 6 DAY)),
(6, 'REPORTED', 'ASSIGNED', 1, 'Assigned to Water and Drainage.', DATE_SUB(NOW(), INTERVAL 5 DAY)),
(6, 'ASSIGNED', 'IN_PROGRESS', 4, 'Hydro-jetting unit deployed.', DATE_SUB(NOW(), INTERVAL 4 DAY)),
(6, 'IN_PROGRESS', 'RESOLVED', 4, 'Silt block removed and flow restored.', DATE_SUB(NOW(), INTERVAL 4 DAY)),
(6, 'RESOLVED', 'VERIFIED', 7, 'Citizen confirmed water drains normally.', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(6, 'VERIFIED', 'CLOSED', 1, 'Automatic closure window expired; audit record locked.', DATE_SUB(NOW(), INTERVAL 3 DAY)),

-- History for CMP-2026-00107
(7, NULL, 'REPORTED', 5, 'Pothole complaint initially submitted.', DATE_SUB(NOW(), INTERVAL 4 DAY)),
(7, 'REPORTED', 'ASSIGNED', 1, 'Assigned to PWD team.', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(7, 'ASSIGNED', 'IN_PROGRESS', 2, 'Cold-mix asphalt patch applied.', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(7, 'IN_PROGRESS', 'RESOLVED', 2, 'Officer marked repair as finished.', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(7, 'RESOLVED', 'REOPENED', 5, 'Citizen rejected resolution: Gravel was washed out within 12 hours. Proper hot-mix asphalt required.', DATE_SUB(NOW(), INTERVAL 12 HOUR)),

-- History for CMP-2026-00108
(8, NULL, 'REPORTED', 6, 'Complaint submitted via citizen portal.', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(8, 'REPORTED', 'REJECTED', 1, 'Rejected by municipal authority: Boundary wall is on private property and outside municipal charter.', DATE_SUB(NOW(), INTERVAL 2 DAY));

-- -----------------------------------------------------------------------------
-- 9. SEED TASKS
-- -----------------------------------------------------------------------------
INSERT INTO `tasks` (`id`, `complaint_id`, `field_worker_id`, `assigned_by_officer_id`, `title`, `description`, `status`, `due_date`) VALUES
(1, 3, 2, 2, 'Market Dumpster Evacuation & Disinfection', 'Empty commercial container, clear surrounding littered plastics, and spray lime disinfectant.', 'IN_PROGRESS', CURDATE()),
(2, 4, 3, 3, 'Collar Joint Clamp Installation', 'Excavate 1.2m trench, drain residual water, install mechanical repair clamp, and verify pressure.', 'COMPLETED', DATE_SUB(CURDATE(), INTERVAL 1 DAY)),
(3, 7, 1, 1, 'Re-patching with Hot Mix Asphalt & Compaction', 'Clear loose debris from CMP-2026-00107, apply tack coat, lay dense bituminous macadam, and compact with vibratory roller.', 'PENDING', DATE_ADD(CURDATE(), INTERVAL 1 DAY));

-- -----------------------------------------------------------------------------
-- 10. SEED SERVICE CATEGORIES
-- -----------------------------------------------------------------------------
INSERT INTO `service_categories` (`id`, `department_id`, `name`, `description`, `estimated_days`, `fee`, `is_active`) VALUES
(1, 3, 'Emergency Potable Water Tanker (6,000L)', 'Direct delivery of municipal treated drinking water tanker to residential society or event.', 1, 350.00, TRUE),
(2, 2, 'Special Bulk Debris & Construction Waste Removal', 'Scheduled doorstep pickup of post-renovation rubble, old furniture, or dry tree logs.', 3, 500.00, TRUE),
(3, 5, 'Roadside Shade Tree Pruning & Canopy Shaping', 'Professional arborist pruning for trees obscuring rooftop solar panels or wall lines.', 5, 0.00, TRUE),
(4, 6, 'Residential Vector Fogging & Larvicide Spray', 'Targeted cold-fogging treatment for apartment complexes with dengue/chikungunya clusters.', 2, 0.00, TRUE),
(5, 1, 'Emergency Asphalt Pothole Patching & Trench Restoration', 'Rapid deployment of asphalt hot-mix crew and roller for deep vehicular craters, trenches, and damaged roadway sections.', 2, 0.00, TRUE);

-- -----------------------------------------------------------------------------
-- 11. SEED SERVICE REQUESTS
-- -----------------------------------------------------------------------------
INSERT INTO `service_requests` (`id`, `request_code`, `citizen_id`, `service_category_id`, `department_id`, `assigned_officer_id`, `details`, `address`, `ward_no`, `preferred_slot`, `status`) VALUES
(1, 'SRQ-2026-0001', 5, 1, 3, 3, 'Underground water pump burned out; request emergency 6,000-liter tanker for residential tower.', 'Greenfield Apartments, Sector 15', 'Ward-12', 'Morning (8 AM - 11 AM)', 'APPROVED'),
(2, 'SRQ-2026-0002', 6, 2, 2, 2, 'Kitchen renovation debris (approx 10 bags of tiles and mortar) stacked neatly in private driveway.', 'House 18, Gulmohar Marg', 'Ward-08', 'Weekend Slot (Saturday)', 'SUBMITTED');

-- -----------------------------------------------------------------------------
-- 12. SEED ANNOUNCEMENTS
-- -----------------------------------------------------------------------------
INSERT INTO `announcements` (`id`, `author_id`, `title`, `content`, `category`, `is_published`) VALUES
(1, 1, 'Launch of the Smart City 24/7 Citizen Redressal Portal', 
 'The Municipal Corporation is pleased to launch the unified Smart City Service Portal. Citizens can now log issues with GPS coordinates, track their complaints in real-time, and hold departments accountable through verified satisfaction ratings.', 
 'GOVERNANCE', TRUE),
(2, 1, 'City-Wide Pre-Monsoon Drainage Cleaning Drive Starting Oct 1', 
 'Sanitation and PWD crews will be conducting intensive silt extraction across all 24 wards. Citizens are requested not to dump construction rubble into open roadside canals.', 
 'ENVIRONMENT', TRUE),
(3, 1, 'Ward 12 Drinking Water Pipe Maintenance Schedule', 
 'Routine booster pump maintenance will take place this Thursday from 10:00 PM to 4:00 AM in Ward 12. Water supply pressure will resume to normal by 6:00 AM.', 
 'UTILITY', TRUE);

-- -----------------------------------------------------------------------------
-- 13. SEED EMERGENCY ALERTS
-- -----------------------------------------------------------------------------
INSERT INTO `emergency_alerts` (`id`, `author_id`, `title`, `severity`, `target_ward`, `message`, `action_instructions`, `is_active`, `expires_at`) VALUES
(1, 1, 'Flash Flood Warning: Low-Lying Sectors along Western Riverbank', 
 'CRITICAL', 'Ward-15', 
 'Continuous rainfall upstream has raised water levels in the canal. Water accumulation expected in basement parking lots along Riverbank Road.', 
 'Move vehicles to elevated municipal parking lots. In case of water ingress, dial Municipal Control Room at 1800-11-2026 immediately.', 
 TRUE, DATE_ADD(NOW(), INTERVAL 24 HOUR)),
(2, 1, 'High-Voltage Cable Repair: Traffic Diversion on Gulmohar Marg', 
 'WARNING', 'Ward-08', 
 'Underground electric cable overhaul between Metro Pillar 38 and 46. Northbound carriageway closed to heavy vehicles.', 
 'Use Outer Ring Road diversion. Expect 15-minute delays during evening peak hours.', 
 TRUE, DATE_ADD(NOW(), INTERVAL 12 HOUR));

-- -----------------------------------------------------------------------------
-- 14. SEED NOTIFICATIONS
-- -----------------------------------------------------------------------------
INSERT INTO `notifications` (`user_id`, `title`, `message`, `type`, `entity_type`, `entity_id`, `is_read`) VALUES
(5, 'Complaint Assigned', 'Your complaint CMP-2026-00101 (Severe Pothole Cluster) has been received and queued for zonal review.', 'INFO', 'COMPLAINT', 1, FALSE),
(6, 'Work Verified', 'Complaint CMP-2026-00105 has been marked as VERIFIED. Thank you for your valuable feedback!', 'SUCCESS', 'COMPLAINT', 5, TRUE),
(2, 'New Complaint Assigned', 'Complaint CMP-2026-00107 (Pothole re-patching) has been reopened by citizen. Requires immediate inspection.', 'WARNING', 'COMPLAINT', 7, FALSE);

-- -----------------------------------------------------------------------------
-- 15. SEED FEEDBACK
-- -----------------------------------------------------------------------------
INSERT INTO `feedback` (`complaint_id`, `citizen_id`, `rating`, `comments`, `satisfaction_level`) VALUES
(5, 6, 5, 'Outstanding response time! The horticulture crew arrived within 2 hours and cleared the heavy tree branches before school hours.', 'EXCELLENT');

-- -----------------------------------------------------------------------------
-- 16. SEED AUDIT LOGS
-- -----------------------------------------------------------------------------
INSERT INTO `audit_logs` (`user_id`, `action`, `entity_type`, `entity_id`, `details`, `ip_address`) VALUES
(1, 'DATABASE_INITIALIZATION', 'SYSTEM', NULL, '{"version": "2.0.0", "event": "Full schema migration and seed data loaded"}', '127.0.0.1'),
(1, 'EMERGENCY_ALERT_PUBLISHED', 'EMERGENCY_ALERT', 1, '{"alert_title": "Flash Flood Warning", "target_ward": "Ward-15", "severity": "CRITICAL"}', '127.0.0.1'),
(5, 'COMPLAINT_REOPENED', 'COMPLAINT', 7, '{"previous_status": "RESOLVED", "reason": "Cold asphalt patch eroded in rain"}', '127.0.0.1'),
(1, 'COMPLAINT_REJECTED', 'COMPLAINT', 8, '{"previous_status": "REPORTED", "reason": "Outside municipal jurisdiction"}', '127.0.0.1');
