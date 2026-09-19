// ==========================================================================
// MOVORA REAL-TIME GLOBAL TRAFFIC & ANALYTICS ENGINE (100% REAL CLOUD DATA)
// Supports Instant Realtime Database Sync across all mobile phones & PCs
// ==========================================================================

const STORAGE_KEY = 'movora_real_analytics_v4';
const VISITOR_KEY = 'movora_visitor_id';
const SESSION_KEY = 'movora_session_id';
const FIREBASE_CONFIG_KEY = 'movora_firebase_db_url';

// Firebase Realtime Database URL (Can be set via env, localStorage, or admin UI)
let FIREBASE_DB_URL = 
  import.meta.env.VITE_FIREBASE_DB_URL || 
  localStorage.getItem(FIREBASE_CONFIG_KEY) || 
  '';

// Get current Firebase DB URL
export function getFirebaseDbUrl() {
  return FIREBASE_DB_URL;
}

// Set or update Firebase DB URL dynamically
export function setFirebaseDbUrl(url) {
  if (url && url.trim()) {
    let clean = url.trim().replace(/\/+$/, '');
    if (clean.endsWith('.json')) {
      clean = clean.replace(/\.json$/, '');
    }
    localStorage.setItem(FIREBASE_CONFIG_KEY, clean);
    FIREBASE_DB_URL = clean;
    return clean;
  } else {
    localStorage.removeItem(FIREBASE_CONFIG_KEY);
    FIREBASE_DB_URL = '';
    return '';
  }
}

// Generate or retrieve persistent unique visitor ID
export function getVisitorId() {
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = 'v_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

// Generate or retrieve current browser session ID
export function getSessionId() {
  let sid = sessionStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = 's_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
    sessionStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

// Detect client device information
export function detectDevice() {
  const ua = (navigator.userAgent || '').toLowerCase();
  let device = 'Desktop';
  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    device = 'Tablet';
  } else if (/mobile|iphone|ipod|android|blackberry|mini|windows\sce|palm/i.test(ua)) {
    device = 'Mobile';
  }

  let browser = 'Chrome';
  if (/firefox/i.test(ua)) browser = 'Firefox';
  else if (/edg/i.test(ua)) browser = 'Edge';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
  else if (/opera|opr/i.test(ua)) browser = 'Opera';
  else if (/brave/i.test(ua)) browser = 'Brave';

  let os = 'Windows';
  if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
  else if (/linux/i.test(ua)) os = 'Linux';

  return { device, browser, os };
}

// Get day name in Arabic
export function getArabicDayName(date = new Date()) {
  const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  return days[date.getDay()];
}

// Clean Initial State starting with 0 (Zero fake numbers!)
export function createEmptyAnalytics() {
  const days = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
  return {
    totalVisits: 0,
    uniqueVisitorsCount: 0,
    uniqueVisitorIds: [],
    totalStreams: 0,
    deviceCounts: {
      Mobile: 0,
      Desktop: 0,
      Tablet: 0,
    },
    browserCounts: {
      Chrome: 0,
      Safari: 0,
      Edge: 0,
      Firefox: 0,
      Opera: 0,
      Brave: 0,
    },
    dailyTraffic: days.map(day => ({
      day,
      visits: 0,
      streams: 0,
    })),
    topMovies: [],
    recentEvents: [],
    activeSessions: {},
    liveActiveCount: 1,
    lastUpdated: Date.now(),
  };
}

// Load current analytics state from local cache
export function loadAnalytics() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const empty = createEmptyAnalytics();
      saveAnalytics(empty);
      return empty;
    }
    return JSON.parse(raw);
  } catch (err) {
    return createEmptyAnalytics();
  }
}

// Save analytics state to local cache
export function saveAnalytics(data) {
  try {
    data.lastUpdated = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Error saving local analytics:', err);
  }
}

