# Smart City Service Portal - REST API Documentation

Comprehensive RESTful API specification for the **Smart City Service Portal**.

- **Base URL**: `http://localhost:5000/api`
- **Authentication Header**: `Authorization: Bearer <JWT_TOKEN>`
- **Content-Type**: `application/json`

---

## 1. System Health & Metadata

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Public | System uptime, memory metrics, and MySQL database connection status. |
| `GET` | `/` | Public | Root API directory and service metadata. |

---

## 2. Authentication & User Profile (`/auth`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Public | Register a new citizen account (`name`, `email`, `password`, `phone`, `ward_no`, `address`). |
| `POST` | `/auth/login` | Public | Authenticate user and receive JWT access token. |
| `GET` | `/auth/me` | Authenticated | Retrieve current user profile and role details. |
| `PUT` | `/auth/profile` | Authenticated | Update user contact info, ward number, and address. |
| `PUT` | `/auth/change-password` | Authenticated | Change user account password. |

---

## 3. Citizen Portal (`/citizen`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/citizen/dashboard` | Citizen / Admin | Citizen summary metrics, recent grievances, alerts, and service requests. |

---

## 4. Grievance Management (`/complaints`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/complaints/meta` | Public | Active departments and category metadata with default SLAs. |
| `POST` | `/complaints` | Citizen / Admin | File a grievance (`title`, `description`, `category_id`, `priority`, `address`, `ward_no`). Generates `CMP-YYYY-XXXXX`. |
| `GET` | `/complaints` | Authenticated | List complaints (scoped by citizen/officer/admin role). |
| `GET` | `/complaints/:idOrCode`| Authenticated | Detailed complaint profile with 6-stage lifecycle progress and audit timeline. |
| `POST` | `/complaints/:id/verify`| Citizen / Admin | Citizen confirms resolution (`RESOLVED → VERIFIED`) and submits rating. |
| `POST` | `/complaints/:id/reopen`| Citizen / Admin | Citizen rejects unsatisfactory resolution (`RESOLVED → REOPENED`). |

---

## 5. Municipal Officer Terminal (`/officer`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/officer/dashboard` | Officer / Admin | Department-scoped grievance queue, KPIs, and field worker roster. |
| `GET` | `/officer/field-workers` | Officer / Admin | Available field technicians in the officer's department. |
| `POST` | `/officer/tasks` | Officer / Admin | Dispatch field worker for a ticket and update status to `IN_PROGRESS`. |
| `PATCH` | `/officer/complaints/:id/status` | Officer / Admin | Transition status (`ASSIGNED`, `IN_PROGRESS`, `RESOLVED`) with progress notes and photo proof. |

---

## 6. City Administrator Console (`/admin`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/admin/stats` | Admin | City-wide KPIs, resolution rate, and departmental workload breakdown. |
| `GET` | `/admin/users` | Admin | Searchable list of registered users and officer profiles. |
| `PATCH` | `/admin/users/:id/role` | Admin | Change user role (`citizen`, `officer`, `admin`) and configure officer credentials. |
| `PATCH` | `/admin/users/:id/status` | Admin | Toggle account active/disabled state. |
| `GET` | `/admin/departments` | Admin | List all municipal wings with active ticket counts. |
| `POST` | `/admin/departments` | Admin | Create a new municipal department. |
| `PUT` | `/admin/departments/:id`| Admin | Update department contact info and head officer. |
| `GET` | `/admin/categories` | Admin | List complaint categories with SLA hour limits. |
| `POST` | `/admin/categories` | Admin | Create a new complaint category under a department. |
| `PUT` | `/admin/categories/:id` | Admin | Update category SLA hours and default priority. |
| `GET` | `/admin/complaints` | Admin | Cross-department master grievance triage. |
| `PATCH` | `/admin/complaints/:id/reassign` | Admin | Reassign grievance to another department/officer. |
| `GET` | `/admin/audit-logs` | Admin | Chronological system security and administrative audit trail. |

---

