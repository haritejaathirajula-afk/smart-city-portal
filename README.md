# 🏙️ Smart City Service Portal

> A full-stack, enterprise-grade civic technology web application built for Software Engineering, Relational Database Design, and System Architecture demonstration.

---

## 📌 1. Project Overview

The **Smart City Service Portal** is a centralized platform for municipal governance and civic engagement:
- **Citizens** report civic problems (potholes, garbage, pipeline bursts, broken streetlights), book scheduled utility services (water tankers, debris clearance, pest fogging), track grievance resolution timelines, view emergency broadcasts, and submit post-resolution ratings.
- **Municipal Officers** manage department-scoped grievance queues, dispatch field crews, record progress notes with proof photos, and mark tickets as resolved.
- **City Administrators** govern system-wide KPIs, manage users and roles, configure municipal departments and SLA hours, triage cross-departmental complaints, and inspect security audit logs.

---

## 🛠️ 2. Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router v6, Axios, Lucide React Icons.
- **Backend**: Node.js, Express.js (REST API Architecture), JWT (JSON Web Tokens), bcryptjs, Helmet, CORS.
- **Database**: MySQL 8.0 (16 Normalized Relational Tables, Foreign Key Constraints, Status History, Full Indexes).
- **Testing**: Jest, Supertest (17 Automated Test Suites, 284 Unit, Integration, Security, Role & UI Tests).
- **Deployment**: Docker Multi-Stage Build, Docker Compose, PM2 Process Manager, Static SPA Serving.

---

## 🏗️ 3. Relational Database Architecture

The system features **16 normalized MySQL tables**:

```
 ┌─────────────┐        ┌─────────────┐        ┌─────────────┐
 │    roles    │───────<│    users    │───────<│   officers  │
 └─────────────┘        └─────────────┘        └─────────────┘
                               │                      │
                               │                      │
 ┌──────────────────────┐      │               ┌─────────────┐
 │  complaint_categories│<─────┼──────────────>│ departments │
 └──────────────────────┘      │               └─────────────┘
            │                  │                      │
            │                  ▼                      ▼
            │           ┌─────────────┐        ┌─────────────┐
            └──────────<│ complaints  │───────<│field_workers│
                        └─────────────┘        └─────────────┘
                               │                      │
                               ▼                      ▼
                        ┌─────────────┐        ┌─────────────┐
                        │status_hist. │        │    tasks    │
                        └─────────────┘        └─────────────┘
```

1. `roles`: Role definitions (`citizen`, `officer`, `admin`).
2. `departments`: Municipal wings (`PWD`, `SWM`, `WSS`, `ELE`, `PRK`, `HLT`).
3. `users`: Citizen and staff accounts with hashed passwords and contact data.
4. `officers`: Extended municipal officer profiles with department and badge ID.
5. `field_workers`: On-ground technicians with assigned skills and wards.
6. `complaint_categories`: Category catalog with default SLA resolution hours.
7. `complaints`: Primary grievance records with GPS coordinates and tracking code.
8. `complaint_status_history`: Tamper-evident audit trail of all lifecycle status changes.
9. `tasks`: Work orders dispatched to field crews.
10. `service_categories`: Catalog of municipal utility services.
11. `service_requests`: Booked municipal services with preferred time slots.
12. `announcements`: Public civic notices with category filters.
13. `emergency_alerts`: High-visibility emergency broadcast alerts.
14. `notifications`: Real-time user alert records.
15. `feedback`: 1-5 star ratings and post-resolution citizen reviews.
16. `audit_logs`: Administrative actions log with IP addresses and JSON payloads.

---

## 🔄 4. Mandated Grievance Lifecycle

Every complaint strictly transitions through the verified civic lifecycle:

```
[REPORTED] ──> [ASSIGNED] ──> [IN_PROGRESS] ──> [RESOLVED]
                                                    │
                   ┌────────────────────────────────┴────────────────┐
                   ▼                                                 ▼
             [VERIFIED]                                         [REOPENED]
                 │                                                   │
                 ▼                                                   ▼
              [CLOSED]                                       (Re-investigated)
```

Every transition automatically records responsible user, previous and new status, and timestamp in `complaint_status_history`.

---

## 🔑 5. Demo Credentials (1-Click Demo Login Available)

| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **City Administrator** | `admin@smartcity.gov` | `Admin@123` | Global Analytics, User & Dept Management, Global Triage, Audit Logs |
| **Municipal Officer** | `officer.roads@smartcity.gov` | `Officer@123` | Department Queue (PWD), Field Worker Dispatch, Status Updates |
| **Sanitation Officer** | `officer.waste@smartcity.gov` | `Officer@123` | Department Queue (SWM), Sanitation Crew Management |
| **Citizen / Resident** | `citizen@smartcity.gov` | `Citizen@123` | Grievance Filing, Service Booking, Tracking, Feedback Rating |

---

## 🚀 6. Setup & Running Instructions

### Prerequisites
- Node.js (v18 or higher)
- npm
- MySQL (Optional: app includes seamless offline demo resilience)

### Step 1: Clone and Install Dependencies
```bash
# Install root dependencies
npm install

# Install server dependencies
cd server && npm install && cd ..

# Install client dependencies
cd client && npm install && cd ..
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env` in the root (or `server/.env`):
```ini
PORT=5000
NODE_ENV=development
JWT_SECRET=smartcity_super_secret_jwt_key_2026
JWT_EXPIRES_IN=7d

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=smart_city_db
```

### Step 3: Initialize Database (When MySQL is Running)
```bash
npm run db:setup
```

### Step 4: Run Application
```bash
# Run both Backend and Frontend concurrently (Local Development)
npm run dev

# Or run individually:
npm run dev:server    # Backend API at http://localhost:5000
npm run dev:client    # Frontend UI at http://localhost:5173
```

### Step 5: Run Across ANY Network (Mobile 4G/5G, Laptop, Remote) 🌐
Access the portal from mobile phones and laptops anywhere in the world, regardless of network or Wi-Fi differences:

```bash
# 1-Click Multi-Network Launcher (Generates live public HTTPS URL + Scannable QR Code)
npm run tunnel

# Or double-click the Windows batch file:
start-network-portal.bat
```

1. **On Any Mobile Phone (4G/5G/Wi-Fi)**:
   - Scan the terminal QR code with your phone camera or visit the generated `https://xxxx.loca.lt` URL in your mobile browser.
   - If prompted for a tunnel password, enter your machine public IP shown in the console.
2. **On the Android Native App (Capacitor)**:
   - Open the app on your phone.
   - Tap **"Server: Standby"** in the top bar or open the hamburger menu $\rightarrow$ **"Network & Server Setup"**.
   - Paste the public tunnel URL (`https://xxxx.loca.lt/api`), tap **"Test Connection"**, and click **"Save & Apply"**. No rebuild required!
3. **On Any Laptop/Desktop**:
   - Open `https://xxxx.loca.lt` in Chrome, Edge, Safari, or Firefox from any network.

---

## 🧪 7. Automated Test Suite

Run the full automated test suite (17 test suites, 284 tests):
```bash
npm run test:server
```

Test coverage includes:
- ✅ End-to-End Multi-Persona Civic Grievance, Service, Alert, Map & SLA Lifecycle (`tests/integration.test.js` - 24 tests)
- ✅ Security Hardening: SQL Injection Mitigation, XSS Sanitation, JWT Attacks & Header Checks (`tests/security.test.js` - 24 tests)
- ✅ Exhaustive RBAC Matrix: Anonymous, Citizen, Officer & Administrator (`tests/role.test.js` - 26 tests)
- ✅ Frontend SPA Delivery, Fallback Routing, 404 Isolation & Production Assets (`tests/ui.test.js` - 11 tests)
- ✅ RBAC Authentication & JWT Authorization (`tests/auth.test.js` - 21 tests)
- ✅ Citizen Dashboard, Notifications & Status API (`tests/citizen.test.js` - 14 tests)
- ✅ Grievance Reporting, Multer Image Upload & Tracking Code (`tests/complaint.test.js` - 9 tests)
- ✅ Grievance Tracking, Search, Filters, Verification & Reopening Lifecycle (`tests/tracking.test.js` - 17 tests)
- ✅ Officer Queue, Ticket Ownership Assignment, Field Worker Task Dispatch & Resolution Proof (`tests/officer.test.js` - 15 tests)
- ✅ Administrator Governance, User Accounts, Role Promotions, Department & Category SLAs, Global Grievance Triage & Audit Trail (`tests/admin.test.js` - 16 tests)
- ✅ Municipal Service Catalog, Booking Flow (`SRV-YYYY-XXXXX`), Department Jurisdiction, Approval/Rejection & Cancellation Lifecycle (`tests/service.test.js` - 25 tests)
- ✅ Public Civic Announcements, Emergency Broadcasts, Automatic Expiry Filtering, and In-App Notifications with Read Status (`tests/announcement.test.js` - 28 tests)
- ✅ Citizen Feedback, 5-Star Ratings, Duplicate Prevention (409 Conflict), My Reviews & Satisfaction Index (`tests/feedback.test.js` - 22 tests)
- ✅ Geospatial GIS Map Markers, Multi-Parameter Filters, Interactive Popups, Officer Jurisdiction View & Ward Density Heatmap (`tests/map.test.js` - 14 tests)
- ✅ Citywide Empirical Analytics, Monthly Trajectory Area Charts, Department SLA Benchmarks, Donut Breakdown & CSV/JSON Reports (`tests/analytics.test.js` - 10 tests)
- ✅ Database Schema, Foreign Key Constraints & Seed Integrity (`tests/db.test.js` - 16 tests)
- ✅ System Health & Database Resilience Checks (`tests/health.test.js` - 2 tests)