// Normalize incoming cloud data safely
function normalizeAnalytics(d) {
  const empty = createEmptyAnalytics();
  if (!d) return empty;

  const now = Date.now();
  let liveCount = 0;
  const prunedSessions = {};
  if (d.activeSessions) {
    for (const [sid, time] of Object.entries(d.activeSessions)) {
      if (now - time < 300000) {
        prunedSessions[sid] = time;
        liveCount++;
      }
    }
  }

  return {
    totalVisits: Number(d.totalVisits) || 0,
    uniqueVisitorsCount: Number(d.uniqueVisitorsCount) || 0,
    uniqueVisitorIds: Array.isArray(d.uniqueVisitorIds) ? d.uniqueVisitorIds : [],
    totalStreams: Number(d.totalStreams) || 0,
    deviceCounts: {
      Mobile: Number(d.deviceCounts?.Mobile) || 0,
      Desktop: Number(d.deviceCounts?.Desktop) || 0,
      Tablet: Number(d.deviceCounts?.Tablet) || 0,
    },
    browserCounts: {
      Chrome: Number(d.browserCounts?.Chrome) || 0,
      Safari: Number(d.browserCounts?.Safari) || 0,
      Edge: Number(d.browserCounts?.Edge) || 0,
      Firefox: Number(d.browserCounts?.Firefox) || 0,
      Opera: Number(d.browserCounts?.Opera) || 0,
      Brave: Number(d.browserCounts?.Brave) || 0,
    },
    dailyTraffic: Array.isArray(d.dailyTraffic) ? d.dailyTraffic : empty.dailyTraffic,
    topMovies: Array.isArray(d.topMovies) ? d.topMovies : [],
    recentEvents: Array.isArray(d.recentEvents) ? d.recentEvents : [],
    activeSessions: prunedSessions,
    liveActiveCount: Math.max(1, liveCount),
    lastUpdated: d.lastUpdated || now,
  };
}

// Fetch Global Live Analytics (From Firebase if connected, else Local Cache)
export async function fetchGlobalAnalytics() {
  if (FIREBASE_DB_URL) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(`${FIREBASE_DB_URL}/traffic.json`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (res.ok) {
        const raw = await res.json();
        if (raw) {
          const normalized = normalizeAnalytics(raw);
          saveAnalytics(normalized);
          return normalized;
        }
      }
    } catch (e) {
      // Graceful offline fallback
    }
  }
  return loadAnalytics();
}