## 7. Municipal Service Requests (`/services`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/services/catalog` | Public | Public utility catalog (Water Tanker, Bulk Waste, Pest Fogging, Tree Pruning, Septic Cleaning). |
| `POST` | `/services/requests` | Authenticated | Book a utility service with slot and address (`SRV-YYYY-XXXXX`). |
| `GET` | `/services/requests` | Authenticated | List service requests (scoped by role). |
| `GET` | `/services/requests/:idOrCode` | Authenticated | Lookup service request details. |
| `PATCH` | `/services/requests/:id/status` | Officer / Admin | Update request status (`APPROVED`, `IN_PROGRESS`, `COMPLETED`, `REJECTED`). |
| `PATCH` | `/services/requests/:id/cancel` | Authenticated | Cancel a pending service request. |

---

## 8. Emergency Alerts & Announcements (`/alerts`, `/announcements`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/announcements` | Public | Feed of published civic notices and announcements. |
| `POST` | `/announcements` | Officer / Admin | Publish a new public municipal notice. |
| `DELETE` | `/announcements/:id` | Officer / Admin | Delete an announcement. |
| `GET` | `/alerts` | Public | Live stream of active emergency alerts ordered by severity (`DISASTER` > `CRITICAL` > `WARNING` > `INFO`). |
| `POST` | `/alerts` | Officer / Admin | Broadcast an emergency alert to city/ward network. |
| `PATCH` | `/alerts/:id/deactivate`| Officer / Admin | Deactivate a resolved emergency alert. |

---

## 9. Citizen Feedback & Satisfaction (`/feedback`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/feedback` | Citizen / Admin | Submit 1-5 star rating and review for a resolved ticket. Strictly enforces duplicate prevention (returns 409 Conflict if review exists; permits update when `update: true`). Auto-promotes `RESOLVED` grievance to `VERIFIED`. |
| `GET` | `/feedback/summary` | Public | Overall average score, 5-star distribution, overall citizen approval rate, and department satisfaction leaderboard. |
| `GET` | `/feedback/recent` | Public | Stream of recent verified citizen reviews with optional `rating` and `department_id` filters. |
| `GET` | `/feedback/my` | Citizen | Retrieve all feedback entries submitted by the authenticated citizen. |
| `GET` | `/feedback/complaint/:id` | Authenticated | Retrieve feedback for a specific complaint by complaint ID or tracking code. |
| `PUT` | `/feedback/:id` | Author / Admin | Update existing rating (1-5), comments, and recalculated satisfaction level. |
| `DELETE` | `/feedback/:id` | Author / Admin | Delete feedback record with audit log trail. |

---

## 10. Analytics, SLA Intelligence & Export (`/analytics`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/analytics/kpis` | Public | Real-time citywide executive scorecard (total, active, resolved, resolution rate %, SLA compliance %, avg turnaround hours). |
| `GET` | `/analytics/trends` | Public | Monthly historical grievance trajectory (reported vs. resolved vs. in-progress) with optional `department_id` filter. |
| `GET` | `/analytics/sla` | Public | Department SLA compliance rates, average turnaround hours, and on-time vs. breached counters. |
| `GET` | `/analytics/categories` | Public | Category volume breakdown with empirical percentages and SLA standards. |
| `GET` | `/analytics/wards` | Public | Ward-wise grievance concentration, active counts, and resolution efficiency rates. |
| `GET` | `/analytics/export` | Authenticated / Public | Download complete grievance database in RFC-compliant CSV or structured JSON format with SLA status (`format=csv\|json`, optional filters). |

---

## 11. Geospatial City Map & Heatmap (`/map`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/map/complaints` | Public | Geospatial complaint markers with numeric coordinates (`latitude`, `longitude`), department name & code, priority, status, address, photo URL, and query filters (`department_id`, `department_code`, `priority`, `status`, `ward`, `search`, `bbox`). |
| `GET` | `/map/clusters` | Public | Ward cluster coordinates, active/resolved totals, emergency counts, and calculated density scores ($0\text{--}100$) for heatmapping. |
| `GET` | `/map/heatmap` | Public | Weighted coordinate points and top 3 ward hotspot rankings for client-side heatmap rasterization. |
| `GET` | `/map/officer-view` | Officer / Admin | Department-scoped jurisdiction map with complaints, active field worker GPS pins, availability statuses, and dispatch KPIs. |