---

## 🚀 8. Production Deployment

### Option A: 1-Click Deployment Script
- **Windows**: Double-click [`scripts/deploy.bat`](file:///C:/Users/harit/OneDrive/Documents/Desktop/city/scripts/deploy.bat)
- **Linux/macOS**: Execute `./scripts/deploy.sh`

### Option B: Docker Compose
```bash
# Launch unified stack with isolated MySQL 8.0 container
docker compose up --build -d

# Verify API health
curl http://localhost:5000/api/health
```

### Option C: Enterprise PM2 Cluster
```bash
pm2 start ecosystem.config.cjs --env production
```

Detailed deployment instructions and operational guidelines are available in [`DEPLOYMENT.md`](file:///C:/Users/harit/OneDrive/Documents/Desktop/city/DEPLOYMENT.md) and [`RELEASE_NOTES.md`](file:///C:/Users/harit/OneDrive/Documents/Desktop/city/RELEASE_NOTES.md).

---

## 📁 9. Project Structure

```
city/
├── client/                     # Frontend Application (React + Vite + Tailwind)
│   ├── src/
│   │   ├── components/common/  # Navbar, Footer, ProtectedRoute
│   │   ├── context/            # AuthContext (JWT state & demo logins)
│   │   ├── pages/
│   │   │   ├── admin/          # Admin Command Center (5 Tabs)
│   │   │   ├── alerts/         # Emergency Alerts & Announcements
│   │   │   ├── analytics/      # Grievance Trends, SLAs & CSV Export
│   │   │   ├── citizen/        # Citizen Dashboard, Report & Track
│   │   │   ├── feedback/       # Satisfaction Index & Ratings
│   │   │   ├── map/            # Interactive GIS City Map & Heatmap
│   │   │   ├── officer/        # Officer Terminal & Worker Dispatch
│   │   │   ├── services/       # Municipal Utility Services Catalog
│   │   │   ├── LandingPage.jsx
│   │   │   ├── LoginPage.jsx   # Includes 1-click Demo Logins
│   │   │   └── RegisterPage.jsx
│   │   ├── App.jsx             # Router Configuration
│   │   └── main.jsx
│   └── package.json
│
├── server/                     # Backend Application (Node.js + Express REST API)
│   ├── database/
│   │   ├── schema.sql          # 16 Relational MySQL Tables
│   │   └── seed.sql            # Realistic Seed Data
│   ├── src/
│   │   ├── config/             # DB connection pool & env configs
│   │   ├── controllers/        # 10 Controller Modules
│   │   ├── middleware/         # JWT Auth, Role Guards, Error Handlers
│   │   ├── routes/             # RESTful API Route Definitions
│   │   └── app.js
│   ├── tests/                  # 13 Automated Jest/Supertest Test Suites
│   ├── API_DOCS.md             # Complete REST API Documentation
│   └── package.json
│
├── package.json                # Root Monorepo Scripts
└── README.md                   # Project Documentation
```

---

## 👥 9. Authors & Academic Credits

- **Project**: Smart City Service Portal
- **Subject**: Software Engineering & System Architecture
- **Version**: 1.0.0 Production Release
