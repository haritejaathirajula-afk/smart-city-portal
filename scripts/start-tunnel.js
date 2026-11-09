/**
 * Smart City Service Portal - Multi-Network Public Tunnel
 * 
 * Provides an instant, secure public HTTPS tunnel accessible from ANY network worldwide:
 * - Mobile phones on cellular data (4G/5G) or outside Wi-Fi
 * - Laptop and desktop browsers anywhere
 * - Native Android APK (Capacitor)
 */

const http = require('http');
const { spawn } = require('child_process');
const path = require('path');
const os = require('os');
const localtunnel = require('localtunnel');
const qrcode = require('qrcode-terminal');

const PORT = process.env.PORT || 5000;
let backendProcess = null;
let activeTunnel = null;

// Helper: check if server on port is already listening
function isPortOpen(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/api/health`, (res) => {
      resolve(res.statusCode >= 200 && res.statusCode < 400);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Helper: get local LAN IP addresses
function getLanIps() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push({ name, ip: iface.address });
      }
    }
  }
  return ips;
}

// Helper: fetch host public IP (used by localtunnel password screen if shown)
async function fetchPublicIp() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch('https://api.ipify.org', { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      return (await res.text()).trim();
    }
  } catch (e) {
    // ignore
  }
  return null;
}

// Start backend server if not already running
async function ensureBackendRunning() {
  const isRunning = await isPortOpen(PORT);
  if (isRunning) {
    console.log(`\x1b[32m✔ Backend server is already running on port ${PORT}\x1b[0m`);
    return;
  }

  console.log(`\x1b[36m⏳ Starting backend server on port ${PORT}...\x1b[0m`);
  const serverScript = path.join(__dirname, '../server/src/server.js');
  
  backendProcess = spawn(process.execPath, [serverScript], {
    cwd: path.join(__dirname, '../server'),
    stdio: 'inherit',
    env: { ...process.env, PORT: String(PORT) }
  });

  // Wait for health check to pass
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    if (await isPortOpen(PORT)) {
      console.log(`\x1b[32m✔ Backend server started successfully!\x1b[0m\n`);
      return;
    }
  }
  console.warn(`\x1b[33m⚠ Backend server launched, proceeding to tunnel...\x1b[0m`);
}

// Establish tunnel
async function launchTunnel() {
  console.log(`\x1b[36m⏳ Connecting secure multi-network tunnel on port ${PORT}...\x1b[0m`);

  const lanIps = getLanIps();
  const publicIp = await fetchPublicIp();

  try {
    const tunnel = await localtunnel({
      port: PORT,
      allow_invalid_cert: true
    });
    activeTunnel = tunnel;

    const publicUrl = tunnel.url;
    const apiUrl = `${publicUrl}/api`;

    console.clear();
    console.log(`\x1b[1m\x1b[32m=================================================================\x1b[0m`);
    console.log(`\x1b[1m\x1b[32m    🏙️  SMART CITY SERVICE PORTAL - MULTI-NETWORK TUNNEL LIVE   \x1b[0m`);
    console.log(`\x1b[1m\x1b[32m=================================================================\x1b[0m\n`);

    console.log(`\x1b[1m\x1b[33m📱 SCAN WITH YOUR PHONE CAMERA TO OPEN ON ANY NETWORK (4G/5G/Wi-Fi):\x1b[0m`);
    qrcode.generate(publicUrl, { small: true });

    console.log(`\n\x1b[1m\x1b[36m🌐 PUBLIC WEB & MOBILE URL:\x1b[0m`);
    console.log(`   👉 \x1b[4m\x1b[32m${publicUrl}\x1b[0m`);
    console.log(`   (Open this on ANY laptop, iPhone, or Android phone worldwide)\n`);

    console.log(`\x1b[1m\x1b[36m🔌 BACKEND API ENDPOINT:\x1b[0m`);
    console.log(`   👉 \x1b[32m${apiUrl}\x1b[0m`);
    console.log(`   (In Android app, tap "Server: Standby" in navbar and paste this URL)\n`);

    if (publicIp) {
      console.log(`\x1b[1m\x1b[33m🔑 Tunnel Verification Password (if prompted in browser):\x1b[0m`);
      console.log(`   👉 \x1b[1m${publicIp}\x1b[0m (Your machine public IP)\n`);
    }

    if (lanIps.length > 0) {
      console.log(`\x1b[37m🏡 Same Wi-Fi Alternative:\x1b[0m`);
      lanIps.forEach(({ name, ip }) => {
        console.log(`   - ${name}: http://${ip}:${PORT}`);
      });
      console.log('');
    }

    console.log(`\x1b[90m-----------------------------------------------------------------`);
    console.log(`• Press Ctrl+C anytime to close tunnel and stop.`);
    console.log(`-----------------------------------------------------------------\x1b[0m\n`);

    tunnel.on('close', () => {
      console.log('\x1b[31mTunnel connection closed. Reconnecting...\x1b[0m');
      setTimeout(launchTunnel, 3000);
    });

    tunnel.on('error', (err) => {
      console.error('\x1b[31mTunnel encountered an error:\x1b[0m', err.message);
    });

  } catch (err) {
    console.error('\x1b[31mFailed to start tunnel:\x1b[0m', err.message);
    console.log('Retrying in 5 seconds...');
    setTimeout(launchTunnel, 5000);
  }
}

// Cleanup on exit
function shutdown() {
  console.log('\n\x1b[33mShutting down tunnel and server...\x1b[0m');
  if (activeTunnel) {
    try { activeTunnel.close(); } catch (e) {}
  }
  if (backendProcess) {
    try { backendProcess.kill(); } catch (e) {}
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

async function main() {
  await ensureBackendRunning();
  await launchTunnel();
}

main();
