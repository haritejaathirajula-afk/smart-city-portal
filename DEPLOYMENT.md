# 🚀 Production Deployment & Operations Guide
## Smart City Service Portal — Version 1.0.0 Production Release

This guide details enterprise deployment strategies, containerization instructions, process management, database backups, and security hardening for the **Smart City Service Portal**.

---

## 📋 1. System Requirements

| Component | Minimum Specification | Recommended Specification |
| :--- | :--- | :--- |
| **Operating System** | Ubuntu 22.04 LTS / Windows Server 2022 | Ubuntu 24.04 LTS |
| **Node.js Runtime** | Node.js v18.17.0 LTS | Node.js v20.x or v22.x LTS |
| **Database** | MySQL 8.0+ | MySQL 8.0+ (InnoDB Engine) |
| **CPU / Memory** | 2 vCPU, 2 GB RAM | 4 vCPU, 8 GB RAM |
| **Disk Storage** | 10 GB SSD | 50 GB NVMe SSD |

---

## 🐳 2. Containerized Deployment (Docker & Docker Compose)

The portal includes a production multi-stage [`Dockerfile`](file:///C:/Users/harit/OneDrive/Documents/Desktop/city/Dockerfile) that builds the React client and serves it through the Node.js Express backend, and [`docker-compose.yml`](file:///C:/Users/harit/OneDrive/Documents/Desktop/city/docker-compose.yml) orchestrating MySQL 8.0 and the application.

### Step 1: Start Stack with Docker Compose
```bash
# Build images and start all services in detached mode
docker compose up --build -d

# Check live container health status
docker compose ps

# View container logs
docker compose logs -f server
```

### Step 2: Automated Health Verification
```bash
curl http://localhost:5000/api/health
```

### Step 3: Tear Down or Upgrade
```bash
# Stop containers while preserving database volume
docker compose down

# Stop containers and destroy database volume
docker compose down -v
```

---

## ⚡ 3. Enterprise Process Management (PM2)

For virtual machines or bare-metal instances, PM2 provides cluster load balancing, automatic restarts, and log rotation:

### Step 1: Install Dependencies & Build Frontend
```bash
# Install PM2 globally
npm install -g pm2

# Install server production dependencies
cd server && npm install --omit=dev && cd ..

# Build frontend production bundle
cd client && npm install && npm run build && cd ..
```

### Step 2: Launch via Ecosystem File
```bash
# Start cluster using ecosystem.config.cjs
pm2 start ecosystem.config.cjs --env production

# Save process list for automatic reboot recovery
pm2 save
pm2 startup
```

### Step 3: PM2 Operational Commands
```bash
# View live cluster status
pm2 status

# Real-time dashboard monitor
pm2 monit

# Zero-downtime hot reload
pm2 reload ecosystem.config.cjs

# Tail error & output logs
pm2 logs smart-city-portal
```

---

## 🌐 4. Nginx Reverse Proxy & SSL/TLS Configuration

Place Nginx in front of port 5000 to manage SSL termination, HTTP/2, and gzip compression:

```nginx
# /etc/nginx/sites-available/smartcity.gov
server {
    listen 80;
    server_name smartcity.yourdomain.gov;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name smartcity.yourdomain.gov;

    # SSL Certificates (e.g. Let's Encrypt / Certbot)
    ssl_certificate /etc/letsencrypt/live/smartcity.yourdomain.gov/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/smartcity.yourdomain.gov/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Client body upload limit for photo proofs (5MB)
    client_max_body_size 10M;

    # Static uploads caching
    location /uploads/ {
        alias /app/server/uploads/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # Proxy all traffic to Node.js backend
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🔐 5. Production Environment Variables Reference

Configure `.env` in the root directory (or `/server/.env`):

```ini
# Application Server
NODE_ENV=production
PORT=5000
CLIENT_URL=https://smartcity.yourdomain.gov

# JWT Authentication
JWT_SECRET=super_strong_cryptographic_random_string_min_32_chars
JWT_EXPIRES_IN=7d

# MySQL Relational Database
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=smartcity_app
DB_PASSWORD=SecurePassword_2026!
DB_NAME=smart_city_db
DB_CONNECTION_LIMIT=20
DB_WAIT_FOR_CONNECTIONS=true
DB_QUEUE_LIMIT=0

# Storage Limits
UPLOAD_DIR=uploads
MAX_FILE_SIZE_BYTES=5242880
```

---

## 💾 6. Database Backup & Disaster Recovery

### Manual Backup
```bash
# Export complete schema and data with timestamp
mysqldump -u root -p smart_city_db > backup_smart_city_$(date +%Y%m%d_%H%M%S).sql
```

### Automated Nightly Backup Cron (Linux)
Add to `crontab -e`:
```bash
0 2 * * * mysqldump -u root -pYourPassword smart_city_db | gzip > /backups/db/smart_city_$(date +\%Y\%m\%d).sql.gz
```

### Database Restoration
```bash
# Restore from backup file
mysql -u root -p smart_city_db < backup_smart_city_20261102.sql
```

---

## 🛡️ 7. Security Hardening Checklist

- [x] **Parameterized Queries**: All SQL statements utilize `mysql2` placeholders (`?`) to prevent SQL injection.
- [x] **Helmet Security Headers**: `X-Content-Type-Options: nosniff` and `X-Download-Options: noopen` configured.
- [x] **Bcrypt Password Hashing**: Passwords stored as salted bcrypt hashes ($10$ rounds).
- [x] **Strict RBAC Enforcement**: Matrix testing validates role isolation across Citizen, Officer, and Admin tiers.
- [x] **File Upload Whitelist**: Only `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif` under 5MB permitted.
- [x] **Tamper-Evident History**: All grievance transitions logged with timestamp, user ID, and remarks.
- [x] **Non-Root Execution**: Docker container runs with unprivileged user permissions.

