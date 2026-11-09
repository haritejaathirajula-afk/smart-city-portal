/**
 * Smart City Service Portal - Smart Server Launcher
 * 
 * Ensures database is reachable, backend server is running,
 * displays prominent access links (Local & Wi-Fi LAN),
 * copies the URL to clipboard, and opens the default browser.
 */

const http = require('http');
const { spawn, exec } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');
let qrcode = null;
try {
  qrcode = require('qrcode-terminal');
} catch (e) {}

const PORT = process.env.PORT || 5000;
const SERVER_DIR = path.join(__dirname, '../server');
const CLIENT_DIR = path.join(__dirname, '../client');
const DIST_INDEX = path.join(CLIENT_DIR, 'dist/index.html');

let backendProcess = null;

// Helper: Check if backend server is responsive
function checkHealth(port) {
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

// Helper: Get local Wi-Fi / LAN IP addresses
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

// Helper: Open URL in default Windows browser
function openBrowser(url) {
  try {
    exec(`start "" "${url}"`);
  } catch (e) {
    // ignore
  }
}

// Helper: Copy URL to Windows clipboard
function copyToClipboard(text) {
  try {
    const proc = spawn('clip', { stdio: ['pipe', 'ignore', 'ignore'] });
    proc.stdin.write(text.trim());
    proc.stdin.end();
  } catch (e) {
    // ignore
  }
}

// Helper: Check if client is built, if not prompt or build
async function ensureClientBuilt() {
  if (!fs.existsSync(DIST_INDEX)) {
    console.log('\x1b[33m⚡ Frontend build not found. Building client once for optimal speed...\x1b[0m');
    await new Promise((resolve, reject) => {
      const buildProc = spawn('npm.cmd', ['run', 'build'], {
        cwd: CLIENT_DIR,
        stdio: 'inherit',
        shell: true
      });
      buildProc.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Frontend build exited with code ${code}`));
      });
    });
  }
}

// Helper: Start backend server process
async function startBackend() {
  const isAlreadyRunning = await checkHealth(PORT);
  if (isAlreadyRunning) {
    return { alreadyRunning: true };
  }

  const serverScript = path.join(SERVER_DIR, 'src/server.js');
  backendProcess = spawn(process.execPath, [serverScript], {
    cwd: SERVER_DIR,
    stdio: 'inherit',
    env: { ...process.env, PORT: String(PORT) }
  });

  backendProcess.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`\x1b[31mServer process exited with code ${code}\x1b[0m`);
    }
  });

  // Wait for health check to pass
  for (let i = 0; i < 25; i++) {
    await new Promise((r) => setTimeout(r, 600));
    if (await checkHealth(PORT)) {
      return { alreadyRunning: false };
    }
  }

  return { alreadyRunning: false };
}

// Display banner with all accessible links
function printBanner() {
  const localUrl = `http://localhost:${PORT}`;
  const lanIps = getLanIps();

  console.log('\n\x1b[1m\x1b[36m=====================================================================\x1b[0m');
  console.log('\x1b[1m\x1b[32m       🏙️   SMART CITY SERVICE PORTAL - SERVER IS ONLINE           \x1b[0m');
  console.log('\x1b[1m\x1b[36m=====================================================================\x1b[0m\n');

  console.log('\x1b[1m\x1b[37m💻 LOCAL LINK (This PC):\x1b[0m');
  console.log(`   👉 \x1b[1m\x1b[32m\x1b[4m${localUrl}\x1b[0m  \x1b[90m(Opening in browser & copied to clipboard)\x1b[0m\n`);

  if (lanIps.length > 0) {
    const primaryMobile = lanIps.find(i => /wi-fi|wlan|wireless/i.test(i.name)) || lanIps[0];
    const mobileUrl = `http://${primaryMobile.ip}:${PORT}`;

    console.log('\x1b[1m\x1b[33m📱 SCAN WITH YOUR PHONE TO OPEN ON MOBILE (Same Wi-Fi / Hotspot):\x1b[0m');
    if (qrcode) {
      qrcode.generate(mobileUrl, { small: true });
    }
    lanIps.forEach(({ name, ip }) => {
      console.log(`   👉 \x1b[1m\x1b[33m\x1b[4mhttp://${ip}:${PORT}\x1b[0m  \x1b[90m[${name}]\x1b[0m`);
    });
    console.log('');
  }

  console.log('\x1b[1m\x1b[34m🏥 BACKEND API HEALTH CHECK:\x1b[0m');
  console.log(`   👉 \x1b[34m${localUrl}/api/health\x1b[0m\n`);

  console.log('\x1b[1m\x1b[35m🌐 NEED CELLULAR / WORLDWIDE INTERNET ACCESS (4G/5G)?\x1b[0m');
  console.log('   👉 Run \x1b[1mstart-network-portal.bat\x1b[0m or type \x1b[1m"t"\x1b[0m to start public tunnel.\n');

  console.log('\x1b[90m---------------------------------------------------------------------');
  console.log('• Press [O] to reopen browser | [T] to launch public tunnel | [Ctrl+C] to stop');
  console.log('---------------------------------------------------------------------\x1b[0m\n');
}

// Setup keyboard shortcuts in console
function setupKeyboardInput() {
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    process.stdin.on('data', (key) => {
      if (key === '\u0003') { // Ctrl+C
        shutdown();
      } else if (key.toLowerCase() === 'o') {
        console.log('\x1b[36mOpening http://localhost:' + PORT + ' in browser...\x1b[0m');
        openBrowser(`http://localhost:${PORT}`);
      } else if (key.toLowerCase() === 't') {
        console.log('\x1b[35mSwitching to Multi-Network Public Tunnel...\x1b[0m');
        require('./start-tunnel');
      }
    });
  }
}

// Graceful shutdown
function shutdown() {
  console.log('\n\x1b[33mStopping server...\x1b[0m');
  if (backendProcess) {
    try { backendProcess.kill(); } catch (e) {}
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

async function main() {
  try {
    await ensureClientBuilt();
    console.log('\x1b[36m⏳ Verifying and starting backend server...\x1b[0m');
    const { alreadyRunning } = await startBackend();
    
    const localUrl = `http://localhost:${PORT}`;
    copyToClipboard(localUrl);
    openBrowser(localUrl);

    printBanner();
    setupKeyboardInput();

    if (alreadyRunning) {
      console.log('\x1b[32m✔ Server is running and listening. Log stream active.\x1b[0m\n');
    }
  } catch (err) {
    console.error('\x1b[31mError launching portal:\x1b[0m', err.message);
  }
}

main();