// Push updated data to Firebase Cloud
async function pushToFirebase(data) {
  if (!FIREBASE_DB_URL) return false;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`${FIREBASE_DB_URL}/traffic.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: controller.signal,
    });
    clearTimeout(timer);
    return res.ok;
  } catch (e) {
    return false;
  }
}

// Track REAL Page View
export function trackPageView(path = window.location.pathname) {
  try {
    const visitorId = getVisitorId();
    const sessionId = getSessionId();
    const { device, browser, os } = detectDevice();
    const today = getArabicDayName();

    // 1. Update local cache immediately
    const local = loadAnalytics();
    local.totalVisits = (local.totalVisits || 0) + 1;
    saveAnalytics(local);

    // 2. Asynchronously sync to cloud if Firebase is connected
    setTimeout(async () => {
      try {
        const globalData = await fetchGlobalAnalytics();
        globalData.totalVisits = (globalData.totalVisits || 0) + 1;

        // Unique visitor check
        if (!globalData.uniqueVisitorIds) globalData.uniqueVisitorIds = [];
        if (!globalData.uniqueVisitorIds.includes(visitorId)) {
          globalData.uniqueVisitorIds.push(visitorId);
          globalData.uniqueVisitorsCount = globalData.uniqueVisitorIds.length;
        }

        // Device & Browser counts
        if (!globalData.deviceCounts) globalData.deviceCounts = { Mobile: 0, Desktop: 0, Tablet: 0 };
        globalData.deviceCounts[device] = (globalData.deviceCounts[device] || 0) + 1;

        if (!globalData.browserCounts) globalData.browserCounts = {};
        globalData.browserCounts[browser] = (globalData.browserCounts[browser] || 0) + 1;

        // Daily traffic for today
        if (globalData.dailyTraffic) {
          const idx = globalData.dailyTraffic.findIndex(d => d.day === today);
          if (idx > -1) {
            globalData.dailyTraffic[idx].visits = (globalData.dailyTraffic[idx].visits || 0) + 1;
          }
        }

        // Active session heartbeat
        if (!globalData.activeSessions) globalData.activeSessions = {};
        globalData.activeSessions[sessionId] = Date.now();

        // Recent event log
        const label = path === '/' ? 'تصفح الصفحة الرئيسية' : `زيارة: ${path}`;
        const newEvent = {
          id: 'ev_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
          type: 'page_view',
          label,
          device,
          browser,
          os,
          time: 'الآن',
          path,
          timestamp: Date.now(),
        };
        globalData.recentEvents = [newEvent, ...(globalData.recentEvents || [])].slice(0, 30);

        saveAnalytics(globalData);
        await pushToFirebase(globalData);
      } catch (e) {
        console.warn('Sync page view notice:', e);
      }
    }, 100);
  } catch (err) {
    console.warn('Track page view error:', err);
  }
}

// Track REAL Movie Stream Playback
export function trackMovieStream(movie, server = 'primary') {
  if (!movie) return;
  try {
    const sessionId = getSessionId();
    const { device, browser } = detectDevice();
    const title = movie.title || movie.original_title || 'فيلم بدون عنوان';
    const today = getArabicDayName();

    // 1. Update local cache immediately
    const local = loadAnalytics();
    local.totalStreams = (local.totalStreams || 0) + 1;
    saveAnalytics(local);

    // 2. Asynchronously sync to cloud
    setTimeout(async () => {
      try {
        const globalData = await fetchGlobalAnalytics();
        globalData.totalStreams = (globalData.totalStreams || 0) + 1;

        // Update daily traffic streams
        if (globalData.dailyTraffic) {
          const idx = globalData.dailyTraffic.findIndex(d => d.day === today);
          if (idx > -1) {
            globalData.dailyTraffic[idx].streams = (globalData.dailyTraffic[idx].streams || 0) + 1;
          }
        }

        // Update top movies table
        let top = globalData.topMovies || [];
        const existingIndex = top.findIndex(m => String(m.id) === String(movie.id));
        if (existingIndex > -1) {
          top[existingIndex].streams = (top[existingIndex].streams || 0) + 1;
          top[existingIndex].server = server;
        } else {
          top.push({
            id: movie.id,
            title,
            streams: 1,
            rating: movie.vote_average ? movie.vote_average.toFixed(1) : '8.0',
            server,
          });
        }
        top.sort((a, b) => (b.streams || 0) - (a.streams || 0));
        globalData.topMovies = top.slice(0, 20);

        // Active session heartbeat
        if (!globalData.activeSessions) globalData.activeSessions = {};
        globalData.activeSessions[sessionId] = Date.now();

        // Recent stream event
        const newEvent = {
          id: 'ev_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
          type: 'movie_stream',
          label: `بدء تشغيل فيلم: ${title}`,
          device,
          browser,
          time: 'الآن',
          server,
          timestamp: Date.now(),
        };
        globalData.recentEvents = [newEvent, ...(globalData.recentEvents || [])].slice(0, 30);

        saveAnalytics(globalData);
        await pushToFirebase(globalData);
      } catch (e) {
        console.warn('Sync movie stream notice:', e);
      }
    }, 100);
  } catch (err) {
    console.warn('Track movie stream error:', err);
  }
}

// Record Active Heartbeat
export function recordHeartbeat() {
  const sessionId = getSessionId();
  try {
    const local = loadAnalytics();
    if (!local.activeSessions) local.activeSessions = {};
    local.activeSessions[sessionId] = Date.now();
    saveAnalytics(local);
  } catch (e) {}
}

// Get Real Active Live Users Count
export function getLiveActiveUsersCount() {
  try {
    const data = loadAnalytics();
    return data.liveActiveCount || 1;
  } catch (e) {
    return 1;
  }
}

// Compute Device Percentages from Real Counts
export function getDevicePercentages(deviceCounts = {}) {
  const mobile = deviceCounts?.Mobile || 0;
  const desktop = deviceCounts?.Desktop || 0;
  const tablet = deviceCounts?.Tablet || 0;
  const total = mobile + desktop + tablet;

  if (total === 0) {
    return { Mobile: 0, Desktop: 0, Tablet: 0 };
  }

  return {
    Mobile: Math.round((mobile / total) * 100),
    Desktop: Math.round((desktop / total) * 100),
    Tablet: Math.round((tablet / total) * 100),
  };
}

// Compute Browser Percentages from Real Counts
export function getBrowserPercentages(browserCounts = {}) {
  if (!browserCounts) return {};
  const total = Object.values(browserCounts).reduce((a, b) => a + Number(b), 0);
  if (total === 0) return {};

  const pcts = {};
  for (const [b, count] of Object.entries(browserCounts)) {
    if (count > 0) {
      pcts[b] = Math.round((count / total) * 100);
    }
  }
  return pcts;
}

// Reset Analytics to Clean Zero in both Local and Cloud
export async function resetAnalyticsData() {
  const empty = createEmptyAnalytics();
  empty.recentEvents = [{
    id: 'ev_' + Date.now().toString(36),
    type: 'system',
    label: 'تمت تصفية وبدء تسجيل الترافيك الحقيقي من الصفر (0)',
    device: 'Desktop',
    time: 'الآن',
    timestamp: Date.now(),
  }];
  saveAnalytics(empty);
  await pushToFirebase(empty);
  return empty;
}

// Export Analytics Data as JSON
export function exportAnalyticsJson() {
  const data = loadAnalytics();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `movora-real-traffic-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export default {
  loadAnalytics,
  fetchGlobalAnalytics,
  saveAnalytics,
  trackPageView,
  trackMovieStream,
  recordHeartbeat,
  getLiveActiveUsersCount,
  getDevicePercentages,
  getBrowserPercentages,
  resetAnalyticsData,
  exportAnalyticsJson,
  getFirebaseDbUrl,
  setFirebaseDbUrl,
};
