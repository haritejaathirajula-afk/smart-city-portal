import axios from 'axios';

/**
 * Key for storing user-configured custom server URL in localStorage
 */
export const STORAGE_KEY_CUSTOM_API = 'smart_city_custom_api_url';

/**
 * Detect if running inside a native mobile wrapper (Capacitor / Cordova)
 */
export const isNativeMobileApp = () => {
  if (typeof window === 'undefined') return false;
  return Boolean(
    window.Capacitor?.isNativePlatform?.() ||
    window.location.protocol === 'capacitor:' ||
    window.location.protocol === 'ionic:' ||
    (window.location.origin === 'https://localhost' && !window.location.port)
  );
};

/**
 * Get user-saved custom server URL
 */
export const getSavedCustomApiUrl = () => {
  if (typeof window === 'undefined') return '';
  return (localStorage.getItem(STORAGE_KEY_CUSTOM_API) || '').trim();
};

/**
 * Save custom server URL
 */
export const saveCustomApiUrl = (url) => {
  if (typeof window === 'undefined') return;
  const cleanUrl = (url || '').trim().replace(/\/+$/, '');
  if (!cleanUrl) {
    localStorage.removeItem(STORAGE_KEY_CUSTOM_API);
  } else {
    // Ensure it ends with /api if not already present
    const apiUrl = cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
    localStorage.setItem(STORAGE_KEY_CUSTOM_API, apiUrl);
  }
  // Update current axios instance default
  api.defaults.baseURL = getEffectiveApiUrl();
};

/**
 * Clear custom server URL
 */
export const clearCustomApiUrl = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY_CUSTOM_API);
  api.defaults.baseURL = getEffectiveApiUrl();
};

/**
 * Resolve the effective API Base URL dynamically
 */
export const getEffectiveApiUrl = () => {
  // 1. User manual override from in-app settings
  const custom = getSavedCustomApiUrl();
  if (custom) return custom;

  // 2. Build-time environment variable (if explicitly defined and not empty)
  if (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.trim() !== '') {
    return import.meta.env.VITE_API_URL.trim();
  }

  // 3. Browser Environment (Mobile browser or Laptop/Desktop browser)
  if (typeof window !== 'undefined' && !isNativeMobileApp()) {
    // If Vite development server on port 5173
    if (window.location.port === '5173') {
      const host = window.location.hostname || 'localhost';
      return `http://${host}:5000/api`;
    }
    // Any other origin (public tunnel e.g. https://*.loca.lt, cloud domain, or LAN IP)
    // The Express backend serves both frontend and /api on the exact same origin!
    return `${window.location.origin}/api`;
  }

  // 4. Capacitor Android Native Wrapper default fallback (Pre-configured with live Cloudflare tunnel)
  return 'https://archives-thorough-one-cardiovascular.trycloudflare.com/api';
};

const api = axios.create({
  baseURL: getEffectiveApiUrl(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Bypass-Tunnel-Reminder': 'true', // Required for localtunnel bypass
    'bypass-tunnel-reminder': 'true',
  },
});

// Request interceptor: attach auth token, ensure correct base URL, and bypass tunnel warning
api.interceptors.request.use(
  (config) => {
    config.baseURL = getEffectiveApiUrl();
    config.headers['Bypass-Tunnel-Reminder'] = 'true';
    config.headers['bypass-tunnel-reminder'] = 'true';

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: unified error parsing
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const customError = {
      status: error.response?.status || (error.code === 'ECONNABORTED' ? 408 : 0),
      message:
        error.response?.data?.message ||
        error.message ||
        'Unable to connect to Smart City server. Please check your network or server URL.',
      errors: error.response?.data?.errors || null,
      isNetworkError: !error.response,
    };
    return Promise.reject(customError);
  }
);

/**
 * Health check ping using the currently configured active server
 */
export async function checkApiHealth() {
  const start = Date.now();
  const response = await api.get('/health', { timeout: 8000 });
  const latency = Date.now() - start;
  return {
    ...response.data,
    latencyMs: latency,
    apiUrl: getEffectiveApiUrl(),
  };
}

/**
 * Test a specific target API URL (for testing custom URLs before saving)
 */
export async function testApiConnection(candidateUrl) {
  let url = (candidateUrl || '').trim().replace(/\/+$/, '');
  if (!url) {
    throw new Error('Please enter a server URL');
  }
  if (!url.endsWith('/api')) {
    url = `${url}/api`;
  }

  const start = Date.now();
  const res = await axios.get(`${url}/health`, {
    timeout: 8000,
    headers: {
      'Bypass-Tunnel-Reminder': 'true',
      'bypass-tunnel-reminder': 'true',
    },
  });

  const latency = Date.now() - start;
  return {
    success: true,
    data: res.data,
    latencyMs: latency,
    resolvedUrl: url,
  };
}

export default api;
